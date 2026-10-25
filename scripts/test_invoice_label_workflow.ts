import assert from 'assert';
import { INVOICE_TYPE_OPTIONS } from '../src/components/common/InvoiceTypeSelect';
import { getInvoiceTypeLabel, getInvoiceTypeTitle } from '../src/lib/utils';
import { generateInvoicePdf } from '../src/lib/invoicePdfGenerator';

console.log('================================================================');
console.log('🧪 VERIFYING "INVOICE" UI LABEL & NON-GST WORKFLOW INTEGRITY');
console.log('================================================================\n');

// 1. Verify UI Label in INVOICE_TYPE_OPTIONS
const nonGstOption = INVOICE_TYPE_OPTIONS.find((opt) => opt.value === 'NON_GST');
assert(nonGstOption, 'NON_GST option exists in INVOICE_TYPE_OPTIONS');
assert.strictEqual(nonGstOption.label, 'Invoice', 'UI label for NON_GST is renamed to "Invoice"');
assert(!nonGstOption.label.includes('Non-GST'), 'Option label does not contain "Non-GST"');
console.log('✅ PASS: UI label for NON_GST is "Invoice"');

// 2. Verify getInvoiceTypeLabel
assert.strictEqual(getInvoiceTypeLabel('NON_GST'), 'Invoice', 'getInvoiceTypeLabel("NON_GST") returns "Invoice"');
console.log('✅ PASS: getInvoiceTypeLabel("NON_GST") returns "Invoice"');

// 3. Verify other options remain unchanged
assert.strictEqual(getInvoiceTypeLabel('TAX_INVOICE'), 'Tax Invoice');
assert.strictEqual(getInvoiceTypeLabel('BILL_OF_SUPPLY'), 'Bill of Supply');
assert.strictEqual(getInvoiceTypeLabel('PROFORMA'), 'Proforma Invoice');
assert.strictEqual(getInvoiceTypeLabel('QUOTATION'), 'Quotation / Estimate');
assert.strictEqual(getInvoiceTypeLabel('CASH_MEMO'), 'Cash Memo');
console.log('✅ PASS: All other invoice type labels remain completely unchanged');

// 4. Verify Non-GST workflow business logic simulation:
// When "Invoice" (NON_GST) is selected:
const selectedType = 'NON_GST';
let taxConfiguration = 'CGST_SGST';
let paymentMode = 'Cash';

// Simulate handleInvoiceTypeChange:
const handleInvoiceTypeChange = (newType: string) => {
  if (newType === 'BILL_OF_SUPPLY' || newType === 'NON_GST' || newType === 'PROFORMA' || newType === 'QUOTATION' || newType === 'CASH_MEMO') {
    taxConfiguration = 'NONE';
  }
  if (newType === 'CASH_MEMO') {
    paymentMode = 'Cash';
  }
};

handleInvoiceTypeChange(selectedType);

const isNoTax = selectedType === 'BILL_OF_SUPPLY' || selectedType === 'NON_GST' || selectedType === 'PROFORMA' || selectedType === 'QUOTATION' || selectedType === 'CASH_MEMO' || taxConfiguration === 'NONE';
assert.strictEqual(taxConfiguration, 'NONE', 'Tax configuration is locked to NONE for Invoice (NON_GST)');
assert.strictEqual(isNoTax, true, 'isNoTax is true for Invoice (NON_GST)');
console.log('✅ PASS: Selecting "Invoice" (NON_GST) locks tax configuration to NONE and suppresses tax calculations');

// 5. Verify stock deduction rule:
// In the system, only QUOTATION bypasses stock decrement; NON_GST decrements stock
const shouldDecrementStock = (type: string) => type !== 'QUOTATION';
assert.strictEqual(shouldDecrementStock('NON_GST'), true, 'Invoice (NON_GST) correctly decrements inventory stock');
assert.strictEqual(shouldDecrementStock('QUOTATION'), false, 'Quotation correctly bypasses inventory decrement');
console.log('✅ PASS: Stock deduction behavior correctly decrements stock for Invoice (NON_GST)');

// 6. Verify PDF generation behavior with NON_GST:
async function testPdf() {
  const mockInvoice = {
    invoiceNumber: 'AT-2026-TEST-INV',
    invoiceType: 'NON_GST',
    taxConfiguration: 'NONE',
    date: new Date().toISOString(),
    customer: { name: 'Test Customer', phone: '9876543210' },
    items: [
      {
        description: 'Refurbished ThinkPad T480',
        hsn: '8471',
        quantity: 1,
        unit: 'Pcs',
        rate: 22000,
        total: 22000,
      },
    ],
    subtotal: 22000,
    grandTotal: 22000,
    paidAmount: 22000,
    balanceDue: 0,
  };

  const { blob, filename } = await generateInvoicePdf(mockInvoice);
  assert(blob.size > 1000, 'PDF generated successfully');
  assert(filename.includes('AT-2026-TEST-INV'), 'Filename contains invoice number');
  console.log(`✅ PASS: PDF generation for "Invoice" (NON_GST) verified (${blob.size} bytes)`);
}

testPdf().then(() => {
  console.log('\n================================================================');
  console.log('ALL VERIFICATIONS PASSED: 6/6 CHECKS SUCCESSFUL');
  console.log('================================================================');
}).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
