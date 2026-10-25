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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/sales/invoices"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-indigo-600" />
              <span>{getInvoiceTypeLabel(invoiceType)}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {invoiceType === 'QUOTATION'
                ? 'Create formal quotation / estimate • Does not deduct stock or affect ledger'
                : invoiceType === 'BILL_OF_SUPPLY'
                ? 'Bill of Supply • Composition / Nil-rated supply • No GST charged'
                : invoiceType === 'NON_GST'
                ? 'Invoice • Unregistered goods & services • No tax breakdown'
                : 'Official customer invoice • Select serialized laptop • Automatic stock & tax tracking'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lastAutoSaveTime && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl hidden sm:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-saved {lastAutoSaveTime}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowDraftsModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
            title="View Saved Drafts"
          >
            <FileClock className="w-4 h-4 text-amber-600" />
            <span>Drafts</span>
            {savedDrafts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {savedDrafts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleManualSaveDraft}
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
            title="Save Current Half-Filled Bill as Draft"
          >
            <BookmarkCheck className="w-4 h-4 text-amber-700" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleCreateInvoice}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs transition inline-flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Generate {invoiceType === 'QUOTATION' ? 'Quotation' : invoiceType === 'CASH_MEMO' ? 'Cash Memo' : 'Invoice'}</span>
          </button>
        </div>
      </div>

      {/* Resume Pending Draft Banner */}
      {pendingDraftNotice && !createdInvoice && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <FileClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  Half-Filled Bill Found
                </span>
                <span className="text-xs text-amber-800 font-semibold">
                  Last saved{' '}
                  {new Date(pendingDraftNotice.updatedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  at{' '}
                  {new Date(pendingDraftNotice.updatedAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm font-black text-slate-900 mt-1">
                {pendingDraftNotice.customerName || 'Walk-in Customer'} •{' '}
                {pendingDraftNotice.items?.length || 0} item(s) •{' '}
                {formatCurrency(pendingDraftNotice.grandTotal || 0)}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                You were working on a bill previously. Would you like to continue from where you left off?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => handleResumeDraft(pendingDraftNotice)}
              className="flex-1 md:flex-initial px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Continue Where I Left</span>
            </button>
            <button
              type="button"
              onClick={() => {
                deleteLocalDraft(pendingDraftNotice.id);
                setPendingDraftNotice(null);
                setSavedDrafts(getLocalDrafts());
              }}
              className="flex-1 md:flex-initial px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 rounded-xl transition"
            >
              Discard Draft
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Invoice Form Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Document Type & Tax Configuration Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Invoice Type & Tax Configuration</span>
              </div>
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
                <p className="text-[11px] text-slate-400 mt-1">
                  {invoiceType === 'BILL_OF_SUPPLY' || invoiceType === 'NON_GST'
                    ? 'Locked to No GST / Non-Taxable for this invoice type.'
                    : taxConfiguration === 'IGST'
                    ? 'Inter-state transaction (outside Gujarat). 100% tax allocated to IGST.'
                    : taxConfiguration === 'EXEMPT'
                    ? 'Goods or services exempt from GST. Tax calculated as 0%.'
                    : taxConfiguration === 'NONE'
                    ? 'No tax will be applied or printed on this invoice.'
                    : 'Intra-state transaction (within Gujarat). Tax split equally between CGST and SGST.'}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Selection Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Customer (Bill To)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add New Customer</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Select Existing Customer (Search by Name, Mobile, GSTIN, City)
                </label>
                <CustomerSearchSelect
                  selectedCustomer={selectedCustomer || null}
                  onSelectCustomer={handleCustomerSelect}
                  onAddNewCustomer={() => setShowAddCustomerModal(true)}
                />
              </div>

              {selectedCustomer && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[11px]">Phone & Email</span>
                    <strong className="text-slate-800">{selectedCustomer.phone}</strong>
                    <div className="text-slate-500">{selectedCustomer.email || 'No email registered'}</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[11px]">Address & GSTIN</span>
                    <div className="text-slate-800 font-medium truncate">{selectedCustomer.address || 'Ahmedabad, Gujarat'}</div>
                    <div className="text-slate-500 font-mono">{selectedCustomer.gstin || 'Unregistered Consumer'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Invoice Line Items</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {items.length} item{items.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Product Row</span>
                </button>
                <button
                  type="button"
                  onClick={() => addInvoiceOnlyRow()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>+ Invoice Only Item</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenQuickCreate(null, '')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>+ Create Product & Stock</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    it.isInvoiceOnly
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700"># {idx + 1}</span>
                      {it.isInvoiceOnly ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <FileText className="w-3 h-3 text-amber-700" />
                          <span>Invoice Only (No Stock Deduction)</span>
                        </span>
                      ) : it.productId ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Package className="w-3 h-3 text-indigo-600" />
                          <span>Inventory Linked</span>
                        </span>
                      ) : null}
                    </div>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Product Search Autocomplete OR Custom Invoice Only Item Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                    <div className="sm:col-span-8">
                      {it.isInvoiceOnly ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-amber-900 font-bold text-xs">
                              Custom Item Name & Details *
                            </label>
                            <button
                              type="button"
                              onClick={() => handleSwitchToInventory(idx)}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition"
                            >
                              Switch to Inventory Product
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
                            placeholder="e.g. Dell Laptop / Custom Service / Accessories"
                            className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-600"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-slate-600 font-semibold">
                              Select Product / Service (Search Name, Specs, Brand, Model, Serial...)
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddToInvoiceOnly(idx, '')}
                              className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:underline transition"
                            >
                              Switch to Invoice Only
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
                      <label className="block text-purple-700 font-semibold mb-1 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        <span>Serial Number</span>
                      </label>
                      {it.isInvoiceOnly ? (
                        <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium text-xs flex items-center gap-1.5">
                          <ShieldOff className="w-3.5 h-3.5 text-slate-400" />
                          <span>N/A (Invoice Only - No Stock)</span>
                        </div>
                      ) : it.isService ? (
                        <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium text-xs flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-blue-500" />
                          <span>N/A (Service Item)</span>
                        </div>
                      ) : (
                        <select
                          value={it.serialNumber}
                          onChange={(e) => handleItemChange(idx, 'serialNumber', e.target.value)}
                          className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-xl text-purple-900 font-mono font-semibold focus:outline-purple-600"
                        >
                          <option value="">-- Select In-Stock Serial # --</option>
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
                    <label className="block text-slate-600 text-xs font-semibold mb-1">
                      Item Description / Specs for Invoice Print
                    </label>
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="e.g. Dell Latitude 5490 | i5 7th Gen | 8GB DDR4 | 256GB SSD"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs"
                    />
                  </div>

                  {/* Quantity, Rate, Discount & Total */}
                  <div className={`grid grid-cols-2 ${isNoTax || isExempt ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} gap-3 text-xs`}>
                    <div>
                      <label className="block text-slate-500 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">Selling Rate (₹)</label>
                      <input
                        type="number"
                        step="any"
                        value={it.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">Discount (₹)</label>
                      <input
                        type="number"
                        step="any"
                        value={it.discount}
                        onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                      />
                    </div>

                    {!isNoTax && !isExempt && (
                      <div>
                        <label className="block text-slate-500 mb-1">GST %</label>
                        <select
                          value={it.gstPercent}
                          onChange={(e) => handleItemChange(idx, 'gstPercent', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
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
                      <label className="block text-slate-500 mb-1">Line Total</label>
                      <input
                        type="text"
                        readOnly
                        value={formatCurrency(it.total)}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 font-black"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Invoice Metadata & Settlement Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Invoice Summary & Payment
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Overall Discount (%)</label>
                <input
                  type="number"
                  step="any"
                  value={overallDiscountPercent}
                  onChange={(e) => setOverallDiscountPercent(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              {/* Breakdown */}
              <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(rawSubtotal)}</span>
                </div>
                {overallDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({overallDiscountPercent}%):</span>
                    <span>- {formatCurrency(overallDiscountAmount)}</span>
                  </div>
                )}
                {!isNoTax && !isExempt && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Taxable Value:</span>
                      <span>{formatCurrency(taxableTotal)}</span>
                    </div>
                    {isIgst ? (
                      <div className="flex justify-between text-slate-600">
                        <span>IGST (18%):</span>
                        <span>{formatCurrency(igst)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>CGST (9%):</span>
                          <span>{formatCurrency(cgst)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>SGST (9%):</span>
                          <span>{formatCurrency(sgst)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
                {isExempt && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax (Exempt / Nil-Rated):</span>
                    <span className="font-medium">₹0.00 (0%)</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-indigo-700">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Section */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <label className="block text-slate-700 font-bold">Payment Collection</label>

                <div>
                  <label className="block text-slate-500 mb-1">Amount Received (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={`e.g. ${grandTotal} (Full)`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(String(grandTotal))}
                      className="text-indigo-600 hover:underline font-semibold"
                    >
                      Collect Full
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidAmount('0')}
                      className="text-slate-500 hover:underline"
                    >
                      Credit (0)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Card">Card</option>
                    <option value="Credit">Credit / Due</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className={balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                    Balance Outstanding:
                  </span>
                  <span className={balanceDue > 0 ? 'text-rose-600 font-black' : 'text-emerald-700 font-black'}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleCreateInvoice}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-4"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm & Generate {invoiceType === 'QUOTATION' ? 'Quotation' : invoiceType === 'CASH_MEMO' ? 'Cash Memo' : 'Invoice'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add New Customer</h3>
            <form onSubmit={handleQuickAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ronak Jain"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 9825012345"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Ahmedabad, Gujarat"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={newCustGstin}
                  onChange={(e) => setNewCustGstin(e.target.value)}
                  placeholder="e.g. 24AAAPL1234M1Z1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {getInvoiceTypeTitle(createdInvoice.invoiceType)} Created Successfully
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-3">
                {createdInvoice.invoiceNumber}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customer: <span className="font-semibold text-slate-700">{selectedCustomer?.name || 'Client'}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-left">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Invoice Amount:</span>
                <span className="font-black text-slate-900 text-base">₹{createdInvoice.grandTotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Paid:</span>
                <span className="font-bold text-emerald-600">₹{createdInvoice.paidAmount?.toLocaleString('en-IN')}</span>
              </div>
              {createdInvoice.balanceDue > 0 && (
                <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-1">
                  <span className="text-rose-600 font-semibold">Balance Due:</span>
                  <span className="font-black text-rose-600">₹{createdInvoice.balanceDue?.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Actions matching prompt */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsWhatsAppOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2.5 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition"
              >
                <MessageCircle className="w-5 h-5" />
                Share on WhatsApp
              </button>

              <div className="grid grid-cols-3 gap-2">
                <Link
                  href={`/sales/invoices/${createdInvoice.id}`}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  <Eye className="w-4 h-4 text-indigo-600" />
                  View
                </Link>
                <a
                  href={`/api/invoices/${createdInvoice.id}/pdf`}
                  download
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  PDF
                </a>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition shadow-xs"
                >
                  <FileImage className="w-4 h-4 text-indigo-600" />
                  Image
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreatedInvoice(null);
                  router.push('/sales/invoices');
                }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 py-1 transition"
              >
                Done / Back to Invoices
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

