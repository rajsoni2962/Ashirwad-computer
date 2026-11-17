import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sync
 * Lightweight real-time cloud database state fingerprint for multi-device synchronization
 * across Web, Android App, and Tablet devices.
 */
export async function GET(req: NextRequest) {
  try {
    const [
      invoiceCount,
      latestInvoice,
      productCount,
      latestProduct,
      customerCount,
      latestCustomer,
      purchaseCount,
      latestPurchase,
      paymentCount,
      latestPayment,
      expenseCount,
      latestExpense,
      bankCount,
    ] = await Promise.all([
      db.invoice.count({ where: { isDeleted: false } }),
      db.invoice.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { id: true, invoiceNumber: true, updatedAt: true },
      }),
      db.product.count(),
      db.product.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, updatedAt: true, currentStock: true },
      }),
      db.customer.count({ where: { isDeleted: false } }),
      db.customer.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, updatedAt: true, currentBalance: true },
      }),
      db.purchase.count(),
      db.purchase.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { id: true, purchaseNumber: true, updatedAt: true },
      }),
      db.payment.count(),
      db.payment.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, amount: true, createdAt: true },
      }),
      db.expense.count(),
      db.expense.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, description: true, createdAt: true },
      }),
      db.bankAccount.count(),
    ]);

    const timestamps = [
      latestInvoice?.updatedAt?.getTime() || 0,
      latestProduct?.updatedAt?.getTime() || 0,
      latestCustomer?.updatedAt?.getTime() || 0,
      latestPurchase?.updatedAt?.getTime() || 0,
      latestPayment?.createdAt?.getTime() || 0,
      latestExpense?.createdAt?.getTime() || 0,
    ];

    const lastModifiedMs = Math.max(...timestamps, 0);

    // Deterministic fingerprint combining counts + latest update timestamps + balances/stock
    const fingerprint = [
      `inv:${invoiceCount}:${latestInvoice?.updatedAt?.toISOString() || '0'}`,
      `prd:${productCount}:${latestProduct?.updatedAt?.toISOString() || '0'}:${latestProduct?.currentStock ?? 0}`,
      `cst:${customerCount}:${latestCustomer?.updatedAt?.toISOString() || '0'}:${latestCustomer?.currentBalance ?? 0}`,
      `pur:${purchaseCount}:${latestPurchase?.updatedAt?.toISOString() || '0'}`,
      `pay:${paymentCount}:${latestPayment?.createdAt?.toISOString() || '0'}`,
      `exp:${expenseCount}:${latestExpense?.createdAt?.toISOString() || '0'}`,
      `bnk:${bankCount}`,
    ].join('|');

    return NextResponse.json({
      success: true,
      connected: true,
      database: 'ashirwad_vyaapar (MongoDB Atlas Cloud)',
      fingerprint,
      lastModifiedAt: lastModifiedMs > 0 ? new Date(lastModifiedMs).toISOString() : new Date().toISOString(),
      serverTime: new Date().toISOString(),
      counts: {
        invoices: invoiceCount,
        products: productCount,
        customers: customerCount,
        purchases: purchaseCount,
        payments: paymentCount,
        expenses: expenseCount,
        bankAccounts: bankCount,
      },
      latestActivity: {
        invoice: latestInvoice?.invoiceNumber || null,
        product: latestProduct?.name || null,
        customer: latestCustomer?.name || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error.message || 'Database sync check failed',
        serverTime: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
