export interface CompanySettings {
  id: string;
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin?: string | null;
  state: string;
  stateCode: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  purchasePrefix: string;
  nextPurchaseNumber: number;
  logoUrl: string;
  signatureUrl: string;
  terms: string;
  footer: string;
  authorizedSignatory: string;
}

export interface CustomerType {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  state?: string | null;
  stateCode?: string | null;
  openingBalance: number;
  currentBalance: number;
  notes?: string | null;
  createdAt: string | Date;
}

export interface SupplierType {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  state?: string | null;
  stateCode?: string | null;
  openingBalance: number;
  currentBalance: number;
  notes?: string | null;
  createdAt: string | Date;
}

export interface ProductType {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  category: string;
  cpu?: string | null;
  generation?: string | null;
  ram?: string | null;
  ramType?: string | null;
  storage?: string | null;
  storageType?: string | null;
  gpu?: string | null;
  displaySize?: string | null;
  condition?: string | null;
  hsn?: string | null;
  gstPercent: number;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  currentStock: number;
  warranty?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  serialNumbers?: SerialNumberType[];
}

export interface SerialNumberType {
  id: string;
  serialNumber: string;
  productId: string;
  product?: ProductType;
  supplierId?: string | null;
  purchasePrice?: number | null;
  purchaseDate?: string | Date | null;
  sellingPrice?: number | null;
  customerId?: string | null;
  customer?: CustomerType | null;
  salesInvoiceId?: string | null;
  saleDate?: string | Date | null;
  warrantyStart?: string | Date | null;
  warrantyEnd?: string | Date | null;
  status: 'In Stock' | 'Sold' | 'Reserved' | 'Under Repair' | 'Returned' | 'Warranty Claim';
  notes?: string | null;
}

export interface InvoiceItemType {
  id?: string;
  productId: string;
  productName?: string;
  serialNumber?: string;
  description?: string;
  hsn?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  gstPercent: number;
  taxableAmount: number;
  gstAmount: number;
  total: number;
}

export interface InvoiceType {
  id: string;
  invoiceNumber: string;
  date: string | Date;
  dueDate?: string | Date | null;
  customerId: string;
  customer?: CustomerType;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentMode: string;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
  notes?: string | null;
  terms?: string | null;
  status: 'Confirmed' | 'Cancelled';
  createdAt: string | Date;
  items: InvoiceItemType[];
}

export interface PurchaseItemType {
  id?: string;
  productId: string;
  productName?: string;
  serialNumbers?: string;
  description?: string;
  hsn?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  gstPercent: number;
  taxableAmount: number;
  gstAmount: number;
  total: number;
}

export interface PurchaseType {
  id: string;
  purchaseNumber: string;
  supplierInvoiceNumber: string;
  date: string | Date;
  dueDate?: string | Date | null;
  supplierId: string;
  supplier?: SupplierType;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  billFileUrl?: string | null;
  ocrRawData?: string | null;
  notes?: string | null;
  status: 'Confirmed' | 'Cancelled';
  createdAt: string | Date;
  items: PurchaseItemType[];
}

export interface PaymentType {
  id: string;
  paymentNumber: string;
  date: string | Date;
  type: 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT';
  customerId?: string | null;
  customer?: CustomerType | null;
  supplierId?: string | null;
  supplier?: SupplierType | null;
  invoiceId?: string | null;
  purchaseId?: string | null;
  amount: number;
  paymentMode: string;
  referenceNumber?: string | null;
  notes?: string | null;
  createdAt: string | Date;
}

export interface StockMovementType {
  id: string;
  productId: string;
  product?: ProductType;
  date: string | Date;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN_CUSTOMER' | 'RETURN_SUPPLIER';
  referenceType?: string | null;
  referenceId?: string | null;
  referenceNumber?: string | null;
  quantityChange: number;
  balanceAfter: number;
  unitPrice?: number | null;
  notes?: string | null;
  createdAt: string | Date;
}

export interface ExpenseType {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string | Date;
  paymentMethod: string;
  attachmentUrl?: string | null;
  notes?: string | null;
  createdAt: string | Date;
}
