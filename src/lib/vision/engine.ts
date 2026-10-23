import { db } from '@/lib/db';
import {
  AIBillVisionResult,
  BoundingBox,
  DocumentClassification,
  ExtractedCustomer,
  ExtractedInvoiceMeta,
  ExtractedItem,
  ExtractedPaymentAndBank,
  ExtractedSupplier,
  ExtractedTotals,
  RawVisionExtraction,
} from './types';
import { verifyBillMathematics } from './verification';
import { matchProductsWithInventory, matchSupplierWithLearning, detectDuplicateInvoice } from './matching';

export interface FilePayload {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  fileUrl: string;
}

const VISION_SYSTEM_PROMPT = `You are an elite Multimodal AI Document Vision Intelligence specialized in Indian B2B & Retail invoices, bills of supply, receipts, and challans.

You are given the ACTUAL ORIGINAL DOCUMENT IMAGE(S) / PDF directly.
Visually inspect every detail: text, tables, columns, rows, cell alignments, headers, footers, logos, stamps, signatures, checkboxes, handwritten notes, printed text, numbers, and GST breakdowns.

CRITICAL INSTRUCTIONS:
1. UNDERSTAND THE ENTIRE IMAGE:
   Classify what document this is from: "GST Invoice", "Retail Bill", "Purchase Invoice", "Tax Invoice", "Quotation", "Estimate", "Credit Note", "Debit Note", "Receipt", "Delivery Challan", or "Other".
   Identify detected document regions: ["HEADER", "SUPPLIER INFORMATION", "CUSTOMER INFORMATION", "INVOICE INFORMATION", "ITEM TABLE", "TAX SECTION", "TOTAL SECTION", "PAYMENT INFORMATION", "BANK INFORMATION", "TERMS", "FOOTER", "SIGNATURE"].

2. PRESERVE EXACT PRODUCT DESCRIPTIONS:
   Do NOT shorten or summarize descriptions. E.g., if a bill says "Dell Latitude 5410 i5 10th Gen 8GB DDR4 256GB SSD", preserve this full text in full_description!

3. UNDERSTAND TABLE STRUCTURE & MULTI-LINE ROWS:
   Preserve row-to-column mappings. If an item description wraps across multiple visual lines, it is ONE single line item. If a bill spans multiple pages/images, unify items into one consecutive item table.

4. VISUAL RELATIONSHIP UNDERSTANDING:
   Map key-value pairs based on visual layout (e.g., "Invoice No:" -> value, "Total:" -> value, GSTIN -> supplier or customer block).

5. DO NOT INVENT OR GUESS MISSING INFORMATION:
   If a field is unreadable, missing, or obscured, you MUST return value = null. Never fabricate GSTIN, invoice numbers, or totals!

6. REGION BOUNDING BOXES (BBOX):
   For important extracted fields and every line item, provide approximate normalized bounding box coordinates:
   "bbox": { "x": 0-1000, "y": 0-1000, "width": 0-1000, "height": 0-1000 }
   where (0,0) is top-left and (1000,1000) is bottom-right of the document page.

Return strict, valid JSON ONLY without any markdown decoration outside the JSON:
{
  "document_type": "GST Invoice",
  "document_type_confidence": 0.98,
  "regions_detected": ["HEADER", "SUPPLIER INFORMATION", "INVOICE INFORMATION", "ITEM TABLE", "TAX SECTION", "TOTAL SECTION", "BANK INFORMATION", "TERMS"],
  "supplier": {
    "business_name": { "value": "ABC Infotech", "confidence": 0.99, "bbox": { "x": 50, "y": 40, "width": 300, "height": 40 } },
    "legal_name": { "value": null, "confidence": 0.0 },
    "gstin": { "value": "24ABCDE1234F1Z5", "confidence": 0.98, "bbox": { "x": 50, "y": 85, "width": 220, "height": 25 } },
    "pan": { "value": null, "confidence": 0.0 },
    "address": { "value": "Shop 4, City Center, SG Highway", "confidence": 0.95 },
    "city": { "value": "Ahmedabad", "confidence": 0.95 },
    "state": { "value": "Gujarat", "confidence": 0.95 },
    "state_code": { "value": "24", "confidence": 0.95 },
    "pin_code": { "value": "380054", "confidence": 0.9 },
    "phone": { "value": "9876543210", "confidence": 0.9 },
    "email": { "value": "sales@abcinfotech.com", "confidence": 0.9 },
    "website": { "value": null, "confidence": 0.0 }
  },
  "customer": {
    "customer_name": { "value": "Ashirwad Tech", "confidence": 0.95 },
    "gstin": { "value": null, "confidence": 0.0 },
    "address": { "value": "Ahmedabad", "confidence": 0.85 },
    "state": { "value": "Gujarat", "confidence": 0.9 },
    "state_code": { "value": "24", "confidence": 0.9 },
    "phone": { "value": null, "confidence": 0.0 },
    "email": { "value": null, "confidence": 0.0 }
  },
  "invoice": {
    "invoice_number": { "value": "INV-2026-098", "confidence": 0.99, "bbox": { "x": 650, "y": 50, "width": 200, "height": 30 } },
    "invoice_date": { "value": "2026-09-24", "confidence": 0.98, "bbox": { "x": 650, "y": 85, "width": 150, "height": 25 } },
    "due_date": { "value": null, "confidence": 0.0 },
    "purchase_order_number": { "value": null, "confidence": 0.0 },
    "reference_number": { "value": null, "confidence": 0.0 },
    "place_of_supply": { "value": "Gujarat (24)", "confidence": 0.9 },
    "reverse_charge": { "value": "No", "confidence": 0.9 },
    "eway_bill_number": { "value": null, "confidence": 0.0 },
    "transport_information": { "value": null, "confidence": 0.0 }
  },
  "items": [
    {
      "item_name": { "value": "Dell Latitude 5410", "confidence": 0.98 },
      "full_description": { "value": "Dell Latitude 5410 i5 10th Gen 8GB DDR4 256GB SSD FHD Display Refurbished", "confidence": 0.98 },
      "brand": { "value": "Dell", "confidence": 0.99 },
      "model": { "value": "Latitude 5410", "confidence": 0.95 },
      "sku": { "value": null, "confidence": 0.0 },
      "product_code": { "value": null, "confidence": 0.0 },
      "hsn_sac": { "value": "8471", "confidence": 0.95 },
      "quantity": { "value": 2, "confidence": 0.99 },
      "unit": { "value": "Pcs", "confidence": 0.9 },
      "rate": { "value": 23000, "confidence": 0.98 },
      "mrp": { "value": null, "confidence": 0.0 },
      "discount": { "value": 0, "confidence": 0.9 },
      "taxable_amount": { "value": 46000, "confidence": 0.98 },
      "gst_rate": { "value": 18, "confidence": 0.98 },
      "cgst": { "value": 4140, "confidence": 0.95 },
      "sgst": { "value": 4140, "confidence": 0.95 },
      "igst": { "value": 0, "confidence": 0.95 },
      "cess": { "value": 0, "confidence": 0.0 },
      "other_taxes": { "value": 0, "confidence": 0.0 },
      "line_total": { "value": 54280, "confidence": 0.99 },
      "bbox": { "x": 50, "y": 250, "width": 900, "height": 45 }
    }
  ],
  "totals": {
    "gross_amount": { "value": 46000, "confidence": 0.95 },
    "discount": { "value": 0, "confidence": 0.9 },
    "taxable_amount": { "value": 46000, "confidence": 0.98 },
    "cgst_total": { "value": 4140, "confidence": 0.95 },
    "sgst_total": { "value": 4140, "confidence": 0.95 },
    "igst_total": { "value": 0, "confidence": 0.95 },
    "cess": { "value": 0, "confidence": 0.0 },
    "round_off": { "value": 0, "confidence": 0.9 },
    "shipping": { "value": 0, "confidence": 0.9 },
    "other_charges": { "value": 0, "confidence": 0.0 },
    "grand_total": { "value": 54280, "confidence": 0.99, "bbox": { "x": 700, "y": 780, "width": 200, "height": 35 } },
    "amount_paid": { "value": 0, "confidence": 0.9 },
    "balance_due": { "value": 54280, "confidence": 0.9 },
    "amount_in_words": { "value": "Fifty Four Thousand Two Hundred Eighty Rupees Only", "confidence": 0.95 }
  },
  "payment": {
    "payment_mode": { "value": "Bank Transfer", "confidence": 0.8 },
    "bank_name": { "value": "HDFC Bank", "confidence": 0.9 },
    "account_number": { "value": "50200012345678", "confidence": 0.95 },
    "ifsc_code": { "value": "HDFC0000123", "confidence": 0.95 },
    "upi_id": { "value": null, "confidence": 0.0 },
    "transaction_reference": { "value": null, "confidence": 0.0 }
  },
  "bank_details": {
    "bank_name": { "value": "HDFC Bank", "confidence": 0.9 },
    "account_number": { "value": "50200012345678", "confidence": 0.95 },
    "ifsc_code": { "value": "HDFC0000123", "confidence": 0.95 }
  },
  "terms": [
    "Goods once sold will not be taken back without original packaging.",
    "Subject to Ahmedabad jurisdiction only."
  ],
  "additional_information": [],
  "extraction_notes": [
    "Invoice is clearly legible with official GST header.",
    "Both CGST (9%) and SGST (9%) applied."
  ]
}`;

/**
 * Resolves available AI Vision configuration from database or environment.
 */
export async function getVisionConfig() {
  const settings = await db.businessSettings.findUnique({ where: { id: 'default' } });

  const geminiKey =
    settings?.geminiApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    '';

  const openaiKey = settings?.openaiApiKey || process.env.OPENAI_API_KEY || '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';

  const provider = settings?.visionProvider || (geminiKey ? 'gemini' : openaiKey ? 'openai' : anthropicKey ? 'anthropic' : 'gemini');
  const model = settings?.visionModel || (provider === 'gemini' ? 'gemini-2.5-flash' : provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022');

  return {
    provider,
    model,
    geminiKey,
    openaiKey,
    anthropicKey,
    hasAnyKey: Boolean(geminiKey || openaiKey || anthropicKey),
  };
}

/**
 * Main multimodal AI vision analysis runner.
 * Sends original file(s) directly to the configured vision model.
 */
export async function analyzeBillWithVision(
  files: FilePayload[],
  customKey?: string,
  customProvider?: string,
  customModel?: string
): Promise<AIBillVisionResult> {
  const config = await getVisionConfig();
  const provider = customProvider || config.provider;
  const model = customModel || config.model;

  let apiKey = customKey;
  if (!apiKey) {
    if (provider === 'gemini') apiKey = config.geminiKey;
    else if (provider === 'openai') apiKey = config.openaiKey;
    else if (provider === 'anthropic') apiKey = config.anthropicKey;
  }

  if (!apiKey && provider !== 'ollama') {
    throw new Error(
      `No API key configured for multimodal vision provider "${provider}". Please configure GEMINI_API_KEY or OPENAI_API_KEY in your settings or .env file to enable live AI bill understanding.`
    );
  }

  let rawJson: RawVisionExtraction | null = null;

  if (provider === 'gemini') {
    rawJson = await callGeminiVision(files, apiKey!, model);
  } else if (provider === 'openai') {
    rawJson = await callOpenAiVision(files, apiKey!, model);
  } else if (provider === 'anthropic') {
    rawJson = await callAnthropicVision(files, apiKey!, model);
  } else {
    throw new Error(`Unsupported vision provider: ${provider}`);
  }

  if (!rawJson) {
    throw new Error('Multimodal vision model did not return valid document understanding data.');
  }

  // 1. Normalize Extracted Supplier
  const supplier: ExtractedSupplier = {
    business_name: rawJson.supplier?.business_name || { value: 'Supplier', confidence: 0.5 },
    legal_name: rawJson.supplier?.legal_name || { value: null, confidence: 0.0 },
    gstin: rawJson.supplier?.gstin || { value: null, confidence: 0.0 },
    pan: rawJson.supplier?.pan || { value: null, confidence: 0.0 },
    address: rawJson.supplier?.address || { value: null, confidence: 0.0 },
    city: rawJson.supplier?.city || { value: null, confidence: 0.0 },
    state: rawJson.supplier?.state || { value: null, confidence: 0.0 },
    state_code: rawJson.supplier?.state_code || { value: null, confidence: 0.0 },
    pin_code: rawJson.supplier?.pin_code || { value: null, confidence: 0.0 },
    phone: rawJson.supplier?.phone || { value: null, confidence: 0.0 },
    email: rawJson.supplier?.email || { value: null, confidence: 0.0 },
    website: rawJson.supplier?.website || { value: null, confidence: 0.0 },
  };

  // 2. Normalize Extracted Customer
  const customer: ExtractedCustomer = {
    customer_name: rawJson.customer?.customer_name || { value: 'Buyer', confidence: 0.5 },
    gstin: rawJson.customer?.gstin || { value: null, confidence: 0.0 },
    address: rawJson.customer?.address || { value: null, confidence: 0.0 },
    state: rawJson.customer?.state || { value: null, confidence: 0.0 },
    state_code: rawJson.customer?.state_code || { value: null, confidence: 0.0 },
    phone: rawJson.customer?.phone || { value: null, confidence: 0.0 },
    email: rawJson.customer?.email || { value: null, confidence: 0.0 },
  };

  // 3. Normalize Extracted Invoice Meta
  const invoice: ExtractedInvoiceMeta = {
    invoice_number: rawJson.invoice?.invoice_number || {
      value: `BILL-${Date.now().toString().slice(-5)}`,
      confidence: 0.6,
      needsVerification: true,
      verificationReason: 'Invoice number was not detected with high confidence',
    },
    invoice_date: rawJson.invoice?.invoice_date || {
      value: new Date().toISOString().split('T')[0],
      confidence: 0.8,
    },
    due_date: rawJson.invoice?.due_date || { value: null, confidence: 0.0 },
    purchase_order_number: rawJson.invoice?.purchase_order_number || { value: null, confidence: 0.0 },
    reference_number: rawJson.invoice?.reference_number || { value: null, confidence: 0.0 },
    place_of_supply: rawJson.invoice?.place_of_supply || { value: null, confidence: 0.0 },
    reverse_charge: rawJson.invoice?.reverse_charge || { value: 'No', confidence: 0.8 },
    eway_bill_number: rawJson.invoice?.eway_bill_number || { value: null, confidence: 0.0 },
    transport_information: rawJson.invoice?.transport_information || { value: null, confidence: 0.0 },
  };

  // 4. Normalize Items with exact descriptions preserved
  const rawItems = Array.isArray(rawJson.items) ? rawJson.items : [];
  const normalizedItems: ExtractedItem[] = rawItems.map((item, idx) => {
    const rawDesc = item.full_description?.value || item.item_name?.value || item.description?.value || `Item ${idx + 1}`;
    const rawName = item.item_name?.value || rawDesc;
    const qty = typeof item.quantity?.value === 'number' ? item.quantity.value : parseFloat(item.quantity?.value) || 1;
    const rate = typeof item.rate?.value === 'number' ? item.rate.value : parseFloat(item.rate?.value) || 0;
    const discount = typeof item.discount?.value === 'number' ? item.discount.value : parseFloat(item.discount?.value) || 0;
    const lineTotal = typeof item.line_total?.value === 'number' ? item.line_total.value : parseFloat(item.line_total?.value) || (qty * rate - discount);
    const taxable = typeof item.taxable_amount?.value === 'number' ? item.taxable_amount.value : parseFloat(item.taxable_amount?.value) || (lineTotal / 1.18);
    const gstRate = typeof item.gst_rate?.value === 'number' ? item.gst_rate.value : parseFloat(item.gst_rate?.value) || 18;

    return {
      id: `item_${idx + 1}_${Date.now()}`,
      item_name: {
        value: rawName,
        confidence: item.item_name?.confidence ?? 0.9,
        bbox: item.item_name?.bbox || item.bbox,
      },
      full_description: {
        value: rawDesc, // Section 4: exact text preserved!
        confidence: item.full_description?.confidence ?? 0.9,
        bbox: item.full_description?.bbox || item.bbox,
      },
      brand: item.brand || { value: null, confidence: 0.0 },
      model: item.model || { value: null, confidence: 0.0 },
      sku: item.sku || { value: null, confidence: 0.0 },
      product_code: item.product_code || { value: null, confidence: 0.0 },
      hsn_sac: item.hsn_sac || { value: '8471', confidence: 0.8 },
      quantity: {
        value: qty,
        confidence: item.quantity?.confidence ?? 0.95,
      },
      unit: item.unit || { value: 'Pcs', confidence: 0.9 },
      rate: {
        value: rate,
        confidence: item.rate?.confidence ?? 0.95,
      },
      mrp: item.mrp || { value: null, confidence: 0.0 },
      discount: {
        value: discount,
        confidence: item.discount?.confidence ?? 0.9,
      },
      taxable_amount: {
        value: Math.round(taxable * 100) / 100,
        confidence: item.taxable_amount?.confidence ?? 0.9,
      },
      gst_rate: {
        value: gstRate,
        confidence: item.gst_rate?.confidence ?? 0.9,
      },
      cgst: item.cgst || { value: Math.round(((lineTotal - taxable) / 2) * 100) / 100, confidence: 0.9 },
      sgst: item.sgst || { value: Math.round(((lineTotal - taxable) / 2) * 100) / 100, confidence: 0.9 },
      igst: item.igst || { value: 0, confidence: 0.9 },
      cess: item.cess || { value: 0, confidence: 0.0 },
      other_taxes: item.other_taxes || { value: 0, confidence: 0.0 },
      line_total: {
        value: Math.round(lineTotal * 100) / 100,
        confidence: item.line_total?.confidence ?? 0.95,
      },
      bbox: item.bbox,
    };
  });

  // 5. Normalize Totals
  const totals: ExtractedTotals = {
    gross_amount: rawJson.totals?.gross_amount || { value: 0, confidence: 0.0 },
    discount: rawJson.totals?.discount || { value: 0, confidence: 0.0 },
    taxable_amount: rawJson.totals?.taxable_amount || {
      value: normalizedItems.reduce((s, it) => s + (it.taxable_amount?.value || 0), 0),
      confidence: 0.8,
    },
    cgst_total: rawJson.totals?.cgst_total || {
      value: normalizedItems.reduce((s, it) => s + (it.cgst?.value || 0), 0),
      confidence: 0.8,
    },
    sgst_total: rawJson.totals?.sgst_total || {
      value: normalizedItems.reduce((s, it) => s + (it.sgst?.value || 0), 0),
      confidence: 0.8,
    },
    igst_total: rawJson.totals?.igst_total || {
      value: normalizedItems.reduce((s, it) => s + (it.igst?.value || 0), 0),
      confidence: 0.8,
    },
    cess: rawJson.totals?.cess || { value: 0, confidence: 0.0 },
    round_off: rawJson.totals?.round_off || { value: 0, confidence: 0.8 },
    shipping: rawJson.totals?.shipping || { value: 0, confidence: 0.8 },
    other_charges: rawJson.totals?.other_charges || { value: 0, confidence: 0.0 },
    grand_total: rawJson.totals?.grand_total || {
      value: normalizedItems.reduce((s, it) => s + (it.line_total?.value || 0), 0),
      confidence: 0.9,
    },
    amount_paid: rawJson.totals?.amount_paid || { value: 0, confidence: 0.8 },
    balance_due: rawJson.totals?.balance_due || rawJson.totals?.grand_total || { value: 0, confidence: 0.8 },
    amount_in_words: rawJson.totals?.amount_in_words || { value: null, confidence: 0.0 },
  };

  // 6. Payment and Bank Details
  const paymentAndBank: ExtractedPaymentAndBank = {
    payment_mode: rawJson.payment?.payment_mode || { value: 'UPI', confidence: 0.8 },
    bank_name: rawJson.bank_details?.bank_name || rawJson.payment?.bank_name || { value: null, confidence: 0.0 },
    account_number: rawJson.bank_details?.account_number || rawJson.payment?.account_number || { value: null, confidence: 0.0 },
    ifsc_code: rawJson.bank_details?.ifsc_code || rawJson.payment?.ifsc_code || { value: null, confidence: 0.0 },
    upi_id: rawJson.payment?.upi_id || { value: null, confidence: 0.0 },
    transaction_reference: rawJson.payment?.transaction_reference || { value: null, confidence: 0.0 },
  };

  // 7. Mathematical Verification (Section 12)
  const mathVerification = verifyBillMathematics(normalizedItems, totals);

  // 8. Match Supplier & Retrieve learned patterns (Section 17)
  const { matchedSupplier } = await matchSupplierWithLearning(supplier);

  // 9. Match Products with Inventory (Section 16)
  const matchedItems = await matchProductsWithInventory(normalizedItems, matchedSupplier?.id);

  // 10. Duplicate Invoice Detection (Section 13)
  const duplicateDetection = await detectDuplicateInvoice(
    invoice.invoice_number?.value || '',
    matchedSupplier?.id
  );

  const docClassification: DocumentClassification = {
    document_type: (rawJson.document_type as any) || 'GST Invoice',
    confidence: rawJson.document_type_confidence || 0.95,
    regions_detected: rawJson.regions_detected || ['HEADER', 'ITEM TABLE', 'TOTAL SECTION'],
  };

  return {
    success: true,
    documentClassification: docClassification,
    supplier,
    customer,
    invoice,
    items: matchedItems,
    totals,
    paymentAndBank,
    terms: Array.isArray(rawJson.terms) ? rawJson.terms : [],
    additionalInformation: Array.isArray(rawJson.additional_information) ? rawJson.additional_information : [],
    extractionNotes: Array.isArray(rawJson.extraction_notes) ? rawJson.extraction_notes : [],
    mathVerification,
    duplicateDetection,
    matchedSupplier,
    uploadedFiles: files.map((f) => ({
      fileName: f.fileName,
      fileUrl: f.fileUrl,
      mimeType: f.mimeType,
      fileSize: f.buffer.length,
    })),
    rawJson,
    providerUsed: provider,
    modelUsed: model,
  };
}

/**
 * Direct Multimodal Vision API call to Google Gemini.
 * Sends original images / PDFs as base64 inlineData without prior OCR conversion.
 */
async function callGeminiVision(
  files: FilePayload[],
  apiKey: string,
  modelName: string
): Promise<RawVisionExtraction> {
  const effectiveModel = modelName || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${apiKey}`;

  // Multi-image / Multi-page PDF support: convert each file into Gemini inlineData part
  const parts: any[] = [];

  for (const f of files) {
    const base64Data = f.buffer.toString('base64');
    let mime = f.mimeType;
    if (f.fileName.toLowerCase().endsWith('.pdf')) {
      mime = 'application/pdf';
    } else if (f.fileName.toLowerCase().endsWith('.png')) {
      mime = 'image/png';
    } else if (f.fileName.toLowerCase().endsWith('.webp')) {
      mime = 'image/webp';
    } else {
      mime = 'image/jpeg';
    }

    parts.push({
      inlineData: {
        mimeType: mime,
        data: base64Data,
      },
    });
  }

  // Add the multimodal document understanding prompt
  parts.push({
    text: `${VISION_SYSTEM_PROMPT}\n\nPlease visually inspect the attached bill document (${files.length} page/file provided) and output the structured JSON analysis conforming strictly to the requested schema.`,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedErr = errorText;
    try {
      const errObj = JSON.parse(errorText);
      parsedErr = errObj.error?.message || errorText;
    } catch {}
    throw new Error(`Google Gemini Vision API Error (${response.status}): ${parsedErr}`);
  }

  const result = await response.json();
  const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textResponse) {
    throw new Error('Gemini Vision did not return candidate text content.');
  }

  return cleanAndParseJson(textResponse);
}

/**
 * Direct Multimodal Vision API call to OpenAI (e.g. gpt-4o, gpt-4o-mini).
 */
async function callOpenAiVision(
  files: FilePayload[],
  apiKey: string,
  modelName: string
): Promise<RawVisionExtraction> {
  const effectiveModel = modelName || 'gpt-4o';
  const url = 'https://api.openai.com/v1/chat/completions';

  const userContent: any[] = [
    {
      type: 'text',
      text: `${VISION_SYSTEM_PROMPT}\n\nPlease inspect all attached bill images (${files.length} page/file) and output the structured JSON analysis conforming strictly to the requested schema.`,
    },
  ];

  for (const f of files) {
    const base64Data = f.buffer.toString('base64');
    const mime = f.mimeType.includes('pdf') ? 'image/png' : f.mimeType;
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${mime};base64,${base64Data}`,
        detail: 'high',
      },
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: effectiveModel,
      messages: [{ role: 'user', content: userContent }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedErr = errorText;
    try {
      const errObj = JSON.parse(errorText);
      parsedErr = errObj.error?.message || errorText;
    } catch {}
    throw new Error(`OpenAI Vision API Error (${response.status}): ${parsedErr}`);
  }

  const result = await response.json();
  const textResponse = result.choices?.[0]?.message?.content;

  if (!textResponse) {
    throw new Error('OpenAI Vision did not return message content.');
  }

  return cleanAndParseJson(textResponse);
}

/**
 * Direct Multimodal Vision API call to Anthropic Claude (e.g. claude-3-5-sonnet-20241022).
 */
async function callAnthropicVision(
  files: FilePayload[],
  apiKey: string,
  modelName: string
): Promise<RawVisionExtraction> {
  const effectiveModel = modelName || 'claude-3-5-sonnet-20241022';
  const url = 'https://api.anthropic.com/v1/messages';

  const content: any[] = [];

  for (const f of files) {
    const base64Data = f.buffer.toString('base64');
    let mediaType = 'image/jpeg';
    if (f.fileName.toLowerCase().endsWith('.png')) mediaType = 'image/png';
    else if (f.fileName.toLowerCase().endsWith('.webp')) mediaType = 'image/webp';

    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: base64Data,
      },
    });
  }

  content.push({
    type: 'text',
    text: `${VISION_SYSTEM_PROMPT}\n\nReturn strict JSON matching the schema.`,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: effectiveModel,
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic Vision API Error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const textResponse = result.content?.[0]?.text;

  if (!textResponse) {
    throw new Error('Anthropic Vision did not return content.');
  }

  return cleanAndParseJson(textResponse);
}

/**
 * Strips markdown code blocks if present and safely parses JSON.
 */
function cleanAndParseJson(rawText: string): RawVisionExtraction {
  let cleaned = rawText.trim();

  // Strip ```json and ```
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }

  cleaned = cleaned.trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}
