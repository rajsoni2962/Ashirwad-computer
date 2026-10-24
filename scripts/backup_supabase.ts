import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Connect to the live Supabase database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('=== STARTING SUPABASE DATABASE BACKUP ===');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 1. Read all tables
  console.log('Fetching all tables from Supabase...');
  const [
    businessSettings,
    businessProfiles,
    customers,
    suppliers,
    products,
    serialNumbers,
    invoices,
    invoiceItems,
    invoiceRevisionAudits,
    purchases,
    purchaseItems,
    payments,
    stockMovements,
    expenses,
    users,
    invoiceShareLogs,
  ] = await Promise.all([
    prisma.businessSettings.findMany(),
    prisma.businessProfile.findMany(),
    prisma.customer.findMany(),
    prisma.supplier.findMany(),
    prisma.product.findMany(),
    prisma.serialNumber.findMany(),
    prisma.invoice.findMany(),
    prisma.invoiceItem.findMany(),
    prisma.invoiceRevisionAudit.findMany(),
    prisma.purchase.findMany(),
    prisma.purchaseItem.findMany(),
    prisma.payment.findMany(),
    prisma.stockMovement.findMany(),
    prisma.expense.findMany(),
    prisma.user.findMany(),
    prisma.invoiceShareLog.findMany(),
  ]);

  const counts: Record<string, number> = {
    businessSettings: businessSettings.length,
    businessProfiles: businessProfiles.length,
    customers: customers.length,
    suppliers: suppliers.length,
    products: products.length,
    serialNumbers: serialNumbers.length,
    invoices: invoices.length,
    invoiceItems: invoiceItems.length,
    invoiceRevisionAudits: invoiceRevisionAudits.length,
    purchases: purchases.length,
    purchaseItems: purchaseItems.length,
    payments: payments.length,
    stockMovements: stockMovements.length,
    expenses: expenses.length,
    users: users.length,
    invoiceShareLogs: invoiceShareLogs.length,
  };

  console.log('Live Database Counts:');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  - ${table}: ${count}`);
  }

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      provider: 'Supabase PostgreSQL',
      recordCounts: counts,
    },
    data: {
      businessSettings,
      businessProfiles,
      customers,
      suppliers,
      products,
      serialNumbers,
      invoices,
      invoiceItems,
      invoiceRevisionAudits,
      purchases,
      purchaseItems,
      payments,
      stockMovements,
      expenses,
      users,
      invoiceShareLogs,
    },
  };

  const backupFilePath = path.join(backupDir, `supabase_backup_${timestamp}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`✓ Backup successfully written to ${backupFilePath}`);

  // 2. Also back up files in public/uploads and public/brand
  const filesBackupDir = path.join(backupDir, `files_backup_${timestamp}`);
  fs.mkdirSync(filesBackupDir, { recursive: true });

  const copyFolderRecursive = (src: string, dest: string) => {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      if (fs.statSync(srcPath).isDirectory()) {
        copyFolderRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyFolderRecursive(path.join(process.cwd(), 'public', 'uploads'), path.join(filesBackupDir, 'uploads'));
  copyFolderRecursive(path.join(process.cwd(), 'public', 'brand'), path.join(filesBackupDir, 'brand'));
  console.log(`✓ Storage & receipt files backed up to ${filesBackupDir}`);

  await prisma.$disconnect();
  console.log('=== SUPABASE BACKUP COMPLETED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Backup error:', err);
  process.exit(1);
});
