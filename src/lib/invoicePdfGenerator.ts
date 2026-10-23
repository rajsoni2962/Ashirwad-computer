import { jsPDF } from 'jspdf';
import { numberToWords, formatDate, getInvoiceTypeTitle, getInvoiceNumberLabel } from './utils';
import { getInvoiceDesign } from './invoice-design';

// Exact Palette from Ashirwad Technologies Master Invoice PDF Specification
export const PDF_COLORS = {
  mainText: [15, 23, 43],         // #0F172B (Main text / business name)
  accent: [79, 70, 229],          // #4F46E5 (Primary accent / headings / Grand Total)
  bodyText: [51, 65, 85],         // #334155 (Main body text / labels / values)
  secondaryText: [100, 116, 139], // #64748B (Secondary text / muted labels)
  muted: [100, 116, 139],         // #64748B (Muted labels)
  tableHeaderBg: [238, 240, 253], // #EEF0FD (Table header background / Banner background)
  sectionBg: [248, 250, 252],     // #F8FAFC (Section background / Amount in words / Bank box)
  alternateBg: [251, 252, 253],   // #FBFCFD
  tableBorder: [202, 213, 226],   // #CAD5E2 (Borders / table grid)
  thinDivider: [226, 232, 240],   // #E2E8F0 (Thin dividers / box borders)
  infoBoxBg: [245, 250, 255],     // #F5FAFF (Light blue information box)
  infoBoxBorder: [191, 219, 254], // #BFDBFE (Information box border)
  received: [5, 150, 105],        // #059669 (Amount received / paid)
  balanceDueRed: [225, 29, 72],   // #E11D48 (Balance due / negative amounts)
  totalRowBg: [241, 245, 249],    // #F1F5F9 (Table total row)
  sigAccentLine: [199, 210, 254], // #C7D2FE (Authorized signatory accent line)
  footerText: [148, 163, 184],    // #94A3B8 (Footer thank-you message)
};

// In-memory cache for fonts to avoid reading disk or network on every call
let cachedArialRegular: string | null = null;
let cachedArialBold: string | null = null;
let cachedArialItalic: string | null = null;
let cachedLogoBase64: string | null = null;
let cachedSignatureBase64: string | null = null;

export function normalizePhoneNumber(rawPhone?: string | null, defaultCountryCode = '91') {
  if (!rawPhone) {
    return { isValid: false, normalized: '', display: '' };
  }

  const cleaned = rawPhone.replace(/\D/g, '');
  if (!cleaned) {
    return { isValid: false, normalized: '', display: '' };
  }

  let normalized = cleaned;
  if (cleaned.length === 10) {
    normalized = `${defaultCountryCode}${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    normalized = `${defaultCountryCode}${cleaned.slice(1)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    normalized = cleaned;
  }

  const isValid = normalized.length >= 10 && normalized.length <= 15;
  let display = `+${normalized}`;
  if (normalized.startsWith('91') && normalized.length === 12) {
    display = `+91 ${normalized.slice(2, 7)} ${normalized.slice(7)}`;
  }

  return { isValid, normalized, display };
}

export function getSanitizedInvoiceFilename(invoiceNumber: string) {
  const sanitized = (invoiceNumber || 'INV').replace(/[^a-zA-Z0-9_-]/g, '-');
  return `Ashirwad_Technologies_${sanitized}.pdf`;
}

/**
 * Formats a currency amount into standard Indian numbering system with Rupee symbol (₹).
 * e.g., 2200 -> ₹2,200.00 | 123456.78 -> ₹1,23,456.78
 */
export function formatPdfCurrency(amount: number | null | undefined, symbol = '₹'): string {
  if (amount === null || amount === undefined || isNaN(amount)) return `${symbol}0.00`;
  const num = Math.abs(Number(amount));
  const sign = amount < 0 ? '-' : '';
  const parts = num.toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1];

  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `${sign}${symbol}${formattedInt}.${decPart}`;
}

export interface InvoicePdfOptions {
  logoBase64?: string;
  signatureBase64?: string;
  qrBase64?: string;
  design?: any;
  doc?: jsPDF;
}

/**
 * Embeds TrueType Arial font for 100% vector typography and native Indian Rupee symbol (₹) support.
 * Runs seamlessly in both Node.js (server) and modern browser environments.
 */
async function loadAndSetupFonts(doc: jsPDF): Promise<string> {
  try {
    if (typeof window === 'undefined') {
      // Node.js Server Environment
      const fs = eval('require')('fs');
      const path = eval('require')('path');
      const fontsDir = path.join(process.cwd(), 'public/fonts');

      if (!cachedArialRegular && fs.existsSync(path.join(fontsDir, 'arial.ttf'))) {
        cachedArialRegular = fs.readFileSync(path.join(fontsDir, 'arial.ttf')).toString('base64');
      }
      if (!cachedArialBold && fs.existsSync(path.join(fontsDir, 'arialbd.ttf'))) {
        cachedArialBold = fs.readFileSync(path.join(fontsDir, 'arialbd.ttf')).toString('base64');
      }
      if (!cachedArialItalic && fs.existsSync(path.join(fontsDir, 'ariali.ttf'))) {
        cachedArialItalic = fs.readFileSync(path.join(fontsDir, 'ariali.ttf')).toString('base64');
      }
    } else {
      // Browser Environment: fetch fonts if not already cached
      if (!cachedArialRegular) {
        try {
          const res = await fetch('/fonts/arial.ttf');
          if (res.ok) {
            const buf = await res.arrayBuffer();
            cachedArialRegular = btoa(
              new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
          }
        } catch {}
      }
      if (!cachedArialBold) {
        try {
          const res = await fetch('/fonts/arialbd.ttf');
          if (res.ok) {
            const buf = await res.arrayBuffer();
            cachedArialBold = btoa(
              new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
          }
        } catch {}
      }
      if (!cachedArialItalic) {
        try {
          const res = await fetch('/fonts/ariali.ttf');
          if (res.ok) {
            const buf = await res.arrayBuffer();
            cachedArialItalic = btoa(
              new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
          }
        } catch {}
      }
    }

    if (cachedArialRegular) {
      doc.addFileToVFS('arial.ttf', cachedArialRegular);
      doc.addFont('arial.ttf', 'Arial', 'normal');
    }
    if (cachedArialBold) {
      doc.addFileToVFS('arialbd.ttf', cachedArialBold);
      doc.addFont('arialbd.ttf', 'Arial', 'bold');
    }
    if (cachedArialItalic) {
      doc.addFileToVFS('ariali.ttf', cachedArialItalic);
      doc.addFont('ariali.ttf', 'Arial', 'italic');
      doc.addFont('ariali.ttf', 'Arial', 'bolditalic');
    }

    if (cachedArialRegular) {
      doc.setFont('Arial', 'normal');
      return 'Arial';
    }
  } catch (err) {
    console.warn('Font loading encountered an issue, falling back to standard helvetica:', err);
  }

  doc.setFont('helvetica', 'normal');
  return 'helvetica';
}

/**
 * Loads default brand assets (Logo & Signature) from disk or public web URL.
 */
async function loadBrandAssets(options: InvoicePdfOptions = {}) {
  let logoBase64 = options.logoBase64 || cachedLogoBase64 || undefined;
  let signatureBase64 = options.signatureBase64 || cachedSignatureBase64 || undefined;

  if (typeof window === 'undefined') {
    const fs = eval('require')('fs');
    const path = eval('require')('path');

    if (!logoBase64) {
      try {
        const pngPath = path.join(process.cwd(), 'public/brand/logo.png');
        const jpegPath = path.join(process.cwd(), 'public/brand/logo.jpeg');
        const logoPath = fs.existsSync(pngPath) ? pngPath : jpegPath;
        if (fs.existsSync(logoPath)) {
          const buf = fs.readFileSync(logoPath);
          const isPng = logoPath.endsWith('.png');
          logoBase64 = `data:image/${isPng ? 'png' : 'jpeg'};base64,${buf.toString('base64')}`;
          cachedLogoBase64 = logoBase64;
        }
      } catch {}
    }

    if (!signatureBase64) {
      try {
        const sigPath = path.join(process.cwd(), 'public/brand/signature.jpeg');
        if (fs.existsSync(sigPath)) {
          const buf = fs.readFileSync(sigPath);
          signatureBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
          cachedSignatureBase64 = signatureBase64;
        }
      } catch {}
    }
  } else {
    if (!logoBase64) {
      try {
        const res = await fetch('/brand/logo.png').catch(() => fetch('/brand/logo.jpeg'));
        if (res && res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          logoBase64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          cachedLogoBase64 = logoBase64;
        }
      } catch {}
    }

    if (!signatureBase64) {
      try {
        const res = await fetch('/brand/signature.jpeg');
        if (res && res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          signatureBase64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          cachedSignatureBase64 = signatureBase64;
        }
      } catch {}
    }
  }

  return { logoBase64, signatureBase64 };
}

/**
 * EXACT MASTER INVOICE PDF GENERATOR
 * Generates an exact, vector-rendered A4 invoice PDF matching the Ashirwad Technologies
 * authoritative specification and visual reference image down to exact proportions,
 * coordinates, colors, fonts, tables, boxes, and spacing.
 */
export async function generateInvoicePdf(
  invoice: any,
  settings: any = {},
  options: InvoicePdfOptions = {}
): Promise<{ doc: jsPDF; blob: Blob; file: File; filename: string; arrayBuffer: ArrayBuffer }> {
  // 1. Initialize A4 PDF in points (595.28 × 841.89 pt)
  const doc = options.doc || new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const filename = getSanitizedInvoiceFilename(invoice?.invoiceNumber || 'INVOICE');

  // Load TrueType fonts and brand assets
  const [fontFamily, { logoBase64, signatureBase64 }] = await Promise.all([
    loadAndSetupFonts(doc),
    loadBrandAssets(options),
  ]);

  let qrBase64 = options.qrBase64;

  // 2. Reconstruct Business Snapshot (prioritizing saved immutable snapshot over live settings)
  let bizSnapshot: any = {};
  if (invoice?.businessSnapshot) {
    try {
      bizSnapshot = typeof invoice.businessSnapshot === 'string'
        ? JSON.parse(invoice.businessSnapshot)
        : invoice.businessSnapshot;
    } catch {}
  }

  const design = getInvoiceDesign(
    options?.design ||
    bizSnapshot?.invoiceDesign ||
    invoice?.businessProfile?.invoiceDesign ||
    settings?.invoiceDesign
  );

  const business = {
    companyName: bizSnapshot.companyName || settings?.companyName || 'ASHIRWAD TECHNOLOGIES',
    tagline: bizSnapshot.tagline || settings?.tagline || 'BEYOND TECH LIMITS',
    address: bizSnapshot.address || settings?.address || 'A/1, 902, Ashraya 10, GST compound, New Ranip, Ahmedabad 382470.',
    phone: bizSnapshot.phone || settings?.phone || '9662278994',
    email: bizSnapshot.email || settings?.email || 'rajsoni2962@gmail.com',
    gstin: (bizSnapshot.gstin && bizSnapshot.gstin !== 'null')
      ? bizSnapshot.gstin
      : (settings?.gstin && settings?.gstin !== 'null' ? settings.gstin : ''),
    state: bizSnapshot.state || settings?.state || 'Gujarat',
    stateCode: bizSnapshot.stateCode || settings?.stateCode || '24',
    bankName: bizSnapshot.bankName || settings?.bankName || 'Kotak Mahindra Bank',
    accountNumber: bizSnapshot.accountNumber || settings?.accountNumber || '5947557983',
    ifscCode: bizSnapshot.ifscCode || settings?.ifscCode || 'KKBK0000879',
    upiId: bizSnapshot.upiId || settings?.upiId || 'rajsoni2962-2@okaxis',
    terms: invoice?.terms || bizSnapshot.terms || settings?.terms || `* Tested and working perfectly at the time of sale.
* Please inspect the laptop before purchase.
* 6 Months of warranty covers technical issues only and excludes physical or liquid damage.
* Battery backup may vary depending on usage.
* No return or refund after sale unless covered under warranty.
* Thank you for choosing us—we're always here to help if you need support.`,
    authorizedSignatory: bizSnapshot.authorizedSignatory || settings?.authorizedSignatory || 'For: ASHIRWAD TECHNOLOGIES\nAuthorized Signatory',
    footer: bizSnapshot.footer || settings?.footer || "Thank you for choosing us—we're always here to help if you need support.",
  };

  // 3. Reconstruct Customer Snapshot
  let custSnapshot: any = null;
  if (invoice?.customerSnapshot) {
    try {
      custSnapshot = typeof invoice.customerSnapshot === 'string'
        ? JSON.parse(invoice.customerSnapshot)
        : invoice.customerSnapshot;
    } catch {}
  }
  const customer = custSnapshot || invoice?.customer || {};

  const grandTotal = Number(invoice?.grandTotal) || 0;
  const paidAmount = Number(invoice?.paidAmount !== undefined ? invoice.paidAmount : invoice?.payments?.reduce((s: number, p: any) => s + (p.amount || 0), 0)) || 0;
  const balanceDue = invoice?.balanceDue !== undefined ? Number(invoice.balanceDue) : Math.max(0, grandTotal - paidAmount);

  // Auto-resolve UPI QR Code if not provided
  if (!qrBase64 && business.upiId) {
    try {
      const upiLink = `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(business.companyName)}&am=${encodeURIComponent(grandTotal)}&cu=INR&tn=${encodeURIComponent(`Inv ${invoice?.invoiceNumber || ''}`)}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;
      const qrRes = await fetch(qrUrl, { cache: 'force-cache' });
      if (qrRes && qrRes.ok) {
        if (typeof window !== 'undefined') {
          const blob = await qrRes.blob();
          const reader = new FileReader();
          qrBase64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } else {
          const arrayBuf = await qrRes.arrayBuffer();
          qrBase64 = `data:image/png;base64,${Buffer.from(arrayBuf).toString('base64')}`;
        }
      }
    } catch {}
  }

  // --- Exact Coordinate Layout ---
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const CONTENT_LEFT = 25.5;
  const CONTENT_WIDTH = 544.0;
  const CONTENT_RIGHT = CONTENT_LEFT + CONTENT_WIDTH; // 569.5

  // 1. TOP BANNER: Invoice Type Title
  const titleY = 31.0;
  const titleH = 26.0;
  doc.setFillColor(PDF_COLORS.tableHeaderBg[0], PDF_COLORS.tableHeaderBg[1], PDF_COLORS.tableHeaderBg[2]);
  doc.rect(CONTENT_LEFT, titleY, CONTENT_WIDTH, titleH, 'F');

  const invoiceTitle = getInvoiceTypeTitle(invoice?.invoiceType);
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text(invoiceTitle, PAGE_WIDTH / 2, titleY + 16.5, { align: 'center' });

  // 2. BUSINESS HEADER
  // Logo Box (Left: x=25.5, y=68, width=98, height=98, radius=12)
  const logoBoxX = CONTENT_LEFT;
  const logoBoxY = 68.0;
  const logoBoxSize = 98.0;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(PDF_COLORS.tableBorder[0], PDF_COLORS.tableBorder[1], PDF_COLORS.tableBorder[2]);
  doc.setLineWidth(1);
  doc.roundedRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 12, 12, 'FD');

  if (logoBase64) {
    try {
      const isPng = logoBase64.includes('image/png') || logoBase64.startsWith('iVBORw0KGgo');
      const format = isPng ? 'PNG' : 'JPEG';
      const imgData = logoBase64.startsWith('data:') ? logoBase64 : `data:image/${isPng ? 'png' : 'jpeg'};base64,${logoBase64}`;
      const imgW = 82;
      const imgH = 66; // Maintain 1024x825 aspect ratio
      const imgX = logoBoxX + (logoBoxSize - imgW) / 2;
      const imgY = logoBoxY + (logoBoxSize - imgH) / 2;
      doc.addImage(imgData, format, imgX, imgY, imgW, imgH);
    } catch {}
  }

  // Business Identity Block (Right-Aligned at CONTENT_RIGHT)
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(19);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text(business.companyName, CONTENT_RIGHT, 90, { align: 'right' });

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text(business.tagline, CONTENT_RIGHT, 103, { align: 'right' });

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text(business.address, CONTENT_RIGHT, 115.5, { align: 'right' });

  // Contact line: "Phone no.: 9662278994  •  Email: rajsoni2962@gmail.com"
  const contactY = 127.5;
  const emailPart = business.email;
  const emailLabel = '  •  Email: ';
  const phonePart = business.phone;
  const phoneLabel = 'Phone no.: ';

  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  const emailW = doc.getTextWidth(emailPart);
  doc.text(emailPart, CONTENT_RIGHT, contactY, { align: 'right' });

  doc.setFont(fontFamily, 'normal');
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  const emailLabelW = doc.getTextWidth(emailLabel);
  doc.text(emailLabel, CONTENT_RIGHT - emailW, contactY, { align: 'right' });

  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  const phoneW = doc.getTextWidth(phonePart);
  doc.text(phonePart, CONTENT_RIGHT - emailW - emailLabelW, contactY, { align: 'right' });

  doc.setFont(fontFamily, 'normal');
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text(phoneLabel, CONTENT_RIGHT - emailW - emailLabelW - phoneW, contactY, { align: 'right' });

  // Business GSTIN line (only shown if configured; hidden with label removed when unset/blank)
  const rawBizGstin = (business.gstin || '').trim();
  if (rawBizGstin && rawBizGstin !== 'null' && rawBizGstin !== '24AANPA0000A1Z5') {
    const gstinY = 139.5;
    const gstinPart = rawBizGstin;
    const gstinLabel = 'GSTIN: ';
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    const gstinW = doc.getTextWidth(gstinPart);
    doc.text(gstinPart, CONTENT_RIGHT, gstinY, { align: 'right' });

    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
    doc.text(gstinLabel, CONTENT_RIGHT - gstinW, gstinY, { align: 'right' });
  }

  // Header Divider (y = 177)
  doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
  doc.setLineWidth(0.75);
  doc.line(CONTENT_LEFT, 177, CONTENT_RIGHT, 177);

  // 3. CUSTOMER AND INVOICE INFORMATION SECTION (y = 178 to 280)
  const partyY = 178;
  const splitX = 286.0;

  // Vertical Divider (clean inset from top and bottom dividers)
  doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
  doc.setLineWidth(0.75);
  doc.line(splitX, partyY + 12, splitX, 270);

  // Left Column: BILLED TO
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text('BILLED TO', CONTENT_LEFT, partyY + 16);

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text(customer.name || 'Walk-in Customer', CONTENT_LEFT, partyY + 30);

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
  doc.text('Contact No.: ', CONTENT_LEFT, partyY + 42.5);
  const contactLabelW = doc.getTextWidth('Contact No.: ');
  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text(customer.phone || '-', CONTENT_LEFT + contactLabelW, partyY + 42.5);

  doc.setFont(fontFamily, 'normal');
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  const custAddr = customer.address || '';
  const addrLines = doc.splitTextToSize(`Address: ${custAddr || '-'}`, 240);
  doc.text(addrLines[0], CONTENT_LEFT, partyY + 54.5);
  if (addrLines.length > 1) {
    doc.text(addrLines.slice(1).join(' '), CONTENT_LEFT, partyY + 65.5);
  }

  const stateY = addrLines.length > 1 ? partyY + 77.5 : partyY + 66.5;
  const stateStr = customer.state ? `State: ${customer.state}${customer.stateCode ? ` (Code: ${customer.stateCode})` : ''}` : 'State: Gujarat (Code: 24)';
  doc.text(stateStr, CONTENT_LEFT, stateY);

  // Customer GSTIN line (preserved for registered buyers; hidden with label removed when unset/blank)
  const rawCustGstin = (customer.gstin || '').trim();
  if (rawCustGstin && rawCustGstin !== 'null') {
    const custGstinY = stateY + 11.0;
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
    doc.text('GSTIN: ', CONTENT_LEFT, custGstinY);
    const custGstinLabelW = doc.getTextWidth('GSTIN: ');
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    doc.text(rawCustGstin, CONTENT_LEFT + custGstinLabelW, custGstinY);
  }


  // Right Column: INVOICE DETAILS (Right-aligned at CONTENT_RIGHT)
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text('INVOICE DETAILS', CONTENT_RIGHT, partyY + 16, { align: 'right' });

  // Invoice No. / Doc No.
  const invTypeLabel = `${getInvoiceNumberLabel(invoice?.invoiceType)} `;
  const invNum = invoice?.invoiceNumber || '-';
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  const invNumW = doc.getTextWidth(invNum);
  doc.text(invNum, CONTENT_RIGHT, partyY + 30, { align: 'right' });
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
  doc.text(invTypeLabel, CONTENT_RIGHT - invNumW, partyY + 30, { align: 'right' });

  // Date
  const dateStr = formatDate(invoice?.date);
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  const dateW = doc.getTextWidth(dateStr);
  doc.text(dateStr, CONTENT_RIGHT, partyY + 42.5, { align: 'right' });
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
  doc.text('Date: ', CONTENT_RIGHT - dateW, partyY + 42.5, { align: 'right' });

  // Payment Mode
  const modeStr = invoice?.paymentMode || 'Cash';
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  const modeW = doc.getTextWidth(modeStr);
  doc.text(modeStr, CONTENT_RIGHT, partyY + 54.5, { align: 'right' });
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
  doc.text('Payment Mode: ', CONTENT_RIGHT - modeW, partyY + 54.5, { align: 'right' });

  // Due Date (optional)
  if (invoice?.dueDate) {
    const dueStr = formatDate(invoice.dueDate);
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    const dueW = doc.getTextWidth(dueStr);
    doc.text(dueStr, CONTENT_RIGHT, partyY + 66.5, { align: 'right' });
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
    doc.text('Due Date: ', CONTENT_RIGHT - dueW, partyY + 66.5, { align: 'right' });
  }

  // Divider below Party Details (y = 280)
  doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
  doc.setLineWidth(0.75);
  doc.line(CONTENT_LEFT, 280, CONTENT_RIGHT, 280);

  // 4. ITEM TABLE (Starts at y = 289)
  let tableY = 289.0;
  const colDef = [
    { id: 'num', label: '#', w: 24.5, align: 'center' },
    { id: 'desc', label: 'ITEM NAME & SPECIFICATIONS', w: 231.2, align: 'left' },
    { id: 'hsn', label: 'HSN', w: 49.0, align: 'center' },
    { id: 'qty', label: 'QTY', w: 38.1, align: 'center' },
    { id: 'unit', label: 'UNIT', w: 43.5, align: 'center' },
    { id: 'rate', label: 'PRICE /\nUNIT', w: 76.2, align: 'right' },
    { id: 'amount', label: 'AMOUNT', w: 81.5, align: 'right' },
  ];

  const headerH = 28.0;

  // Draw Table Header
  const drawTableHeader = (y: number) => {
    let x = CONTENT_LEFT;
    doc.setDrawColor(PDF_COLORS.tableBorder[0], PDF_COLORS.tableBorder[1], PDF_COLORS.tableBorder[2]);
    doc.setLineWidth(0.75);

    colDef.forEach((col) => {
      doc.setFillColor(PDF_COLORS.tableHeaderBg[0], PDF_COLORS.tableHeaderBg[1], PDF_COLORS.tableHeaderBg[2]);
      doc.rect(x, y, col.w, headerH, 'FD');
      x += col.w;
    });

    x = CONTENT_LEFT;
    colDef.forEach((col) => {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(7);
      doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);

      if (col.id === 'rate') {
        doc.text('PRICE /', x + col.w / 2, y + 11.5, { align: 'center' });
        doc.text('UNIT', x + col.w / 2, y + 21, { align: 'center' });
      } else if (col.align === 'center') {
        doc.text(col.label, x + col.w / 2, y + 16.5, { align: 'center' });
      } else if (col.align === 'right') {
        doc.text(col.label, x + col.w / 2, y + 16.5, { align: 'center' });
      } else {
        doc.text(col.label, x + 10, y + 16.5);
      }
      x += col.w;
    });
  };

  drawTableHeader(tableY);

  let curRowY = tableY + headerH;
  let totalQty = 0;
  const items = invoice?.items || [];

  items.forEach((item: any, idx: number) => {
    let itemSnapshot: any = {};
    if (item?.itemSnapshot) {
      try {
        itemSnapshot = typeof item.itemSnapshot === 'string' ? JSON.parse(item.itemSnapshot) : item.itemSnapshot;
      } catch {}
    }

    const qty = Number(item.quantity !== undefined ? item.quantity : itemSnapshot.quantity) || 1;
    totalQty += qty;

    const descText = item.description || item.productName || itemSnapshot.productName || item.product?.name || 'Item';
    const splitDesc = doc.splitTextToSize(descText, colDef[1].w - 18);
    const serial = item.serialNumber || itemSnapshot.serialNumber;
    const warranty = item.warranty || itemSnapshot.warranty || item.product?.warranty;
    const hasExtraNote = Boolean(serial || warranty);

    const descHeight = splitDesc.length * 10;
    const rowH = Math.max(28.0, descHeight + (hasExtraNote ? 12 : 0) + 8);

    // Multi-page overflow check
    if (curRowY + rowH > 740) {
      doc.addPage();
      tableY = 31.0;
      drawTableHeader(tableY);
      curRowY = tableY + headerH;
    }

    // Draw row cells
    let x = CONTENT_LEFT;
    doc.setDrawColor(PDF_COLORS.tableBorder[0], PDF_COLORS.tableBorder[1], PDF_COLORS.tableBorder[2]);
    doc.setLineWidth(0.75);

    colDef.forEach((col) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(x, curRowY, col.w, rowH, 'FD');
      x += col.w;
    });

    // # index
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
    doc.text(String(idx + 1), CONTENT_LEFT + colDef[0].w / 2, curRowY + 17, { align: 'center' });

    // Item description
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    doc.text(splitDesc, CONTENT_LEFT + colDef[0].w + 10, curRowY + 16);

    // Serial & Warranty Note underneath
    if (hasExtraNote) {
      const extraY = curRowY + 16 + (splitDesc.length * 10);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(109, 40, 217); // Purple-700
      let extraStr = '';
      if (serial && warranty) extraStr = `S/N: ${serial}  •  Warranty: ${warranty}`;
      else if (serial) extraStr = `S/N: ${serial}`;
      else if (warranty) extraStr = `Warranty: ${warranty}`;
      doc.text(extraStr, CONTENT_LEFT + colDef[0].w + 10, extraY);
    }

    // HSN
    const hsnVal = item.hsn || itemSnapshot.hsn || '8471';
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
    doc.text(hsnVal, CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w / 2, curRowY + 17, { align: 'center' });

    // Qty
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    doc.text(String(qty), CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w + colDef[3].w / 2, curRowY + 17, { align: 'center' });

    // Unit
    const unitVal = item.unit || itemSnapshot.unit || 'Pcs';
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
    doc.text(unitVal, CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w + colDef[3].w + colDef[4].w / 2, curRowY + 17, { align: 'center' });

    // Price / Unit
    const rateVal = Number(item.rate !== undefined ? item.rate : itemSnapshot.rate) || 0;
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    const rateStr = formatPdfCurrency(rateVal);
    const rateX = CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w + colDef[3].w + colDef[4].w + colDef[5].w - 12;
    doc.text(rateStr, rateX, curRowY + 17, { align: 'right' });

    // Amount
    const totalVal = Number(item.total !== undefined ? item.total : itemSnapshot.total) || (qty * rateVal);
    doc.setFont(fontFamily, 'bold');
    const amtStr = formatPdfCurrency(totalVal);
    const amtX = CONTENT_RIGHT - 12;
    doc.text(amtStr, amtX, curRowY + 17, { align: 'right' });

    curRowY += rowH;
  });

  // Total Row
  const totalRowH = 22.0;
  let tx = CONTENT_LEFT;
  doc.setDrawColor(PDF_COLORS.tableBorder[0], PDF_COLORS.tableBorder[1], PDF_COLORS.tableBorder[2]);
  doc.setLineWidth(0.75);

  colDef.forEach((col) => {
    doc.setFillColor(PDF_COLORS.totalRowBg[0], PDF_COLORS.totalRowBg[1], PDF_COLORS.totalRowBg[2]);
    doc.rect(tx, curRowY, col.w, totalRowH, 'FD');
    tx += col.w;
  });

  // "Total"
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text('Total', CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w / 2, curRowY + 14, { align: 'center' });

  // Qty total
  doc.text(String(totalQty), CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w + colDef[3].w / 2, curRowY + 14, { align: 'center' });

  // Unit
  doc.text('Pcs', CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w + colDef[3].w + colDef[4].w / 2, curRowY + 14, { align: 'center' });

  // Total Amount
  const subtotalVal = invoice?.subtotal !== undefined ? invoice.subtotal : grandTotal;
  doc.text(formatPdfCurrency(subtotalVal), CONTENT_RIGHT - 12, curRowY + 14, { align: 'right' });

  curRowY += totalRowH;

  // 5. SECTION BELOW TABLE: AMOUNT IN WORDS, DETAILS & FINANCIAL BREAKDOWN
  const secY = curRowY + 16.0;

  // LEFT BLOCK (Width: 294 pt)
  // Box 1: INVOICE AMOUNT IN WORDS:
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
  doc.text('INVOICE AMOUNT IN WORDS:', CONTENT_LEFT, secY);

  const box1Y = secY + 5.0;
  const box1W = 294.0;
  const box1H = 26.0;
  doc.setFillColor(PDF_COLORS.sectionBg[0], PDF_COLORS.sectionBg[1], PDF_COLORS.sectionBg[2]);
  doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
  doc.setLineWidth(1);
  doc.roundedRect(CONTENT_LEFT, box1Y, box1W, box1H, 6, 6, 'FD');

  doc.setFont(fontFamily, 'bolditalic');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  const wordsStr = numberToWords(Math.round(grandTotal));
  doc.text(wordsStr, CONTENT_LEFT + 10, box1Y + 16.5);

  // Box 2: Description & Condition Box
  const box2Y = box1Y + box1H + 10.0;
  const box2W = 294.0;
  const box2H = 55.0;
  doc.setFillColor(PDF_COLORS.infoBoxBg[0], PDF_COLORS.infoBoxBg[1], PDF_COLORS.infoBoxBg[2]);
  doc.setDrawColor(PDF_COLORS.infoBoxBorder[0], PDF_COLORS.infoBoxBorder[1], PDF_COLORS.infoBoxBorder[2]);
  doc.roundedRect(CONTENT_LEFT, box2Y, box2W, box2H, 7, 7, 'FD');

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text('Description & Condition:', CONTENT_LEFT + 8, box2Y + 13.5);

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  const defaultNotes = 'Professionally refurbished, fully tested, and ready to use. Clean, reliable, and backed by quality service.';
  const notesText = invoice?.notes || defaultNotes;
  const descLines = doc.splitTextToSize(notesText, box2W - 16);
  doc.text(descLines, CONTENT_LEFT + 8, box2Y + 25.5, { lineHeightFactor: 1.35 });

  // Box 3: Bank & Payment Details Box (with QR Code)
  const box3Y = box2Y + box2H + 10.0;
  const box3W = 294.0;
  const box3H = 96.0;
  doc.setFillColor(PDF_COLORS.sectionBg[0], PDF_COLORS.sectionBg[1], PDF_COLORS.sectionBg[2]);
  doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
  doc.roundedRect(CONTENT_LEFT, box3Y, box3W, box3H, 7, 7, 'FD');

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text('Bank & Payment Details:', CONTENT_LEFT + 8, box3Y + 14);

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text(`Bank Name: ${business.bankName}`, CONTENT_LEFT + 8, box3Y + 28);
  doc.text(`Account No.: ${business.accountNumber}`, CONTENT_LEFT + 8, box3Y + 41);
  doc.text(`IFSC Code: ${business.ifscCode}`, CONTENT_LEFT + 8, box3Y + 54);

  doc.text('UPI ID: ', CONTENT_LEFT + 8, box3Y + 67);
  const upiW = doc.getTextWidth('UPI ID: ');
  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text(business.upiId, CONTENT_LEFT + 8 + upiW, box3Y + 67);

  // QR Code on right inside Box 3
  const qrSize = 65.0;
  const qrX = CONTENT_LEFT + box3W - 8.0 - qrSize;
  const qrY = box3Y + 8.0;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(PDF_COLORS.tableBorder[0], PDF_COLORS.tableBorder[1], PDF_COLORS.tableBorder[2]);
  doc.setLineWidth(0.75);
  doc.roundedRect(qrX, qrY, qrSize, qrSize, 4, 4, 'FD');

  if (qrBase64) {
    try {
      doc.addImage(qrBase64, 'PNG', qrX + 2, qrY + 2, qrSize - 4, qrSize - 4);
    } catch {}
  }

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(6);
  doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
  doc.text('Scan & Pay', qrX + qrSize / 2, qrY + qrSize + 9.5, { align: 'center' });

  // RIGHT BLOCK: FINANCIAL TOTALS (Parallel to boxes)
  const rightX = 345.0;
  let calcY = secY + 7.0;

  // Sub Total Row
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text('Sub Total:', rightX, calcY);
  doc.text(formatPdfCurrency(subtotalVal), CONTENT_RIGHT, calcY, { align: 'right' });
  doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
  doc.setLineWidth(0.5);
  doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);

  // Discount Row (if applicable)
  const discountAmt = Number(invoice?.discountAmount) || 0;
  if (discountAmt > 0) {
    calcY += 18.0;
    const discLabel = invoice?.discountPercent ? `Discount (${invoice.discountPercent}%):` : 'Discount:';
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(PDF_COLORS.received[0], PDF_COLORS.received[1], PDF_COLORS.received[2]);
    doc.text(discLabel, rightX, calcY);
    doc.setFont(fontFamily, 'bold');
    doc.text(`- ${formatPdfCurrency(discountAmt)}`, CONTENT_RIGHT, calcY, { align: 'right' });
    doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
    doc.setLineWidth(0.5);
    doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
  }

  // Tax Rows (Taxable Value, CGST, SGST, IGST) - only for GST invoices
  const isNoTax = invoice?.invoiceType === 'BILL_OF_SUPPLY' ||
                  invoice?.invoiceType === 'NON_GST' ||
                  invoice?.invoiceType === 'PROFORMA' ||
                  invoice?.invoiceType === 'QUOTATION' ||
                  invoice?.invoiceType === 'CASH_MEMO' ||
                  invoice?.taxConfiguration === 'NONE' ||
                  (!invoice?.cgst && !invoice?.sgst && !invoice?.igst);
  const isExempt = invoice?.taxConfiguration === 'EXEMPT';
  const isIgst = invoice?.taxConfiguration === 'IGST';

  if (!isNoTax) {
    if (isExempt) {
      calcY += 18.0;
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
      doc.text('GST (Exempt / Nil-Rated):', rightX, calcY);
      doc.text('₹0.00 (0%)', CONTENT_RIGHT, calcY, { align: 'right' });
      doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
      doc.setLineWidth(0.5);
      doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
    } else if (isIgst) {
      if (invoice?.taxableAmount > 0) {
        calcY += 18.0;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
        doc.text('Taxable Value:', rightX, calcY);
        doc.text(formatPdfCurrency(invoice.taxableAmount), CONTENT_RIGHT, calcY, { align: 'right' });
        doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
        doc.setLineWidth(0.5);
        doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
      }
      if (invoice?.igst > 0) {
        calcY += 18.0;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
        doc.text('IGST (18%):', rightX, calcY);
        doc.text(formatPdfCurrency(invoice.igst), CONTENT_RIGHT, calcY, { align: 'right' });
        doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
        doc.setLineWidth(0.5);
        doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
      }
    } else {
      if (invoice?.taxableAmount > 0) {
        calcY += 18.0;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
        doc.text('Taxable Value:', rightX, calcY);
        doc.text(formatPdfCurrency(invoice.taxableAmount), CONTENT_RIGHT, calcY, { align: 'right' });
        doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
        doc.setLineWidth(0.5);
        doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
      }
      if (invoice?.cgst > 0) {
        calcY += 18.0;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
        doc.text('CGST (9%):', rightX, calcY);
        doc.text(formatPdfCurrency(invoice.cgst), CONTENT_RIGHT, calcY, { align: 'right' });
        doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
        doc.setLineWidth(0.5);
        doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
      }
      if (invoice?.sgst > 0) {
        calcY += 18.0;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
        doc.text('SGST (9%):', rightX, calcY);
        doc.text(formatPdfCurrency(invoice.sgst), CONTENT_RIGHT, calcY, { align: 'right' });
        doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
        doc.setLineWidth(0.5);
        doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
      }
    }
  }

  // Round-off (if applicable)
  if (invoice?.roundOff && invoice.roundOff !== 0) {
    calcY += 18.0;
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
    doc.text('Round-Off:', rightX, calcY);
    doc.text(`${invoice.roundOff > 0 ? '+' : ''}${formatPdfCurrency(invoice.roundOff)}`, CONTENT_RIGHT, calcY, { align: 'right' });
    doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
    doc.setLineWidth(0.5);
    doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
  }

  // Grand Total Row (13 pt bold, #4F46E5)
  calcY += 28.0;
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text('Grand Total:', rightX, calcY);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text(formatPdfCurrency(grandTotal), CONTENT_RIGHT, calcY, { align: 'right' });
  doc.setDrawColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.setLineWidth(0.75);
  doc.line(rightX, calcY + 7.0, CONTENT_RIGHT, calcY + 7.0);

  // Received / Paid Row (8 pt bold, #059669)
  calcY += 23.0;
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text('Received / Paid:', rightX, calcY);
  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(PDF_COLORS.received[0], PDF_COLORS.received[1], PDF_COLORS.received[2]);
  doc.text(formatPdfCurrency(paidAmount), CONTENT_RIGHT, calcY, { align: 'right' });
  doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
  doc.setLineWidth(0.5);
  doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);

  // Balance Due Row (8 pt bold, #334155, or red if > 0)
  calcY += 22.0;
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text('Balance Due:', rightX, calcY);
  const dueColor = balanceDue > 0 ? PDF_COLORS.balanceDueRed : PDF_COLORS.bodyText;
  doc.setTextColor(dueColor[0], dueColor[1], dueColor[2]);
  doc.text(formatPdfCurrency(balanceDue), CONTENT_RIGHT, calcY, { align: 'right' });

  // 6. SECTION DIVIDER ABOVE TERMS & SIGNATORY
  const termsDividerY = Math.max(620.0, box3Y + box3H + 12.0);
  doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
  doc.setLineWidth(0.75);
  doc.line(CONTENT_LEFT, termsDividerY, CONTENT_RIGHT, termsDividerY);

  // Terms and Conditions (Left)
  const termsY = termsDividerY + 12.0;
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text('TERMS AND CONDITIONS:', CONTENT_LEFT, termsY);

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
  const termsList = business.terms.split('\n').map((t: string) => t.trim()).filter(Boolean);
  let curTermY = termsY + 11.0;
  termsList.forEach((t: string) => {
    doc.text(t, CONTENT_LEFT, curTermY);
    curTermY += 10.0;
  });

  // Authorized Signatory (Right)
  const sigX = 389.0;
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text(`For: ${business.companyName}`, CONTENT_RIGHT, termsDividerY + 18.0, { align: 'right' });

  if (signatureBase64) {
    try {
      const sigW = 85.0;
      const sigH = 35.1; // Maintain 800x331 aspect ratio
      doc.addImage(signatureBase64, 'JPEG', CONTENT_RIGHT - sigW, termsDividerY + 26.0, sigW, sigH);
    } catch {}
  }

  const sigLineY = termsDividerY + 67.0;
  doc.setDrawColor(PDF_COLORS.sigAccentLine[0], PDF_COLORS.sigAccentLine[1], PDF_COLORS.sigAccentLine[2]);
  doc.setLineWidth(0.75);
  doc.line(sigX, sigLineY, CONTENT_RIGHT, sigLineY);

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text('Authorized Signatory', CONTENT_RIGHT, sigLineY + 11.0, { align: 'right' });

  // 7. FOOTER DIVIDER AND THANK-YOU MESSAGE
  const footerLineY = 722.0;
  doc.setDrawColor(PDF_COLORS.thinDivider[0], PDF_COLORS.thinDivider[1], PDF_COLORS.thinDivider[2]);
  doc.setLineWidth(0.75);
  doc.line(CONTENT_LEFT, footerLineY, CONTENT_RIGHT, footerLineY);

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(PDF_COLORS.footerText[0], PDF_COLORS.footerText[1], PDF_COLORS.footerText[2]);
  doc.text(business.footer, PAGE_WIDTH / 2, 735, { align: 'center' });

  const arrayBuffer = doc.output('arraybuffer');
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  return { doc, blob, file, filename, arrayBuffer };
}

/**
 * Triggers a browser download of the on-demand generated PDF blob.
 */
export function downloadPdfBlob(blob: Blob, filename: string) {
  if (typeof window === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

/**
 * Opens the on-demand generated PDF blob directly in a new browser tab for viewing/printing.
 */
export function viewPdfBlob(blob: Blob, filename?: string) {
  if (typeof window === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => {
    try {
      window.URL.revokeObjectURL(url);
    } catch {}
  }, 60000);
}

/**
 * Generates and triggers direct vector download of invoice PDF on-demand.
 */
export async function downloadInvoicePdf(invoice: any, settings: any = {}): Promise<void> {
  const { blob, filename } = await generateInvoicePdf(invoice, settings);
  downloadPdfBlob(blob, filename);
}

/**
 * Generates and views vector invoice PDF directly on-demand in a new tab.
 */
export async function viewInvoicePdf(invoice: any, settings: any = {}): Promise<void> {
  const { blob, filename } = await generateInvoicePdf(invoice, settings);
  viewPdfBlob(blob, filename);
}

/**
 * Backward-compatible helper that delegates to generateInvoicePdf, ensuring
 * identical crisp vector output across all callers.
 */
export async function generateInvoicePdfFromElement(
  _element: HTMLElement | null,
  _invoiceNumber: string,
  invoiceData?: any,
  settingsData?: any
): Promise<{ doc: jsPDF; blob: Blob; file: File; filename: string }> {
  const res = await generateInvoicePdf(invoiceData || { invoiceNumber: _invoiceNumber }, settingsData);
  return { doc: res.doc, blob: res.blob, file: res.file, filename: res.filename };
}
