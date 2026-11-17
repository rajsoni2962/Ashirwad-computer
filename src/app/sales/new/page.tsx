'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  Search,
  Package,
  Hash,
  ArrowLeft,
  UserPlus,
  MessageCircle,
  FileText,
  Eye,
  Download,
  Wrench,
  FileClock,
  BookmarkCheck,
  Sparkles,
  FileImage,
  PackagePlus,
  ShieldOff,
  ChevronDown,
} from 'lucide-react';
import { formatCurrency, numberToWords, getInvoiceTypeTitle, getInvoiceTypeLabel, getTaxConfigLabel } from '@/lib/utils';
import Link from 'next/link';
import WhatsAppShareModal from '@/components/invoice/WhatsAppShareModal';
import InvoiceImageModal from '@/components/invoice/InvoiceImageModal';
import CustomerSearchSelect from '@/components/common/CustomerSearchSelect';
import ProductSearchSelect from '@/components/common/ProductSearchSelect';
import InvoiceTypeSelect from '@/components/common/InvoiceTypeSelect';
import QuickCreateProductModal from '@/components/inventory/QuickCreateProductModal';
import {
  InvoiceDraft,
  getLocalDrafts,
  saveLocalDraft,
  getActiveDraft,
  deleteLocalDraft,
  clearActiveDraftId,
} from '@/lib/invoiceDraftManager';
import InvoiceDraftsModal from '@/components/invoice/InvoiceDraftsModal';

export default function NewSalesInvoicePage() {
  const router = useRouter();

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Document Type & Tax Configuration
  const [invoiceType, setInvoiceType] = useState('NON_GST');
  const [taxConfiguration, setTaxConfiguration] = useState('NONE');

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('Professionally refurbished, fully tested, and ready to use. Clean, reliable, and backed by quality service.');
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

  const handleCustomerSelect = (cust: any) => {
    setCustomerId(cust?.id || '');
    if (cust && !customers.some((c) => c.id === cust.id)) {
      setCustomers((prev) => [...prev, cust]);
    }
    // Auto-detect inter-state vs intra-state
    if (invoiceType !== 'BILL_OF_SUPPLY' && invoiceType !== 'NON_GST' && taxConfiguration !== 'NONE' && taxConfiguration !== 'EXEMPT') {
      const stateCode = cust?.stateCode?.trim();
      const stateName = cust?.state?.trim().toLowerCase();
      const isInterstate = (stateCode && stateCode !== '24') || (stateName && stateName !== 'gujarat');
      if (isInterstate) {
        setTaxConfiguration('IGST');
      } else if (taxConfiguration === 'IGST') {
        setTaxConfiguration('CGST_SGST');
      }
    }
  };

  // Items
  const [items, setItems] = useState<any[]>([
    {
      productId: '',
      product: null,
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
  ]);

  // Overall Discount
  const [overallDiscountPercent, setOverallDiscountPercent] = useState('0');

  // Quick Add Customer Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustGstin, setNewCustGstin] = useState('');

  // Post-Save Invoice State
  const [createdInvoice, setCreatedInvoice] = useState<any | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Draft Management State
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<InvoiceDraft[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [pendingDraftNotice, setPendingDraftNotice] = useState<InvoiceDraft | null>(null);
  const [draftToast, setDraftToast] = useState<string | null>(null);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setDraftToast(msg);
    setTimeout(() => setDraftToast(null), 3500);
  };

  const handleResumeDraft = (draft: InvoiceDraft) => {
    setCurrentDraftId(draft.id);
    setInvoiceType(draft.invoiceType || 'TAX_INVOICE');
    setTaxConfiguration(draft.taxConfiguration || 'CGST_SGST');
    setCustomerId(draft.customerId || '');
    setDate(draft.date || new Date().toISOString().split('T')[0]);
    setDueDate(draft.dueDate || '');
    setPaymentMode(draft.paymentMode || 'Cash');
    setPaidAmount(draft.paidAmount !== undefined ? String(draft.paidAmount) : '');
    setPaymentReference(draft.paymentReference || '');
    if (draft.notes !== undefined) setNotes(draft.notes);
    if (draft.terms !== undefined) setTerms(draft.terms);
    if (draft.overallDiscountPercent !== undefined) setOverallDiscountPercent(String(draft.overallDiscountPercent));

    if (Array.isArray(draft.items) && draft.items.length > 0) {
      setItems(draft.items);
    }

    setPendingDraftNotice(null);
    setShowDraftsModal(false);
    showToast(`Resumed draft for ${draft.customerName || 'Customer'}!`);
  };

  const handleManualSaveDraft = () => {
    const selectedCust = customers.find((c) => c.id === customerId);
    const saved = saveLocalDraft({
      id: currentDraftId || undefined,
      invoiceType,
      taxConfiguration,
      customerId,
      customerName: selectedCust?.name || '',
      customerPhone: selectedCust?.phone || '',
      date,
      dueDate,
      paymentMode,
      paidAmount,
      paymentReference,
      notes,
      terms,
      overallDiscountPercent,
      items,
      grandTotal,
    });
    setCurrentDraftId(saved.id);
    setSavedDrafts(getLocalDrafts());
    setPendingDraftNotice(null);
    showToast('Half-filled bill saved to drafts! You can resume anytime.');
  };

  const handleStartFresh = () => {
    if (currentDraftId) {
      deleteLocalDraft(currentDraftId);
      clearActiveDraftId();
      setCurrentDraftId(null);
    }
    setPendingDraftNotice(null);
    setCustomerId('');
    setInvoiceType('TAX_INVOICE');
    setTaxConfiguration('CGST_SGST');
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setPaymentMode('Cash');
    setPaidAmount('');
    setPaymentReference('');
    setOverallDiscountPercent('0');
    setItems([
      {
        productId: '',
        product: null,
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
    ]);
    setSavedDrafts(getLocalDrafts());
    setShowDraftsModal(false);
    showToast('Started fresh bill.');
  };

  useEffect(() => {
    // Load local drafts on mount
    const drafts = getLocalDrafts();
    setSavedDrafts(drafts);

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCustId = urlParams.get('customerId');
      const urlDraftId = urlParams.get('draftId');

      if (urlDraftId) {
        const found = drafts.find((d) => d.id === urlDraftId);
        if (found) {
          handleResumeDraft(found);
        }
      } else if (urlCustId) {
        setCustomerId(urlCustId);
      } else {
        const active = getActiveDraft();
        if (active) {
          const hasData = Boolean(
            active.customerId ||
            (active.items && active.items.some((it) => it.productId || (it.description && it.description.trim() !== '') || it.rate > 0))
          );
          if (hasData) {
            setPendingDraftNotice(active);
          }
        }
      }
    }

    fetch('/api/customers')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCustomers(res.data);
      });
    fetch('/api/products')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setProducts(res.data);
      });
    fetch('/api/settings')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setSettings(res.data);
          setTerms(res.data.terms);
        }
      });
  }, []);

  const round2 = (num: number) => Math.round(num * 100) / 100;

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

    // Filter available serial numbers for physical products
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
    showToast(`Added custom invoice-only row`);
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
    showToast(`Set line #${index + 1} to Invoice-Only: "${name}"`);
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
    showToast(`Switched line #${index + 1} to Inventory product search`);
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
    showToast(`Created & added "${newProd.name}" to stock & invoice!`);
  };

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName,
          phone: newCustPhone,
          address: newCustAddress,
          gstin: newCustGstin,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCustomers([...customers, json.data]);
        setCustomerId(json.data.id);
        setShowAddCustomerModal(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustAddress('');
        setNewCustGstin('');
      } else {
        alert(json.error || 'Failed to create customer');
      }
    } catch (err: any) {
      alert('Error creating customer');
    }
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

  // Auto-save effect: debounced automatically when half-filled data changes
  useEffect(() => {
    if (createdInvoice) return;

    const hasData = Boolean(
      customerId ||
      items.some((it) => it.productId || (it.description && it.description.trim() !== '') || it.rate > 0)
    );

    if (!hasData) return;

    const timer = setTimeout(() => {
      const selectedCust = customers.find((c) => c.id === customerId);
      const saved = saveLocalDraft({
        id: currentDraftId || undefined,
        invoiceType,
        taxConfiguration,
        customerId,
        customerName: selectedCust?.name || '',
        customerPhone: selectedCust?.phone || '',
        date,
        dueDate,
        paymentMode,
        paidAmount,
        paymentReference,
        notes,
        terms,
        overallDiscountPercent,
        items,
        grandTotal,
      });

      if (!currentDraftId) {
        setCurrentDraftId(saved.id);
      }
      setSavedDrafts(getLocalDrafts());
      const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setLastAutoSaveTime(nowStr);
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    customerId,
    invoiceType,
    taxConfiguration,
    date,
    dueDate,
    paymentMode,
    paidAmount,
    paymentReference,
    notes,
    terms,
    overallDiscountPercent,
    items,
    grandTotal,
    currentDraftId,
    customers,
    createdInvoice,
  ]);

  const handleCreateInvoice = async () => {
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
        paymentReference,
        notes,
        terms,
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

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        if (currentDraftId) {
          deleteLocalDraft(currentDraftId);
          clearActiveDraftId();
          setCurrentDraftId(null);
        }
        setSavedDrafts(getLocalDrafts());
        setPendingDraftNotice(null);
        setCreatedInvoice(json.data);
      } else {
        alert(json.error || 'Failed to create invoice');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error creating invoice');
    }
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/sales/invoices"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Back to Invoices"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-slate-700" />
              <span>{getInvoiceTypeLabel(invoiceType)}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {invoiceType === 'QUOTATION'
                ? 'Formal estimate without inventory deduction or ledger entry'
                : invoiceType === 'BILL_OF_SUPPLY'
                ? 'Composition or exempt supply without tax calculation'
                : invoiceType === 'NON_GST'
                ? 'General invoice without tax breakdown'
                : 'Commercial tax invoice with automated stock deduction and tax ledger'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lastAutoSaveTime && (
            <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hidden sm:inline-flex items-center gap-1.5 tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Saved {lastAutoSaveTime}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowDraftsModal(true)}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5"
            title="View Drafts"
          >
            <FileClock className="w-3.5 h-3.5 text-slate-500" />
            <span>Drafts</span>
            {savedDrafts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-white text-[10px] font-bold tabular-nums">
                {savedDrafts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleManualSaveDraft}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5"
            title="Save as Draft"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleCreateInvoice}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition inline-flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Create {invoiceType === 'QUOTATION' ? 'Quotation' : invoiceType === 'CASH_MEMO' ? 'Cash Memo' : 'Invoice'}</span>
          </button>
        </div>
      </div>

      {/* Resume Pending Draft Banner */}
      {pendingDraftNotice && !createdInvoice && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <FileClock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  Draft Restored
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {new Date(pendingDraftNotice.updatedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  {new Date(pendingDraftNotice.updatedAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {pendingDraftNotice.customerName || 'Walk-in Customer'} •{' '}
                {pendingDraftNotice.items?.length || 0} item(s) •{' '}
                <span className="font-mono tabular-nums">{formatCurrency(pendingDraftNotice.grandTotal || 0)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => handleResumeDraft(pendingDraftNotice)}
              className="flex-1 md:flex-initial px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition inline-flex items-center justify-center gap-1.5"
            >
              Resume Draft
            </button>
            <button
              type="button"
              onClick={() => {
                deleteLocalDraft(pendingDraftNotice.id);
                setPendingDraftNotice(null);
                setSavedDrafts(getLocalDrafts());
              }}
              className="flex-1 md:flex-initial px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200 rounded-lg transition"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Invoice Form Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* Document Type & Tax Configuration Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Document & Tax Configuration</span>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {getInvoiceTypeLabel(invoiceType)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Document Type <span className="text-rose-500">*</span>
                </label>
                <InvoiceTypeSelect
                  value={invoiceType}
                  onChange={handleInvoiceTypeChange}
                  showHelperDescription={false}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Tax Treatment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={taxConfiguration}
                  onChange={(e) => setTaxConfiguration(e.target.value)}
                  disabled={invoiceType === 'BILL_OF_SUPPLY' || invoiceType === 'NON_GST'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-400 transition"
                >
                  <option value="CGST_SGST">Intra-State (CGST + SGST)</option>
                  <option value="IGST">Inter-State (IGST)</option>
                  <option value="EXEMPT">Exempt / Nil-Rated</option>
                  <option value="NONE">Non-Taxable / No GST</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {invoiceType === 'BILL_OF_SUPPLY' || invoiceType === 'NON_GST'
                    ? 'Non-taxable for selected document type.'
                    : taxConfiguration === 'IGST'
                    ? 'Inter-state transaction (outside Gujarat). 100% IGST.'
                    : taxConfiguration === 'EXEMPT'
                    ? '0% tax rate applied.'
                    : taxConfiguration === 'NONE'
                    ? 'No tax lines displayed.'
                    : 'Intra-state transaction. Split equally as CGST and SGST.'}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Selection Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Users className="w-4 h-4 text-slate-600" />
                <span>Customer</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Customer</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <CustomerSearchSelect
                  selectedCustomer={selectedCustomer || null}
                  onSelectCustomer={handleCustomerSelect}
                  onAddNewCustomer={() => setShowAddCustomerModal(true)}
                />
              </div>

              {selectedCustomer && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                    <span className="text-slate-500 block text-[11px] font-medium">Contact</span>
                    <strong className="text-slate-900 font-mono tabular-nums">{selectedCustomer.phone}</strong>
                    <div className="text-slate-500">{selectedCustomer.email || 'No email'}</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                    <span className="text-slate-500 block text-[11px] font-medium">Billing Address & GSTIN</span>
                    <div className="text-slate-800 truncate">{selectedCustomer.address || 'Ahmedabad, Gujarat'}</div>
                    <div className="text-slate-500 font-mono tabular-nums">{selectedCustomer.gstin || 'Unregistered'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Package className="w-4 h-4 text-slate-600" />
                <span>Items</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 tabular-nums">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
                <button
                  type="button"
                  onClick={() => addInvoiceOnlyRow()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Custom Item</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenQuickCreate(null, '')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>New Product</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition space-y-3 ${
                    it.isInvoiceOnly
                      ? 'border-slate-300 bg-slate-50/50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500 tabular-nums">#{idx + 1}</span>
                      {it.isInvoiceOnly ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Invoice Only
                        </span>
                      ) : it.productId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Inventory Linked
                        </span>
                      ) : null}
                    </div>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Product Search Autocomplete OR Custom Invoice Only Item Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                    <div className="sm:col-span-8">
                      {it.isInvoiceOnly ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-slate-700 font-medium text-xs">
                              Item Description <span className="text-rose-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleSwitchToInventory(idx)}
                              className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline transition"
                            >
                              Select from Inventory
                            </button>
                          </div>
                          <input
                            type="text"
                            value={it.productName || it.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleItemChange(idx, 'productName', val);
                              if (!it.description || it.description === it.productName) {
                                handleItemChange(idx, 'description', val);
                              }
                            }}
                            placeholder="Item name / Service description"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-slate-700 font-medium">
                              Product / Service
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddToInvoiceOnly(idx, '')}
                              className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline transition"
                            >
                              Switch to Custom Item
                            </button>
                          </div>
                          <ProductSearchSelect
                            selectedProduct={it.product || products.find((p) => p.id === it.productId) || null}
                            onSelectProduct={(p) => handleProductSelect(idx, p)}
                            onAddToInvoiceOnly={(q) => handleAddToInvoiceOnly(idx, q)}
                            onCreateAndAddToStock={(q) => handleOpenQuickCreate(idx, q)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-slate-500" />
                        <span>Serial Number</span>
                      </label>
                      {it.isInvoiceOnly ? (
                        <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 font-medium text-xs flex items-center gap-1.5">
                          <ShieldOff className="w-3.5 h-3.5 text-slate-400" />
                          <span>Not applicable</span>
                        </div>
                      ) : it.isService ? (
                        <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 font-medium text-xs flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-slate-400" />
                          <span>Service item</span>
                        </div>
                      ) : (
                        <select
                          value={it.serialNumber}
                          onChange={(e) => handleItemChange(idx, 'serialNumber', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                        >
                          <option value="">Select Serial #</option>
                          {it.availableSerials?.map((sn: any) => (
                            <option key={sn.id} value={sn.serialNumber}>
                              {sn.serialNumber}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Description Input */}
                  <div>
                    <label className="block text-slate-600 text-xs font-medium mb-1">
                      Specifications / Print Details
                    </label>
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Specifications, warranty terms, or notes"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>

                  {/* Quantity, Rate, Discount & Total */}
                  <div className={`grid grid-cols-2 ${isNoTax || isExempt ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} gap-3 text-xs`}>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        step="any"
                        value={it.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Discount (₹)</label>
                      <input
                        type="number"
                        step="any"
                        value={it.discount}
                        onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                      />
                    </div>

                    {!isNoTax && !isExempt && (
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">GST %</label>
                        <select
                          value={it.gstPercent}
                          onChange={(e) => handleItemChange(idx, 'gstPercent', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                        >
                          <option value="18">18%</option>
                          <option value="12">12%</option>
                          <option value="28">28%</option>
                          <option value="5">5%</option>
                          <option value="0">0%</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Total (₹)</label>
                      <input
                        type="text"
                        readOnly
                        value={formatCurrency(it.total)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-4 space-y-5">
          {/* Invoice Summary & Settlement Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Summary & Payment
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Overall Discount (%)</label>
                <input
                  type="number"
                  step="any"
                  value={overallDiscountPercent}
                  onChange={(e) => setOverallDiscountPercent(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Breakdown */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">{formatCurrency(rawSubtotal)}</span>
                </div>
                {overallDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({overallDiscountPercent}%)</span>
                    <span className="font-mono tabular-nums">- {formatCurrency(overallDiscountAmount)}</span>
                  </div>
                )}
                {!isNoTax && !isExempt && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Taxable Total</span>
                      <span className="font-mono tabular-nums">{formatCurrency(taxableTotal)}</span>
                    </div>
                    {isIgst ? (
                      <div className="flex justify-between text-slate-600">
                        <span>IGST (18%)</span>
                        <span className="font-mono tabular-nums">{formatCurrency(igst)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>CGST (9%)</span>
                          <span className="font-mono tabular-nums">{formatCurrency(cgst)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>SGST (9%)</span>
                          <span className="font-mono tabular-nums">{formatCurrency(sgst)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
                {isExempt && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax (Exempt)</span>
                    <span className="font-mono tabular-nums">₹0.00</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Section */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-semibold">Payment</label>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(String(grandTotal))}
                      className="text-slate-700 hover:text-slate-900 font-medium underline"
                    >
                      Paid in Full
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setPaidAmount('0')}
                      className="text-slate-500 hover:text-slate-700 underline"
                    >
                      Credit (₹0)
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="number"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={`Paid amount (defaults to ${grandTotal})`}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Card">Card</option>
                    <option value="Credit">Credit / Due</option>
                  </select>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                  <span className={balanceDue > 0 ? 'text-rose-600' : 'text-slate-700'}>
                    Balance Due:
                  </span>
                  <span className={`font-mono tabular-nums ${balanceDue > 0 ? 'text-rose-600 font-bold' : 'text-slate-900 font-bold'}`}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleCreateInvoice}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-2 mt-4"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Create {invoiceType === 'QUOTATION' ? 'Quotation' : invoiceType === 'CASH_MEMO' ? 'Cash Memo' : 'Invoice'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Customer</h3>
            <form onSubmit={handleQuickAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Customer Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Business or contact name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Phone Number <span className="text-rose-500">*</span></label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="City, State"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">GSTIN</label>
                <input
                  type="text"
                  value={newCustGstin}
                  onChange={(e) => setNewCustGstin(e.target.value)}
                  placeholder="15-character GSTIN"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-Save Invoice Screen */}
      {createdInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center space-y-5 border border-slate-200">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {getInvoiceTypeTitle(createdInvoice.invoiceType)} Created
              </span>
              <h3 className="text-xl font-bold font-mono text-slate-900 mt-2.5 tabular-nums">
                {createdInvoice.invoiceNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customer: <span className="font-medium text-slate-800">{selectedCustomer?.name || 'Customer'}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-left text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Amount:</span>
                <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">{formatCurrency(createdInvoice.grandTotal || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Paid:</span>
                <span className="font-mono font-medium text-emerald-700 tabular-nums">{formatCurrency(createdInvoice.paidAmount || 0)}</span>
              </div>
              {createdInvoice.balanceDue > 0 && (
                <div className="flex justify-between items-center border-t border-slate-200 pt-1.5">
                  <span className="text-rose-600 font-medium">Balance Due:</span>
                  <span className="font-mono font-bold text-rose-600 tabular-nums">{formatCurrency(createdInvoice.balanceDue || 0)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setIsWhatsAppOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
              >
                <MessageCircle className="w-4 h-4" />
                Share on WhatsApp
              </button>

              <div className="grid grid-cols-3 gap-2">
                <Link
                  href={`/sales/invoices/${createdInvoice.id}`}
                  className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  View
                </Link>
                <a
                  href={`/api/invoices/${createdInvoice.id}/pdf`}
                  download
                  className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  PDF
                </a>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <FileImage className="w-3.5 h-3.5 text-slate-600" />
                  Image
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreatedInvoice(null);
                  router.push('/sales/invoices');
                }}
                className="w-full text-xs text-slate-500 hover:text-slate-800 py-1 transition font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {isWhatsAppOpen && createdInvoice && (
        <WhatsAppShareModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          invoice={{
            ...createdInvoice,
            customer: selectedCustomer,
          }}
        />
      )}

      {/* Invoice Image Export Modal */}
      {isImageModalOpen && createdInvoice && (
        <InvoiceImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          invoice={{
            ...createdInvoice,
            customer: selectedCustomer,
          }}
          settings={settings}
        />
      )}

      {/* Invoice Drafts Modal */}
      <InvoiceDraftsModal
        isOpen={showDraftsModal}
        onClose={() => setShowDraftsModal(false)}
        drafts={savedDrafts}
        activeDraftId={currentDraftId}
        onResume={handleResumeDraft}
        onDelete={(id) => {
          deleteLocalDraft(id);
          if (currentDraftId === id) {
            setCurrentDraftId(null);
          }
          if (pendingDraftNotice?.id === id) {
            setPendingDraftNotice(null);
          }
          setSavedDrafts(getLocalDrafts());
        }}
        onNewBill={handleStartFresh}
      />

      {/* Quick Create Inventory Product Modal */}
      <QuickCreateProductModal
        isOpen={showQuickCreateModal}
        onClose={() => setShowQuickCreateModal(false)}
        initialName={quickCreateQuery}
        onSuccess={handleQuickCreateSuccess}
      />

      {/* Draft Notification Toast */}
      {draftToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{draftToast}</span>
        </div>
      )}
    </div>
  );
}

