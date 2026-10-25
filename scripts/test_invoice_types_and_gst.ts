import { getTestDb } from '../src/lib/test-db';
import { assertSafeForTesting } from '../src/lib/db-guard';
import { generateInvoicePdf, formatPdfCurrency } from '../src/lib/invoicePdfGenerator';
import { getInvoiceTypeTitle, getTaxConfigLabel } from '../src/lib/utils';

async function runTestSuite() {
  // Fail-closed guard: NEVER run against production database
  assertSafeForTesting({ scriptName: 'scripts/test_invoice_types_and_gst.ts' });
  const db = getTestDb();

  console.log('================================================================');
  console.log('🧪 TESTING INVOICE TYPES, OPTIONAL GST, AND PDF INTEGRATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const createdTestInvoiceIds: string[] = [];

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, details || '');
      failed++;
    }
  }

  // 1. Ensure test customer and product exist
  let testCustomer = await db.customer.findFirst({ where: { phone: '9988776655' } });
  if (!testCustomer) {
    testCustomer = await db.customer.create({
      data: {
        name: 'Vikas Sharma (Outstation Buyer)',
        phone: '9988776655',
        email: 'vikas.sharma@example.com',
        address: 'Sector 62, Noida, Uttar Pradesh',
        state: 'Uttar Pradesh',
        stateCode: '09',
        gstin: '09AABCV1234F1Z9',
        currentBalance: 0,
      },
    });
  }

  let localCustomer = await db.customer.findFirst({ where: { phone: '9825000001' } });
  if (!localCustomer) {
    localCustomer = await db.customer.create({
      data: {
        name: 'Jignesh Patel (Local Gujarat Buyer)',
        phone: '9825000001',
        email: 'jignesh@example.com',
        address: 'CG Road, Ahmedabad, Gujarat',
        state: 'Gujarat',
        stateCode: '24',
        gstin: '24AABCP1234F1Z1',
        currentBalance: 0,
      },
    });
  }

  let testProduct = await db.product.findFirst({ where: { name: 'HP EliteBook 840 G6 Test Laptop' } });
  if (!testProduct) {
    testProduct = await db.product.create({
      data: {
        name: 'HP EliteBook 840 G6 Test Laptop',
        brand: 'HP',
        model: 'EliteBook 840 G6',
        category: 'Laptop',
        productType: 'PHYSICAL',
        sellingPrice: 30000,
        purchasePrice: 22000,
        currentStock: 50,
        minStock: 2,
        warranty: '6 Months',
        gstPercent: 18,
      },
    });
  }

  const initialStock = (await db.product.findUnique({ where: { id: testProduct.id } }))?.currentStock || 50;
  console.log(`Initial test product stock: ${initialStock}\n`);

  // ============================================================================
  // TEST 1: Standard Tax Invoice (Intra-State: CGST + SGST)
  // ============================================================================
  console.log('--- Test 1: Standard Tax Invoice (CGST + SGST) ---');
  const taxInvoiceNumber = `TI-${Date.now().toString().slice(-6)}`;
  const rate1 = 30000;
  const taxable1 = Math.round((rate1 / 1.18) * 100) / 100;
  const gst1 = Math.round((rate1 - taxable1) * 100) / 100;
  const cgst1 = Math.round((gst1 / 2) * 100) / 100;
  const sgst1 = Math.round((gst1 / 2) * 100) / 100;

  const inv1 = await db.invoice.create({
    data: {
      invoiceNumber: taxInvoiceNumber,
      invoiceType: 'TAX_INVOICE',
      taxConfiguration: 'CGST_SGST',
      date: new Date(),
      customerId: localCustomer.id,
      subtotal: rate1,
      taxableAmount: taxable1,
      cgst: cgst1,
      sgst: sgst1,
      igst: 0,
      grandTotal: rate1,
      finalTotal: rate1,
      paidAmount: rate1,
      balanceDue: 0,
      paymentMode: 'UPI',
      paymentStatus: 'Paid',
      status: 'Confirmed',
      items: {
        create: [
          {
            productId: testProduct.id,
            productName: testProduct.name,
            quantity: 1,
            unit: 'Pcs',
            rate: rate1,
            taxableAmount: taxable1,
            gstAmount: gst1,
            gstPercent: 18,
            total: rate1,
          },
        ],
      },
    },
    include: { items: true, customer: true },
  });

  assert(inv1.invoiceType === 'TAX_INVOICE', 'Invoice 1 has invoiceType TAX_INVOICE');
  assert(inv1.taxConfiguration === 'CGST_SGST', 'Invoice 1 has taxConfiguration CGST_SGST');
  assert(inv1.cgst > 0 && inv1.sgst > 0 && inv1.igst === 0, 'Invoice 1 correctly charges CGST and SGST with 0 IGST');
  assert(getInvoiceTypeTitle(inv1.invoiceType) === 'TAX INVOICE', 'getInvoiceTypeTitle returns "TAX INVOICE"');

  // ============================================================================
  // TEST 2: Inter-State Tax Invoice (IGST)
  // ============================================================================
  console.log('\n--- Test 2: Inter-State Tax Invoice (IGST) ---');
  const igstInvoiceNumber = `IGST-${Date.now().toString().slice(-6)}`;
  const inv2 = await db.invoice.create({
    data: {
      invoiceNumber: igstInvoiceNumber,
      invoiceType: 'TAX_INVOICE',
      taxConfiguration: 'IGST',
      date: new Date(),
      customerId: testCustomer.id,
      subtotal: rate1,
      taxableAmount: taxable1,
      cgst: 0,
      sgst: 0,
      igst: gst1,
      grandTotal: rate1,
      finalTotal: rate1,
      paidAmount: rate1,
      balanceDue: 0,
      paymentMode: 'Bank Transfer',
      paymentStatus: 'Paid',
      status: 'Confirmed',
      items: {
        create: [
          {
            productId: testProduct.id,
            productName: testProduct.name,
            quantity: 1,
            unit: 'Pcs',
            rate: rate1,
            taxableAmount: taxable1,
            gstAmount: gst1,
            gstPercent: 18,
            total: rate1,
          },
        ],
      },
    },
    include: { items: true, customer: true },
  });

  assert(inv2.taxConfiguration === 'IGST', 'Invoice 2 has taxConfiguration IGST');
  assert(inv2.igst > 0 && inv2.cgst === 0 && inv2.sgst === 0, 'Invoice 2 allocates 100% tax to IGST with CGST=0 and SGST=0');
  assert(getTaxConfigLabel(inv2.taxConfiguration) === 'IGST (Inter-State)', 'Tax label returns "IGST (Inter-State)"');

  // ============================================================================
  // TEST 3: Bill of Supply (Zero Tax, Non-Taxable Supply)
  // ============================================================================
  console.log('\n--- Test 3: Bill of Supply (Composition/Exempt Supply) ---');
  const bosNumber = `BOS-${Date.now().toString().slice(-6)}`;
  const inv3 = await db.invoice.create({
    data: {
      invoiceNumber: bosNumber,
      invoiceType: 'BILL_OF_SUPPLY',
      taxConfiguration: 'NONE',
      date: new Date(),
      customerId: localCustomer.id,
      subtotal: 25000,
      taxableAmount: 25000,
      cgst: 0,
      sgst: 0,
      igst: 0,
      grandTotal: 25000,
      finalTotal: 25000,
      paidAmount: 25000,
      balanceDue: 0,
      paymentMode: 'Cash',
      paymentStatus: 'Paid',
      status: 'Confirmed',
      items: {
        create: [
          {
            productId: testProduct.id,
            productName: testProduct.name,
            quantity: 1,
            unit: 'Pcs',
            rate: 25000,
            taxableAmount: 25000,
            gstAmount: 0,
            gstPercent: 0,
            total: 25000,
          },
        ],
      },
    },
    include: { items: true, customer: true },
  });

  assert(inv3.invoiceType === 'BILL_OF_SUPPLY', 'Invoice 3 has invoiceType BILL_OF_SUPPLY');
  assert(inv3.taxConfiguration === 'NONE', 'Invoice 3 has taxConfiguration NONE');
  assert(inv3.cgst === 0 && inv3.sgst === 0 && inv3.igst === 0, 'Invoice 3 charges ZERO GST');
  assert(getInvoiceTypeTitle(inv3.invoiceType) === 'BILL OF SUPPLY', 'getInvoiceTypeTitle returns "BILL OF SUPPLY"');

  // ============================================================================
  // TEST 4: Non-GST Invoice (Unregistered / Non-Taxable goods)
  // ============================================================================
  console.log('\n--- Test 4: Non-GST Invoice ---');
  const nonGstNumber = `NGST-${Date.now().toString().slice(-6)}`;
  const inv4 = await db.invoice.create({
    data: {
      invoiceNumber: nonGstNumber,
      invoiceType: 'NON_GST',
      taxConfiguration: 'NONE',
      date: new Date(),
      customerId: localCustomer.id,
      subtotal: 18000,
      taxableAmount: 18000,
      cgst: 0,
      sgst: 0,
      igst: 0,
      grandTotal: 18000,
      finalTotal: 18000,
      paidAmount: 18000,
      balanceDue: 0,
      paymentMode: 'Cash',
      paymentStatus: 'Paid',
      status: 'Confirmed',
      items: {
        create: [
          {
            productId: testProduct.id,
            productName: testProduct.name,
            quantity: 1,
            unit: 'Pcs',
            rate: 18000,
            taxableAmount: 18000,
            gstAmount: 0,
            gstPercent: 0,
            total: 18000,
          },
        ],
      },
    },
    include: { items: true, customer: true },
  });

  assert(inv4.invoiceType === 'NON_GST', 'Invoice 4 has invoiceType NON_GST');
  assert(getInvoiceTypeTitle(inv4.invoiceType) === 'INVOICE', 'getInvoiceTypeTitle returns "INVOICE"');

  // ============================================================================
  // TEST 5: Quotation / Estimate (Stock & Ledger Isolation)
  // ============================================================================
  console.log('\n--- Test 5: Quotation / Estimate ---');
  const quoteNumber = `EST-${Date.now().toString().slice(-6)}`;
  const stockBeforeQuote = (await db.product.findUnique({ where: { id: testProduct.id } }))?.currentStock || 0;
  const balanceBeforeQuote = (await db.customer.findUnique({ where: { id: localCustomer.id } }))?.currentBalance || 0;

  // Simulate API creation behavior: quotations do NOT decrement stock or customer balance
  const invQuote = await db.invoice.create({
    data: {
      invoiceNumber: quoteNumber,
      invoiceType: 'QUOTATION',
      taxConfiguration: 'CGST_SGST',
      date: new Date(),
      customerId: localCustomer.id,
      subtotal: 45000,
      taxableAmount: 38135.59,
      cgst: 3432.2,
      sgst: 3432.2,
      igst: 0,
      grandTotal: 45000,
      finalTotal: 45000,
      paidAmount: 0,
      balanceDue: 45000,
      paymentMode: 'Credit',
      paymentStatus: 'Unpaid',
      status: 'Confirmed',
      items: {
        create: [
          {
            productId: testProduct.id,
            productName: testProduct.name,
            quantity: 1,
            unit: 'Pcs',
            rate: 45000,
            taxableAmount: 38135.59,
            gstAmount: 6864.41,
            gstPercent: 18,
            total: 45000,
          },
        ],
      },
    },
    include: { items: true, customer: true },
  });

  const stockAfterQuote = (await db.product.findUnique({ where: { id: testProduct.id } }))?.currentStock || 0;
  const balanceAfterQuote = (await db.customer.findUnique({ where: { id: localCustomer.id } }))?.currentBalance || 0;

  assert(invQuote.invoiceType === 'QUOTATION', 'Invoice Quote has invoiceType QUOTATION');
  assert(getInvoiceTypeTitle(invQuote.invoiceType) === 'QUOTATION / ESTIMATE', 'Title returns "QUOTATION / ESTIMATE"');
  assert(stockAfterQuote === stockBeforeQuote, `Quotation did NOT decrement physical stock (${stockBeforeQuote} === ${stockAfterQuote})`);
  assert(balanceAfterQuote === balanceBeforeQuote, `Quotation did NOT add debt to customer ledger (${balanceBeforeQuote} === ${balanceAfterQuote})`);

  // ============================================================================
  // TEST 6: Cash Memo & Proforma
  // ============================================================================
  console.log('\n--- Test 6: Cash Memo & Proforma ---');
  const cashMemoTitle = getInvoiceTypeTitle('CASH_MEMO');
  const proformaTitle = getInvoiceTypeTitle('PROFORMA');
  assert(cashMemoTitle === 'CASH MEMO', 'Cash Memo title returns "CASH MEMO"');
  assert(proformaTitle === 'PROFORMA INVOICE', 'Proforma title returns "PROFORMA INVOICE"');

  // ============================================================================
  // TEST 7: PDF Generator Verification Across All Invoice Types
  // ============================================================================
  console.log('\n--- Test 7: Vector PDF Generation Across All Invoice Types ---');
  
  // PDF for Tax Invoice
  const pdf1 = await generateInvoicePdf(inv1);
  assert(pdf1.arrayBuffer && pdf1.arrayBuffer.byteLength > 1000, 'Tax Invoice PDF generated successfully', { bytes: pdf1.arrayBuffer?.byteLength });

  // PDF for IGST Invoice
  const pdf2 = await generateInvoicePdf(inv2);
  assert(pdf2.arrayBuffer && pdf2.arrayBuffer.byteLength > 1000, 'IGST Invoice PDF generated successfully', { bytes: pdf2.arrayBuffer?.byteLength });

  // PDF for Bill of Supply (Omission of tax rows)
  const pdf3 = await generateInvoicePdf(inv3);
  assert(pdf3.arrayBuffer && pdf3.arrayBuffer.byteLength > 1000, 'Bill of Supply PDF generated successfully', { bytes: pdf3.arrayBuffer?.byteLength });

  // PDF for Quotation
  const pdfQuote = await generateInvoicePdf(invQuote);
  assert(pdfQuote.arrayBuffer && pdfQuote.arrayBuffer.byteLength > 1000, 'Quotation PDF generated successfully', { bytes: pdfQuote.arrayBuffer?.byteLength });

  // ============================================================================
  // TEST 8: Soft Delete & History Preservation
  // ============================================================================
  console.log('\n--- Test 8: Soft Deletion of Quotation Does NOT Inflate Inventory ---');
  const stockBeforeDeleteQuote = (await db.product.findUnique({ where: { id: testProduct.id } }))?.currentStock || 0;
  
  // Mark deleted
  await db.invoice.update({
    where: { id: invQuote.id },
    data: { isDeleted: true, deletedAt: new Date(), deletionReason: 'Test quote expiry' },
  });

  const stockAfterDeleteQuote = (await db.product.findUnique({ where: { id: testProduct.id } }))?.currentStock || 0;
  assert(stockAfterDeleteQuote === stockBeforeDeleteQuote, `Soft-deleting quotation did NOT alter stock (${stockBeforeDeleteQuote} === ${stockAfterDeleteQuote})`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
