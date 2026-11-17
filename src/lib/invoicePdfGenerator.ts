import { jsPDF } from 'jspdf';
import { numberToWords, formatDate, getInvoiceTypeTitle, getInvoiceNumberLabel } from './utils';
import { getInvoiceDesign } from './invoice-design';

// Refined Navy, Silver, White & Light-Grey Palette for Ashirwad Technologies
export const PDF_COLORS = {
  mainText: [15, 23, 42],         // #0F172A (Deep navy headings & business name)
  accent: [30, 58, 138],          // #1E3A8A (Royal deep navy section titles & Grand Total)
  bodyText: [51, 65, 85],         // #334155 (Slate-700 body text / labels / values)
  secondaryText: [100, 116, 139], // #64748B (Secondary text / muted labels)
  muted: [100, 116, 139],         // #64748B (Muted labels)
  tableHeaderBg: [238, 242, 249], // #EEF2F9 (Subtle navy-tinted table & top banner header)
  sectionBg: [248, 250, 252],     // #F8FAFC (Light-grey / silver-white section box)
  alternateBg: [251, 252, 253],   // #FBFCFD
  tableBorder: [203, 213, 225],   // #CBD5E1 (Crisp silver / light-grey table grid borders)
  thinDivider: [226, 232, 240],   // #E2E8F0 (Silver-grey thin dividers & box borders)
  infoBoxBg: [248, 250, 252],     // #F8FAFC (Clean light-grey information box)
  infoBoxBorder: [203, 213, 225], // #CBD5E1 (Silver information box border)
  received: [5, 150, 105],        // #059669 (Amount received / paid)
  balanceDueRed: [225, 29, 72],   // #E11D48 (Balance due / negative amounts)
  totalRowBg: [241, 245, 249],    // #F1F5F9 (Silver-grey table total row)
  sigAccentLine: [203, 213, 225], // #CBD5E1 (Silver authorized signatory line)
  footerText: [100, 116, 139],    // #64748B (Footer thank-you message)
};

// In-memory cache for fonts and brand assets
let cachedArialRegular: string | null = null;
let cachedArialBold: string | null = null;
let cachedArialItalic: string | null = null;
let cachedArialBoldItalic: string | null = null;
let cachedLogoBase64: string | null = null;
let cachedSignatureBase64: string | null = null;

/**
 * Fast, memory-safe conversion of ArrayBuffer to base64 string in browser environments.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks to avoid call stack or O(N^2) string allocation issues
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as unknown as number[]));
  }
  return btoa(chunks.join(''));
}

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
 * Checks whether a business GSTIN is genuinely configured and valid
 * (never accepts null, empty, or placeholder '24AANPA0000A1Z5').
 */
export function isValidBusinessGstin(gstin?: string | null): boolean {
  if (!gstin || typeof gstin !== 'string') return false;
  const cleaned = gstin.trim().toUpperCase();
  if (!cleaned || cleaned === 'NULL' || cleaned === 'UNDEFINED' || cleaned === '24AANPA0000A1Z5') {
    return false;
  }
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleaned) || cleaned.length === 15;
}

/**
 * Checks if a historical invoice requires accounting review because it was issued as a
 * GST Tax Invoice or collected GST while the business profile had no valid registered GSTIN.
 */
export function requiresGstAccountingReview(invoice: any, settings?: any): boolean {
  if (!invoice) return false;
  let bizSnapshot: any = {};
  if (invoice.businessSnapshot) {
    try {
      bizSnapshot =
        typeof invoice.businessSnapshot === 'string'
          ? JSON.parse(invoice.businessSnapshot)
          : invoice.businessSnapshot;
    } catch {}
  }
  const effectiveGstin =
    bizSnapshot?.gstin || invoice?.businessProfile?.gstin || settings?.gstin || '';
  const hasRegisteredGstin = isValidBusinessGstin(effectiveGstin);
  const taxCollected =
    (Number(invoice.cgst) || 0) + (Number(invoice.sgst) || 0) + (Number(invoice.igst) || 0);
  const isMarkedTaxInvoice = invoice.invoiceType === 'TAX_INVOICE';

  return !hasRegisteredGstin && (isMarkedTaxInvoice || taxCollected > 0);
}

/**
 * Resolves dynamic category-aware Terms & Conditions and Description & Condition
 * based on the actual items and invoice type.
 * - Never displays laptop terms on CCTV, service, or accessory invoices.
 * - Never displays battery terms on non-battery products.
 * - Eliminates duplicate thank-you lines (since the footer already renders the thank-you message).
 */
export function resolveInvoiceDynamicContent(invoice: any, business: any) {
  const items: any[] = Array.isArray(invoice?.items) ? invoice.items : [];

  let hasLaptop = false;
  let hasCctv = false;
  let hasService = false;
  let hasBattery = false;
  let hasDesktop = false;
  let hasAccessory = false;
  const itemWarranties: string[] = [];

  for (const item of items) {
    let snap: any = {};
    if (item?.itemSnapshot) {
      try {
        snap = typeof item.itemSnapshot === 'string' ? JSON.parse(item.itemSnapshot) : item.itemSnapshot;
      } catch {}
    }

    const text = [
      item?.description,
      item?.productName,
      snap?.productName,
      snap?.description,
      item?.product?.name,
      item?.product?.category,
      item?.product?.description,
    ]
      .filter(Boolean)
      .join(' ');

    const hsn = String(item?.hsn || item?.hsnCode || snap?.hsn || item?.product?.hsn || '').trim();
    const warranty = String(item?.warranty || snap?.warranty || item?.product?.warranty || '').trim();
    if (warranty && warranty !== 'No Warranty' && warranty !== 'None' && warranty !== '-') {
      itemWarranties.push(warranty);
    }

    if (
      /\b(laptop|notebook|macbook|thinkpad|latitude|inspiron|pavilion|elitebook|probook|ideapad|vivobook|zenbook|chromebook|ultrabook|t480|t490|l480|x1\s*carbon)\b/i.test(
        text
      )
    ) {
      hasLaptop = true;
      hasBattery = true;
    }

    if (
      /\b(cctv|camera|cp\s*plus|hikvision|dahua|dvr|nvr|surveillance|night\s*vision|pt\s*camera|bullet\s*camera|dome\s*camera|ip\s*camera|wifi\s*camera)\b/i.test(
        text
      ) ||
      hsn.startsWith('8525')
    ) {
      hasCctv = true;
    }

    if (
      item?.isService ||
      item?.product?.productType === 'SERVICE' ||
      hsn.startsWith('99') ||
      /\b(repair|service|installation|formatting|windows\s*install|motherboard\s*repair|hinge\s*repair|screen\s*replace|labor|diagnostics|troubleshooting|maintenance|amc|remote\s*support|networking\s*setup)\b/i.test(
        text
      )
    ) {
      hasService = true;
    }

    if (/\b(battery|ups|inverter|power\s*bank|cmos\s*battery|laptop\s*battery)\b/i.test(text)) {
      hasBattery = true;
    }

    if (/\b(desktop|custom\s*pc|gaming\s*pc|workstation|all-in-one|aio|tower\s*pc|monitor|cpu\s*cabinet)\b/i.test(text)) {
      hasDesktop = true;
    }

    if (
      /\b(mouse|keyboard|ram|ddr3|ddr4|ddr5|ssd|hdd|hard\s*drive|nvme|pendrive|flash\s*drive|cable|adapter|charger|router|switch|headphone|earphone|speaker|webcam|enclosure|caddy|toner|cartridge|bag)\b/i.test(
        text
      )
    ) {
      hasAccessory = true;
    }
  }

  const primaryWarranty = itemWarranties[0] || '6 Months';
  const isQuotation = invoice?.invoiceType === 'QUOTATION' || invoice?.invoiceType === 'PROFORMA';

  const rawTerms = String(invoice?.terms || business?.terms || '').trim();
  const isDefaultLaptopTerms =
    !rawTerms ||
    /inspect the laptop before purchase/i.test(rawTerms) ||
    /Battery backup may vary depending on usage/i.test(rawTerms);

  let termsList: string[] = [];

  if (isQuotation && isDefaultLaptopTerms) {
    termsList = [
      '* This document is an official price quotation / estimate and not a tax invoice.',
      '* Quoted prices and stock availability are valid for 7 days from the date of issue.',
      '* Applicable warranty terms take effect upon final billing and product delivery.',
      '* Confirmed orders require agreed payment prior to dispatch or installation.',
    ];
  } else if (isDefaultLaptopTerms) {
    if (hasCctv && !hasLaptop) {
      termsList = [
        '* Tested and verified in working condition at the time of sale.',
        '* Please inspect the camera/surveillance equipment and verify model specifications before purchase.',
        `* ${primaryWarranty} warranty covers manufacturing or technical defects only and excludes physical, water, surge, or lightning damage.`,
        '* Power adapters, cables, and mounting accessories are not covered under camera warranty unless specified.',
        '* No return or refund after sale unless covered under applicable warranty.',
      ];
    } else if (hasService && !hasLaptop && !hasCctv && !hasDesktop && !hasAccessory) {
      termsList = [
        '* Repair and technical service work has been tested and verified at the time of delivery.',
        '* Service warranty (where specified) applies strictly to the specific component repaired or replaced.',
        '* Physical damage, liquid damage, power surge, or software corruption is excluded from warranty.',
        '* Customers are advised to maintain data backups; the business is not liable for data loss during service.',
        '* Charges for completed diagnostics, software installation, or service labor are non-refundable.',
      ];
    } else if (!hasLaptop && (hasAccessory || hasDesktop)) {
      termsList = [
        '* Tested and verified in working condition at the time of sale.',
        '* Please inspect the hardware/accessory and verify compatibility before purchase.',
        `* ${primaryWarranty} warranty covers technical manufacturing defects only and excludes physical, burn, surge, or liquid damage.`,
        ...(hasBattery ? ['* Battery backup depends on load and usage conditions.'] : []),
        '* No return or refund after sale unless covered under applicable warranty.',
      ];
    } else {
      // Laptop sale (or general hardware with laptop)
      termsList = [
        '* Tested and working perfectly at the time of sale.',
        '* Please inspect the laptop and verify specifications before purchase.',
        `* ${primaryWarranty} of warranty covers technical issues only and excludes physical or liquid damage.`,
        '* Battery backup may vary depending on usage.',
        '* No return or refund after sale unless covered under warranty.',
      ];
    }
  } else {
    // Custom terms provided — sanitize against category mismatches and duplicate thank-you lines
    termsList = rawTerms
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((line) => {
        if (!hasLaptop && /inspect the laptop/i.test(line)) {
          return '* Please inspect the product and verify specifications before purchase.';
        }
        return line;
      })
      .filter((line) => {
        if (!hasLaptop && !hasBattery && /battery\s*backup/i.test(line)) {
          return false;
        }
        // Avoid duplicating the footer thank-you message
        if (/thank\s+you\s+for\s+choosing\s+us/i.test(line)) {
          return false;
        }
        return true;
      });
  }

  // Final pass to guarantee no duplicate thank-you line in termsList
  termsList = termsList.filter((line) => !/thank\s+you\s+for\s+choosing\s+us/i.test(line));

  // Resolve Description & Condition note
  const legacyDefaultNote =
    'Professionally refurbished, fully tested, and ready to use. Clean, reliable, and backed by quality service.';
  const rawNote = invoice?.notes !== undefined && invoice?.notes !== null ? String(invoice.notes).trim() : '';
  const isLegacyDefaultNote = !rawNote || rawNote === legacyDefaultNote;

  let descriptionNote = rawNote;
  if (isLegacyDefaultNote) {
    if (hasCctv && !hasLaptop) {
      descriptionNote =
        'Tested and verified security & surveillance equipment. Reliable performance backed by quality technical support.';
    } else if (hasService && !hasLaptop && !hasCctv && !hasDesktop && !hasAccessory) {
      descriptionNote =
        'Professional diagnostics, repair, and technical service completed and verified by qualified technicians.';
    } else if (!hasLaptop && (hasAccessory || hasDesktop)) {
      descriptionNote =
        'Quality IT hardware and accessories, tested and verified in working condition at the time of sale.';
    } else {
      descriptionNote = legacyDefaultNote;
    }
  }

  const footerMessage =
    business?.footer || "Thank you for choosing us—we're always here to help if you need support.";

  return {
    termsList,
    descriptionNote,
    footerMessage,
    categories: { hasLaptop, hasCctv, hasService, hasBattery, hasDesktop, hasAccessory },
  };
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
  baseUrl?: string;
  fonts?: {
    regular?: string;
    bold?: string;
    italic?: string;
    boldItalic?: string;
  };
}

/**
 * Embeds TrueType Arial font for 100% vector typography and native Indian Rupee symbol (₹) support.
 * Runs seamlessly in both Node.js (server / Vercel) and modern browser environments.
 */
async function loadAndSetupFonts(doc: jsPDF, options: InvoicePdfOptions = {}): Promise<string> {
  try {
    if (options.fonts?.regular) cachedArialRegular = options.fonts.regular;
    if (options.fonts?.bold) cachedArialBold = options.fonts.bold;
    if (options.fonts?.italic) cachedArialItalic = options.fonts.italic;
    if (options.fonts?.boldItalic) cachedArialBoldItalic = options.fonts.boldItalic;

    if (typeof window === 'undefined') {
      // Node.js Server Environment
      try {
        const fs = eval('require')('fs');
        const path = eval('require')('path');
        const fontsDir = path.join(process.cwd(), 'public', 'fonts');

        if (!cachedArialRegular && fs.existsSync(path.join(fontsDir, 'arial.ttf'))) {
          cachedArialRegular = fs.readFileSync(path.join(fontsDir, 'arial.ttf')).toString('base64');
        }
        if (!cachedArialBold && fs.existsSync(path.join(fontsDir, 'arialbd.ttf'))) {
          cachedArialBold = fs.readFileSync(path.join(fontsDir, 'arialbd.ttf')).toString('base64');
        }
        if (!cachedArialItalic && fs.existsSync(path.join(fontsDir, 'ariali.ttf'))) {
          cachedArialItalic = fs.readFileSync(path.join(fontsDir, 'ariali.ttf')).toString('base64');
        }
        if (!cachedArialBoldItalic && fs.existsSync(path.join(fontsDir, 'arialbi.ttf'))) {
          cachedArialBoldItalic = fs.readFileSync(path.join(fontsDir, 'arialbi.ttf')).toString('base64');
        }
      } catch {}

      // Serverless CDN fallback if local fs did not have the font files bundled
      if ((!cachedArialRegular || !cachedArialBold) && options.baseUrl) {
        const fetchFontB64 = async (file: string) => {
          try {
            const res = await fetch(`${options.baseUrl}/fonts/${file}`, { cache: 'force-cache' });
            if (res.ok) {
              const ab = await res.arrayBuffer();
              return Buffer.from(ab).toString('base64');
            }
          } catch {}
          return null;
        };
        const [reg, bold, ital, bi] = await Promise.all([
          cachedArialRegular ? Promise.resolve(cachedArialRegular) : fetchFontB64('arial.ttf'),
          cachedArialBold ? Promise.resolve(cachedArialBold) : fetchFontB64('arialbd.ttf'),
          cachedArialItalic ? Promise.resolve(cachedArialItalic) : fetchFontB64('ariali.ttf'),
          cachedArialBoldItalic ? Promise.resolve(cachedArialBoldItalic) : fetchFontB64('arialbi.ttf'),
        ]);
        if (reg) cachedArialRegular = reg;
        if (bold) cachedArialBold = bold;
        if (ital) cachedArialItalic = ital;
        if (bi) cachedArialBoldItalic = bi;
      }
    } else {
      // Browser Environment: fetch fonts concurrently if not already cached
      const fetchBrowserFont = async (url: string): Promise<string | null> => {
        try {
          const res = await fetch(url, { cache: 'force-cache' });
          if (res.ok) {
            const buf = await res.arrayBuffer();
            return arrayBufferToBase64(buf);
          }
        } catch {}
        return null;
      };

      const [reg, bold, ital, bi] = await Promise.all([
        cachedArialRegular ? Promise.resolve(cachedArialRegular) : fetchBrowserFont('/fonts/arial.ttf'),
        cachedArialBold ? Promise.resolve(cachedArialBold) : fetchBrowserFont('/fonts/arialbd.ttf'),
        cachedArialItalic ? Promise.resolve(cachedArialItalic) : fetchBrowserFont('/fonts/ariali.ttf'),
        cachedArialBoldItalic ? Promise.resolve(cachedArialBoldItalic) : fetchBrowserFont('/fonts/arialbi.ttf'),
      ]);

      if (reg) cachedArialRegular = reg;
      if (bold) cachedArialBold = bold;
      if (ital) cachedArialItalic = ital;
      if (bi) cachedArialBoldItalic = bi;
    }

    if (cachedArialRegular) {
      doc.addFileToVFS('arial.ttf', cachedArialRegular);
      doc.addFont('arial.ttf', 'Arial', 'normal');
    }
    if (cachedArialBold) {
      doc.addFileToVFS('arialbd.ttf', cachedArialBold);
      doc.addFont('arialbd.ttf', 'Arial', 'bold');
    } else if (cachedArialRegular) {
      doc.addFont('arial.ttf', 'Arial', 'bold');
    }
    if (cachedArialItalic) {
      doc.addFileToVFS('ariali.ttf', cachedArialItalic);
      doc.addFont('ariali.ttf', 'Arial', 'italic');
    } else if (cachedArialRegular) {
      doc.addFont('arial.ttf', 'Arial', 'italic');
    }
    if (cachedArialBoldItalic) {
      doc.addFileToVFS('arialbi.ttf', cachedArialBoldItalic);
      doc.addFont('arialbi.ttf', 'Arial', 'bolditalic');
    } else if (cachedArialItalic) {
      doc.addFont('ariali.ttf', 'Arial', 'bolditalic');
    } else if (cachedArialBold) {
      doc.addFont('arialbd.ttf', 'Arial', 'bolditalic');
    }

    if (cachedArialRegular) {
      doc.setFont('Arial', 'normal');
      return 'Arial';
    }
  } catch (err) {
    console.warn('Font loading encountered an issue:', err);
  }

  doc.setFont('helvetica', 'normal');
  return 'helvetica';
}

/**
 * Loads default brand assets (Original AT Logo & Signature) from disk or public web URL.
 */
async function loadBrandAssets(options: InvoicePdfOptions = {}) {
  let logoBase64 = options.logoBase64 || cachedLogoBase64 || undefined;
  let signatureBase64 = options.signatureBase64 || cachedSignatureBase64 || undefined;

  if (typeof window === 'undefined') {
    try {
      const fs = eval('require')('fs');
      const path = eval('require')('path');

      if (!logoBase64) {
        const pngPath = path.join(process.cwd(), 'public', 'brand', 'logo.png');
        const jpegPath = path.join(process.cwd(), 'public', 'brand', 'logo.jpeg');
        const logoPath = fs.existsSync(pngPath) ? pngPath : jpegPath;
        if (fs.existsSync(logoPath)) {
          const buf = fs.readFileSync(logoPath);
          const isPng = logoPath.endsWith('.png');
          logoBase64 = `data:image/${isPng ? 'png' : 'jpeg'};base64,${buf.toString('base64')}`;
          cachedLogoBase64 = logoBase64;
        }
      }

      if (!signatureBase64) {
        const sigPath = path.join(process.cwd(), 'public', 'brand', 'signature.jpeg');
        if (fs.existsSync(sigPath)) {
          const buf = fs.readFileSync(sigPath);
          signatureBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
          cachedSignatureBase64 = signatureBase64;
        }
      }
    } catch {}

    // Serverless CDN fallback if assets were not on local disk
    if ((!logoBase64 || !signatureBase64) && options.baseUrl) {
      if (!logoBase64) {
        try {
          const res = await fetch(`${options.baseUrl}/brand/logo.png`, { cache: 'force-cache' });
          if (res.ok) {
            const ab = await res.arrayBuffer();
            logoBase64 = `data:image/png;base64,${Buffer.from(ab).toString('base64')}`;
            cachedLogoBase64 = logoBase64;
          }
        } catch {}
      }
      if (!signatureBase64) {
        try {
          const res = await fetch(`${options.baseUrl}/brand/signature.jpeg`, { cache: 'force-cache' });
          if (res.ok) {
            const ab = await res.arrayBuffer();
            signatureBase64 = `data:image/jpeg;base64,${Buffer.from(ab).toString('base64')}`;
            cachedSignatureBase64 = signatureBase64;
          }
        } catch {}
      }
    }
  } else {
    if (!logoBase64) {
      try {
        const res = await fetch('/brand/logo.png').catch(() => fetch('/brand/logo.jpeg'));
        if (res && res.ok) {
          const buf = await res.arrayBuffer();
          logoBase64 = `data:image/png;base64,${arrayBufferToBase64(buf)}`;
          cachedLogoBase64 = logoBase64;
        }
      } catch {}
    }

    if (!signatureBase64) {
      try {
        const res = await fetch('/brand/signature.jpeg');
        if (res && res.ok) {
          const buf = await res.arrayBuffer();
          signatureBase64 = `data:image/jpeg;base64,${arrayBufferToBase64(buf)}`;
          cachedSignatureBase64 = signatureBase64;
        }
      } catch {}
    }
  }

  return { logoBase64, signatureBase64 };
}

/**
 * MASTER INVOICE PDF GENERATOR
 * Generates a crisp, vector-rendered A4 portrait invoice PDF with embedded Unicode Arial fonts,
 * reliable Indian Rupee (₹) formatting, navy/silver/white theme, and category-aware terms.
 */
export async function generateInvoicePdf(
  invoice: any,
  settings: any = {},
  options: InvoicePdfOptions = {}
): Promise<{ doc: jsPDF; blob: Blob; file: File; filename: string; arrayBuffer: ArrayBuffer }> {
  // 1. Initialize A4 PDF in points (595.28 × 841.89 pt)
  const doc =
    options.doc ||
    new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true,
    });

  const filename = getSanitizedInvoiceFilename(invoice?.invoiceNumber || 'INVOICE');

  // Load TrueType Unicode fonts and brand assets
  const [fontFamily, { logoBase64, signatureBase64 }] = await Promise.all([
    loadAndSetupFonts(doc, options),
    loadBrandAssets(options),
  ]);

  // Currency symbol safeguard: if Arial is embedded, use native Unicode ₹; otherwise 'Rs. ' so it never corrupts
  const currencySymbol = fontFamily === 'Arial' ? '₹' : 'Rs. ';
  const fmtMoney = (val: number | null | undefined) => formatPdfCurrency(val, currencySymbol);

  let qrBase64 = options.qrBase64;

  // 2. Reconstruct Business Snapshot (prioritizing saved immutable snapshot over live settings)
  let bizSnapshot: any = {};
  if (invoice?.businessSnapshot) {
    try {
      bizSnapshot =
        typeof invoice.businessSnapshot === 'string'
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

  const rawTagline = (bizSnapshot.tagline || settings?.tagline || 'Beyond Tech Limits')
    .replace(/\.{2,}$/, '')
    .replace(/\s*\.\.\.\s*$/, '')
    .trim();

  const business = {
    companyName: bizSnapshot.companyName || settings?.companyName || 'ASHIRWAD TECHNOLOGIES',
    tagline: rawTagline,
    address:
      bizSnapshot.address ||
      settings?.address ||
      'A/1, 902, Ashraya 10, GST compound, New Ranip, Ahmedabad 382470.',
    phone: bizSnapshot.phone || settings?.phone || '9662278994',
    email: bizSnapshot.email || settings?.email || 'rajsoni2962@gmail.com',
    gstin:
      bizSnapshot.gstin && bizSnapshot.gstin !== 'null'
        ? bizSnapshot.gstin
        : settings?.gstin && settings?.gstin !== 'null'
        ? settings.gstin
        : '',
    state: bizSnapshot.state || settings?.state || 'Gujarat',
    stateCode: bizSnapshot.stateCode || settings?.stateCode || '24',
    bankName: bizSnapshot.bankName || settings?.bankName || 'Kotak Mahindra Bank',
    accountNumber: bizSnapshot.accountNumber || settings?.accountNumber || '5947557983',
    ifscCode: bizSnapshot.ifscCode || settings?.ifscCode || 'KKBK0000879',
    upiId: bizSnapshot.upiId || settings?.upiId || 'rajsoni2962-2@okaxis',
    terms: invoice?.terms || bizSnapshot.terms || settings?.terms || '',
    authorizedSignatory:
      bizSnapshot.authorizedSignatory ||
      settings?.authorizedSignatory ||
      'For: ASHIRWAD TECHNOLOGIES\nAuthorized Signatory',
    footer:
      bizSnapshot.footer ||
      settings?.footer ||
      "Thank you for choosing us—we're always here to help if you need support.",
  };

  // Resolve dynamic category-aware terms, condition description, and deduplicated footer
  const dynamicContent = resolveInvoiceDynamicContent(invoice, business);

  // 3. Reconstruct Customer Snapshot
  let custSnapshot: any = null;
  if (invoice?.customerSnapshot) {
    try {
      custSnapshot =
        typeof invoice.customerSnapshot === 'string'
          ? JSON.parse(invoice.customerSnapshot)
          : invoice.customerSnapshot;
    } catch {}
  }
  const customer = custSnapshot || invoice?.customer || {};

  const grandTotal = Number(invoice?.grandTotal) || 0;
  const paidAmount =
    Number(
      invoice?.paidAmount !== undefined
        ? invoice.paidAmount
        : invoice?.payments?.reduce((s: number, p: any) => s + (p.amount || 0), 0)
    ) || 0;
  const balanceDue =
    invoice?.balanceDue !== undefined
      ? Number(invoice.balanceDue)
      : Math.max(0, grandTotal - paidAmount);

  // Auto-resolve UPI QR Code if not provided
  if (!qrBase64 && business.upiId) {
    try {
      const upiLink = `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(
        business.companyName
      )}&am=${encodeURIComponent(grandTotal)}&cu=INR&tn=${encodeURIComponent(
        `Inv ${invoice?.invoiceNumber || ''}`
      )}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        upiLink
      )}`;
      const qrRes = await fetch(qrUrl, { cache: 'force-cache' });
      if (qrRes && qrRes.ok) {
        if (typeof window !== 'undefined') {
          const buf = await qrRes.arrayBuffer();
          qrBase64 = `data:image/png;base64,${arrayBufferToBase64(buf)}`;
        } else {
          const arrayBuf = await qrRes.arrayBuffer();
          qrBase64 = `data:image/png;base64,${Buffer.from(arrayBuf).toString('base64')}`;
        }
      }
    } catch {}
  }

  // --- Coordinate Layout ---
  const PAGE_WIDTH = 595.28;
  const CONTENT_LEFT = 25.5;
  const CONTENT_WIDTH = 544.0;
  const CONTENT_RIGHT = CONTENT_LEFT + CONTENT_WIDTH; // 569.5

  // 1. TOP BANNER: Invoice Type Title
  const titleY = 31.0;
  const titleH = 26.0;
  doc.setFillColor(
    PDF_COLORS.tableHeaderBg[0],
    PDF_COLORS.tableHeaderBg[1],
    PDF_COLORS.tableHeaderBg[2]
  );
  doc.rect(CONTENT_LEFT, titleY, CONTENT_WIDTH, titleH, 'F');

  const invoiceTitle = getInvoiceTypeTitle(invoice?.invoiceType);
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text(invoiceTitle, PAGE_WIDTH / 2, titleY + 17.0, { align: 'center' });

  // 2. BUSINESS HEADER
  // Original AT Logo Box (Left: x=25.5, y=68, width=98, height=98, radius=12)
  const logoBoxX = CONTENT_LEFT;
  const logoBoxY = 68.0;
  const logoBoxSize = 98.0;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(
    PDF_COLORS.tableBorder[0],
    PDF_COLORS.tableBorder[1],
    PDF_COLORS.tableBorder[2]
  );
  doc.setLineWidth(1);
  doc.roundedRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 12, 12, 'FD');

  if (logoBase64) {
    try {
      const isPng = logoBase64.includes('image/png') || logoBase64.startsWith('iVBORw0KGgo');
      const format = isPng ? 'PNG' : 'JPEG';
      const imgData = logoBase64.startsWith('data:')
        ? logoBase64
        : `data:image/${isPng ? 'png' : 'jpeg'};base64,${logoBase64}`;
      let imgW = 84;
      let imgH = 84;
      try {
        const props = doc.getImageProperties(imgData);
        if (props.width && props.height) {
          const aspect = props.width / props.height;
          const maxDim = 84;
          if (aspect >= 1) {
            imgW = maxDim;
            imgH = maxDim / aspect;
          } else {
            imgH = maxDim;
            imgW = maxDim * aspect;
          }
        }
      } catch {}
      const imgX = logoBoxX + (logoBoxSize - imgW) / 2;
      const imgY = logoBoxY + (logoBoxSize - imgH) / 2;
      doc.addImage(imgData, format, imgX, imgY, imgW, imgH);
    } catch {}
  }

  // Business Identity Block (Right-Aligned at CONTENT_RIGHT)
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(20);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text(business.companyName, CONTENT_RIGHT, 88, { align: 'right' });

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text(business.tagline, CONTENT_RIGHT, 102, { align: 'right' });

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text(business.address, CONTENT_RIGHT, 115.5, { align: 'right' });

  // Contact line: "Phone no.: 9662278994  •  Email: rajsoni2962@gmail.com"
  const contactY = 128.5;
  const emailPart = business.email;
  const emailLabel = '  •  Email: ';
  const phonePart = business.phone;
  const phoneLabel = 'Phone no.: ';

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  const emailW = doc.getTextWidth(emailPart);
  doc.text(emailPart, CONTENT_RIGHT, contactY, { align: 'right' });

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  const emailLabelW = doc.getTextWidth(emailLabel);
  doc.text(emailLabel, CONTENT_RIGHT - emailW, contactY, { align: 'right' });

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  const phoneW = doc.getTextWidth(phonePart);
  doc.text(phonePart, CONTENT_RIGHT - emailW - emailLabelW, contactY, { align: 'right' });

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text(phoneLabel, CONTENT_RIGHT - emailW - emailLabelW - phoneW, contactY, { align: 'right' });

  // Business GSTIN line (never fabricated; only shown when genuinely registered)
  if (isValidBusinessGstin(business.gstin)) {
    const gstinY = 141.5;
    const gstinPart = business.gstin.trim();
    const gstinLabel = 'GSTIN: ';
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    const gstinW = doc.getTextWidth(gstinPart);
    doc.text(gstinPart, CONTENT_RIGHT, gstinY, { align: 'right' });

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
    doc.text(gstinLabel, CONTENT_RIGHT - gstinW, gstinY, { align: 'right' });
  }

  // Header Divider (y = 177)
  doc.setDrawColor(
    PDF_COLORS.thinDivider[0],
    PDF_COLORS.thinDivider[1],
    PDF_COLORS.thinDivider[2]
  );
  doc.setLineWidth(0.75);
  doc.line(CONTENT_LEFT, 177, CONTENT_RIGHT, 177);

  // 3. CUSTOMER AND INVOICE INFORMATION SECTION (y = 178 to 280)
  const partyY = 178;
  const splitX = 286.0;

  // Vertical Divider
  doc.setDrawColor(
    PDF_COLORS.thinDivider[0],
    PDF_COLORS.thinDivider[1],
    PDF_COLORS.thinDivider[2]
  );
  doc.setLineWidth(0.75);
  doc.line(splitX, partyY + 12, splitX, 270);

  // Left Column: BILLED TO (hiding empty optional fields cleanly)
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text('BILLED TO', CONTENT_LEFT, partyY + 16);

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text(customer.name || 'Walk-in Customer', CONTENT_LEFT, partyY + 31);

  let custCursorY = partyY + 44.5;

  const custPhone = String(customer.phone || '').trim();
  if (custPhone && custPhone !== '-' && custPhone !== 'null') {
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
    doc.text('Contact No.: ', CONTENT_LEFT, custCursorY);
    const contactLabelW = doc.getTextWidth('Contact No.: ');
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    doc.text(custPhone, CONTENT_LEFT + contactLabelW, custCursorY);
    custCursorY += 13.0;
  }

  const custAddr = String(customer.address || '').trim();
  if (custAddr && custAddr !== '-' && custAddr !== 'null') {
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
    const addrLines = doc.splitTextToSize(`Address: ${custAddr}`, 245);
    doc.text(addrLines[0], CONTENT_LEFT, custCursorY);
    custCursorY += 12.0;
    if (addrLines.length > 1) {
      doc.text(addrLines.slice(1).join(' '), CONTENT_LEFT, custCursorY);
      custCursorY += 12.0;
    }
  }

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  const stateStr = customer.state
    ? `State: ${customer.state}${customer.stateCode ? ` (Code: ${customer.stateCode})` : ''}`
    : 'State: Gujarat (Code: 24)';
  doc.text(stateStr, CONTENT_LEFT, custCursorY);
  custCursorY += 12.0;

  // Customer GSTIN line (preserved for registered buyers; hidden when unset/blank)
  const rawCustGstin = String(customer.gstin || '').trim();
  if (rawCustGstin && rawCustGstin !== 'null' && rawCustGstin !== '-') {
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
    doc.text('GSTIN: ', CONTENT_LEFT, custCursorY);
    const custGstinLabelW = doc.getTextWidth('GSTIN: ');
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    doc.text(rawCustGstin, CONTENT_LEFT + custGstinLabelW, custCursorY);
  }

  // Right Column: INVOICE DETAILS (Right-aligned at CONTENT_RIGHT)
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text('INVOICE DETAILS', CONTENT_RIGHT, partyY + 16, { align: 'right' });

  // Invoice No. / Doc No.
  const invTypeLabel = `${getInvoiceNumberLabel(invoice?.invoiceType).replace(/:+$/, '')}: `;
  const invNum = invoice?.invoiceNumber || '-';
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  const invNumW = doc.getTextWidth(invNum);
  doc.text(invNum, CONTENT_RIGHT, partyY + 31, { align: 'right' });
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
  doc.text(invTypeLabel, CONTENT_RIGHT - invNumW, partyY + 31, { align: 'right' });

  // Date
  const dateStr = formatDate(invoice?.date);
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  const dateW = doc.getTextWidth(dateStr);
  doc.text(dateStr, CONTENT_RIGHT, partyY + 44.5, { align: 'right' });
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
  doc.text('Date: ', CONTENT_RIGHT - dateW, partyY + 44.5, { align: 'right' });

  // Payment Mode
  const modeStr = invoice?.paymentMode || 'Cash';
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  const modeW = doc.getTextWidth(modeStr);
  doc.text(modeStr, CONTENT_RIGHT, partyY + 57.5, { align: 'right' });
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
  doc.text('Payment Mode: ', CONTENT_RIGHT - modeW, partyY + 57.5, { align: 'right' });

  // Due Date (optional)
  if (invoice?.dueDate) {
    const dueStr = formatDate(invoice.dueDate);
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    const dueW = doc.getTextWidth(dueStr);
    doc.text(dueStr, CONTENT_RIGHT, partyY + 70.5, { align: 'right' });
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
    doc.text('Due Date: ', CONTENT_RIGHT - dueW, partyY + 70.5, { align: 'right' });
  }

  // Divider below Party Details (y = 280)
  doc.setDrawColor(
    PDF_COLORS.thinDivider[0],
    PDF_COLORS.thinDivider[1],
    PDF_COLORS.thinDivider[2]
  );
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
    doc.setDrawColor(
      PDF_COLORS.tableBorder[0],
      PDF_COLORS.tableBorder[1],
      PDF_COLORS.tableBorder[2]
    );
    doc.setLineWidth(0.75);

    colDef.forEach((col) => {
      doc.setFillColor(
        PDF_COLORS.tableHeaderBg[0],
        PDF_COLORS.tableHeaderBg[1],
        PDF_COLORS.tableHeaderBg[2]
      );
      doc.rect(x, y, col.w, headerH, 'FD');
      x += col.w;
    });

    x = CONTENT_LEFT;
    colDef.forEach((col) => {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);

      if (col.id === 'rate') {
        doc.text('PRICE /', x + col.w / 2, y + 11.5, { align: 'center' });
        doc.text('UNIT', x + col.w / 2, y + 21, { align: 'center' });
      } else if (col.align === 'center') {
        doc.text(col.label, x + col.w / 2, y + 17.5, { align: 'center' });
      } else if (col.align === 'right') {
        doc.text(col.label, x + col.w - 10, y + 17.5, { align: 'right' });
      } else {
        doc.text(col.label, x + 10, y + 17.5);
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
        itemSnapshot =
          typeof item.itemSnapshot === 'string'
            ? JSON.parse(item.itemSnapshot)
            : item.itemSnapshot;
      } catch {}
    }

    const qty = Number(item.quantity !== undefined ? item.quantity : itemSnapshot.quantity) || 1;
    totalQty += qty;

    const descText =
      item.description ||
      item.productName ||
      itemSnapshot.productName ||
      item.product?.name ||
      'Item';
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(9);
    const splitDesc = doc.splitTextToSize(descText, colDef[1].w - 18);

    const rawSerial = String(item.serialNumber || itemSnapshot.serialNumber || '').trim();
    const rawWarranty = String(
      item.warranty || itemSnapshot.warranty || item.product?.warranty || ''
    ).trim();
    const serial = rawSerial && rawSerial !== 'null' && rawSerial !== '-' ? rawSerial : '';
    const warranty =
      rawWarranty &&
      rawWarranty !== 'null' &&
      rawWarranty !== '-' &&
      rawWarranty !== 'No Warranty' &&
      rawWarranty !== 'None'
        ? rawWarranty
        : '';
    const hasExtraNote = Boolean(serial || warranty);

    const lineStep = 11.25;
    const firstLineBaseline = 15.0;
    const lastDescBaseline = firstLineBaseline + (splitDesc.length - 1) * lineStep;
    const extraBaseline = lastDescBaseline + 12.0;
    const rowH = Math.max(
      28.0,
      (hasExtraNote ? extraBaseline : lastDescBaseline) + 9.0
    );

    // Multi-page overflow check
    if (curRowY + rowH > 740) {
      doc.addPage();
      tableY = 31.0;
      drawTableHeader(tableY);
      curRowY = tableY + headerH;
    }

    // Draw row cells
    let x = CONTENT_LEFT;
    doc.setDrawColor(
      PDF_COLORS.tableBorder[0],
      PDF_COLORS.tableBorder[1],
      PDF_COLORS.tableBorder[2]
    );
    doc.setLineWidth(0.75);

    colDef.forEach((col) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(x, curRowY, col.w, rowH, 'FD');
      x += col.w;
    });

    // # index
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
    doc.text(String(idx + 1), CONTENT_LEFT + colDef[0].w / 2, curRowY + firstLineBaseline, {
      align: 'center',
    });

    // Item description (preserving full specifications)
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    doc.text(splitDesc, CONTENT_LEFT + colDef[0].w + 10, curRowY + firstLineBaseline, {
      lineHeightFactor: 1.25,
    });

    // Serial & Warranty Note underneath in deep navy
    if (hasExtraNote) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
      let extraStr = '';
      if (serial && warranty) extraStr = `S/N: ${serial}  •  Warranty: ${warranty}`;
      else if (serial) extraStr = `S/N: ${serial}`;
      else if (warranty) extraStr = `Warranty: ${warranty}`;
      doc.text(extraStr, CONTENT_LEFT + colDef[0].w + 10, curRowY + extraBaseline);
    }

    // HSN
    const hsnVal = item.hsn || item.hsnCode || itemSnapshot.hsn || '8471';
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
    doc.text(
      String(hsnVal),
      CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w / 2,
      curRowY + firstLineBaseline,
      { align: 'center' }
    );

    // Qty
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    doc.text(
      String(qty),
      CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w + colDef[3].w / 2,
      curRowY + firstLineBaseline,
      { align: 'center' }
    );

    // Unit
    const unitVal = item.unit || itemSnapshot.unit || 'Pcs';
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
    doc.text(
      unitVal,
      CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w + colDef[3].w + colDef[4].w / 2,
      curRowY + firstLineBaseline,
      { align: 'center' }
    );

    // Price / Unit
    const rateVal = Number(item.rate !== undefined ? item.rate : itemSnapshot.rate) || 0;
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
    const rateStr = fmtMoney(rateVal);
    const rateX =
      CONTENT_LEFT +
      colDef[0].w +
      colDef[1].w +
      colDef[2].w +
      colDef[3].w +
      colDef[4].w +
      colDef[5].w -
      10;
    doc.text(rateStr, rateX, curRowY + firstLineBaseline, { align: 'right' });

    // Amount
    const totalVal =
      Number(
        item.total !== undefined
          ? item.total
          : item.amount !== undefined
          ? item.amount
          : itemSnapshot.total
      ) || qty * rateVal;
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(9);
    const amtStr = fmtMoney(totalVal);
    const amtX = CONTENT_RIGHT - 10;
    doc.text(amtStr, amtX, curRowY + firstLineBaseline, { align: 'right' });

    curRowY += rowH;
  });

  // Total Row
  const totalRowH = 22.0;
  let tx = CONTENT_LEFT;
  doc.setDrawColor(
    PDF_COLORS.tableBorder[0],
    PDF_COLORS.tableBorder[1],
    PDF_COLORS.tableBorder[2]
  );
  doc.setLineWidth(0.75);

  colDef.forEach((col) => {
    doc.setFillColor(
      PDF_COLORS.totalRowBg[0],
      PDF_COLORS.totalRowBg[1],
      PDF_COLORS.totalRowBg[2]
    );
    doc.rect(tx, curRowY, col.w, totalRowH, 'FD');
    tx += col.w;
  });

  // "Total"
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text(
    'Total',
    CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w / 2,
    curRowY + 15,
    { align: 'center' }
  );

  // Qty total
  doc.setFontSize(8.5);
  doc.text(
    String(totalQty),
    CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w + colDef[3].w / 2,
    curRowY + 15,
    { align: 'center' }
  );

  // Unit
  doc.setFontSize(8);
  doc.text(
    'Pcs',
    CONTENT_LEFT + colDef[0].w + colDef[1].w + colDef[2].w + colDef[3].w + colDef[4].w / 2,
    curRowY + 15,
    { align: 'center' }
  );

  // Total Amount
  const subtotalVal = invoice?.subtotal !== undefined ? Number(invoice.subtotal) : grandTotal;
  doc.setFontSize(9);
  doc.text(fmtMoney(subtotalVal), CONTENT_RIGHT - 10, curRowY + 15, { align: 'right' });

  curRowY += totalRowH;

  // Check if lower summary & terms section needs a new page (when many items fill page 1)
  if (curRowY + 290 > 810) {
    doc.addPage();
    curRowY = 30.0;
  }

  // 5. SECTION BELOW TABLE: AMOUNT IN WORDS, DETAILS & FINANCIAL BREAKDOWN
  const secY = curRowY + 16.0;

  // LEFT BLOCK (Width: 294 pt)
  // Box 1: INVOICE AMOUNT IN WORDS:
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.muted[0], PDF_COLORS.muted[1], PDF_COLORS.muted[2]);
  doc.text('INVOICE AMOUNT IN WORDS:', CONTENT_LEFT, secY);

  const box1Y = secY + 5.0;
  const box1W = 294.0;
  doc.setFont(fontFamily, 'bolditalic');
  doc.setFontSize(8.5);
  const wordsStr = numberToWords(Math.round(grandTotal));
  const splitWords = doc.splitTextToSize(wordsStr, box1W - 20);
  const box1H = Math.max(26.0, splitWords.length * 11.5 + 12.0);

  doc.setFillColor(PDF_COLORS.sectionBg[0], PDF_COLORS.sectionBg[1], PDF_COLORS.sectionBg[2]);
  doc.setDrawColor(
    PDF_COLORS.thinDivider[0],
    PDF_COLORS.thinDivider[1],
    PDF_COLORS.thinDivider[2]
  );
  doc.setLineWidth(1);
  doc.roundedRect(CONTENT_LEFT, box1Y, box1W, box1H, 6, 6, 'FD');

  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text(splitWords, CONTENT_LEFT + 10, box1Y + 16.5, { lineHeightFactor: 1.25 });

  // Box 2: Description & Condition Box
  const box2Y = box1Y + box1H + 10.0;
  const box2W = 294.0;
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.2);
  const descLines = doc.splitTextToSize(dynamicContent.descriptionNote, box2W - 16);
  const box2H = Math.max(52.0, 24.0 + descLines.length * 10.0 + 8.0);

  doc.setFillColor(PDF_COLORS.infoBoxBg[0], PDF_COLORS.infoBoxBg[1], PDF_COLORS.infoBoxBg[2]);
  doc.setDrawColor(
    PDF_COLORS.infoBoxBorder[0],
    PDF_COLORS.infoBoxBorder[1],
    PDF_COLORS.infoBoxBorder[2]
  );
  doc.roundedRect(CONTENT_LEFT, box2Y, box2W, box2H, 7, 7, 'FD');

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text('Description & Condition:', CONTENT_LEFT + 8, box2Y + 14);

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text(descLines, CONTENT_LEFT + 8, box2Y + 26.5, { lineHeightFactor: 1.35 });

  // Box 3: Bank & Payment Details Box (with QR Code)
  const box3Y = box2Y + box2H + 10.0;
  const box3W = 294.0;
  const box3H = 92.0;
  doc.setFillColor(PDF_COLORS.sectionBg[0], PDF_COLORS.sectionBg[1], PDF_COLORS.sectionBg[2]);
  doc.setDrawColor(
    PDF_COLORS.thinDivider[0],
    PDF_COLORS.thinDivider[1],
    PDF_COLORS.thinDivider[2]
  );
  doc.roundedRect(CONTENT_LEFT, box3Y, box3W, box3H, 7, 7, 'FD');

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text('Bank & Payment Details:', CONTENT_LEFT + 8, box3Y + 14);

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.5);
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
  doc.setDrawColor(
    PDF_COLORS.tableBorder[0],
    PDF_COLORS.tableBorder[1],
    PDF_COLORS.tableBorder[2]
  );
  doc.setLineWidth(0.75);
  doc.roundedRect(qrX, qrY, qrSize, qrSize, 4, 4, 'FD');

  if (qrBase64) {
    try {
      doc.addImage(qrBase64, 'PNG', qrX + 2, qrY + 2, qrSize - 4, qrSize - 4);
    } catch {}
  }

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(6.5);
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
  doc.setFont(fontFamily, 'bold');
  doc.text(fmtMoney(subtotalVal), CONTENT_RIGHT, calcY, { align: 'right' });
  doc.setDrawColor(
    PDF_COLORS.thinDivider[0],
    PDF_COLORS.thinDivider[1],
    PDF_COLORS.thinDivider[2]
  );
  doc.setLineWidth(0.5);
  doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);

  // Discount Row (if applicable)
  const discountAmt = Number(invoice?.discountAmount) || 0;
  if (discountAmt > 0) {
    calcY += 18.0;
    const discLabel = invoice?.discountPercent
      ? `Discount (${invoice.discountPercent}%):`
      : 'Discount:';
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(PDF_COLORS.received[0], PDF_COLORS.received[1], PDF_COLORS.received[2]);
    doc.text(discLabel, rightX, calcY);
    doc.setFont(fontFamily, 'bold');
    doc.text(`- ${fmtMoney(discountAmt)}`, CONTENT_RIGHT, calcY, { align: 'right' });
    doc.setDrawColor(
      PDF_COLORS.thinDivider[0],
      PDF_COLORS.thinDivider[1],
      PDF_COLORS.thinDivider[2]
    );
    doc.setLineWidth(0.5);
    doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
  }

  // Tax Rows (Taxable Value, CGST, SGST, IGST) - only when GST applies
  const isNoTax =
    invoice?.invoiceType === 'BILL_OF_SUPPLY' ||
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
      doc.text(`${fmtMoney(0)} (0%)`, CONTENT_RIGHT, calcY, { align: 'right' });
      doc.setDrawColor(
        PDF_COLORS.thinDivider[0],
        PDF_COLORS.thinDivider[1],
        PDF_COLORS.thinDivider[2]
      );
      doc.setLineWidth(0.5);
      doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
    } else if (isIgst) {
      if (invoice?.taxableAmount > 0) {
        calcY += 18.0;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
        doc.text('Taxable Value:', rightX, calcY);
        doc.text(fmtMoney(invoice.taxableAmount), CONTENT_RIGHT, calcY, { align: 'right' });
        doc.setDrawColor(
          PDF_COLORS.thinDivider[0],
          PDF_COLORS.thinDivider[1],
          PDF_COLORS.thinDivider[2]
        );
        doc.setLineWidth(0.5);
        doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
      }
      if (invoice?.igst > 0) {
        calcY += 18.0;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
        doc.text('IGST (18%):', rightX, calcY);
        doc.text(fmtMoney(invoice.igst), CONTENT_RIGHT, calcY, { align: 'right' });
        doc.setDrawColor(
          PDF_COLORS.thinDivider[0],
          PDF_COLORS.thinDivider[1],
          PDF_COLORS.thinDivider[2]
        );
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
        doc.text(fmtMoney(invoice.taxableAmount), CONTENT_RIGHT, calcY, { align: 'right' });
        doc.setDrawColor(
          PDF_COLORS.thinDivider[0],
          PDF_COLORS.thinDivider[1],
          PDF_COLORS.thinDivider[2]
        );
        doc.setLineWidth(0.5);
        doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
      }
      if (invoice?.cgst > 0) {
        calcY += 18.0;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
        doc.text('CGST (9%):', rightX, calcY);
        doc.text(fmtMoney(invoice.cgst), CONTENT_RIGHT, calcY, { align: 'right' });
        doc.setDrawColor(
          PDF_COLORS.thinDivider[0],
          PDF_COLORS.thinDivider[1],
          PDF_COLORS.thinDivider[2]
        );
        doc.setLineWidth(0.5);
        doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
      }
      if (invoice?.sgst > 0) {
        calcY += 18.0;
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
        doc.text('SGST (9%):', rightX, calcY);
        doc.text(fmtMoney(invoice.sgst), CONTENT_RIGHT, calcY, { align: 'right' });
        doc.setDrawColor(
          PDF_COLORS.thinDivider[0],
          PDF_COLORS.thinDivider[1],
          PDF_COLORS.thinDivider[2]
        );
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
    doc.text(`${invoice.roundOff > 0 ? '+' : ''}${fmtMoney(invoice.roundOff)}`, CONTENT_RIGHT, calcY, {
      align: 'right',
    });
    doc.setDrawColor(
      PDF_COLORS.thinDivider[0],
      PDF_COLORS.thinDivider[1],
      PDF_COLORS.thinDivider[2]
    );
    doc.setLineWidth(0.5);
    doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);
  }

  // Grand Total Row (12 pt bold, deep navy #1E3A8A)
  calcY += 28.0;
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text('Grand Total:', rightX, calcY);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text(fmtMoney(grandTotal), CONTENT_RIGHT, calcY, { align: 'right' });
  doc.setDrawColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.setLineWidth(0.75);
  doc.line(rightX, calcY + 7.0, CONTENT_RIGHT, calcY + 7.0);

  // Received / Paid Row (8.5 pt bold, #059669)
  calcY += 23.0;
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text('Received / Paid:', rightX, calcY);
  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(PDF_COLORS.received[0], PDF_COLORS.received[1], PDF_COLORS.received[2]);
  doc.text(fmtMoney(paidAmount), CONTENT_RIGHT, calcY, { align: 'right' });
  doc.setDrawColor(
    PDF_COLORS.thinDivider[0],
    PDF_COLORS.thinDivider[1],
    PDF_COLORS.thinDivider[2]
  );
  doc.setLineWidth(0.5);
  doc.line(rightX, calcY + 6.0, CONTENT_RIGHT, calcY + 6.0);

  // Balance Due Row (9 pt bold, #334155, or red if > 0)
  calcY += 22.0;
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  doc.text('Balance Due:', rightX, calcY);
  const dueColor = balanceDue > 0 ? PDF_COLORS.balanceDueRed : PDF_COLORS.bodyText;
  doc.setTextColor(dueColor[0], dueColor[1], dueColor[2]);
  doc.text(fmtMoney(balanceDue), CONTENT_RIGHT, calcY, { align: 'right' });

  // 6. SECTION DIVIDER ABOVE TERMS & SIGNATORY
  const termsDividerY = Math.max(615.0, box3Y + box3H + 14.0, calcY + 18.0);
  doc.setDrawColor(
    PDF_COLORS.thinDivider[0],
    PDF_COLORS.thinDivider[1],
    PDF_COLORS.thinDivider[2]
  );
  doc.setLineWidth(0.75);
  doc.line(CONTENT_LEFT, termsDividerY, CONTENT_RIGHT, termsDividerY);

  // Terms and Conditions (Left, wrapped cleanly so it never collides with Signatory on Right)
  const termsY = termsDividerY + 14.0;
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.text('TERMS AND CONDITIONS:', CONTENT_LEFT, termsY);

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(PDF_COLORS.bodyText[0], PDF_COLORS.bodyText[1], PDF_COLORS.bodyText[2]);
  let curTermY = termsY + 12.0;
  dynamicContent.termsList.forEach((t: string) => {
    const wrappedTerm = doc.splitTextToSize(t, 345.0);
    doc.text(wrappedTerm, CONTENT_LEFT, curTermY, { lineHeightFactor: 1.25 });
    curTermY += wrappedTerm.length * 9.5 + 1.5;
  });

  // Authorized Signatory (Right)
  const sigX = 389.0;
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text(`For: ${business.companyName}`, CONTENT_RIGHT, termsDividerY + 18.0, {
    align: 'right',
  });

  if (signatureBase64) {
    try {
      const sigW = 85.0;
      const sigH = 35.1;
      doc.addImage(
        signatureBase64,
        'JPEG',
        CONTENT_RIGHT - sigW,
        termsDividerY + 26.0,
        sigW,
        sigH
      );
    } catch {}
  }

  const sigLineY = termsDividerY + 67.0;
  doc.setDrawColor(
    PDF_COLORS.sigAccentLine[0],
    PDF_COLORS.sigAccentLine[1],
    PDF_COLORS.sigAccentLine[2]
  );
  doc.setLineWidth(0.75);
  doc.line(sigX, sigLineY, CONTENT_RIGHT, sigLineY);

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.mainText[0], PDF_COLORS.mainText[1], PDF_COLORS.mainText[2]);
  doc.text('Authorized Signatory', CONTENT_RIGHT, sigLineY + 11.0, { align: 'right' });

  // 7. FOOTER DIVIDER AND SINGLE THANK-YOU MESSAGE
  const footerLineY = Math.max(722.0, curTermY + 8.0, sigLineY + 22.0);
  doc.setDrawColor(
    PDF_COLORS.thinDivider[0],
    PDF_COLORS.thinDivider[1],
    PDF_COLORS.thinDivider[2]
  );
  doc.setLineWidth(0.75);
  doc.line(CONTENT_LEFT, footerLineY, CONTENT_RIGHT, footerLineY);

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(
    PDF_COLORS.footerText[0],
    PDF_COLORS.footerText[1],
    PDF_COLORS.footerText[2]
  );
  doc.text(dynamicContent.footerMessage, PAGE_WIDTH / 2, footerLineY + 13.0, {
    align: 'center',
  });

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
  const res = await generateInvoicePdf(
    invoiceData || { invoiceNumber: _invoiceNumber },
    settingsData
  );
  return { doc: res.doc, blob: res.blob, file: res.file, filename: res.filename };
}
