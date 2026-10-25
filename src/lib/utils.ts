import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency as Indian Rupees (e.g., ₹24,000.00)
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format numbers in Indian numbering system without currency symbol (e.g., 24,000)
export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-IN').format(val);
}

// Format dates nicely
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Convert amount to words in Indian Rupees (e.g., "Twenty Nine Thousand Rupees only")
export function numberToWords(num: number): string {
  if (!num || isNaN(num)) return 'Zero Rupees only';
  
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const wholeNumber = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - wholeNumber) * 100);

  function convertHundreds(n: number): string {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
    } else if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  }

  let words = '';
  const crore = Math.floor(wholeNumber / 10000000);
  const lakh = Math.floor((wholeNumber % 10000000) / 100000);
  const thousand = Math.floor((wholeNumber % 100000) / 1000);
  const hundred = wholeNumber % 1000;

  if (crore > 0) words += convertHundreds(crore) + ' Crore ';
  if (lakh > 0) words += convertHundreds(lakh) + ' Lakh ';
  if (thousand > 0) words += convertHundreds(thousand) + ' Thousand ';
  if (hundred > 0) words += convertHundreds(hundred) + ' ';

  words = words.trim();
  if (!words) words = 'Zero';

  let result = words + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertHundreds(paise) + ' Paise';
  }
  return result + ' only';
}

export function getInvoiceTypeTitle(type?: string): string {
  switch (type) {
    case 'BILL_OF_SUPPLY':
      return 'BILL OF SUPPLY';
    case 'NON_GST':
      return 'NON-GST INVOICE';
    case 'PROFORMA':
      return 'PROFORMA INVOICE';
    case 'QUOTATION':
      return 'QUOTATION / ESTIMATE';
    case 'CASH_MEMO':
      return 'CASH MEMO';
    case 'DELIVERY_CHALLAN':
      return 'DELIVERY CHALLAN';
    case 'CREDIT_NOTE':
      return 'CREDIT NOTE';
    case 'DEBIT_NOTE':
      return 'DEBIT NOTE';
    case 'TAX_INVOICE':
    default:
      return 'TAX INVOICE';
  }
}

export function getInvoiceTypeLabel(type?: string): string {
  switch (type) {
    case 'BILL_OF_SUPPLY':
      return 'Bill of Supply';
    case 'NON_GST':
      return 'Invoice';
    case 'PROFORMA':
      return 'Proforma Invoice';
    case 'QUOTATION':
      return 'Quotation / Estimate';
    case 'CASH_MEMO':
      return 'Cash Memo';
    case 'DELIVERY_CHALLAN':
      return 'Delivery Challan';
    case 'CREDIT_NOTE':
      return 'Credit Note';
    case 'DEBIT_NOTE':
      return 'Debit Note';
    case 'TAX_INVOICE':
    default:
      return 'Tax Invoice';
  }
}

export function getInvoiceNumberLabel(type?: string): string {
  switch (type) {
    case 'QUOTATION':
      return 'Quotation No.:';
    case 'PROFORMA':
      return 'Proforma No.:';
    case 'BILL_OF_SUPPLY':
      return 'Bill No.:';
    case 'CASH_MEMO':
      return 'Cash Memo No.:';
    case 'DELIVERY_CHALLAN':
      return 'Challan No.:';
    case 'CREDIT_NOTE':
      return 'Credit Note No.:';
    case 'DEBIT_NOTE':
      return 'Debit Note No.:';
    case 'NON_GST':
    case 'TAX_INVOICE':
    default:
      return 'Invoice No.:';
  }
}

export function getTaxConfigLabel(config?: string): string {
  switch (config) {
    case 'IGST':
      return 'IGST (Inter-State)';
    case 'EXEMPT':
      return 'Exempt / Nil-Rated';
    case 'NONE':
      return 'No GST / Non-Taxable';
    case 'CGST_SGST':
    default:
      return 'CGST + SGST (Intra-State)';
  }
}
