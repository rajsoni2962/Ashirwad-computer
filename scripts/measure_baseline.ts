import { db } from '../src/lib/db';
import { generateInvoicePdf } from '../src/lib/invoicePdfGenerator';

async function runBenchmark() {
  console.log('=== Performance Benchmark: Measuring Latency ===\n');

  // 1. Dashboard Query Benchmark (Simulating current GET /api/dashboard logic)
  const t0 = performance.now();
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const [salesInvoices, purchaseBills, products, customers, suppliers, recentSales, recentPurchases, recentPayments, expenses] = await Promise.all([
    db.invoice.findMany({
      where: { status: 'Confirmed', date: { gte: startDate } },
      include: { items: true },
    }),
    db.purchase.findMany({
      where: { status: 'Confirmed', date: { gte: startDate } },
      include: { items: true },
    }),
    db.product.findMany({ where: { isDeleted: false } }),
    db.customer.findMany(),
    db.supplier.findMany(),
    db.invoice.findMany({
      take: 6,
      orderBy: { date: 'desc' },
      include: { customer: true, items: true },
    }),
    db.purchase.findMany({
      take: 6,
      orderBy: { date: 'desc' },
      include: { supplier: true, items: true },
    }),
    db.payment.findMany({
      take: 6,
      orderBy: { date: 'desc' },
      include: { customer: true, supplier: true },
    }),
    db.expense.findMany({ where: { date: { gte: startDate } } }),
  ]);
  const tDashboard = performance.now() - t0;
  console.log(`[Baseline] Dashboard full fetch: ${tDashboard.toFixed(2)} ms`);

  // 2. Products Query Benchmark (Current GET /api/products logic)
  const t1 = performance.now();
  const allProducts = await db.product.findMany({
    where: { isDeleted: false },
    orderBy: { name: 'asc' },
    include: {
      serialNumbers: {
        where: { status: 'In Stock' },
        select: { id: true, serialNumber: true, status: true },
      },
      _count: {
        select: {
          serialNumbers: true,
          invoiceItems: true,
          purchaseItems: true,
        },
      },
    },
  });
  const tProducts = performance.now() - t1;
  console.log(`[Baseline] Products full fetch (${allProducts.length} items): ${tProducts.toFixed(2)} ms`);

  // 3. Invoices Query Benchmark (Current GET /api/invoices logic)
  const t2 = performance.now();
  const allInvoices = await db.invoice.findMany({
    where: { isDeleted: false },
    orderBy: { date: 'desc' },
    include: {
      customer: true,
      items: { include: { product: true } },
      payments: true,
      serialNumbers: true,
    },
  });
  const tInvoices = performance.now() - t2;
  console.log(`[Baseline] Invoices full fetch (${allInvoices.length} invoices): ${tInvoices.toFixed(2)} ms`);

  // 4. PDF Generation Benchmark
  const sampleInvoice = allInvoices[0];
  if (sampleInvoice) {
    const settings = await db.businessSettings.findUnique({ where: { id: 'default' } });
    const t3 = performance.now();
    await generateInvoicePdf(sampleInvoice, settings);
    const tPdf = performance.now() - t3;
    console.log(`[Baseline] Invoice PDF generation (uncached): ${tPdf.toFixed(2)} ms`);
  }

  console.log('\n=== Baseline Measurement Complete ===');
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
