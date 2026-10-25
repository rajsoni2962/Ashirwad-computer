import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customerId') || '';
    const status = searchParams.get('status') || '';
    const invoiceType = searchParams.get('invoiceType') || '';

    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const where: any = {};
    if (!includeDeleted) {
      where.isDeleted = false;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (customerId) where.customerId = customerId;
    if (status && status !== 'All') where.status = status;
    if (invoiceType && invoiceType !== 'All') where.invoiceType = invoiceType;

    const invoices = await db.invoice.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        payments: true,
        serialNumbers: true,
      },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const authUser = auth.user;

    const body = await request.json();
    const {
      customerId,
      date,
      dueDate,
      invoiceType = 'TAX_INVOICE',
      taxConfiguration = 'CGST_SGST',
      items, // array of { productId, serialNumber, description, hsn, quantity, unit, rate, discount, gstPercent, taxableAmount, gstAmount, total }
      subtotal,
      discountPercent,
      discountAmount,
      taxableAmount,
      cgst,
      sgst,
      igst,
      grandTotal,
      paidAmount,
      paymentMode,
      paymentReference,
      notes,
      terms,
    } = body;

    if (!customerId || !items || !items.length) {
      return NextResponse.json(
        { success: false, error: 'Customer and at least one item are required' },
        { status: 400 }
      );
    }

    const invDate = date ? new Date(date) : new Date();
    const paid = parseFloat(paidAmount) || 0;
    const total = parseFloat(grandTotal) || 0;
    const balanceDue = Math.max(0, total - paid);
    let payStatus = 'Paid';
    if (paid <= 0) payStatus = 'Unpaid';
    else if (paid < total) payStatus = 'Partial';

    // 1. Pre-fetch reference data OUTSIDE the transaction for speed and connection stability
    const [customer, settings, productRecords] = await Promise.all([
      db.customer.findUnique({ where: { id: customerId } }),
      db.businessSettings.findUnique({ where: { id: 'default' } }),
      db.product.findMany({
        where: { id: { in: items.map((it: any) => it.productId).filter(Boolean) } },
      }),
    ]);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const productMap = new Map(productRecords.map((p) => [p.id, p]));

    const customerSnapshot = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      gstin: customer.gstin,
      state: customer.state || 'Gujarat',
      stateCode: customer.stateCode || '24',
    };

    const businessSnapshot = {
      companyName: settings?.companyName || 'ASHIRWAD TECHNOLOGIES',
      tagline: settings?.tagline || 'REPAIR | UPGRADE | BUILD | SERVICE',
      address: settings?.address || 'Ashraya 10, GST compound, new ranip, Ahmedabad 382470.',
      phone: settings?.phone || '9662278994',
      email: settings?.email || 'rajsoni2962@gmail.com',
      gstin: (settings?.gstin && settings?.gstin !== 'null') ? settings.gstin : '',
      state: settings?.state || 'Gujarat',
      stateCode: settings?.stateCode || '24',
      bankName: settings?.bankName || 'State Bank of India',
      accountNumber: settings?.accountNumber || '39485720194',
      ifscCode: settings?.ifscCode || 'SBIN0001234',
      upiId: settings?.upiId || '9662278994@upi',
      terms: terms || settings?.terms || '',
      authorizedSignatory: settings?.authorizedSignatory || 'Ashirwad Technologies\nRaj Soni\nProprietor',
      footer: settings?.footer || "Thank you for choosing us—we're always here to help if you need support.",
    };

    // Pre-calculate items data for create payload in memory
    const itemsCreateData = items.map((it: any) => {
      const isInvoiceOnly = Boolean(it.isInvoiceOnly || !it.productId);
      const prod = it.productId ? productMap.get(it.productId) : null;
      const prodName = prod?.name || it.productName || it.description || 'Item';
      const warranty = prod?.warranty || it.warranty || (isInvoiceOnly ? (it.warranty || null) : '6 Months');
      const rate = parseFloat(it.rate) || 0;
      const disc = parseFloat(it.discount) || 0;
      const gstPct = it.gstPercent !== undefined ? parseFloat(it.gstPercent) : 0;
      const taxable = parseFloat(it.taxableAmount) || 0;
      const gst = parseFloat(it.gstAmount) || 0;
      const itemTotal = parseFloat(it.total) || 0;
      const hsn = it.hsn || prod?.hsn || '8471';
      const qty = parseInt(it.quantity) || 1;
      const unit = it.unit || 'Pcs';

      return {
        productId: it.productId ? it.productId : null,
        isInvoiceOnly,
        productName: prodName,
        warranty: warranty,
        serialNumber: it.serialNumber || null,
        description: it.description || prodName || null,
        hsn,
        quantity: qty,
        unit,
        rate,
        discount: disc,
        gstPercent: gstPct,
        taxableAmount: taxable,
        gstAmount: gst,
        total: itemTotal,
        itemSnapshot: JSON.stringify({
          productId: it.productId || null,
          isInvoiceOnly,
          productName: prodName,
          brand: prod?.brand || null,
          model: prod?.model || null,
          hsn,
          warranty,
          serialNumber: it.serialNumber || null,
          quantity: qty,
          unit,
          rate,
          discount: disc,
          gstPercent: gstPct,
          taxableAmount: taxable,
          gstAmount: gst,
          total: itemTotal,
        }),
      };
    });

    // 2. Perform atomic transaction with generous timeout and connection wait
    const createdInvoice = await db.$transaction(
      async (tx) => {
        // Resolve unique invoice number
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

        // Create the Invoice record with frozen snapshots & on-demand PDF metadata
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            date: invDate,
            dueDate: dueDate ? new Date(dueDate) : null,
            customerId,
            subtotal: parseFloat(subtotal) || 0,
            discountPercent: parseFloat(discountPercent) || 0,
            discountAmount: parseFloat(discountAmount) || 0,
            taxableAmount: parseFloat(taxableAmount) || 0,
            cgst: parseFloat(cgst) || 0,
            sgst: parseFloat(sgst) || 0,
            igst: parseFloat(igst) || 0,
            grandTotal: total,
            roundOff: 0,
            finalTotal: total,
            paidAmount: paid,
            balanceDue,
            paymentMode: paymentMode || 'Cash',
            paymentStatus: payStatus,
            notes: notes || null,
            terms: terms || settings?.terms || null,
            status: 'Confirmed',
            invoiceType: invoiceType || 'NON_GST',
            taxConfiguration: taxConfiguration || 'NONE',
            templateVersion: 'v1.0',
            isFinalized: true,
            finalizedAt: invDate,
            revisionNumber: 1,
            customerSnapshot: JSON.stringify(customerSnapshot),
            businessSnapshot: JSON.stringify(businessSnapshot),
            items: {
              create: itemsCreateData,
            },
          },
        });

        // For physical sales (excluding Quotations / Estimates which do not adjust inventory):
        if (invoiceType !== 'QUOTATION') {
          for (const it of items) {
            const prod = productMap.get(it.productId);
            const isService = prod?.productType === 'SERVICE' || prod?.category?.toLowerCase() === 'service';

            const isInvoiceOnly = Boolean(it.isInvoiceOnly || !it.productId);
            if (isInvoiceOnly) continue;

            if (!isService && it.productId) {
              const qty = parseInt(it.quantity) || 1;
              const updatedProd = await tx.product.update({
                where: { id: it.productId },
                data: {
                  currentStock: { decrement: qty },
                },
              });

              await tx.stockMovement.create({
                data: {
                  productId: it.productId,
                  date: invDate,
                  type: 'SALE',
                  referenceType: 'INVOICE',
                  referenceId: invoice.id,
                  referenceNumber: invoice.invoiceNumber,
                  quantityChange: -qty,
                  balanceAfter: updatedProd.currentStock,
                  unitPrice: parseFloat(it.rate) || 0,
                  notes: `Sale on Invoice ${invoice.invoiceNumber} ${it.serialNumber ? `(SN: ${it.serialNumber})` : ''}`,
                },
              });

              if (it.serialNumber) {
                const snRecord = await tx.serialNumber.findFirst({
                  where: { serialNumber: it.serialNumber },
                });

                if (snRecord) {
                  const warStart = invDate;
                  const warEnd = new Date(invDate);
                  warEnd.setMonth(warEnd.getMonth() + 6);

                  await tx.serialNumber.update({
                    where: { id: snRecord.id },
                    data: {
                      status: 'Sold',
                      customerId,
                      salesInvoiceId: invoice.id,
                      saleDate: invDate,
                      sellingPrice: parseFloat(it.rate) || prod?.sellingPrice || 0,
                      warrantyStart: warStart,
                      warrantyEnd: warEnd,
                    },
                  });
                }
              }
            }
          }

          if (balanceDue > 0) {
            await tx.customer.update({
              where: { id: customerId },
              data: { currentBalance: { increment: balanceDue } },
            });
          }

          if (paid > 0) {
            const payNum = `PAY-SALE-${Date.now().toString().slice(-6)}`;
            await tx.payment.create({
              data: {
                paymentNumber: payNum,
                date: invDate,
                type: 'CUSTOMER_PAYMENT',
                customerId,
                invoiceId: invoice.id,
                amount: paid,
                paymentMode: paymentMode || 'Cash',
                referenceNumber: paymentReference || `REC-${invoice.invoiceNumber}`,
                notes: `Payment for Invoice ${invoice.invoiceNumber}`,
              },
            });
          }
        }

        // Single clean revision audit log entry
        await tx.invoiceRevisionAudit.create({
          data: {
            invoiceId: invoice.id,
            revisionNumber: 1,
            action: 'CREATED_FINALIZED',
            changedBy: authUser.username || 'admin',
            changeReason: `Initial invoice creation (${invoiceType || 'TAX_INVOICE'})`,
            diffSummary: JSON.stringify([{ field: 'status', oldVal: null, newVal: 'Confirmed' }]),
            previousSnapshot: null,
            newSnapshot: JSON.stringify(invoice),
          },
        });

        return invoice;
      },
      {
        maxWait: 15000, // Wait up to 15s to acquire transaction connection
        timeout: 30000, // Allow up to 30s for the transaction to complete
      }
    );

    return NextResponse.json({ success: true, data: createdInvoice });
  } catch (error: any) {
    console.error('Invoice Creation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
