import fs from 'fs';
import path from 'path';
// Import the isolated test client generated specifically for isolated_test_restore.db
// @ts-ignore
import { PrismaClient } from '../prisma/generated-test-client';

const dbFilePath = path.resolve(process.cwd(), 'prisma', 'isolated_test_restore.db').replace(/\\/g, '/');
const testDb = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbFilePath}`,
    },
  },
});

async function runRestoreTest() {
  console.log('================================================================');
  console.log('   ISOLATED DATABASE RESTORE & VERIFICATION TEST');
  console.log('================================================================\n');

  const backupsDir = path.join(process.cwd(), 'backups');
  const backupFiles = fs
    .readdirSync(backupsDir)
    .filter((f) => f.startsWith('supabase_backup_') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (backupFiles.length === 0) {
    throw new Error('No backup file found in backups/ directory!');
  }

  const latestBackupPath = path.join(backupsDir, backupFiles[0]);
  console.log(`Loading backup file: ${latestBackupPath}`);
  const rawBackup = fs.readFileSync(latestBackupPath, 'utf-8');
  const backup = JSON.parse(rawBackup);

  const { recordCounts } = backup.metadata;
  const { data } = backup;

  console.log('\n--- 1. RESTORING TABLES IN ISOLATED DATABASE ---');

  // Helper date converter
  const toDate = (val: any) => (val ? new Date(val) : null);

  // 1. BusinessSettings
  if (data.businessSettings?.length) {
    for (const item of data.businessSettings) {
      await testDb.businessSettings.create({
        data: {
          ...item,
          updatedAt: toDate(item.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✓ Restored ${data.businessSettings.length} BusinessSettings`);
  }

  // 2. BusinessProfiles
  if (data.businessProfiles?.length) {
    for (const item of data.businessProfiles) {
      await testDb.businessProfile.create({
        data: {
          ...item,
          createdAt: toDate(item.createdAt) || new Date(),
          updatedAt: toDate(item.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✓ Restored ${data.businessProfiles.length} BusinessProfiles`);
  }

  // 3. Customers
  if (data.customers?.length) {
    for (const item of data.customers) {
      await testDb.customer.create({
        data: {
          ...item,
          createdAt: toDate(item.createdAt) || new Date(),
          updatedAt: toDate(item.updatedAt) || new Date(),
          deletedAt: toDate(item.deletedAt),
        },
      });
    }
    console.log(`✓ Restored ${data.customers.length} Customers`);
  }

  // 4. Suppliers
  if (data.suppliers?.length) {
    for (const item of data.suppliers) {
      await testDb.supplier.create({
        data: {
          ...item,
          createdAt: toDate(item.createdAt) || new Date(),
          updatedAt: toDate(item.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✓ Restored ${data.suppliers.length} Suppliers`);
  }

  // 5. Products
  if (data.products?.length) {
    for (const item of data.products) {
      await testDb.product.create({
        data: {
          ...item,
          createdAt: toDate(item.createdAt) || new Date(),
          updatedAt: toDate(item.updatedAt) || new Date(),
          deletedAt: toDate(item.deletedAt),
        },
      });
    }
    console.log(`✓ Restored ${data.products.length} Products`);
  }

  // 6. Users
  if (data.users?.length) {
    for (const item of data.users) {
      await testDb.user.create({
        data: {
          ...item,
          createdAt: toDate(item.createdAt) || new Date(),
          updatedAt: toDate(item.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✓ Restored ${data.users.length} Users`);
  }

  // 7. Purchases
  if (data.purchases?.length) {
    for (const item of data.purchases) {
      await testDb.purchase.create({
        data: {
          ...item,
          date: toDate(item.date) || new Date(),
          dueDate: toDate(item.dueDate),
          createdAt: toDate(item.createdAt) || new Date(),
          updatedAt: toDate(item.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✓ Restored ${data.purchases.length} Purchases`);
  }

  // 8. PurchaseItems
  if (data.purchaseItems?.length) {
    for (const item of data.purchaseItems) {
      await testDb.purchaseItem.create({ data: item });
    }
    console.log(`✓ Restored ${data.purchaseItems.length} PurchaseItems`);
  }

  // 9. Invoices
  if (data.invoices?.length) {
    for (const item of data.invoices) {
      await testDb.invoice.create({
        data: {
          ...item,
          date: toDate(item.date) || new Date(),
          dueDate: toDate(item.dueDate),
          createdAt: toDate(item.createdAt) || new Date(),
          updatedAt: toDate(item.updatedAt) || new Date(),
          finalizedAt: toDate(item.finalizedAt),
          deletedAt: toDate(item.deletedAt),
          restoredAt: toDate(item.restoredAt),
          whatsappSharedAt: toDate(item.whatsappSharedAt),
          pdfGeneratedAt: toDate(item.pdfGeneratedAt),
        },
      });
    }
    console.log(`✓ Restored ${data.invoices.length} Invoices`);
  }

  // 10. InvoiceItems
  if (data.invoiceItems?.length) {
    for (const item of data.invoiceItems) {
      await testDb.invoiceItem.create({ data: item });
    }
    console.log(`✓ Restored ${data.invoiceItems.length} InvoiceItems`);
  }

  // 11. InvoiceRevisionAudits
  if (data.invoiceRevisionAudits?.length) {
    for (const item of data.invoiceRevisionAudits) {
      await testDb.invoiceRevisionAudit.create({
        data: {
          ...item,
          createdAt: toDate(item.createdAt) || new Date(),
        },
      });
    }
    console.log(`✓ Restored ${data.invoiceRevisionAudits.length} InvoiceRevisionAudits`);
  }

  // 12. SerialNumbers
  if (data.serialNumbers?.length) {
    for (const item of data.serialNumbers) {
      await testDb.serialNumber.create({
        data: {
          ...item,
          purchaseDate: toDate(item.purchaseDate),
          saleDate: toDate(item.saleDate),
          warrantyStart: toDate(item.warrantyStart),
          warrantyEnd: toDate(item.warrantyEnd),
          createdAt: toDate(item.createdAt) || new Date(),
          updatedAt: toDate(item.updatedAt) || new Date(),
        },
      });
    }
    console.log(`✓ Restored ${data.serialNumbers.length} SerialNumbers`);
  }

  // 13. Payments
  if (data.payments?.length) {
    for (const item of data.payments) {
      await testDb.payment.create({
        data: {
          ...item,
          date: toDate(item.date) || new Date(),
          createdAt: toDate(item.createdAt) || new Date(),
        },
      });
    }
    console.log(`✓ Restored ${data.payments.length} Payments`);
  }

  // 14. StockMovements
  if (data.stockMovements?.length) {
    for (const item of data.stockMovements) {
      await testDb.stockMovement.create({
        data: {
          ...item,
          date: toDate(item.date) || new Date(),
          createdAt: toDate(item.createdAt) || new Date(),
        },
      });
    }
    console.log(`✓ Restored ${data.stockMovements.length} StockMovements`);
  }

  // 15. Expenses
  if (data.expenses?.length) {
    for (const item of data.expenses) {
      await testDb.expense.create({
        data: {
          ...item,
          date: toDate(item.date) || new Date(),
          createdAt: toDate(item.createdAt) || new Date(),
        },
      });
    }
    console.log(`✓ Restored ${data.expenses.length} Expenses`);
  }

  // 16. InvoiceShareLogs
  if (data.invoiceShareLogs?.length) {
    for (const item of data.invoiceShareLogs) {
      await testDb.invoiceShareLog.create({
        data: {
          ...item,
          sharedAt: toDate(item.sharedAt) || new Date(),
        },
      });
    }
    console.log(`✓ Restored ${data.invoiceShareLogs.length} InvoiceShareLogs`);
  }

  console.log('\n--- 2. VERIFYING PARITY ACROSS ALL TABLES ---');

  const [
    cBusinessSettings,
    cBusinessProfiles,
    cCustomers,
    cSuppliers,
    cProducts,
    cSerialNumbers,
    cInvoices,
    cInvoiceItems,
    cInvoiceRevisionAudits,
    cPurchases,
    cPurchaseItems,
    cPayments,
    cStockMovements,
    cExpenses,
    cUsers,
    cInvoiceShareLogs,
  ] = await Promise.all([
    testDb.businessSettings.count(),
    testDb.businessProfile.count(),
    testDb.customer.count(),
    testDb.supplier.count(),
    testDb.product.count(),
    testDb.serialNumber.count(),
    testDb.invoice.count(),
    testDb.invoiceItem.count(),
    testDb.invoiceRevisionAudit.count(),
    testDb.purchase.count(),
    testDb.purchaseItem.count(),
    testDb.payment.count(),
    testDb.stockMovement.count(),
    testDb.expense.count(),
    testDb.user.count(),
    testDb.invoiceShareLog.count(),
  ]);

  const restoredCounts: Record<string, number> = {
    businessSettings: cBusinessSettings,
    businessProfiles: cBusinessProfiles,
    customers: cCustomers,
    suppliers: cSuppliers,
    products: cProducts,
    serialNumbers: cSerialNumbers,
    invoices: cInvoices,
    invoiceItems: cInvoiceItems,
    invoiceRevisionAudits: cInvoiceRevisionAudits,
    purchases: cPurchases,
    purchaseItems: cPurchaseItems,
    payments: cPayments,
    stockMovements: cStockMovements,
    expenses: cExpenses,
    users: cUsers,
    invoiceShareLogs: cInvoiceShareLogs,
  };

  let allMatched = true;
  for (const [table, expectedCount] of Object.entries(recordCounts)) {
    const actual = restoredCounts[table];
    const match = actual === expectedCount;
    if (!match) {
      allMatched = false;
      console.error(`❌ MISMATCH on ${table}: expected ${expectedCount}, got ${actual}`);
    } else {
      console.log(`✅ MATCH: ${table} -> ${actual} records (100% matched)`);
    }
  }

  if (!allMatched) {
    throw new Error('BACKUP RESTORE VERIFICATION FAILED: Record count mismatch detected!');
  }

  console.log('\n================================================================');
  console.log('🎉 SUCCESS: BACKUP RESTORE VERIFICATION FULLY PASSED (16/16 TABLES)');
  console.log('================================================================\n');

  await testDb.$disconnect();
}

runRestoreTest().catch(async (err) => {
  console.error('Restore test failed:', err);
  await testDb.$disconnect();
  process.exit(1);
});
