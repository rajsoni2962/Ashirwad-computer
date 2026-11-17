import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, verifyPassword } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/security-logger';
import { getAppEnvironment } from '@/lib/db-guard';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    if (auth.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only admin accounts can reset the database.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { confirmText, password } = body;

    if (confirmText !== 'RESET DATABASE') {
      return NextResponse.json(
        { success: false, error: 'Confirmation failed. Please type "RESET DATABASE" exactly to proceed.' },
        { status: 400 }
      );
    }

    // Verify password against logged-in admin account in database
    const adminUser = await db.user.findUnique({
      where: { id: auth.user.id },
    });

    if (!adminUser || !verifyPassword(password, adminUser.password)) {
      logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        message: `Failed admin database reset attempt for user "${auth.user.username}" due to incorrect password.`,
        environment: getAppEnvironment(),
        source: 'api/settings/database/reset',
      });
      return NextResponse.json(
        { success: false, error: 'Incorrect admin password. Database reset aborted.' },
        { status: 401 }
      );
    }

    // Execute atomic wipe of all business transaction & inventory records
    await db.$transaction(async (tx) => {
      // 1. Delete invoice shares and logs
      await tx.invoiceShareLog.deleteMany({});

      // 2. Delete invoice items and invoices
      await tx.invoiceItem.deleteMany({});
      await tx.invoice.deleteMany({});

      // 3. Delete purchase items and purchases
      await tx.purchaseItem.deleteMany({});
      await tx.purchase.deleteMany({});

      // 4. Delete payments
      await tx.payment.deleteMany({});

      // 5. Delete stock movements and serial numbers
      await tx.stockMovement.deleteMany({});
      await tx.serialNumber.deleteMany({});

      // 6. Delete products
      await tx.product.deleteMany({});

      // 7. Delete customers and suppliers
      await tx.customer.deleteMany({});
      await tx.supplier.deleteMany({});

      // 8. Delete expenses
      await tx.expense.deleteMany({});

      // 9. Reset invoice & purchase sequence counters in business settings
      await tx.businessSettings.updateMany({
        data: {
          nextInvoiceNumber: 1,
          nextPurchaseNumber: 1,
        },
      });
    });

    logSecurityEvent({
      type: 'AUTHORIZED_DATABASE_RESET',
      message: `Admin user "${auth.user.username}" executed an authorized database reset. Transactional data cleared.`,
      environment: getAppEnvironment(),
      source: 'api/settings/database/reset',
    });

    return NextResponse.json({
      success: true,
      message: 'Database reset successfully. All invoices, inventory, customers, suppliers, and payments have been erased. Admin account preserved.',
    });
  } catch (error: any) {
    console.error('Database reset error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Database reset failed' }, { status: 500 });
  }
}
