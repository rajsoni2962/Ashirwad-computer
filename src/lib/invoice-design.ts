/**
 * 100% Customizable Graphic Invoice Design & Layout Engine
 * Provides complete control over branding, palette, typography, positioning,
 * and column visibility for on-screen invoice preview and PDF rendering.
 */

export interface InvoiceDesignConfig {
  // 1. Template & Layout Style
  layoutStyle: 'modern' | 'classic' | 'tech' | 'compact' | 'minimal';
  paperSize: 'a4' | 'letter';
  pageMargin: 'compact' | 'normal' | 'spacious';

  // 2. Color Palette & Branding
  primaryColor: string; // Brand accent: e.g. #4f46e5
  headerBgStyle: 'solid-accent' | 'soft-tint' | 'minimal-white' | 'dark-slate';
  tableHeaderStyle: 'filled' | 'tinted' | 'bordered' | 'minimal';
  borderRadius: 'none' | 'small' | 'medium' | 'rounded';

  // 3. Typography
  fontFamily: 'Inter' | 'Outfit' | 'Roboto' | 'JetBrains Mono' | 'Georgia';
  fontSizeScale: 'compact' | 'normal' | 'large';

  // 4. Header & Logo Placement
  logoPosition: 'left' | 'center' | 'right' | 'hidden';
  logoSize: number; // width in px (60 - 240)
  companyDetailsAlign: 'left' | 'center' | 'right';
  showTagline: boolean;
  showGstinBadge: boolean;
  showContactInfo: boolean;

  // 5. Structure & Block Positions
  swapCustomerMetaPosition: boolean; // false: Customer Left / Invoice Info Right; true: swapped!
  customerCardTitle: string; // "Billed To"
  invoiceMetaTitle: string; // "Invoice Details"

  // 6. Item Table Columns
  showSerialColumn: boolean; // S.No
  showHsnColumn: boolean; // HSN/SAC
  showWarrantyColumn: boolean; // Warranty
  showUnitColumn: boolean; // Unit
  showDiscountColumn: boolean; // Discount
  showTaxBreakdown: boolean; // Detailed CGST/SGST vs Unified GST
  zebraStripes: boolean; // Alternating table row shading

  // 7. Footer, Payment & Signatory Blocks
  bankDetailsPosition: 'left' | 'full' | 'hidden';
  showUpiQrCode: boolean;
  qrCodeSize: number; // 60 - 120
  termsPosition: 'left' | 'full' | 'hidden';
  signatoryPosition: 'right' | 'center' | 'left';
  signatoryTitle: string; // "Authorized Signatory"
  showSignatureImage: boolean;
  signatureHeight: number; // 30 - 80 px
  footerText: string;
}

export const DEFAULT_INVOICE_DESIGN: InvoiceDesignConfig = {
  layoutStyle: 'modern',
  paperSize: 'a4',
  pageMargin: 'normal',

  primaryColor: '#4f46e5', // Ashirwad Indigo
  headerBgStyle: 'soft-tint',
  tableHeaderStyle: 'tinted',
  borderRadius: 'medium',

  fontFamily: 'Inter',
  fontSizeScale: 'normal',

  logoPosition: 'left',
  logoSize: 98,
  companyDetailsAlign: 'left',
  showTagline: true,
  showGstinBadge: false,
  showContactInfo: true,

  swapCustomerMetaPosition: false,
  customerCardTitle: 'BILLED TO',
  invoiceMetaTitle: 'INVOICE DETAILS',

  showSerialColumn: true,
  showHsnColumn: true,
  showWarrantyColumn: true,
  showUnitColumn: true,
  showDiscountColumn: false,
  showTaxBreakdown: true,
  zebraStripes: false,

  bankDetailsPosition: 'left',
  showUpiQrCode: true,
  qrCodeSize: 65,
  termsPosition: 'full',
  signatoryPosition: 'right',
  signatoryTitle: 'Authorized Signatory',
  showSignatureImage: true,
  signatureHeight: 38,
  footerText: "Thank you for choosing us—we're always here to help if you need support.",
};

export const COLOR_PRESETS = [
  { name: 'Ashirwad Indigo', primary: '#4f46e5', label: 'Indigo' },
  { name: 'Royal Blue', primary: '#2563eb', label: 'Blue' },
  { name: 'Emerald Tech', primary: '#059669', label: 'Emerald' },
  { name: 'Crimson Bold', primary: '#dc2626', label: 'Crimson' },
  { name: 'Dark Slate', primary: '#0f172a', label: 'Slate' },
  { name: 'Amber Gold', primary: '#d97706', label: 'Amber' },
  { name: 'Violet Premium', primary: '#7c3aed', label: 'Violet' },
];

export const DESIGN_PRESETS: Record<string, Partial<InvoiceDesignConfig>> = {
  modern: {
    layoutStyle: 'modern',
    primaryColor: '#4f46e5',
    headerBgStyle: 'soft-tint',
    tableHeaderStyle: 'tinted',
    borderRadius: 'medium',
    fontFamily: 'Inter',
    logoPosition: 'left',
    logoSize: 98,
    qrCodeSize: 65,
    swapCustomerMetaPosition: false,
    showUpiQrCode: true,
    bankDetailsPosition: 'left',
    termsPosition: 'full',
    signatoryPosition: 'right',
  },
  classic: {
    layoutStyle: 'classic',
    primaryColor: '#2563eb',
    headerBgStyle: 'soft-tint',
    tableHeaderStyle: 'tinted',
    borderRadius: 'medium',
    fontFamily: 'Inter',
    logoPosition: 'left',
    logoSize: 98,
    qrCodeSize: 65,
    swapCustomerMetaPosition: false,
    showUpiQrCode: true,
    bankDetailsPosition: 'left',
    termsPosition: 'full',
    signatoryPosition: 'right',
  },
  tech: {
    layoutStyle: 'tech',
    primaryColor: '#059669',
    headerBgStyle: 'soft-tint',
    tableHeaderStyle: 'tinted',
    borderRadius: 'medium',
    fontFamily: 'Inter',
    logoPosition: 'left',
    logoSize: 98,
    qrCodeSize: 65,
    swapCustomerMetaPosition: false,
    showUpiQrCode: true,
    bankDetailsPosition: 'left',
    termsPosition: 'full',
    signatoryPosition: 'right',
  },
  compact: {
    layoutStyle: 'compact',
    pageMargin: 'normal',
    fontSizeScale: 'normal',
    primaryColor: '#0f172a',
    headerBgStyle: 'soft-tint',
    tableHeaderStyle: 'tinted',
    borderRadius: 'medium',
    fontFamily: 'Inter',
    logoPosition: 'left',
    logoSize: 98,
    qrCodeSize: 65,
    swapCustomerMetaPosition: false,
    showUpiQrCode: true,
    bankDetailsPosition: 'left',
    termsPosition: 'full',
    signatoryPosition: 'right',
  },
};

/**
 * Parses and returns a safe, validated InvoiceDesignConfig merging defaults.
 */
export function getInvoiceDesign(rawConfig?: string | null | object): InvoiceDesignConfig {
  if (!rawConfig) return { ...DEFAULT_INVOICE_DESIGN };

  let parsed: any = {};
  if (typeof rawConfig === 'string') {
    try {
      parsed = JSON.parse(rawConfig);
    } catch {
      parsed = {};
    }
  } else if (typeof rawConfig === 'object') {
    parsed = rawConfig;
  }

  return {
    ...DEFAULT_INVOICE_DESIGN,
    ...parsed,
  };
}
