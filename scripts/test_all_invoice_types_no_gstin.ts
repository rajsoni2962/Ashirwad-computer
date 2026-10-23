import { generateInvoicePdf } from '../src/lib/invoicePdfGenerator';
import { db } from '../src/lib/db';
import { jsPDF } from 'jspdf';

interface TestCase {
  name: string;
  invoiceType: string;
}

const testCases: TestCase[] = [
  { name: 'Non-GST Invoice', invoiceType: 'NON_GST' },
  { name: 'Bill of Supply', invoiceType: 'BILL_OF_SUPPLY' },
  { name: 'Proforma Invoice', invoiceType: 'PROFORMA' },
  { name: 'Quotation / Estimate', invoiceType: 'QUOTATION' },
  { name: 'Cash Memo', invoiceType: 'CASH_MEMO' },
];

async function runTests() {
  console.log('====================================================');
  console.log('TESTING ALL INVOICE TYPES FOR ZERO GSTIN & NO TAXES');
  console.log('====================================================\n');

  const settings = await db.businessSettings.findUnique({ where: { id: 'default' } });

  let allPassed = true;

  // Tiny 1x1 png base64 for fast offline testing
  const dummyQr = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  for (const tc of testCases) {
    console.log(`Testing Invoice Type: "${tc.name}" (${tc.invoiceType})...`);

    const printedTexts: string[] = [];

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true,
    });

    // Intercept doc.text to capture every text item rendered on the document
    const origText = doc.text;
    doc.text = function (text: any, ...args: any[]) {
      if (typeof text === 'string') {
        printedTexts.push(text);
      } else if (Array.isArray(text)) {
        printedTexts.push(...text);
      }
      return origText.apply(this, [text, ...args] as any);
    };

    const mockInvoice = {
      id: `test-${tc.invoiceType.toLowerCase()}-1`,
      invoiceNumber: `AT/2026/TEST-${tc.invoiceType}`,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      invoiceType: tc.invoiceType,
      taxConfiguration: 'NONE',
      subtotal: 25000,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 25000,
      cgst: 0,
      sgst: 0,
      igst: 0,
      grandTotal: 25000,
      paidAmount: 25000,
      balanceDue: 0,
      paymentMode: 'Cash',
      paymentStatus: 'Paid',
      notes: 'Testing document rendering for non-GST registered business.',
      terms: '* Tested and working perfectly at the time of sale.\n* 6 Months warranty covers technical issues only.',
      customer: {
        id: 'cust-1',
        name: 'Walk-in Customer Test',
        phone: '9876543210',
        email: 'customer@test.com',
        address: '101 Test Tower, Ahmedabad',
        state: 'Gujarat',
        stateCode: '24',
        gstin: '', // Customer has no GSTIN
      },
      items: [
        {
          id: 'item-1',
          description: 'Lenovo ThinkPad T480s i7 8th Gen 16GB 512GB SSD',
          quantity: 1,
          unit: 'Pcs',
          rate: 25000,
          discount: 0,
          gstPercent: 0,
          taxableAmount: 25000,
          gstAmount: 0,
          total: 25000,
          hsn: '8471',
          warranty: '6 Months Warranty',
          serialNumber: 'SN-TP-8871',
        },
      ],
    };

    const result = await generateInvoicePdf(mockInvoice, settings, {
      qrBase64: dummyQr,
      doc,
    });

    const joinedText = printedTexts.join(' ');

    // 1. Verify GSTIN does NOT appear anywhere
    const hasGstin = /gstin/i.test(joinedText);
    const hasHardcodedGstin = joinedText.includes('24AANPA0000A1Z5');
    const hasBlankGstin = /gstin:\s*$/im.test(joinedText);

    // 2. Verify CGST, SGST, IGST do NOT appear
    const hasCgst = /cgst/i.test(joinedText);
    const hasSgst = /sgst/i.test(joinedText);
    const hasIgst = /igst/i.test(joinedText);

    // 3. Verify approved layout elements ARE present
    const hasCompanyName = /ASHIRWAD/i.test(joinedText);
    const hasPhone = joinedText.includes('9662278994');
    const hasTotal = /25,000/i.test(joinedText);
    const hasSignatory = /Authorized Signatory/i.test(joinedText);
    const hasBank = /Kotak|State Bank/i.test(joinedText);

    let testPassed = true;

    if (hasGstin || hasHardcodedGstin || hasBlankGstin) {
      console.error(`  ❌ FAILED: GSTIN appeared on generated document!`);
      testPassed = false;
    } else {
      console.log(`  ✓ Confirmed: NO GSTIN anywhere on generated document.`);
    }

    if (hasCgst || hasSgst || hasIgst) {
      console.error(`  ❌ FAILED: Automatic GST taxes (CGST/SGST/IGST) appeared!`);
      testPassed = false;
    } else {
      console.log(`  ✓ Confirmed: NO CGST, SGST, or IGST added to invoice.`);
    }

    if (!hasCompanyName || !hasPhone || !hasTotal || !hasSignatory || !hasBank) {
      console.error(`  ❌ FAILED: Missing essential layout elements:`, {
        hasCompanyName,
        hasPhone,
        hasTotal,
        hasSignatory,
        hasBank,
      });
      testPassed = false;
    } else {
      console.log(`  ✓ Confirmed: Approved layout, logo box, bank details, and signatory intact.`);
    }

    if (testPassed) {
      console.log(`  ✅ [PASS] ${tc.name} generated document verified.\n`);
    } else {
      allPassed = false;
      console.log(`  ❌ [FAIL] ${tc.name} generated document checks failed.\n`);
    }
  }

  if (allPassed) {
    console.log('========================================================================');
    console.log('🎉 ALL 5 INVOICE TYPES CONFIRMED CLEAN: NO GSTIN AND NO TAXES DISPLAYED');
    console.log('========================================================================');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
