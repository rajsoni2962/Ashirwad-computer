'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  UserPlus,
  FileText,
  Save,
  AlertCircle,
  HelpCircle,
  History,
  Package,
  PackagePlus,
  ShieldOff,
  Wrench,
} from 'lucide-react';
import { formatCurrency, numberToWords, getInvoiceTypeTitle, getInvoiceTypeLabel, getTaxConfigLabel } from '@/lib/utils';
import Link from 'next/link';
import CustomerSearchSelect from '@/components/common/CustomerSearchSelect';
import ProductSearchSelect from '@/components/common/ProductSearchSelect';
import InvoiceTypeSelect from '@/components/common/InvoiceTypeSelect';
import QuickCreateProductModal from '@/components/inventory/QuickCreateProductModal';

export default function EditSalesInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [originalInvoice, setOriginalInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Document Type & Tax Configuration
  const [invoiceType, setInvoiceType] = useState('TAX_INVOICE');
  const [taxConfiguration, setTaxConfiguration] = useState('CGST_SGST');

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<any>(null);
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  const isNoTax = invoiceType === 'BILL_OF_SUPPLY' || invoiceType === 'NON_GST' || invoiceType === 'PROFORMA' || invoiceType === 'QUOTATION' || invoiceType === 'CASH_MEMO' || taxConfiguration === 'NONE';
  const isExempt = taxConfiguration === 'EXEMPT';
  const isIgst = taxConfiguration === 'IGST';

  const handleInvoiceTypeChange = (newType: string) => {
    setInvoiceType(newType);
    if (newType === 'BILL_OF_SUPPLY' || newType === 'NON_GST' || newType === 'PROFORMA' || newType === 'QUOTATION' || newType === 'CASH_MEMO') {
      setTaxConfiguration('NONE');
    }
    if (newType === 'CASH_MEMO') {
      setPaymentMode('Cash');
    }
  };

  // Items
  const [items, setItems] = useState<any[]>([]);

  // Overall Discount
  const [overallDiscountPercent, setOverallDiscountPercent] = useState('0');

  // Quick Add Customer Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustGstin, setNewCustGstin] = useState('');

  // Audit / Revision Reason Modal
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState('Price and details updated');

  const round2 = (num: number) => Math.round(num * 100) / 100;

  // Load existing invoice and reference datasets
  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch('/api/customers').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ])
      .then(([invRes, custRes, prodRes, setRes]) => {
        if (custRes.success) setCustomers(custRes.data);
        if (prodRes.success) setProducts(prodRes.data);
        if (setRes.success && setRes.data) setSettings(setRes.data);

        if (invRes.success && invRes.data) {
          const inv = invRes.data;
          setOriginalInvoice(inv);
          setCustomerId(inv.customerId);
          setSelectedCustomerObj(inv.customer);
          setDate(inv.date ? new Date(inv.date).toISOString().split('T')[0] : '');
          setDueDate(inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '');
          setPaymentMode(inv.paymentMode || 'Cash');
          setPaidAmount(inv.paidAmount?.toString() || '0');
          setNotes(inv.notes || '');
          setTerms(inv.terms || '');
          setOverallDiscountPercent(inv.discountPercent?.toString() || '0');
          setInvoiceType(inv.invoiceType || 'TAX_INVOICE');
          setTaxConfiguration(inv.taxConfiguration || 'CGST_SGST');

          // Map items
          const mappedItems = (inv.items || []).map((it: any) => {
            const isInvoiceOnly = Boolean(it.isInvoiceOnly || !it.productId);
            const prod = it.product || {};
            const isService = !isInvoiceOnly && (prod.productType === 'SERVICE' || prod.category?.toLowerCase() === 'service');
            
            // Collect serial numbers including the one currently attached to this invoice
            const available = [...(prod.serialNumbers || [])];
            if (it.serialNumber && !available.some((s: any) => s.serialNumber === it.serialNumber)) {
              available.push({ serialNumber: it.serialNumber, status: 'Sold (Current)' });
            }

            return {
              id: it.id,
              isInvoiceOnly,
              productName: it.productName || prod.name || it.description || '',
              productId: it.productId,
              product: prod,
              isService,
              serialNumber: it.serialNumber || '',
              description: it.description || prod.name || '',
              hsn: it.hsn || (isService ? '9987' : '8471'),
              quantity: it.quantity || 1,
              unit: it.unit || 'Pcs',
              rate: it.rate || 0,
              discount: it.discount || 0,
              gstPercent: it.gstPercent !== undefined ? it.gstPercent : 0,
              taxableAmount: it.taxableAmount || 0,
              gstAmount: it.gstAmount || 0,
              total: it.total || 0,
              availableSerials: available,
            };
          });

          setItems(
            mappedItems.length > 0
              ? mappedItems
              : [
                  {
                    productId: '',
                    product: null,
                    isInvoiceOnly: false,
                    productName: '',
                    isService: false,
                    serialNumber: '',
                    description: '',
                    hsn: '8471',
                    quantity: 1,
                    unit: 'Pcs',
                    rate: 0,
                    discount: 0,
                    gstPercent: 0,
                    taxableAmount: 0,
                    gstAmount: 0,
                    total: 0,
                    availableSerials: [],
                  },
                ]
          );
        }
      })
      .catch((err) => console.error('Error loading invoice for editing:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleProductSelect = (index: number, prod: any) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (!prod) {
      item.productId = '';
      item.product = null;
      item.isInvoiceOnly = false;
      item.productName = '';
      item.isService = false;
      item.description = '';
      item.rate = 0;
      item.serialNumber = '';
      item.availableSerials = [];
      item.taxableAmount = 0;
      item.gstAmount = 0;
      item.total = 0;
      updated[index] = item;
      setItems(updated);
      return;
    }

    const isService = prod.productType === 'SERVICE' || prod.category?.toLowerCase() === 'service';

    item.productId = prod.id;
    item.product = prod;
    item.isInvoiceOnly = false;
    item.productName = prod.name;
    item.isService = isService;
    item.description = prod.name;
    item.hsn = prod.hsn || (isService ? '9987' : '8471');
    item.rate = prod.sellingPrice || 0;
    item.gstPercent = prod.gstPercent !== undefined ? prod.gstPercent : 0;
    item.serialNumber = '';
    item.availableSerials = isService ? [] : (prod.serialNumbers || []);

    const qty = item.quantity || 1;
    const effectiveGst = (isNoTax || isExempt || taxConfiguration === 'NONE') ? 0 : (item.gstPercent || 0);
    const baseAmount = Math.max(0, qty * item.rate - (item.discount || 0));
    let taxable = baseAmount;
    let gstAmt = 0;
    if (!isNoTax && !isExempt && taxConfiguration !== 'NONE' && effectiveGst > 0) {
      taxable = round2(baseAmount / (1 + effectiveGst / 100));
      gstAmt = round2(baseAmount - taxable);
    }

    item.taxableAmount = taxable;
    item.gstAmount = gstAmt;
    item.total = round2(baseAmount);

    updated[index] = item;
    setItems(updated);
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    const it = { ...updated[index], [field]: val };

    const qty = parseFloat(it.quantity) || 1;
    const rate = parseFloat(it.rate) || 0;
    const disc = parseFloat(it.discount) || 0;
    const effectiveGst = (isNoTax || isExempt || taxConfiguration === 'NONE') ? 0 : (parseFloat(it.gstPercent) || 0);

    const baseAmount = Math.max(0, qty * rate - disc);
    let taxable = baseAmount;
    let gstAmt = 0;
    if (!isNoTax && !isExempt && taxConfiguration !== 'NONE' && effectiveGst > 0) {
      taxable = round2(baseAmount / (1 + effectiveGst / 100));
      gstAmt = round2(baseAmount - taxable);
    }

    it.taxableAmount = taxable;
    it.gstAmount = gstAmt;
    it.total = round2(baseAmount);

    updated[index] = it;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        product: null,
        isInvoiceOnly: false,
        productName: '',
        serialNumber: '',
        description: '',
        hsn: '8471',
        quantity: 1,
        unit: 'Pcs',
        rate: 0,
        discount: 0,
        gstPercent: (isNoTax || isExempt || taxConfiguration === 'NONE') ? 0 : 18,
        taxableAmount: 0,
        gstAmount: 0,
        total: 0,
        availableSerials: [],
      },
    ]);
  };

  const addInvoiceOnlyRow = (initialName: string = '') => {
    const name = initialName.trim() || 'Custom Item';
    const effectiveGst = (isNoTax || isExempt || taxConfiguration === 'NONE') ? 0 : 18;
    setItems([
      ...items,
      {
        productId: '',
        product: null,
        isInvoiceOnly: true,
        productName: name,
        description: name,
        isService: false,
        serialNumber: '',
        hsn: '8471',
        quantity: 1,
        unit: 'Pcs',
        rate: 0,
        discount: 0,
        gstPercent: effectiveGst,
        taxableAmount: 0,
        gstAmount: 0,
        total: 0,
        availableSerials: [],
      },
    ]);
  };

  const handleAddToInvoiceOnly = (index: number, queryText: string) => {
    const updated = [...items];
    const item = { ...updated[index] };
    const name = queryText.trim() || 'Custom Item';

    item.productId = '';
    item.product = null;
    item.isInvoiceOnly = true;
    item.productName = name;
    item.description = name;
    item.isService = false;
    item.serialNumber = '';
    item.availableSerials = [];
    item.hsn = '8471';
    item.gstPercent = (isNoTax || isExempt || taxConfiguration === 'NONE') ? 0 : 18;

    const qty = parseFloat(item.quantity) || 1;
    const rate = parseFloat(item.rate) || 0;
    const disc = parseFloat(item.discount) || 0;
    const effectiveGst = (isNoTax || isExempt || taxConfiguration === 'NONE') ? 0 : (parseFloat(item.gstPercent) || 0);

    const baseAmount = Math.max(0, qty * rate - disc);
    let taxable = baseAmount;
    let gstAmt = 0;
    if (!isNoTax && !isExempt && taxConfiguration !== 'NONE' && effectiveGst > 0) {
      taxable = round2(baseAmount / (1 + effectiveGst / 100));
      gstAmt = round2(baseAmount - taxable);
    }

    item.taxableAmount = taxable;
    item.gstAmount = gstAmt;
    item.total = round2(baseAmount);

    updated[index] = item;
    setItems(updated);
  };

  const handleSwitchToInventory = (index: number) => {
    const updated = [...items];
    const item = { ...updated[index] };
    item.isInvoiceOnly = false;
    item.productId = '';
    item.product = null;
    item.productName = '';
    item.description = '';
    item.rate = 0;
    item.serialNumber = '';
    item.availableSerials = [];
    item.taxableAmount = 0;
    item.gstAmount = 0;
    item.total = 0;
    updated[index] = item;
    setItems(updated);
  };

  // Quick Product Create Modal State
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [quickCreateQuery, setQuickCreateQuery] = useState('');
  const [quickCreateTargetIndex, setQuickCreateTargetIndex] = useState<number | null>(null);

  const handleOpenQuickCreate = (index: number | null, queryText: string) => {
    setQuickCreateTargetIndex(index);
    setQuickCreateQuery(queryText);
    setShowQuickCreateModal(true);
  };

  const handleQuickCreateSuccess = (newProd: any) => {
    setProducts((prev) => [newProd, ...prev]);
    if (quickCreateTargetIndex !== null && quickCreateTargetIndex < items.length) {
      handleProductSelect(quickCreateTargetIndex, newProd);
    } else {
      const isService = newProd.productType === 'SERVICE' || newProd.category?.toLowerCase() === 'service';
      const effectiveGst = (isNoTax || isExempt || taxConfiguration === 'NONE') ? 0 : (newProd.gstPercent || 0);
      const rate = newProd.sellingPrice || 0;
      const baseAmount = Math.max(0, 1 * rate);
      let taxable = baseAmount;
      let gstAmt = 0;
      if (!isNoTax && !isExempt && taxConfiguration !== 'NONE' && effectiveGst > 0) {
        taxable = round2(baseAmount / (1 + effectiveGst / 100));
        gstAmt = round2(baseAmount - taxable);
      }

      setItems((prev) => [
        ...prev,
        {
          productId: newProd.id,
          product: newProd,
          isInvoiceOnly: false,
          productName: newProd.name,
          isService,
          serialNumber: '',
          description: newProd.name,
          hsn: newProd.hsn || (isService ? '9987' : '8471'),
          quantity: 1,
          unit: 'Pcs',
          rate,
          discount: 0,
          gstPercent: effectiveGst,
          taxableAmount: taxable,
          gstAmount: gstAmt,
          total: round2(baseAmount),
          availableSerials: newProd.serialNumbers || [],
        },
      ]);
    }
  };

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // Financial Calculations
  const rawSubtotal = round2(items.reduce((acc, it) => acc + (it.total || 0), 0));
  const discPct = parseFloat(overallDiscountPercent) || 0;
  const overallDiscountAmount = round2((rawSubtotal * discPct) / 100);
  const grandTotal = Math.max(0, round2(rawSubtotal - overallDiscountAmount));

  let taxableTotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (!isNoTax && !isExempt) {
    const totalItemTaxable = items.reduce((acc, it) => acc + (it.taxableAmount || 0), 0);
    const totalItemGst = items.reduce((acc, it) => acc + (it.gstAmount || 0), 0);
    const factor = rawSubtotal > 0 ? grandTotal / rawSubtotal : 1;
    taxableTotal = round2(totalItemTaxable * factor);
    const totalGst = round2(totalItemGst * factor);

    if (isIgst) {
      igst = totalGst;
      cgst = 0;
      sgst = 0;
    } else {
      cgst = round2(totalGst / 2);
      sgst = round2(totalGst / 2);
      igst = 0;
    }
  } else if (isExempt) {
    taxableTotal = grandTotal;
  }

  const numericPaid = paidAmount === '' ? grandTotal : parseFloat(paidAmount) || 0;
  const balanceDue = Math.max(0, round2(grandTotal - numericPaid));

  const handleSaveClick = () => {
    if (!customerId) {
      alert('Please select or add a Customer');
      return;
    }

    const invalidItem = items.find((i) => {
      if (i.isInvoiceOnly) {
        return !(i.description?.trim() || i.productName?.trim()) || i.rate <= 0;
      }
      return !i.productId || i.rate <= 0;
    });
    if (invalidItem) {
      alert('Please provide a valid product/item name and selling price (> 0) for all item rows.');
      return;
    }

    // Open mandatory reason modal
    setShowReasonModal(true);
  };

  const handleConfirmSave = async () => {
    if (!revisionReason.trim()) {
      alert('Please provide a reason for editing this invoice.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId,
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        invoiceType,
        taxConfiguration,
        subtotal: rawSubtotal,
        discountPercent: discPct,
        discountAmount: overallDiscountAmount,
        taxableAmount: taxableTotal,
        cgst,
        sgst,
        igst,
        grandTotal,
        paidAmount: numericPaid,
        paymentMode,
        notes,
        terms,
        revisionReason: revisionReason.trim(),
        changedBy: 'admin',
        items: items.map((it) => ({
          productId: it.isInvoiceOnly ? null : (it.productId || null),
          isInvoiceOnly: Boolean(it.isInvoiceOnly || !it.productId),
          productName: it.productName || it.product?.name || it.description || 'Custom Item',
          serialNumber: it.isInvoiceOnly ? null : (it.serialNumber || null),
          description: it.description || it.productName || '',
          hsn: it.hsn,
          quantity: it.quantity,
          unit: it.unit,
          rate: it.rate,
          discount: it.discount,
          gstPercent: (isNoTax || isExempt || taxConfiguration === 'NONE') ? 0 : (parseFloat(it.gstPercent) || 0),
          taxableAmount: (isNoTax || isExempt || taxConfiguration === 'NONE') ? it.total : it.taxableAmount,
          gstAmount: (isNoTax || isExempt || taxConfiguration === 'NONE') ? 0 : it.gstAmount,
          total: it.total,
        })),
      };

      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setShowReasonModal(false);
        router.push(`/sales/invoices/${id}`);
      } else {
        alert(json.error || 'Failed to update invoice');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading Invoice for Editing...</p>
      </div>
    );
  }

  if (!originalInvoice) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-800">Invoice Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">Cannot find invoice with ID: {id}</p>
        <Link href="/sales/invoices" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Back to All Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/sales/invoices/${id}`}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Edit Invoice {originalInvoice.invoiceNumber}</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Current: v{originalInvoice.revisionNumber || 1}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify permitted customer details, item rates, discounts, or terms. All modifications are permanently recorded in the audit trail.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/sales/invoices/${id}`}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </Link>
          <button
            onClick={handleSaveClick}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save & Record Revision</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Customer & Line Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Document Type & Tax Configuration Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Invoice Type & Tax Configuration</span>
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {getInvoiceTypeLabel(invoiceType)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Invoice Document Type <span className="text-rose-500">*</span>
                </label>
                <InvoiceTypeSelect
                  value={invoiceType}
                  onChange={handleInvoiceTypeChange}
                  showHelperDescription={true}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tax Configuration <span className="text-rose-500">*</span>
                </label>
                <select
                  value={taxConfiguration}
                  onChange={(e) => setTaxConfiguration(e.target.value)}
                  disabled={invoiceType === 'BILL_OF_SUPPLY' || invoiceType === 'NON_GST'}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition shadow-2xs"
                >
                  <option value="CGST_SGST">CGST + SGST (Intra-State: 50% CGST / 50% SGST)</option>
                  <option value="IGST">IGST (Inter-State: Integrated GST)</option>
                  <option value="EXEMPT">Exempt / Nil-Rated (0% GST)</option>
                  <option value="NONE">No GST / Non-Taxable</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Selection Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Customer (Bill To)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New Customer</span>
              </button>
            </div>

            <CustomerSearchSelect
              selectedCustomer={selectedCustomerObj || customers.find((c) => c.id === customerId) || null}
              onSelectCustomer={(cust) => {
                setCustomerId(cust?.id || '');
                setSelectedCustomerObj(cust);
              }}
              onAddNewCustomer={() => setShowAddCustomerModal(true)}
            />

            {/* Display Selected Customer Snapshot */}
            {selectedCustomerObj && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer Name</span>
                  <span className="font-semibold text-slate-800">{selectedCustomerObj.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone Number</span>
                  <span className="font-medium text-slate-700">{selectedCustomerObj.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">GSTIN</span>
                  <span className="font-mono text-slate-700">{selectedCustomerObj.gstin || 'Unregistered'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">State</span>
                  <span className="font-medium text-slate-700">{selectedCustomerObj.state || 'Gujarat (24)'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Line Items Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Line Items</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {items.length} item{items.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Product Row</span>
                </button>
                <button
                  type="button"
                  onClick={() => addInvoiceOnlyRow()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>+ Invoice Only Item</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenQuickCreate(null, '')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>+ Create Product & Stock</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition space-y-3 relative group ${
                    item.isInvoiceOnly
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-500">ITEM #{index + 1}</span>
                      {item.isInvoiceOnly ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <FileText className="w-3 h-3 text-amber-700" />
                          <span>Invoice Only (No Stock Deduction)</span>
                        </span>
                      ) : item.productId ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Package className="w-3 h-3 text-indigo-600" />
                          <span>Inventory Linked</span>
                        </span>
                      ) : null}
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Product Search Selector OR Custom Invoice Only Name */}
                  <div>
                    {item.isInvoiceOnly ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                            Custom Item Name & Details *
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSwitchToInventory(index)}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition"
                          >
                            Switch to Inventory Product
                          </button>
                        </div>
                        <input
                          type="text"
                          value={item.productName || item.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleItemChange(index, 'productName', val);
                            if (!item.description || item.description === item.productName) {
                              handleItemChange(index, 'description', val);
                            }
                          }}
                          placeholder="e.g. Dell Laptop / Custom Service / Accessories"
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            Search Product / Service
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddToInvoiceOnly(index, '')}
                            className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:underline transition"
                          >
                            Switch to Invoice Only
                          </button>
                        </div>
                        <ProductSearchSelect
                          selectedProduct={item.product || products.find((p) => p.id === item.productId) || null}
                          onSelectProduct={(prod) => handleProductSelect(index, prod)}
                          onAddToInvoiceOnly={(q) => handleAddToInvoiceOnly(index, q)}
                          onCreateAndAddToStock={(q) => handleOpenQuickCreate(index, q)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Description & Serial Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Invoice Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item description on invoice..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {item.isInvoiceOnly ? 'Unit Tracking' : item.isService ? 'Unit Type' : 'Unit Serial Number'}
                      </label>
                      {item.isInvoiceOnly ? (
                        <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 font-medium flex items-center gap-1.5">
                          <ShieldOff className="w-3.5 h-3.5 text-slate-400" />
                          <span>N/A (Invoice Only — No Stock)</span>
                        </div>
                      ) : item.isService ? (
                        <input
                          type="text"
                          disabled
                          value="N/A (Service Item — No Physical Stock)"
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed"
                        />
                      ) : item.availableSerials && item.availableSerials.length > 0 ? (
                        <select
                          value={item.serialNumber}
                          onChange={(e) => handleItemChange(index, 'serialNumber', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-indigo-600"
                        >
                          <option value="">-- Choose In-Stock Serial # --</option>
                          {item.availableSerials.map((s: any) => (
                            <option key={s.serialNumber || s} value={s.serialNumber || s}>
                              {s.serialNumber || s} {s.status ? `(${s.status})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={item.serialNumber}
                          onChange={(e) => handleItemChange(index, 'serialNumber', e.target.value)}
                          placeholder="Manual Serial Number (Optional)"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-indigo-600"
                        />
                      )}
                    </div>
                  </div>

                  {/* Qty, Rate, Discount, GST %, Line Total */}
                  <div className={`grid grid-cols-2 ${isNoTax || isExempt ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} gap-2.5 pt-1`}>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Rate (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Discount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-600"
                      />
                    </div>

                    {!isNoTax && !isExempt && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          GST %
                        </label>
                        <select
                          value={item.gstPercent}
                          onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-600"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                    )}

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Total (₹)
                      </label>
                      <div className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-black text-indigo-700">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Dates, Financials, Payment & Notes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Invoice Dates Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Invoice Dates
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Pricing & GST Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Totals & Tax Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-800">{formatCurrency(rawSubtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 pt-1">
                <span className="text-[11px]">Extra Discount (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overallDiscountPercent}
                  onChange={(e) => setOverallDiscountPercent(e.target.value)}
                  className="w-20 px-2 py-1 text-right bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-indigo-600"
                />
              </div>

              {overallDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 text-[11px]">
                  <span>Discount Amount:</span>
                  <span className="font-bold">- {formatCurrency(overallDiscountAmount)}</span>
                </div>
              )}

              {!isNoTax && !isExempt && (
                <>
                  <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                    <span>Taxable Value:</span>
                    <span>{formatCurrency(taxableTotal)}</span>
                  </div>

                  {isIgst ? (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>IGST (18%):</span>
                      <span>{formatCurrency(igst)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>CGST (9%):</span>
                        <span>{formatCurrency(cgst)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>SGST (9%):</span>
                        <span>{formatCurrency(sgst)}</span>
                      </div>
                    </>
                  )}
                </>
              )}

              {isExempt && (
                <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                  <span>Tax (Exempt / Nil-Rated):</span>
                  <span>₹0.00 (0%)</span>
                </div>
              )}

              <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline">
                <span className="font-black text-slate-900 text-sm">Grand Total:</span>
                <span className="font-black text-indigo-700 text-base">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment & Dues Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Payment Settlement
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-600"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit">Credit (Pay Later)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Amount Received / Paid (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-indigo-600"
                />
              </div>

              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-600 font-medium">Balance Due:</span>
                <span className={`font-black ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Notes & Terms
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Invoice Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Reason Modal (Mandatory on Save) */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Record Revision Reason
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explain why this invoice is being updated for audit compliance.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Change Reason <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder="e.g. Corrected selling price, updated customer phone..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-600"
                />
              </div>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Customer details corrected',
                  'Selling price updated',
                  'Discount adjustment',
                  'Line items modified',
                  'Payment settlement corrected',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setRevisionReason(sug)}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReasonModal(false)}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving || !revisionReason.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm & Save Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Inventory Product Modal */}
      <QuickCreateProductModal
        isOpen={showQuickCreateModal}
        onClose={() => setShowQuickCreateModal(false)}
        initialName={quickCreateQuery}
        onSuccess={handleQuickCreateSuccess}
      />
    </div>
  );
}
