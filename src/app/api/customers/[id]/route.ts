import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { date: 'desc' },
          include: { items: true },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
        serialNumbers: {
          include: { product: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // Build timeline ledger
    const ledgerEntries = [
      ...customer.invoices.map((inv) => ({
        type: 'INVOICE',
        id: inv.id,
        date: inv.date,
        reference: inv.invoiceNumber,
        debit: inv.grandTotal, // customer owes
        credit: 0,
        balanceChange: inv.grandTotal,
        paymentStatus: inv.paymentStatus,
        details: inv.items.map((i) => i.description || i.productId).join(', '),
      })),
      ...customer.payments.map((pay) => ({
        type: 'PAYMENT',
        id: pay.id,
        date: pay.date,
        reference: pay.paymentNumber,
        debit: 0,
        credit: pay.amount, // customer paid
        balanceChange: -pay.amount,
        paymentStatus: 'Paid',
        details: `Mode: ${pay.paymentMode} ${pay.referenceNumber ? `(Ref: ${pay.referenceNumber})` : ''}`,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = customer.openingBalance;
    const computedLedger = ledgerEntries.map((entry) => {
      runningBalance += entry.balanceChange;
      return {
        ...entry,
        runningBalance,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        customer,
        ledger: computedLedger.reverse(), // newest first
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const updated = await db.customer.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        gstin: body.gstin || null,
        state: body.state,
        stateCode: body.stateCode,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;

    const customer = await db.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const isCascade = searchParams.get('cascade') === 'true';

    // Check existing customer references
    const [invoiceCount, paymentCount, serialCount] = await Promise.all([
      db.invoice.count({ where: { customerId: id } }),
      db.payment.count({ where: { customerId: id } }),
      db.serialNumber.count({ where: { customerId: id } }),
    ]);

    if (isCascade) {
      // 1. Unlink or delete dependent records
      await db.serialNumber.updateMany({
        where: { customerId: id },
        data: { customerId: null },
      });

      // 2. Find and delete invoices & their items/logs
      const customerInvoices = await db.invoice.findMany({
        where: { customerId: id },
        select: { id: true },
      });
      const invIds = customerInvoices.map((inv) => inv.id);

      if (invIds.length > 0) {
        await db.invoiceShareLog.deleteMany({ where: { invoiceId: { in: invIds } } });
        await db.invoiceRevisionAudit.deleteMany({ where: { invoiceId: { in: invIds } } });
        await db.payment.deleteMany({ where: { invoiceId: { in: invIds } } });
        await db.serialNumber.updateMany({
          where: { salesInvoiceId: { in: invIds } },
          data: { salesInvoiceId: null },
        });
        await db.invoiceItem.deleteMany({ where: { invoiceId: { in: invIds } } });
        await db.invoice.deleteMany({ where: { id: { in: invIds } } });
      }

      // 3. Delete any standalone customer payments
      await db.payment.deleteMany({ where: { customerId: id } });

      // 4. Finally hard delete customer
      await db.customer.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: 'Customer and all associated records permanently purged.',
      });
    }

    // Standard Delete: If unreferenced, hard delete cleanly
    if (invoiceCount === 0 && paymentCount === 0 && serialCount === 0) {
      await db.customer.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: 'Customer deleted successfully.',
      });
    }

    // If referenced by invoices or payments, soft-delete (archive) to maintain legal audit trail
    await db.customer.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: auth.user.username || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      archived: true,
      message: `Customer archived and removed from active list (${invoiceCount} historical invoice(s) safely preserved).`,
    });
  } catch (error: any) {
    console.error('Customer DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
