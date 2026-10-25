import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // json optional
    }

    const restoredBy = auth.user.username;

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        serialNumbers: true,
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (!invoice.isDeleted) {
      return NextResponse.json({ success: false, error: 'Invoice is already active and not deleted' }, { status: 400 });
    }

    // Check 7-day expiration policy
    const now = new Date();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const deletedTime = invoice.deletedAt ? new Date(invoice.deletedAt).getTime() : 0;
    if (now.getTime() - deletedTime > SEVEN_DAYS_MS) {
      return NextResponse.json(
        {
          success: false,
          error: 'This invoice has passed the 7-day recovery period and is ineligible for standard restoration.',
        },
        { status: 400 }
      );
    }

    const previousSnapshot = JSON.stringify(invoice);

    const restoredInvoice = await db.$transaction(async (tx) => {
      // 1. Reconcile physical inventory without double-counting
      if (invoice.status === 'Confirmed') {
        for (const it of invoice.items) {
          const isService = it.product?.productType === 'SERVICE' || it.product?.category?.toLowerCase() === 'service';
          if (!it.isInvoiceOnly && !isService && it.productId) {
            const updatedProd = await tx.product.update({
              where: { id: it.productId },
              data: { currentStock: { decrement: it.quantity } },
            });

            await tx.stockMovement.create({
              data: {
                productId: it.productId,
                date: now,
                type: 'SALE',
                referenceType: 'INVOICE_RESTORED',
                referenceId: invoice.id,
                referenceNumber: invoice.invoiceNumber,
                quantityChange: -it.quantity,
                balanceAfter: updatedProd.currentStock,
                unitPrice: it.rate,
                notes: `Stock re-deducted upon restoring Invoice ${invoice.invoiceNumber}`,
              },
            });
          }
        }

        // Re-assign serial numbers if still in stock
        for (const sn of invoice.serialNumbers) {
          const liveSn = await tx.serialNumber.findUnique({ where: { id: sn.id } });
          if (liveSn && liveSn.status === 'In Stock') {
            await tx.serialNumber.update({
              where: { id: sn.id },
              data: {
                status: 'Sold',
                salesInvoiceId: invoice.id,
                customerId: invoice.customerId,
                saleDate: invoice.date,
              },
            });
          }
        }

        // Re-apply customer balance due
        if (invoice.balanceDue > 0) {
          await tx.customer.update({
            where: { id: invoice.customerId },
            data: { currentBalance: { increment: invoice.balanceDue } },
          });
        }
      }

      // 2. Mark invoice restored
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          deletionReason: null,
          restoredAt: now,
          restoredBy,
        },
      });

      // 3. Record audit trail
      await tx.invoiceRevisionAudit.create({
        data: {
          invoiceId: id,
          revisionNumber: invoice.revisionNumber,
          action: 'RESTORED',
          changedBy: restoredBy,
          changeReason: 'Restored from Recently Deleted within 7-day safety recovery window',
          diffSummary: JSON.stringify([
            { field: 'Status', oldVal: 'Recently Deleted', newVal: 'Active (Restored)' },
          ]),
          previousSnapshot,
          newSnapshot: JSON.stringify(updated),
        },
      });

      return updated;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} successfully restored to All Invoices!`,
      data: restoredInvoice,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
