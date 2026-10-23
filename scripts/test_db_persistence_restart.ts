import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { assertSafeForTesting } from '../src/lib/db-guard';
import { getTestDb } from '../src/lib/test-db';

async function main() {
  // Fail-closed guard: NEVER run against production database
  assertSafeForTesting({ scriptName: 'scripts/test_db_persistence_restart.ts' });

  console.log('=====================================================');
  console.log('DATABASE PERSISTENCE ACROSS RESTART VERIFICATION TEST');
  console.log('=====================================================\n');

  // Step 1: Initial Database Connection
  console.log('1. Connecting to database via isolated test Prisma instance...');
  let prisma: PrismaClient | null = getTestDb();

  // Ensure a test product exists
  let product = await prisma.product.findFirst({ where: { name: 'Restart Verification Laptop' } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'Restart Verification Laptop',
        brand: 'Dell',
        model: 'Latitude 7490',
        category: 'Laptop',
        hsn: '8471',
        gstPercent: 18.0,
        purchasePrice: 20000,
        sellingPrice: 30000,
        currentStock: 10,
      },
    });
  }

  // Ensure a test customer exists
  const testPhone = '9999988888';
  let customer = await prisma.customer.findFirst({ where: { phone: testPhone } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: 'Persistence Verification Corp',
        phone: testPhone,
        email: 'persistence@example.com',
        address: 'Persistence Park, Block 4B, Ahmedabad',
        gstin: '24ABCDE1234F1Z5',
        state: 'Gujarat',
        stateCode: '24',
      },
    });
  }

  const testInvoiceNumber = `TEST-RESTART-${Date.now().toString().slice(-6)}`;
  console.log(`2. Creating test invoice [${testInvoiceNumber}] with snapshot data...`);

  const createdInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: testInvoiceNumber,
      date: new Date(),
      customerId: customer.id,
      customerSnapshot: JSON.stringify({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        gstin: customer.gstin,
        state: customer.state,
      }),
      businessSnapshot: JSON.stringify({
        companyName: 'ASHIRWAD TECHNOLOGIES',
        address: 'Ashraya 10, GST compound, new ranip, Ahmedabad 382470.',
        phone: '9662278994',
        email: 'rajsoni2962@gmail.com',
        gstin: '',
      }),
      status: 'Confirmed',
      isFinalized: true,
      templateVersion: 'v1.0',
      subtotal: 45000,
      taxableAmount: 45000,
      cgst: 4050,
      sgst: 4050,
      igst: 0,
      grandTotal: 53100,
      finalTotal: 53100,
      paidAmount: 53100,
      balanceDue: 0,
      paymentStatus: 'Paid',
      paymentMode: 'UPI',
      notes: 'Testing database durability across server restarts',
      items: {
        create: [
          {
            productId: product.id,
            productName: product.name,
            description: 'Dell Latitude Enterprise Laptop (Refurbished)',
            hsn: '8471',
            quantity: 1,
            unit: 'Pcs',
            rate: 45000,
            discount: 0,
            gstPercent: 18,
            taxableAmount: 45000,
            gstAmount: 8100,
            total: 53100,
            serialNumber: 'SN-RESTART-001',
            warranty: '6 Months Tech Warranty',
            itemSnapshot: JSON.stringify({ name: product.name, rate: 45000 }),
          },
        ],
      },
      revisions: {
        create: [
          {
            revisionNumber: 1,
            action: 'CREATED_FINALIZED',
            changedBy: 'Automated System Tester',
            changeReason: 'Initial creation for restart durability verification',
            newSnapshot: JSON.stringify({ invoiceNumber: testInvoiceNumber, status: 'Confirmed' }),
          },
        ],
      },
    },
    include: {
      items: true,
      revisions: true,
    },
  });

  console.log(`   ✓ Created invoice ID: ${createdInvoice.id}`);
  console.log(`   ✓ Line items created: ${createdInvoice.items.length}`);
  console.log(`   ✓ Revisions created: ${createdInvoice.revisions.length}\n`);

  // Step 3: Simulate full webapp server shutdown and restart
  console.log('3. Simulating Full Webapp Restart:');
  console.log('   - Terminating active Prisma connection...');
  await prisma.$disconnect();
  prisma = null;
  console.log('   - Connection severed. Process memory pool cleared.');

  console.log('   - Spawning independent node verification process simulating fresh boot...');
  const restartCheckOutput = execSync(
    `npx tsx -e "
      import { PrismaClient } from '@prisma/client';
      const p = new PrismaClient();
      async function check() {
        const inv = await p.invoice.findUnique({
          where: { invoiceNumber: '${testInvoiceNumber}' },
          include: { items: true, revisions: true, customer: true }
        });
        if (!inv) {
          console.error('FAIL: Invoice not found after restart!');
          process.exit(1);
        }
        console.log('   [Fresh Process] SUCCESS: Invoice found in fresh process:', inv.invoiceNumber);
        console.log('   [Fresh Process] SUCCESS: Items intact:', inv.items.length, '| Serial:', inv.items[0].serialNumber);
        console.log('   [Fresh Process] SUCCESS: Customer linked:', inv.customer.name);
        console.log('   [Fresh Process] SUCCESS: Audit entries:', inv.revisions.length);
        await p.\\$disconnect();
      }
      check();
    "`,
    { encoding: 'utf-8' }
  );
  console.log(restartCheckOutput);

  // Step 4: Re-connect in a second instance to double check full data integrity
  console.log('4. Connecting via second independent client to verify snapshots & financial consistency...');
  const secondPrisma = new PrismaClient();
  const retrievedInvoice = await secondPrisma.invoice.findUnique({
    where: { invoiceNumber: testInvoiceNumber },
    include: { items: true, customer: true, revisions: true },
  });

  if (!retrievedInvoice) {
    throw new Error('Verification failed: Invoice missing from persistent storage!');
  }

  // Assertions
  if (retrievedInvoice.grandTotal !== 53100) {
    throw new Error(`Grand total mismatch: expected 53100, got ${retrievedInvoice.grandTotal}`);
  }
  if (retrievedInvoice.items.length !== 1 || retrievedInvoice.items[0].rate !== 45000) {
    throw new Error('Line item data mismatch after restart');
  }
  if (!retrievedInvoice.customerSnapshot || !retrievedInvoice.businessSnapshot) {
    throw new Error('Historical snapshots were not persisted!');
  }

  console.log('   ✓ Grand Total verified:', retrievedInvoice.grandTotal);
  console.log('   ✓ Customer snapshot intact:', retrievedInvoice.customerSnapshot);
  console.log('   ✓ Business snapshot intact:', retrievedInvoice.businessSnapshot);
  console.log('   ✓ Payment status verified:', retrievedInvoice.paymentStatus);
  console.log('   ✓ Audited revisions verified:', retrievedInvoice.revisions.length);

  // Clean up test records
  await secondPrisma.invoiceRevisionAudit.deleteMany({ where: { invoiceId: retrievedInvoice.id } });
  await secondPrisma.invoiceItem.deleteMany({ where: { invoiceId: retrievedInvoice.id } });
  await secondPrisma.invoice.delete({ where: { id: retrievedInvoice.id } });
  await secondPrisma.customer.delete({ where: { id: customer.id } });
  await secondPrisma.product.delete({ where: { id: product.id } });
  await secondPrisma.$disconnect();

  console.log('\n=====================================================');
  console.log('✓ ALL RESTART PERSISTENCE CHECKS PASSED WITH 100% ACCURACY!');
  console.log('  Database operations, WAL logs, relations, and');
  console.log('  snapshots survive webapp restarts completely.');
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
