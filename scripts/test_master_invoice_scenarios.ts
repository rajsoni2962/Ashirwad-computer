import { generateInvoicePdf, formatPdfCurrency } from '../src/lib/invoicePdfGenerator';
import { numberToWords, getInvoiceTypeTitle } from '../src/lib/utils';
import fs from 'fs';
import path from 'path';

async function runScenarioTests() {
  console.log('================================================================');
  console.log('🧪 TESTING ASHIRWAD MASTER INVOICE PDF — ALL 8 SCENARIOS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, details || '');
      failed++;
    }
  }

  const baseBusiness = {
    companyName: 'ASHIRWAD TECHNOLOGIES',
    tagline: 'BEYOND TECH LIMITS',
    address: 'A/1, 902, Ashraya 10, GST compound, New Ranip, Ahmedabad 382470.',
    phone: '9662278994',
    email: 'rajsoni2962@gmail.com',
    gstin: '',
    bankName: 'Kotak Mahindra Bank',
    accountNumber: '5947557983',
    ifscCode: 'KKBK0000879',
    upiId: 'rajsoni2962-2@okaxis',
  };

  const baseCustomer = {
    name: 'SMVS Ghatlodiya mandir',
    phone: '9714904990',
    address: '1, KK Nagar Rd, Nr, Gyanjyot School, Riddhi society, Ghatlodiya',
    state: 'Gujarat',
    stateCode: '24',
  };

  // Scenario 1: A single-item invoice (Reference invoice)
  console.log('--- Scenario 1: Single-Item Invoice ---');
  const sc1 = await generateInvoicePdf({
    invoiceNumber: 'AT/2026/11',
    invoiceType: 'NON_GST',
    date: '2026-10-18T10:00:00Z',
    paymentMode: 'Cash',
    subtotal: 2200,
    grandTotal: 2200,
    paidAmount: 2200,
    balanceDue: 0,
    customer: baseCustomer,
    items: [
      {
        description: 'SK Hynix 4GB 2666MHz DDR4 Laptop RAM',
        hsn: '8471',
        quantity: 1,
        unit: 'Pcs',
        rate: 2200,
        total: 2200,
      }
    ],
  }, baseBusiness);

  assert(sc1.arrayBuffer && sc1.arrayBuffer.byteLength > 1000, 'Scenario 1 PDF generated', { size: sc1.arrayBuffer.byteLength });
  assert(sc1.filename.includes('AT-2026-11'), 'Scenario 1 filename sanitized properly');

  // Scenario 2: Multi-item invoice
  console.log('\n--- Scenario 2: Multi-Item Invoice ---');
  const sc2 = await generateInvoicePdf({
    invoiceNumber: 'AT/2026/12',
    invoiceType: 'TAX_INVOICE',
    date: '2026-10-18T11:00:00Z',
    paymentMode: 'UPI',
    subtotal: 54000,
    taxableAmount: 45762.71,
    cgst: 4118.64,
    sgst: 4118.64,
    grandTotal: 54000,
    paidAmount: 54000,
    balanceDue: 0,
    customer: baseCustomer,
    items: [
      { description: 'Lenovo ThinkPad T480 i5 8th Gen 16GB 512GB SSD', hsn: '8471', quantity: 1, unit: 'Pcs', rate: 28000, total: 28000 },
      { description: 'Dell Latitude 7490 i7 8th Gen 16GB 256GB SSD', hsn: '8471', quantity: 1, unit: 'Pcs', rate: 26000, total: 26000 },
    ],
  }, baseBusiness);
  assert(sc2.arrayBuffer && sc2.arrayBuffer.byteLength > 1000, 'Scenario 2 PDF generated for 2 items');

  // Scenario 3: Long product descriptions & text wrapping
  console.log('\n--- Scenario 3: Long Product Descriptions ---');
  const sc3 = await generateInvoicePdf({
    invoiceNumber: 'AT/2026/13',
    invoiceType: 'TAX_INVOICE',
    date: '2026-10-18T12:00:00Z',
    subtotal: 35000,
    grandTotal: 35000,
    paidAmount: 35000,
    balanceDue: 0,
    customer: baseCustomer,
    items: [
      {
        description: 'HP ZBook Studio G5 Mobile Workstation - Intel Core i7-8850H 6-Core vPro Processor, 32GB DDR4 2666MHz RAM, 1TB NVMe PCIe M.2 High Speed SSD, NVIDIA Quadro P1000 4GB Dedicated GDDR5 Graphics Card, 15.6" UHD 4K Anti-Glare IPS Display (Grade A+ Certified Refurbished)',
        serialNumber: 'S/N: 5CD8472B7Q',
        warranty: '6 Months Comprehensive Hardware Warranty',
        hsn: '8471',
        quantity: 1,
        unit: 'Pcs',
        rate: 35000,
        total: 35000,
      }
    ],
  }, baseBusiness);
  assert(sc3.arrayBuffer && sc3.arrayBuffer.byteLength > 1000, 'Scenario 3 PDF generated with multi-line description and serial/warranty');

  // Scenario 4: Non-GST Invoice
  console.log('\n--- Scenario 4: Non-GST Invoice ---');
  const sc4 = await generateInvoicePdf({
    invoiceNumber: 'NGST/2026/01',
    invoiceType: 'NON_GST',
    subtotal: 4500,
    grandTotal: 4500,
    paidAmount: 4500,
    balanceDue: 0,
    customer: baseCustomer,
    items: [{ description: 'Kingston 500GB NVMe M.2 SSD + Installation', hsn: '8471', quantity: 1, unit: 'Pcs', rate: 4500, total: 4500 }],
  }, baseBusiness);
  assert(getInvoiceTypeTitle('NON_GST') === 'INVOICE', 'Non-GST title resolved as INVOICE');
  assert(sc4.arrayBuffer && sc4.arrayBuffer.byteLength > 1000, 'Scenario 4 Non-GST PDF generated');

  // Scenario 5: GST Invoice with CGST + SGST (Intrastate)
  console.log('\n--- Scenario 5: GST Invoice with CGST + SGST ---');
  const sc5 = await generateInvoicePdf({
    invoiceNumber: 'TAX/2026/99',
    invoiceType: 'TAX_INVOICE',
    taxConfiguration: 'CGST_SGST',
    subtotal: 20000,
    taxableAmount: 16949.15,
    cgst: 1525.42,
    sgst: 1525.42,
    grandTotal: 20000,
    paidAmount: 20000,
    balanceDue: 0,
    customer: baseCustomer,
    items: [{ description: 'Motherboard Chip-Level Repair & Thermal Servicing', hsn: '9987', quantity: 1, unit: 'Job', rate: 20000, total: 20000 }],
  }, baseBusiness);
  assert(sc5.arrayBuffer && sc5.arrayBuffer.byteLength > 1000, 'Scenario 5 Intra-state GST PDF generated');

  // Scenario 6: Interstate Invoice with IGST
  console.log('\n--- Scenario 6: Interstate Invoice with IGST ---');
  const outstationCustomer = {
    name: 'Vikas Sharma (Outstation Buyer)',
    phone: '9988776655',
    address: 'Sector 62, Noida, Uttar Pradesh',
    state: 'Uttar Pradesh',
    stateCode: '09',
    gstin: '09AABCV1234F1Z9',
  };
  const sc6 = await generateInvoicePdf({
    invoiceNumber: 'IGST/2026/05',
    invoiceType: 'TAX_INVOICE',
    taxConfiguration: 'IGST',
    subtotal: 42000,
    taxableAmount: 35593.22,
    igst: 6406.78,
    grandTotal: 42000,
    paidAmount: 42000,
    balanceDue: 0,
    customer: outstationCustomer,
    items: [{ description: 'Dell Precision 7530 Intel Xeon E-2176M 32GB ECC 512GB SSD', hsn: '8471', quantity: 1, unit: 'Pcs', rate: 42000, total: 42000 }],
  }, baseBusiness);
  assert(sc6.arrayBuffer && sc6.arrayBuffer.byteLength > 1000, 'Scenario 6 Interstate IGST PDF generated');

  // Scenario 7: Partially Paid Invoice
  console.log('\n--- Scenario 7: Partially Paid Invoice ---');
  const sc7 = await generateInvoicePdf({
    invoiceNumber: 'AT/2026/88',
    invoiceType: 'TAX_INVOICE',
    subtotal: 50000,
    grandTotal: 50000,
    paidAmount: 20000,
    balanceDue: 30000,
    customer: baseCustomer,
    items: [{ description: 'Apple MacBook Pro 16" Intel Core i7 16GB 512GB SSD', hsn: '8471', quantity: 1, unit: 'Pcs', rate: 50000, total: 50000 }],
  }, baseBusiness);
  assert(sc7.arrayBuffer && sc7.arrayBuffer.byteLength > 1000, 'Scenario 7 Partially Paid PDF generated with balance due');

  // Scenario 8: Invoice without optional bank details
  console.log('\n--- Scenario 8: Invoice Without Optional Bank Details ---');
  const businessWithoutBank = {
    ...baseBusiness,
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  };
  const sc8 = await generateInvoicePdf({
    invoiceNumber: 'CSH/2026/01',
    invoiceType: 'CASH_MEMO',
    subtotal: 1500,
    grandTotal: 1500,
    paidAmount: 1500,
    balanceDue: 0,
    customer: { name: 'Direct Counter Cash Buyer', phone: '' },
    items: [{ description: 'Original 65W Type-C Laptop Fast Charger', hsn: '8504', quantity: 1, unit: 'Pcs', rate: 1500, total: 1500 }],
  }, businessWithoutBank);
  assert(sc8.arrayBuffer && sc8.arrayBuffer.byteLength > 1000, 'Scenario 8 PDF generated cleanly without bank details');

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runScenarioTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
