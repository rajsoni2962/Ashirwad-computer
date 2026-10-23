'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import InvoicePrintView from '@/components/invoice/InvoicePrintView';
import {
  InvoiceDesignConfig,
  DEFAULT_INVOICE_DESIGN,
  COLOR_PRESETS,
  DESIGN_PRESETS,
  getInvoiceDesign,
} from '@/lib/invoice-design';
import {
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Palette,
  Layout,
  Type,
  Table as TableIcon,
  CreditCard,
  PenTool,
  Hash,
  Eye,
  Sliders,
  RotateCcw,
  Sparkles,
  Printer,
  Download,
  Building2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { generateInvoicePdfFromElement, downloadPdfBlob } from '@/lib/invoicePdfGenerator';

type StudioTab = 'theme' | 'layout' | 'typography' | 'columns' | 'bank' | 'signatory' | 'numbering';

export default function InvoiceDesignerPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>('theme');
  const [design, setDesign] = useState<InvoiceDesignConfig>(DEFAULT_INVOICE_DESIGN);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('default');

  // Series numbers & terms
  const [seriesData, setSeriesData] = useState({
    invoicePrefix: 'AT/2026/',
    nextInvoiceNumber: 110,
    purchasePrefix: 'PO/2026/',
    nextPurchaseNumber: 201,
    terms: '',
    footer: '',
    authorizedSignatory: 'Ashirwad Tech\nRaj Soni\nProprietor',
  });

  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [previewSample, setPreviewSample] = useState<'laptop' | 'parts'>('laptop');

  // Load profiles & settings
  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then((r) => r.json()),
      fetch('/api/business-profiles').then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([setRes, profRes]) => {
        if (setRes.success && setRes.data) {
          setSettings(setRes.data);
          const loadedDesign = getInvoiceDesign(setRes.data.invoiceDesign);
          setDesign(loadedDesign);
          setSeriesData({
            invoicePrefix: setRes.data.invoicePrefix || 'AT/2026/',
            nextInvoiceNumber: setRes.data.nextInvoiceNumber || 110,
            purchasePrefix: setRes.data.purchasePrefix || 'PO/2026/',
            nextPurchaseNumber: setRes.data.nextPurchaseNumber || 201,
            terms: setRes.data.terms || '',
            footer: setRes.data.footer || '',
            authorizedSignatory: setRes.data.authorizedSignatory || 'Ashirwad Tech\nRaj Soni\nProprietor',
          });
        }
        if (profRes.success && profRes.data) {
          setProfiles(profRes.data);
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg('Failed to load invoice designer settings');
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle switching branch profile
  const handleProfileChange = (profileId: string) => {
    setSelectedProfileId(profileId);
    if (profileId === 'default') {
      if (settings?.invoiceDesign) {
        setDesign(getInvoiceDesign(settings.invoiceDesign));
      } else {
        setDesign(DEFAULT_INVOICE_DESIGN);
      }
    } else {
      const found = profiles.find((p) => p.id === profileId);
      if (found && found.invoiceDesign) {
        setDesign(getInvoiceDesign(found.invoiceDesign));
      } else {
        setDesign(DEFAULT_INVOICE_DESIGN);
      }
    }
  };

  // Preset selector
  const applyPreset = (presetKey: string) => {
    const preset = DESIGN_PRESETS[presetKey];
    if (preset) {
      setDesign((prev) => ({
        ...prev,
        ...preset,
      }));
    }
  };

  // Color swatch selector
  const applyColor = (hex: string) => {
    setDesign((prev) => ({
      ...prev,
      primaryColor: hex,
    }));
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const designJson = JSON.stringify(design);

      // 1. Save global settings
      const globalPayload = {
        ...seriesData,
        invoiceDesign: designJson,
        terms: seriesData.terms || design.footerText,
        footer: seriesData.footer || design.footerText,
        authorizedSignatory: seriesData.authorizedSignatory || design.signatoryTitle,
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalPayload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }

      // 2. If a specific business profile is selected, also persist to it
      if (selectedProfileId !== 'default') {
        await fetch(`/api/business-profiles/${selectedProfileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceDesign: designJson }),
        });
      }

      setSuccessMsg('100% Invoice Design & Layout successfully saved and applied to all invoices & PDFs!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving invoice design');
    } finally {
      setSaving(false);
    }
  };

  // Reset to Factory Default
  const handleResetToDefault = () => {
    if (confirm('Revert all invoice design & layout settings back to Factory Modern Default?')) {
      setDesign({ ...DEFAULT_INVOICE_DESIGN });
      setSuccessMsg('Reset to factory default modern layout. Click Save to apply.');
    }
  };

  // Sample Invoices for Live Preview
  const sampleLaptopInvoice = {
    id: 'sample-inv-1',
    invoiceNumber: `${seriesData.invoicePrefix}108`,
    invoiceType: 'TAX_INVOICE',
    status: 'Finalized',
    paymentStatus: 'Paid',
    revisionNumber: 1,
    date: new Date().toISOString(),
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    paymentMode: 'UPI / Online Transfer',
    customer: {
      name: 'Aditi Patel',
      phone: '9825100000',
      email: 'aditi.patel@gmail.com',
      address: 'B-402, Shivalik High Street, Near Judges Bungalow, Bodakdev, Ahmedabad',
      gstin: '',
      state: 'Gujarat',
      stateCode: '24',
    },
    items: [
      {
        id: 'it-1',
        description: 'Dell Latitude 7490 Ultrabook (Intel Core i5 8th Gen, 16GB DDR4, 512GB NVMe SSD, 14" FHD IPS Display)',
        serialNumber: 'DELL-LAT-7490-9821',
        hsn: '8471',
        quantity: 1,
        unit: 'Pcs',
        rate: 22880.51,
        discountAmount: 0,
        total: 22880.51,
      },
      {
        id: 'it-2',
        description: 'Hammok Wireless Combo Keyboard & Mouse (Dual Mode 2.4GHz + Bluetooth)',
        serialNumber: 'HAM-WLS-9912',
        hsn: '8471',
        quantity: 1,
        unit: 'Pcs',
        rate: 1016.1,
        discountAmount: 0,
        total: 1016.1,
      },
      {
        id: 'it-3',
        description: 'Antivirus & System Setup Complete Diagnostic Service (1-Year Protection)',
        serialNumber: '',
        hsn: '9987',
        quantity: 1,
        unit: 'Job',
        rate: 847.46,
        discountAmount: 0,
        total: 847.46,
      },
    ],
    subtotal: 24744.07,
    taxableAmount: 24744.07,
    cgst: 2226.96,
    sgst: 2226.96,
    igst: 0,
    grandTotal: 29198.0,
    paidAmount: 29198.0,
    balanceDue: 0,
    discountAmount: 0,
    taxConfiguration: 'CGST_SGST',
    notes: 'Professionally refurbished, fully tested, 100% health battery, and certified by Ashirwad Technologies.',
  };

  const samplePartsInvoice = {
    id: 'sample-inv-2',
    invoiceNumber: `${seriesData.invoicePrefix}109`,
    invoiceType: 'TAX_INVOICE',
    status: 'Finalized',
    paymentStatus: 'Partial',
    revisionNumber: 1,
    date: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    paymentMode: 'Cash / Split',
    customer: {
      name: 'Rohan Mehra',
      phone: '9909988776',
      email: 'rohan.tech@gmail.com',
      address: '22, Sunrise Park Society, Drive-In Road, Ahmedabad',
      gstin: '',
      state: 'Gujarat',
      stateCode: '24',
    },
    items: [
      {
        id: 'it-1',
        description: 'Crucial 16GB DDR4 3200MHz Laptop RAM (CT16G4SFRA32A)',
        serialNumber: 'CRU-RAM-8841',
        hsn: '8473',
        quantity: 2,
        unit: 'Pcs',
        rate: 3200.0,
        discountAmount: 400.0,
        total: 6000.0,
      },
      {
        id: 'it-2',
        description: 'Kingston NV2 1TB PCIe 4.0 NVMe M.2 High Speed Internal SSD',
        serialNumber: 'KNG-1TB-7743',
        hsn: '8471',
        quantity: 1,
        unit: 'Pcs',
        rate: 5500.0,
        discountAmount: 200.0,
        total: 5300.0,
      },
    ],
    subtotal: 11300.0,
    taxableAmount: 11300.0,
    cgst: 1017.0,
    sgst: 1017.0,
    igst: 0,
    grandTotal: 13334.0,
    paidAmount: 10000.0,
    balanceDue: 3334.0,
    discountAmount: 600.0,
    taxConfiguration: 'CGST_SGST',
    notes: 'Brand new components with 3 Years manufacturer warranty.',
  };

  const previewInvoice = previewSample === 'laptop' ? sampleLaptopInvoice : samplePartsInvoice;

  // Test Download
  const handleTestDownload = async () => {
    const el = document.getElementById('printable-invoice-document');
    if (!el) return;
    try {
      const { blob, filename } = await generateInvoicePdfFromElement(
        el,
        previewInvoice.invoiceNumber,
        previewInvoice,
        settings
      );
      downloadPdfBlob(blob, filename);
    } catch (err) {
      alert('Error generating preview PDF');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header & Save Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  100% Visual Graphic Invoice Designer Studio
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    WYSIWYG Live
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize every pixel of your invoice: colors, logo size, typography, table columns, bank details, and layout position.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Business Profile Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500 font-medium">Design Target:</span>
              <select
                value={selectedProfileId}
                onChange={(e) => handleProfileChange(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
              >
                <option value="default">Default Business (All Branches)</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              title="Revert back to Modern Factory Default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 gold-gradient-bg hover:opacity-95 rounded-xl shadow-md gold-glow transition disabled:opacity-50"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{saving ? 'Applying...' : 'Save & Apply Design'}</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white p-20 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
            <span className="text-sm font-semibold text-slate-600">Loading Graphic Invoice Designer Studio...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Controls Panel (5 Columns) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-100 overflow-x-auto bg-slate-50/70 p-2 gap-1.5 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setActiveTab('theme')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                    activeTab === 'theme'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Theme & Colors</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('layout')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                    activeTab === 'layout'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Layout & Logo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('typography')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                    activeTab === 'typography'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Typography</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('columns')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                    activeTab === 'columns'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Columns</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bank')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                    activeTab === 'bank'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Bank & QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('signatory')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                    activeTab === 'signatory'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Signatory & Terms</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('numbering')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                    activeTab === 'numbering'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>Series Numbers</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 space-y-6 max-h-[720px] overflow-y-auto scrollbar-thin">
                {/* 1. Theme & Colors Tab */}
                {activeTab === 'theme' && (
                  <div className="space-y-6">
                    {/* Template Presets */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Quick Designer Presets
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { key: 'modern', label: 'Modern Indigo', desc: 'Vibrant, rounded, soft tinted' },
                          { key: 'classic', label: 'Classic Formal', desc: 'Serif font, sharp edges, dark' },
                          { key: 'tech', label: 'Cyber Tech', desc: 'Emerald green, dark header' },
                          { key: 'compact', label: 'Compact Ledger', desc: 'Dense lines, minimal whitespace' },
                        ].map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => applyPreset(p.key)}
                            className={`text-left p-3 rounded-xl border text-xs transition ${
                              design.layoutStyle === p.key
                                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className="font-bold text-slate-900 block">{p.label}</span>
                            <span className="text-[11px] text-slate-500">{p.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brand Primary Accent Color */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Brand Accent Color
                      </label>
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="color"
                          value={design.primaryColor}
                          onChange={(e) => applyColor(e.target.value)}
                          className="w-12 h-10 p-0.5 rounded-xl border border-slate-300 cursor-pointer shadow-xs bg-white"
                        />
                        <input
                          type="text"
                          value={design.primaryColor}
                          onChange={(e) => applyColor(e.target.value)}
                          className="w-32 px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl"
                        />
                        <span className="text-xs text-slate-500">Pick any custom brand color</span>
                      </div>

                      {/* Curated Swatches */}
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((c) => (
                          <button
                            key={c.primary}
                            type="button"
                            onClick={() => applyColor(c.primary)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 text-[11px] font-semibold text-slate-700 bg-white shadow-2xs"
                          >
                            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: c.primary }} />
                            <span>{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Header Banner Background */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Invoice Header Banner Style
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'soft-tint', label: 'Soft Tint', desc: '10% accent opacity' },
                          { key: 'solid-accent', label: 'Solid Accent', desc: 'Full brand color background' },
                          { key: 'dark-slate', label: 'Dark Charcoal', desc: 'Deep slate #0f172a' },
                          { key: 'minimal-white', label: 'Minimal White', desc: 'Clean white with border' },
                        ].map((h) => (
                          <button
                            key={h.key}
                            type="button"
                            onClick={() => setDesign({ ...design, headerBgStyle: h.key as any })}
                            className={`p-2.5 rounded-xl border text-left text-xs transition ${
                              design.headerBgStyle === h.key
                                ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>{h.label}</div>
                            <span className="text-[10px] text-slate-400">{h.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table Header Fill */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Table Header Fill Style
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'filled', label: 'Solid Fill', desc: 'Brand accent background' },
                          { key: 'tinted', label: 'Tinted', desc: 'Light accent background' },
                          { key: 'bordered', label: 'Double Border', desc: 'Clean white + colored borders' },
                          { key: 'minimal', label: 'Slate Dark', desc: 'Classic dark header' },
                        ].map((th) => (
                          <button
                            key={th.key}
                            type="button"
                            onClick={() => setDesign({ ...design, tableHeaderStyle: th.key as any })}
                            className={`p-2.5 rounded-xl border text-left text-xs transition ${
                              design.tableHeaderStyle === th.key
                                ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>{th.label}</div>
                            <span className="text-[10px] text-slate-400">{th.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Border Radius */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Container Corner Curvature
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { key: 'none', label: 'Sharp (0px)' },
                          { key: 'small', label: 'Small (8px)' },
                          { key: 'medium', label: 'Modern (16px)' },
                          { key: 'rounded', label: 'Pill (24px)' },
                        ].map((r) => (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => setDesign({ ...design, borderRadius: r.key as any })}
                            className={`p-2 rounded-xl border text-center text-xs transition ${
                              design.borderRadius === r.key
                                ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Layout & Logo Tab */}
                {activeTab === 'layout' && (
                  <div className="space-y-6">
                    {/* Logo Placement */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Company Logo Position
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { key: 'left', label: 'Left' },
                          { key: 'center', label: 'Center' },
                          { key: 'right', label: 'Right' },
                          { key: 'hidden', label: 'Hidden' },
                        ].map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setDesign({ ...design, logoPosition: p.key as any })}
                            className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                              design.logoPosition === p.key
                                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-500'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo Size Slider */}
                    {design.logoPosition !== 'hidden' && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Logo Dimension Size:</span>
                          <span className="font-mono font-bold text-indigo-600">{design.logoSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="220"
                          step="5"
                          value={design.logoSize}
                          onChange={(e) => setDesign({ ...design, logoSize: parseInt(e.target.value) || 120 })}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Compact (60px)</span>
                          <span>Default (130px)</span>
                          <span>Large (220px)</span>
                        </div>
                      </div>
                    )}

                    {/* Swap Customer & Invoice Metadata */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Swap Customer & Invoice Details</span>
                        <span className="text-[11px] text-slate-500">
                          {design.swapCustomerMetaPosition
                            ? 'Currently: Invoice Details on Left, Bill To on Right'
                            : 'Currently: Bill To on Left, Invoice Details on Right'}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={design.swapCustomerMetaPosition}
                          onChange={(e) => setDesign({ ...design, swapCustomerMetaPosition: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* Custom Block Titles */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Customer Block Title
                        </label>
                        <input
                          type="text"
                          value={design.customerCardTitle}
                          onChange={(e) => setDesign({ ...design, customerCardTitle: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Invoice Meta Block Title
                        </label>
                        <input
                          type="text"
                          value={design.invoiceMetaTitle}
                          onChange={(e) => setDesign({ ...design, invoiceMetaTitle: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Page Padding */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        A4 Page Margins / Padding
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'compact', label: 'Compact (20px)' },
                          { key: 'normal', label: 'Standard (36px)' },
                          { key: 'spacious', label: 'Spacious (48px)' },
                        ].map((m) => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setDesign({ ...design, pageMargin: m.key as any })}
                            className={`p-2 rounded-xl border text-center text-xs font-bold transition ${
                              design.pageMargin === m.key
                                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Typography Tab */}
                {activeTab === 'typography' && (
                  <div className="space-y-6">
                    {/* Font Family */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Invoice Typography & Font Family
                      </label>
                      <div className="space-y-2">
                        {[
                          { key: 'Outfit', label: 'Outfit (Modern Geometric - Default)', font: 'font-outfit' },
                          { key: 'Inter', label: 'Inter (Clean Technical Sans)', font: 'font-sans' },
                          { key: 'Roboto', label: 'Roboto (Google Standard)', font: 'font-sans' },
                          { key: 'JetBrains Mono', label: 'JetBrains Mono (Modern Monospace)', font: 'font-mono' },
                          { key: 'Georgia', label: 'Georgia (Classic Editorial Serif)', font: 'font-serif' },
                        ].map((f) => (
                          <button
                            key={f.key}
                            type="button"
                            onClick={() => setDesign({ ...design, fontFamily: f.key as any })}
                            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                              design.fontFamily === f.key
                                ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950 ring-1 ring-indigo-500'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className={f.font}>{f.label}</span>
                            <span className="text-[11px] font-mono text-slate-400">Aa Bb 123</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size Scale */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Font Scale & Density
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'compact', label: 'Compact (12px)' },
                          { key: 'normal', label: 'Normal (13px)' },
                          { key: 'large', label: 'Large (14px)' },
                        ].map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => setDesign({ ...design, fontSizeScale: s.key as any })}
                            className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                              design.fontSizeScale === s.key
                                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Branding Toggles */}
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Header Branding Elements
                      </label>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs font-semibold text-slate-800">Show Company Tagline</span>
                        <input
                          type="checkbox"
                          checked={design.showTagline}
                          onChange={(e) => setDesign({ ...design, showTagline: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs font-semibold text-slate-800">Show Contact Info (Phone & Email)</span>
                        <input
                          type="checkbox"
                          checked={design.showContactInfo}
                          onChange={(e) => setDesign({ ...design, showContactInfo: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs font-semibold text-slate-800">Show GSTIN Number</span>
                        <input
                          type="checkbox"
                          checked={design.showGstinBadge}
                          onChange={(e) => setDesign({ ...design, showGstinBadge: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Table Columns Tab */}
                {activeTab === 'columns' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Line Items Table Columns & Visibility
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Toggle specific columns on or off to tailor invoices for retail, services, or wholesale.
                      </p>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">Serial Number (#) Column</span>
                            <span className="text-[11px] text-slate-500">1, 2, 3 row index column</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={design.showSerialColumn}
                            onChange={(e) => setDesign({ ...design, showSerialColumn: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">HSN / SAC Code Column</span>
                            <span className="text-[11px] text-slate-500">Essential for GST compliant B2B tax bills</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={design.showHsnColumn}
                            onChange={(e) => setDesign({ ...design, showHsnColumn: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">Product Serial Number (S/N) Badge</span>
                            <span className="text-[11px] text-slate-500">Shows tracking serials under item descriptions</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={design.showWarrantyColumn}
                            onChange={(e) => setDesign({ ...design, showWarrantyColumn: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">Unit Column</span>
                            <span className="text-[11px] text-slate-500">Displays Pcs, Boxes, Jobs, Meters</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={design.showUnitColumn}
                            onChange={(e) => setDesign({ ...design, showUnitColumn: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">Discount Column</span>
                            <span className="text-[11px] text-slate-500">Displays discount deduction per line item</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={design.showDiscountColumn}
                            onChange={(e) => setDesign({ ...design, showDiscountColumn: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">Alternating Zebra Row Shading</span>
                            <span className="text-[11px] text-slate-500">Alternating subtle gray stripes for readability</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={design.zebraStripes}
                            onChange={(e) => setDesign({ ...design, zebraStripes: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Bank & QR Tab */}
                {activeTab === 'bank' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Bank Details Position
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'left', label: 'Side Column (Default)' },
                          { key: 'full', label: 'Full Width Row' },
                          { key: 'hidden', label: 'Hidden' },
                        ].map((b) => (
                          <button
                            key={b.key}
                            type="button"
                            onClick={() => setDesign({ ...design, bankDetailsPosition: b.key as any })}
                            className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                              design.bankDetailsPosition === b.key
                                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* UPI QR Code */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Dynamic UPI QR Code</span>
                          <span className="text-[11px] text-slate-500">Auto-generates Scan & Pay QR with invoice total</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={design.showUpiQrCode}
                          onChange={(e) => setDesign({ ...design, showUpiQrCode: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                      </div>

                      {design.showUpiQrCode && (
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">QR Code Size:</span>
                            <span className="font-mono font-bold text-indigo-600">{design.qrCodeSize}px</span>
                          </div>
                          <input
                            type="range"
                            min="60"
                            max="140"
                            step="5"
                            value={design.qrCodeSize}
                            onChange={(e) => setDesign({ ...design, qrCodeSize: parseInt(e.target.value) || 90 })}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Signatory & Legal Terms Tab */}
                {activeTab === 'signatory' && (
                  <div className="space-y-6">
                    {/* Signatory Alignment */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Authorized Signatory Alignment
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'left', label: 'Left' },
                          { key: 'center', label: 'Center' },
                          { key: 'right', label: 'Right (Default)' },
                        ].map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => setDesign({ ...design, signatoryPosition: s.key as any })}
                            className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                              design.signatoryPosition === s.key
                                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Signatory Title */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Signatory Label Text
                      </label>
                      <input
                        type="text"
                        value={design.signatoryTitle}
                        onChange={(e) => setDesign({ ...design, signatoryTitle: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    {/* Digital Signature Image Toggle & Height */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Show Signature Stamp / Image</span>
                          <span className="text-[11px] text-slate-500">Renders digital signature above the signatory label</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={design.showSignatureImage}
                          onChange={(e) => setDesign({ ...design, showSignatureImage: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                      </div>

                      {design.showSignatureImage && (
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">Signature Height:</span>
                            <span className="font-mono font-bold text-indigo-600">{design.signatureHeight}px</span>
                          </div>
                          <input
                            type="range"
                            min="30"
                            max="90"
                            step="2"
                            value={design.signatureHeight}
                            onChange={(e) => setDesign({ ...design, signatureHeight: parseInt(e.target.value) || 48 })}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                    {/* Terms & Conditions Content */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Warranty Terms & Conditions
                        </label>
                        <select
                          value={design.termsPosition}
                          onChange={(e) => setDesign({ ...design, termsPosition: e.target.value as any })}
                          className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5"
                        >
                          <option value="full">Show Terms</option>
                          <option value="hidden">Hide Terms</option>
                        </select>
                      </div>
                      <textarea
                        rows={4}
                        value={seriesData.terms}
                        onChange={(e) => setSeriesData({ ...seriesData, terms: e.target.value })}
                        placeholder="* 6 Months warranty on technical issues...\n* No return without physical inspection..."
                        className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono leading-relaxed"
                      />
                    </div>

                    {/* Footer Greeting */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Invoice Bottom Footer Greeting
                      </label>
                      <input
                        type="text"
                        value={design.footerText}
                        onChange={(e) => {
                          setDesign({ ...design, footerText: e.target.value });
                          setSeriesData({ ...seriesData, footer: e.target.value });
                        }}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {/* 7. Numbering Series Tab */}
                {activeTab === 'numbering' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-indigo-600" />
                        Sales Invoice Auto-Numbering Series
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prefix</label>
                          <input
                            type="text"
                            value={seriesData.invoicePrefix}
                            onChange={(e) => setSeriesData({ ...seriesData, invoicePrefix: e.target.value })}
                            className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Next Serial</label>
                          <input
                            type="number"
                            value={seriesData.nextInvoiceNumber}
                            onChange={(e) => setSeriesData({ ...seriesData, nextInvoiceNumber: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Next Bill Generated: <span className="font-mono font-bold text-indigo-600">{seriesData.invoicePrefix}{seriesData.nextInvoiceNumber}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-orange-600" />
                        Purchase Order Series
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prefix</label>
                          <input
                            type="text"
                            value={seriesData.purchasePrefix}
                            onChange={(e) => setSeriesData({ ...seriesData, purchasePrefix: e.target.value })}
                            className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Next Serial</label>
                          <input
                            type="number"
                            value={seriesData.nextPurchaseNumber}
                            onChange={(e) => setSeriesData({ ...seriesData, nextPurchaseNumber: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Live Preview Canvas (7 Columns) */}
            <div className="lg:col-span-7 space-y-3 sticky top-4">
              {/* Preview Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white p-3 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Live WYSIWYG A4 Canvas</span>
                  <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 ml-2">
                    <button
                      type="button"
                      onClick={() => setPreviewSample('laptop')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
                        previewSample === 'laptop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Laptop Bill
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewSample('parts')}
                      className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
                        previewSample === 'parts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Parts & RAM
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setZoomScale((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
                      className="p-1 hover:text-indigo-400"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1 font-mono text-[11px] text-slate-300 font-bold">{Math.round(zoomScale * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomScale((z) => Math.min(1.2, +(z + 0.1).toFixed(2)))}
                      className="p-1 hover:text-indigo-400"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomScale(1.0)}
                      className="px-1.5 py-0.5 text-[10px] font-bold text-slate-300 hover:bg-slate-700 rounded"
                    >
                      100%
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    title="Test Print"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleTestDownload}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition"
                    title="Download test PDF"
                  >
                    <Download className="w-3 h-3 stroke-[2.5]" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* Document Container with zoom scaling */}
              <div className="bg-slate-100/90 p-4 sm:p-6 rounded-3xl border border-slate-200 overflow-x-auto flex justify-center shadow-inner min-h-[720px]">
                <div
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="w-full max-w-[210mm] shrink-0"
                >
                  <InvoicePrintView
                    invoice={previewInvoice}
                    settings={settings}
                    customDesign={design}
                    isDesignerPreview={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
