'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sparkles,
  ArrowLeft,
  Truck,
  PackageCheck,
  Calculator,
  ShieldAlert,
  Settings,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Building,
  CreditCard,
  Layers,
  FileCheck,
  RefreshCw,
  Key,
  ExternalLink,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AIBillVisionResult, ExtractedItem } from '@/lib/vision/types';

export default function ImportSupplierBillPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const addMoreFilesInputRef = useRef<HTMLInputElement>(null);

  // Uploaded Files State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Scanning & Vision State
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [scanResult, setScanResult] = useState<AIBillVisionResult | null>(null);
  const [selectedBbox, setSelectedBbox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'payment' | 'terms' | 'raw'>('items');

  // Available existing suppliers and products from DB for matching
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Config / Modal State
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [activeItemForNewProduct, setActiveItemForNewProduct] = useState<number | null>(null);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    brand: '',
    model: '',
    category: 'Laptop',
    purchasePrice: 0,
    sellingPrice: 0,
    hsn: '8471',
    minStock: 1,
    currentStock: 0,
  });

  // Config Form
  const [apiConfig, setApiConfig] = useState({
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    hasGeminiKey: false,
    maskedGeminiKey: '',
    hasOpenAiKey: false,
    maskedOpenAiKey: '',
    geminiApiKeyInput: '',
    openaiApiKeyInput: '',
    hasAnyKey: false,
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // Extracted Bill Form State (Editable by user)
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierLegalName, setSupplierLegalName] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Customer details on bill
  const [customerName, setCustomerName] = useState('Ashirwad Tech');
  const [customerGstin, setCustomerGstin] = useState('');

  // Items
  const [items, setItems] = useState<any[]>([]);

  // Financials & Totals
  const [taxableAmount, setTaxableAmount] = useState<number>(0);
  const [cgst, setCgst] = useState<number>(0);
  const [sgst, setSgst] = useState<number>(0);
  const [igst, setIgst] = useState<number>(0);
  const [roundOff, setRoundOff] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);

  // Payment Details
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  // Image preview zoom & rotation
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Load suppliers, products, and vision config on mount
  useEffect(() => {
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSuppliers(res.data);
      });
    fetch('/api/products')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setProducts(res.data);
      });
    fetchConfig();
  }, []);

  const fetchConfig = () => {
    fetch('/api/vision/config')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setApiConfig((prev) => ({
            ...prev,
            provider: res.data.provider || 'gemini',
            model: res.data.model || 'gemini-2.5-flash',
            hasGeminiKey: res.data.hasGeminiKey,
            maskedGeminiKey: res.data.maskedGeminiKey,
            hasOpenAiKey: res.data.hasOpenAiKey,
            maskedOpenAiKey: res.data.maskedOpenAiKey,
            hasAnyKey: res.data.hasAnyKey,
          }));
        }
      });
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/vision/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey: apiConfig.geminiApiKeyInput || undefined,
          openaiApiKey: apiConfig.openaiApiKeyInput || undefined,
          visionProvider: apiConfig.provider,
          visionModel: apiConfig.model,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Vision AI settings saved successfully!');
        setConfigModalOpen(false);
        fetchConfig();
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      alert('Error saving configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  // Handle files selection (single or multiple)
  const handleFilesSelected = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const newFiles = Array.from(filesList);
    const combinedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(combinedFiles);

    // Generate previews
    const previews = combinedFiles.map((f) => URL.createObjectURL(f));
    setFilePreviews(previews);
    setActivePageIndex(0);

    // Trigger multimodal vision scan
    runVisionAnalysis(combinedFiles);
  };

  const runVisionAnalysis = async (filesToAnalyze: File[]) => {
    if (filesToAnalyze.length === 0) return;

    setScanning(true);
    setScanResult(null);
    setSelectedBbox(null);
    setScanStep('Sending original document image to Multimodal AI Vision...');

    try {
      const formData = new FormData();
      for (const f of filesToAnalyze) {
        formData.append('files', f);
      }

      setScanStep('Multimodal Vision model inspecting visual structure, tables & GST regions...');

      const res = await fetch('/api/vision/analyze', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to analyze bill document');
      }

      setScanStep('Auditing line item math, duplicate detection & catalog matching...');
      const data: AIBillVisionResult = json.data;
      setScanResult(data);

      // Populate Editable State
      setSupplierName(data.supplier.business_name?.value || 'Supplier');
      setSupplierLegalName(data.supplier.legal_name?.value || '');
      setSupplierGstin(data.supplier.gstin?.value || '');
      setSupplierAddress(data.supplier.address?.value || '');
      setSupplierPhone(data.supplier.phone?.value || '');
      setSupplierInvoiceNumber(data.invoice.invoice_number?.value || `INV-${Date.now().toString().slice(-4)}`);
      setInvoiceDate(data.invoice.invoice_date?.value || new Date().toISOString().split('T')[0]);
      setDueDate(data.invoice.due_date?.value || '');
      setPlaceOfSupply(data.invoice.place_of_supply?.value || '');
      setPoNumber(data.invoice.purchase_order_number?.value || '');

      setCustomerName(data.customer.customer_name?.value || 'Ashirwad Tech');
      setCustomerGstin(data.customer.gstin?.value || '');

      if (data.matchedSupplier) {
        setSupplierId(data.matchedSupplier.id);
      } else {
        setSupplierId('');
      }

      // Populate items
      const mappedItems = (data.items || []).map((it) => ({
        id: it.id || Math.random().toString(),
        productId: it.matchedProduct?.id || products[0]?.id || '',
        name: it.item_name?.value || it.full_description?.value,
        full_description: it.full_description?.value || it.item_name?.value,
        hsn: it.hsn_sac?.value || '8471',
        quantity: it.quantity?.value || 1,
        unit: it.unit?.value || 'Pcs',
        rate: it.rate?.value || 0,
        discount: it.discount?.value || 0,
        gstPercent: it.gst_rate?.value || 18,
        taxableAmount: it.taxable_amount?.value || 0,
        cgst: it.cgst?.value || 0,
        sgst: it.sgst?.value || 0,
        igst: it.igst?.value || 0,
        total: it.line_total?.value || 0,
        confidence: it.line_total?.confidence || 0.95,
        bbox: it.bbox,
        isMatched: it.isMatched,
        matchedProduct: it.matchedProduct,
        serialNumbers: '',
      }));

      setItems(mappedItems.length > 0 ? mappedItems : [defaultItem()]);

      // Financials
      setTaxableAmount(data.totals.taxable_amount?.value || 0);
      setCgst(data.totals.cgst_total?.value || 0);
      setSgst(data.totals.sgst_total?.value || 0);
      setIgst(data.totals.igst_total?.value || 0);
      setRoundOff(data.totals.round_off?.value || 0);
      setGrandTotal(data.totals.grand_total?.value || 0);

      // Payment details
      setPaidAmount(data.totals.amount_paid?.value?.toString() || '0');
      setPaymentMode(data.paymentAndBank.payment_mode?.value || 'UPI');
      setPaymentReference(data.paymentAndBank.transaction_reference?.value || '');
      setBankName(data.paymentAndBank.bank_name?.value || '');
      setAccountNumber(data.paymentAndBank.account_number?.value || '');
      setIfscCode(data.paymentAndBank.ifsc_code?.value || '');
      setUpiId(data.paymentAndBank.upi_id?.value || '');

      if (data.terms && data.terms.length > 0) {
        setNotes(`Extracted Terms:\n${data.terms.join('\n')}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Vision model failed. Please check your API key configuration.');
      if (!apiConfig.hasAnyKey) {
        setConfigModalOpen(true);
      }
    } finally {
      setScanning(false);
      setScanStep('');
    }
  };

  const defaultItem = () => ({
    id: Math.random().toString(),
    productId: products[0]?.id || '',
    name: 'Hardware Purchase Item',
    full_description: 'Dell / Hardware Purchase Item',
    hsn: '8471',
    quantity: 1,
    unit: 'Pcs',
    rate: 18500,
    discount: 0,
    gstPercent: 18,
    taxableAmount: 15677.97,
    cgst: 1411.01,
    sgst: 1411.01,
    igst: 0,
    total: 18500,
    confidence: 1.0,
    isMatched: false,
    matchedProduct: null,
    serialNumbers: '',
  });

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    const it = { ...updated[index], [field]: val };

    if (field === 'productId') {
      const selectedP = products.find((p) => p.id === val);
      if (selectedP) {
        it.matchedProduct = selectedP;
        it.isMatched = true;
        if (!it.rate || it.rate === 0) {
          it.rate = selectedP.purchasePrice || selectedP.sellingPrice * 0.78;
        }
      }
    }

    const qty = parseFloat(it.quantity) || 1;
    const rate = parseFloat(it.rate) || 0;
    const disc = parseFloat(it.discount) || 0;
    const gstPct = parseFloat(it.gstPercent) || 18;

    const baseAmount = Math.max(0, qty * rate - disc);
    const taxable = round2(baseAmount / (1 + gstPct / 100));
    const gstAmt = round2(baseAmount - taxable);

    it.taxableAmount = taxable;
    it.cgst = round2(gstAmt / 2);
    it.sgst = round2(gstAmt / 2);
    it.total = round2(baseAmount);

    updated[index] = it;
    setItems(updated);
    recalculateTotals(updated);
  };

  const recalculateTotals = (currentItems: any[]) => {
    const calculatedTaxable = round2(currentItems.reduce((s, it) => s + (it.taxableAmount || 0), 0));
    const calculatedCgst = round2(currentItems.reduce((s, it) => s + (it.cgst || 0), 0));
    const calculatedSgst = round2(currentItems.reduce((s, it) => s + (it.sgst || 0), 0));
    const calculatedTotal = round2(currentItems.reduce((s, it) => s + (it.total || 0), 0));

    setTaxableAmount(calculatedTaxable);
    setCgst(calculatedCgst);
    setSgst(calculatedSgst);
    setGrandTotal(calculatedTotal);
  };

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    recalculateTotals(updated);
  };

  const addItem = () => {
    const updated = [...items, defaultItem()];
    setItems(updated);
    recalculateTotals(updated);
  };

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  // Open "Create New Product" modal prefilled with item's extracted description
  const handleOpenCreateProduct = (index: number) => {
    const it = items[index];
    setActiveItemForNewProduct(index);

    // Try extracting model and brand
    const desc = it.full_description || it.name || '';
    let brand = '';
    const lower = desc.toLowerCase();
    if (lower.includes('dell')) brand = 'Dell';
    else if (lower.includes('hp') || lower.includes('hewlett')) brand = 'HP';
    else if (lower.includes('lenovo') || lower.includes('thinkpad')) brand = 'Lenovo';
    else if (lower.includes('asus')) brand = 'Asus';
    else if (lower.includes('acer')) brand = 'Acer';
    else if (lower.includes('apple') || lower.includes('macbook')) brand = 'Apple';

    setNewProductForm({
      name: it.full_description || it.name || 'New Hardware Item',
      brand,
      model: it.name || '',
      category: 'Laptop',
      purchasePrice: parseFloat(it.rate) || 0,
      sellingPrice: round2((parseFloat(it.rate) || 0) * 1.25),
      hsn: it.hsn || '8471',
      minStock: 1,
      currentStock: 0,
    });
    setNewProductModalOpen(true);
  };

  const handleSaveNewProduct = async () => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductForm),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const createdProduct = json.data;
        setProducts((prev) => [...prev, createdProduct]);

        // Automatically bind to the item
        if (activeItemForNewProduct !== null && items[activeItemForNewProduct]) {
          handleItemChange(activeItemForNewProduct, 'productId', createdProduct.id);
        }

        setNewProductModalOpen(false);
        setActiveItemForNewProduct(null);
      } else {
        alert(json.error || 'Failed to create product');
      }
    } catch (err: any) {
      alert('Error creating product: ' + err.message);
    }
  };

  // Section 18: Confirm Purchase (Only this writes to database)
  const handleConfirmPurchase = async () => {
    if (!supplierId && !supplierName) {
      alert('Please select or specify a Supplier');
      return;
    }

    let finalSupplierId = supplierId;

    // If no supplier picked, create a new supplier entity in database
    if (!finalSupplierId && supplierName) {
      try {
        const createSupRes = await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: supplierName,
            gstin: supplierGstin,
            address: supplierAddress,
            phone: supplierPhone,
          }),
        });
        const supJson = await createSupRes.json();
        if (supJson.success) {
          finalSupplierId = supJson.data.id;
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!finalSupplierId) {
      alert('Supplier ID could not be resolved');
      return;
    }

    try {
      const payload = {
        supplierId: finalSupplierId,
        supplierInvoiceNumber: supplierInvoiceNumber || `BILL-${Date.now()}`,
        date: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal: taxableAmount,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount,
        cgst,
        sgst,
        igst,
        grandTotal,
        paidAmount: parseFloat(paidAmount) || 0,
        paymentMode,
        paymentReference,
        billFileUrl: filePreviews[0] || null,
        originalFileName: selectedFiles[0]?.name || 'uploaded_bill.jpg',
        documentType: scanResult?.documentClassification.document_type || 'GST Invoice',
        aiExtractedData: scanResult?.rawJson || null,
        verificationStatus: scanResult?.mathVerification?.status || 'VERIFIED',
        notes: notes || 'Imported via Multimodal AI Bill Vision',
        items: items.map((it) => ({
          productId: it.productId || products[0]?.id,
          serialNumbers: it.serialNumbers || null,
          description: it.full_description || it.name,
          hsn: it.hsn || '8471',
          quantity: it.quantity,
          unit: it.unit || 'Pcs',
          rate: it.rate,
          discount: it.discount,
          gstPercent: it.gstPercent,
          taxableAmount: it.taxableAmount,
          gstAmount: round2((it.cgst || 0) + (it.sgst || 0) + (it.igst || 0)),
          total: it.total,
        })),
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert(
          `✓ Purchase saved successfully! PO Number: ${json.data.purchaseNumber}.\nStock has been updated, supplier ledger recorded, and bill image attached.`
        );
        router.push('/purchases/all');
      } else {
        alert(json.error || 'Failed to save purchase');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error saving purchase');
    }
  };

  const activeFile = selectedFiles[activePageIndex];
  const activeFileUrl = filePreviews[activePageIndex];
  const isPdf = activeFile?.name.toLowerCase().endsWith('.pdf') || false;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/purchases/all"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Import Supplier Bill
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Document OCR
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated document inspection, table extraction, and line item matching.
            </p>
          </div>
        </div>

        {/* Vision Engine Model & Settings Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setConfigModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Model: <strong className="text-slate-900 font-semibold">{apiConfig.model}</strong></span>
            {apiConfig.hasAnyKey ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="API Key Connected" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" title="API Key Needed" />
            )}
          </button>

          {/* Trigger Upload Buttons */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="sm:hidden px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl border border-slate-200"
            title="Capture Photo"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Bill</span>
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <input
          ref={addMoreFilesInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
      </div>

      {/* Screen 1: Upload Dropzone if no file selected */}
      {selectedFiles.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 p-8 sm:p-12 text-center transition">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Upload Supplier Bill
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
            Upload an invoice PDF or image to extract items, tax rates, and supplier information.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-xs transition inline-flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select File (PDF / Image)</span>
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition inline-flex items-center gap-2"
            >
              <Camera className="w-3.5 h-3.5 text-slate-600" />
              <span>Capture Photo</span>
            </button>
          </div>

          {/* Quick API Key notice if none found */}
          {!apiConfig.hasAnyKey && (
            <div className="mt-6 max-w-md mx-auto p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 text-left">
              <Key className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex-1">
                <strong>API Key Required:</strong> Configure Gemini or OpenAI key in settings to enable bill parsing.
              </div>
              <button
                onClick={() => setConfigModalOpen(true)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded-lg shrink-0"
              >
                Configure
              </button>
            </div>
          )}

          {/* Real sample bill 1-click test button */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-xs text-slate-400 block mb-2.5 font-medium">Or test with sample bill:</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/uploads/bills/bill_1790367855073_d3d64l.pdf');
                    const blob = await res.blob();
                    const f = new File([blob], 'Supplier_Hardware_Invoice.pdf', { type: 'application/pdf' });
                    setSelectedFiles([f]);
                    setFilePreviews([URL.createObjectURL(f)]);
                    runVisionAnalysis([f]);
                  } catch (e) {
                    alert('Sample file could not be loaded');
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              >
                Sample Hardware Invoice (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 2: Scanning In Progress State */}
      {scanning && (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin" />
            <Sparkles className="w-6 h-6 text-slate-700 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Processing Document...
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
              {scanStep || 'Extracting tables and line items...'}
            </p>
          </div>
        </div>
      )}

      {/* Screen 3: ChatGPT-Style Side-by-Side Review Screen (Section 10) */}
      {selectedFiles.length > 0 && !scanning && scanResult && (
        <div className="space-y-4">
          {/* Top Review Bar: Classification + Math Status + Duplicate Warning */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Document Type Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
                  <FileCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>{scanResult.documentClassification.document_type}</span>
                  <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                    ({Math.round(scanResult.documentClassification.confidence * 100)}%)
                  </span>
                </div>

                {/* Math Verification Badge */}
                {scanResult.mathVerification.status === 'VERIFIED' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Calculations Verified</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Total Mismatch</span>
                  </div>
                )}

                {/* Duplicate Detection Alert Badge */}
                {scanResult.duplicateDetection?.isDuplicate && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Possible Duplicate</span>
                  </div>
                )}
              </div>

              {/* Actions: Re-scan / Upload Different */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => runVisionAnalysis(selectedFiles)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Re-scan</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    setFilePreviews([]);
                    setScanResult(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
                >
                  Change File
                </button>
              </div>
            </div>

            {/* If calculation mismatch, show exact discrepancies */}
            {scanResult.mathVerification.discrepancies.length > 0 && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-amber-700" />
                  <span>Independent Mathematical Audit Notes:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                  {scanResult.mathVerification.discrepancies.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* If duplicate warning, show details */}
            {scanResult.duplicateDetection?.isDuplicate && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{scanResult.duplicateDetection.warningMessage}</span>
              </div>
            )}
          </div>

          {/* TWO-COLUMN SIDE-BY-SIDE REVIEW CONTAINER (Section 10) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: ORIGINAL BILL VISUAL INSPECTOR */}
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-4 text-white flex flex-col h-[820px] border border-slate-800 shadow-md relative sticky top-4">
              {/* Top Controls */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-slate-200 truncate max-w-[160px]">
                    {activeFile?.name}
                  </span>
                </div>

                {/* Multi-page switcher if multiple files */}
                {selectedFiles.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                    {selectedFiles.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePageIndex(idx)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          activePageIndex === idx
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        P{idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => addMoreFilesInputRef.current?.click()}
                      className="px-1 text-slate-400 hover:text-white text-[11px]"
                      title="Add more pages"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Zoom & Rotate Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(Math.min(2.5, zoom + 0.2))}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"
                    title="Rotate"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Document Visual Viewer with Bounding Box Overlay */}
              <div className="flex-1 overflow-auto p-2 flex items-center justify-center relative custom-scrollbar">
                {isPdf ? (
                  <iframe
                    src={activeFileUrl}
                    className="w-full h-full rounded-xl bg-white"
                    title="Original Supplier PDF Document"
                  />
                ) : (
                  <div
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.15s ease',
                    }}
                    className="relative origin-center max-w-full"
                  >
                    <img
                      src={activeFileUrl}
                      alt="Original Bill Image"
                      className="max-w-full rounded-lg shadow-2xl block"
                    />

                    {/* Section 9: Highlighted Bounding Box Overlay */}
                    {selectedBbox && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${selectedBbox.x / 10}%`,
                          top: `${selectedBbox.y / 10}%`,
                          width: `${selectedBbox.width / 10}%`,
                          height: `${selectedBbox.height / 10}%`,
                        }}
                        className="border-2 border-indigo-400 bg-indigo-500/20 rounded shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-pulse pointer-events-none transition-all duration-200"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Viewer Status */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Original Document Preserved</span>
                <span className="font-mono">{apiConfig.model}</span>
              </div>
            </div>

            {/* RIGHT COLUMN: EXTRACTED DETAILS & EDITABLE FIELDS */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setActiveTab('items')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                    activeTab === 'items'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Items & Supplier ({items.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                    activeTab === 'payment'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Payment & Bank</span>
                </button>
                <button
                  onClick={() => setActiveTab('terms')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                    activeTab === 'terms'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Terms & Notes</span>
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                    activeTab === 'raw'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Raw Data</span>
                </button>
              </div>

              {/* TAB 1: ITEMS & SUPPLIER (Default Core View) */}
              {activeTab === 'items' && (
                <div className="space-y-6">
                  {/* Supplier & Invoice Header Block */}
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-indigo-600" />
                        <span>Supplier & Invoice Information</span>
                      </h3>
                      {supplierId ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Matched Existing Supplier
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Will Create New Supplier Entity
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Supplier Match Selector */}
                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 font-semibold mb-1">
                          Mapped Supplier in Your Database
                        </label>
                        <select
                          value={supplierId}
                          onChange={(e) => {
                            setSupplierId(e.target.value);
                            const found = suppliers.find((s) => s.id === e.target.value);
                            if (found) {
                              setSupplierName(found.name);
                              setSupplierGstin(found.gstin || '');
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-indigo-600"
                        >
                          <option value="">-- Create New Supplier ({supplierName || 'New'}) --</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.gstin ? `(${s.gstin})` : ''} — Bal: {formatCurrency(s.currentBalance)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Supplier Business Name
                        </label>
                        <input
                          type="text"
                          value={supplierName}
                          onChange={(e) => setSupplierName(e.target.value)}
                          onFocus={() => setSelectedBbox(scanResult.supplier.business_name?.bbox || null)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Supplier GSTIN
                        </label>
                        <input
                          type="text"
                          value={supplierGstin}
                          onChange={(e) => setSupplierGstin(e.target.value)}
                          onFocus={() => setSelectedBbox(scanResult.supplier.gstin?.bbox || null)}
                          placeholder="24ABCDE1234F1Z5"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-indigo-600 uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Supplier Invoice No.
                        </label>
                        <input
                          type="text"
                          value={supplierInvoiceNumber}
                          onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                          onFocus={() => setSelectedBbox(scanResult.invoice.invoice_number?.bbox || null)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-black focus:outline-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Invoice Date
                        </label>
                        <input
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          onFocus={() => setSelectedBbox(scanResult.invoice.invoice_date?.bbox || null)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Place of Supply
                        </label>
                        <input
                          type="text"
                          value={placeOfSupply}
                          onChange={(e) => setPlaceOfSupply(e.target.value)}
                          placeholder="e.g. Gujarat (24)"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Supplier Address / City
                        </label>
                        <input
                          type="text"
                          value={supplierAddress}
                          onChange={(e) => setSupplierAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table (Section 4 & 5: Exact descriptions preserved, row-col mapping) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Extracted Line Items ({items.length})
                        </h3>
                      </div>
                      <button
                        onClick={addItem}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {items.map((it, idx) => (
                        <div
                          key={it.id || idx}
                          onMouseEnter={() => {
                            if (it.bbox) setSelectedBbox(it.bbox);
                          }}
                          className={`p-4 rounded-2xl border transition-all ${
                            it.isMatched
                              ? 'border-emerald-200 bg-white shadow-xs'
                              : 'border-amber-200 bg-amber-50/20 shadow-xs'
                          }`}
                        >
                          {/* Item Card Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-black flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-xs text-slate-800">
                                {it.name || `Item ${idx + 1}`}
                              </span>
                            </div>

                            {/* Section 16: Product Matching Actions */}
                            <div className="flex items-center gap-2">
                              {it.isMatched ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>
                                    Matched: {it.matchedProduct?.name} (Stock: {it.matchedProduct?.currentStock})
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                  <HelpCircle className="w-3 h-3 text-amber-600" />
                                  <span>Needs Inventory Mapping</span>
                                </span>
                              )}

                              <button
                                onClick={() => handleOpenCreateProduct(idx)}
                                className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                                title="Create new product in catalog"
                              >
                                + New Product
                              </button>

                              {items.length > 1 && (
                                <button
                                  onClick={() => removeItem(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Section 4: Exact Extracted Full Description (Never shortened!) */}
                          <div className="space-y-2 mb-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                                Exact Extracted Bill Description (Preserved verbatim from invoice)
                              </label>
                              <textarea
                                rows={2}
                                value={it.full_description}
                                onChange={(e) => handleItemChange(idx, 'full_description', e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-indigo-600"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                                Target Inventory Product (Stock count will increase upon confirmation)
                              </label>
                              <select
                                value={it.productId}
                                onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-bold focus:outline-indigo-600"
                              >
                                <option value="">-- Select Product from Inventory --</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.brand ? `[${p.brand}]` : ''} • Stock: {p.currentStock} • Cost: {formatCurrency(p.purchasePrice)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Row Financials: Qty, Rate, GST %, Total */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                            <div>
                              <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-0.5">Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold tabular-nums font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-0.5">Unit Rate (₹)</label>
                              <input
                                type="number"
                                step="any"
                                value={it.rate}
                                onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold tabular-nums font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-0.5">GST Rate</label>
                              <select
                                value={it.gstPercent}
                                onChange={(e) => handleItemChange(idx, 'gstPercent', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium tabular-nums font-mono"
                              >
                                <option value="18">18% (Standard)</option>
                                <option value="12">12%</option>
                                <option value="28">28%</option>
                                <option value="5">5%</option>
                                <option value="0">0% (Nil)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-0.5">HSN Code</label>
                              <input
                                type="text"
                                value={it.hsn}
                                onChange={(e) => handleItemChange(idx, 'hsn', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono tabular-nums"
                              />
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                              <label className="block text-slate-500 text-[10px] font-semibold uppercase mb-0.5">Line Total (₹)</label>
                              <input
                                type="text"
                                readOnly
                                value={formatCurrency(it.total)}
                                className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 font-semibold tabular-nums font-mono text-right"
                              />
                            </div>
                          </div>

                          {/* Laptop / Hardware Serial Numbers input */}
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <label className="block text-indigo-700 font-semibold text-[11px] mb-0.5">
                              Hardware Serial Numbers (optional, comma-separated for laptop tracking)
                            </label>
                            <input
                              type="text"
                              value={it.serialNumbers}
                              onChange={(e) => handleItemChange(idx, 'serialNumbers', e.target.value)}
                              placeholder="e.g. DELL5410-0982, DELL5410-0983"
                              className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-indigo-600"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 12: Financial Ledger & Mathematical Breakdown */}
                  <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Verified Grand Total</div>
                        <div className="text-2xl font-black text-white">{formatCurrency(grandTotal)}</div>
                      </div>
                      <div className="text-right text-xs space-y-0.5 text-slate-300">
                        <div>Taxable Amount: <strong>{formatCurrency(taxableAmount)}</strong></div>
                        <div>CGST (9%): <strong>{formatCurrency(cgst)}</strong> • SGST (9%): <strong>{formatCurrency(sgst)}</strong></div>
                        {igst > 0 && <div>IGST: <strong>{formatCurrency(igst)}</strong></div>}
                      </div>
                    </div>

                    {/* Quick Payment & Settlement bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-900">
                      <div>
                        <label className="block text-slate-300 text-[11px] mb-1">Amount Paid Now (₹)</label>
                        <input
                          type="number"
                          step="any"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          placeholder="0 for credit"
                          className="w-full px-3 py-1.5 bg-white rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-[11px] mb-1">Payment Method</label>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white rounded-xl font-medium"
                        >
                          <option value="UPI">UPI / QR</option>
                          <option value="Bank Transfer">Bank Transfer / NEFT</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-300 text-[11px] mb-1">Transaction Ref / UTR</label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="e.g. UTR / Ref No."
                          className="w-full px-3 py-1.5 bg-white rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Final Action Button */}
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleConfirmPurchase}
                        className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Save Purchase</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PAYMENT & BANK DETAILS */}
              {activeTab === 'payment' && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Extracted Supplier Banking & Settlement Details</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Supplier Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank / SBI"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. 50200012345678"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder="e.g. HDFC0000123"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">UPI ID / VPA</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. supplier@upi"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TERMS & NOTES */}
              {activeTab === 'terms' && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Terms, Conditions & Extraction Notes</span>
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Invoice Terms & Conditions
                      </label>
                      <textarea
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                      />
                    </div>

                    {scanResult.extractionNotes && scanResult.extractionNotes.length > 0 && (
                      <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200">
                        <span className="font-bold text-indigo-900 block mb-1">AI Document Observations:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-indigo-800">
                          {scanResult.extractionNotes.map((note, i) => (
                            <li key={i}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: AI RAW JSON */}
              {activeTab === 'raw' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Multimodal Vision Raw JSON Output</span>
                    <span className="font-mono text-slate-500">{apiConfig.model}</span>
                  </div>
                  <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-auto max-h-[400px] custom-scrollbar">
                    {JSON.stringify(scanResult.rawJson, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: AI Vision Model & API Key Configuration */}
      {configModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Multimodal AI Vision Configuration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select your vision provider and set API credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Vision Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setApiConfig((p) => ({ ...p, provider: 'gemini', model: 'gemini-2.5-flash' }));
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      apiConfig.provider === 'gemini'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Google Gemini</span>
                      {apiConfig.hasGeminiKey && <span className="text-[10px] text-emerald-600">✓ Ready</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Gemini 2.5 Flash / 1.5 Pro</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setApiConfig((p) => ({ ...p, provider: 'openai', model: 'gpt-4o' }));
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      apiConfig.provider === 'openai'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>OpenAI</span>
                      {apiConfig.hasOpenAiKey && <span className="text-[10px] text-emerald-600">✓ Ready</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">GPT-4o / GPT-4o-mini</div>
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Model Version</label>
                <select
                  value={apiConfig.model}
                  onChange={(e) => setApiConfig((p) => ({ ...p, model: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold"
                >
                  {apiConfig.provider === 'gemini' ? (
                    <>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest & Best Vision)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deepest Analysis)</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4o">GPT-4o (High Accuracy Vision)</option>
                      <option value="gpt-4o-mini">GPT-4o-mini (Faster)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Gemini API Key */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Google Gemini API Key
                  {apiConfig.hasGeminiKey && (
                    <span className="ml-2 font-normal text-slate-400">
                      (Configured: {apiConfig.maskedGeminiKey})
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={apiConfig.geminiApiKeyInput}
                  onChange={(e) => setApiConfig((p) => ({ ...p, geminiApiKeyInput: e.target.value }))}
                  placeholder={apiConfig.hasGeminiKey ? 'Leave blank to keep existing key' : 'AIzaSy...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono"
                />
              </div>

              {/* OpenAI API Key */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  OpenAI API Key
                  {apiConfig.hasOpenAiKey && (
                    <span className="ml-2 font-normal text-slate-400">
                      (Configured: {apiConfig.maskedOpenAiKey})
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={apiConfig.openaiApiKeyInput}
                  onChange={(e) => setApiConfig((p) => ({ ...p, openaiApiKeyInput: e.target.value }))}
                  placeholder={apiConfig.hasOpenAiKey ? 'Leave blank to keep existing key' : 'sk-...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfigModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
              >
                {savingConfig ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Section 16 Quick Create New Product */}
      {newProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Catalog Product</h3>
                  <p className="text-xs text-slate-500">Auto-filled from extracted invoice row</p>
                </div>
              </div>
              <button
                onClick={() => setNewProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Product Name</label>
                <input
                  type="text"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Brand</label>
                  <input
                    type="text"
                    value={newProductForm.brand}
                    onChange={(e) => setNewProductForm((p) => ({ ...p, brand: e.target.value }))}
                    placeholder="e.g. Dell"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={newProductForm.hsn}
                    onChange={(e) => setNewProductForm((p) => ({ ...p, hsn: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={newProductForm.purchasePrice}
                    onChange={(e) => setNewProductForm((p) => ({ ...p, purchasePrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Expected Sale (₹)</label>
                  <input
                    type="number"
                    value={newProductForm.sellingPrice}
                    onChange={(e) => setNewProductForm((p) => ({ ...p, sellingPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNewProductModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewProduct}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
              >
                Create & Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
