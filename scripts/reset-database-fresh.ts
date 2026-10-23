import { db } from '../src/lib/db';
import { assertSafeForReset } from '../src/lib/db-guard';

async function resetDatabaseFresh() {
  // Fail-closed guard: Blocks table wiping on production database
  assertSafeForReset({ scriptName: 'scripts/reset-database-fresh.ts' });

  console.log('===========================================================');
  console.log('RESETTING DATABASE TO FRESH CLEAN SLATE FOR PRODUCTION');
  console.log('===========================================================\n');

  console.log('1. Clearing all transactional and inventory tables...');
  await db.invoiceShareLog.deleteMany({});
  await db.invoiceRevisionAudit.deleteMany({});
  await db.invoiceItem.deleteMany({});
  await db.payment.deleteMany({});
  await db.invoice.deleteMany({});

  await db.purchaseItem.deleteMany({});
  await db.purchase.deleteMany({});

  await db.serialNumber.deleteMany({});
  await db.stockMovement.deleteMany({});
  await db.product.deleteMany({});

  await db.customer.deleteMany({});
  await db.supplier.deleteMany({});
  await db.expense.deleteMany({});

  console.log('✓ All old products, inventory, customers, suppliers, and invoices cleared.');

  console.log('\n2. Initializing clean default Business Profile & Admin...');
  await db.businessSettings.upsert({
    where: { id: 'default' },
    update: {
      nextInvoiceNumber: 1,
      nextPurchaseNumber: 1,
    },
    create: {
      id: 'default',
      companyName: 'ASHIRWAD TECH',
      tagline: 'Repair | Upgrade | Build | Service',
      address: 'Ashraya 10, GST compound, new ranip, Ahmedabad 382470.',
      phone: '9662278994',
      email: 'rajsoni2962@gmail.com',
      gstin: '',
      state: 'Gujarat',
      stateCode: '24',
      bankName: 'State Bank of India',
      accountNumber: '39485720194',
      ifscCode: 'SBIN0001234',
      upiId: '9662278994@upi',
      invoicePrefix: 'AT/2026/',
      nextInvoiceNumber: 1,
      purchasePrefix: 'PO/2026/',
      nextPurchaseNumber: 1,
      logoUrl: '/brand/logo.png',
      signatureUrl: '/brand/signature.jpeg',
      terms: `* Tested and working perfectly at the time of sale.
* Please inspect the laptop before purchase.
* 6 Months of warranty covers technical issues only and excludes physical or liquid damage.
* Battery backup may vary depending on usage.
* No return or refund after sale unless covered under warranty.
* Thank you for choosing us—we’re always here to help if you need support.`,
      footer: "Thank you for choosing us—we're always here to help if you need support.",
      authorizedSignatory: 'Ashirwad Tech\nRaj Soni\nProprietor',
    },
  });

  await db.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Raj Soni',
      email: 'rajsoni2962@gmail.com',
      phone: '9662278994',
      role: 'admin',
      password: 'admin',
    },
  });

  const [products, customers, suppliers, invoices, purchases] = await Promise.all([
    db.product.count(),
    db.customer.count(),
    db.supplier.count(),
    db.invoice.count(),
    db.purchase.count(),
  ]);

  console.log('\n--- LIVE DATABASE FRESH STATUS ---');
  console.log(`• Products: ${products}`);
  console.log(`• Customers: ${customers}`);
  console.log(`• Suppliers: ${suppliers}`);
  console.log(`• Invoices: ${invoices}`);
  console.log(`• Purchases: ${purchases}`);
  console.log('\n✓ Database successfully reset to clean starting state!');

  await db.$disconnect();
}

resetDatabaseFresh().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
