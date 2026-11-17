import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    }

    // 1. Fetch source invoice
    const quotation = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        serialNumbers: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }

    if (quotation.invoiceType !== 'QUOTATION') {
      return NextResponse.json(
        { success: false, error: `Document ${quotation.invoiceNumber} is already a ${quotation.invoiceType}, not a Quotation.` },
        { status: 400 }
      );
    }

    if (quotation.convertedToInvoiceId) {
      const existingTaxInv = await db.invoice.findUnique({
        where: { id: quotation.convertedToInvoiceId },
        select: { id: true, invoiceNumber: true },
      });
      return NextResponse.json(
        {
          success: false,
          error: `This quotation was already converted into Tax Invoice ${existingTaxInv?.invoiceNumber || quotation.convertedToInvoiceId}.`,
          convertedInvoiceId: quotation.convertedToInvoiceId,
        },
        { status: 409 }
      );
    }

    // 2. Fetch business settings for next invoice number sequence
    const settings = await db.businessSettings.findUnique({ where: { id: 'default' } });

    // 3. Pre-fetch product records for stock verification
    const productIds = quotation.items.map((it) => it.productId).filter(Boolean) as string[];
    const productRecords = await db.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(productRecords.map((p) => [p.id, p]));

    const now = new Date();

    // 4. Atomic conversion transaction
    const taxInvoice = await db.$transaction(async (tx) => {
      // A. Generate unique next tax invoice number
      const prefix = settings?.invoicePrefix || 'AT/2026/';
      let nextNum = settings?.nextInvoiceNumber || 110;
      let invoiceNumber = `${prefix}${nextNum}`;
      while (await tx.invoice.findUnique({ where: { invoiceNumber } })) {
        nextNum++;
        invoiceNumber = `${prefix}${nextNum}`;
      }

      await tx.businessSettings.update({
        where: { id: 'default' },
        data: { nextInvoiceNumber: nextNum + 1 },
      });

      // B. Create the new live Tax Invoice
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          date: now,
          dueDate: quotation.dueDate,
          customerId: quotation.customerId,
          subtotal: quotation.subtotal,
          discountPercent: quotation.discountPercent,
          discountAmount: quotation.discountAmount,
          taxableAmount: quotation.taxableAmount,
          cgst: quotation.cgst,
          sgst: quotation.sgst,
          igst: quotation.igst,
          grandTotal: quotation.grandTotal,
          paidAmount: quotation.paidAmount,
          balanceDue: quotation.balanceDue,
          paymentMode: quotation.paymentMode,
          paymentStatus: quotation.paymentStatus,
          notes: quotation.notes ? `${quotation.notes} (Converted from Quotation ${quotation.invoiceNumber})` : `Converted from Quotation ${quotation.invoiceNumber}`,
          terms: quotation.terms,
          status: 'Confirmed',
          invoiceType: 'TAX_INVOICE',
          taxConfiguration: quotation.taxConfiguration,
          customerSnapshot: quotation.customerSnapshot,
          businessSnapshot: quotation.businessSnapshot,
          roundOff: quotation.roundOff,
          finalTotal: quotation.finalTotal,
          templateVersion: quotation.templateVersion,
          isFinalized: true,
          finalizedAt: now,
          parentInvoiceId: quotation.id,
          businessProfileId: quotation.businessProfileId,
          items: {
            create: quotation.items.map((it) => ({
              productId: it.productId,
              isInvoiceOnly: it.isInvoiceOnly,
              productName: it.productName,
              warranty: it.warranty,
              serialNumber: it.serialNumber,
              description: it.description,
              hsn: it.hsn,
              quantity: it.quantity,
              unit: it.unit,
              rate: it.rate,
              discount: it.discount,
              gstPercent: it.gstPercent,
              taxableAmount: it.taxableAmount,
              gstAmount: it.gstAmount,
              total: it.total,
              itemSnapshot: it.itemSnapshot,
            })),
          },
        },
      });

      // C. Perform live inventory stock deduction and movement logging
      for (const it of quotation.items) {
        if (it.productId && !it.isInvoiceOnly) {
          const prod = productMap.get(it.productId);
          const isService = prod?.productType === 'SERVICE' || prod?.category?.toLowerCase() === 'service';

          if (!isService) {
            const qty = it.quantity || 1;
            const updatedProd = await tx.product.update({
              where: { id: it.productId },
              data: {
                currentStock: { decrement: qty },
              },
            });

            await tx.stockMovement.create({
              data: {
                productId: it.productId,
                date: now,
                type: 'SALE',
                referenceType: 'INVOICE',
                referenceId: newInvoice.id,
                referenceNumber: newInvoice.invoiceNumber,
                quantityChange: -qty,
                balanceAfter: updatedProd.currentStock,
                unitPrice: it.rate,
                notes: `Stock deducted on conversion of Quotation ${quotation.invoiceNumber} to Invoice ${newInvoice.invoiceNumber}`,
              },
            });

            // Mark Serial Numbers as SOLD if assigned
            if (it.serialNumber) {
              await tx.serialNumber.updateMany({
                where: {
                  productId: it.productId,
                  serialNumber: it.serialNumber,
                },
                data: {
                  status: 'Sold',
                  salesInvoiceId: newInvoice.id,
                  customerId: quotation.customerId,
                  saleDate: now,
                },
              });
            }
          }
        }
      }

      // D. Update Customer accounts receivable balance
      if (quotation.balanceDue > 0) {
        await tx.customer.update({
          where: { id: quotation.customerId },
          data: {
            currentBalance: { increment: quotation.balanceDue },
          },
        });
      }

      // E. Update Quotation with conversion pointers
      await tx.invoice.update({
        where: { id: quotation.id },
        data: {
          convertedToInvoiceId: newInvoice.id,
          convertedAt: now,
        },
      });

      return newInvoice;
    });

    return NextResponse.json({
      success: true,
      message: `Quotation converted successfully to Tax Invoice ${taxInvoice.invoiceNumber}`,
      data: taxInvoice,
    });
  } catch (error: any) {
    console.error('Error converting quotation to invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to convert quotation' },
      { status: 500 }
    );
  }
}
