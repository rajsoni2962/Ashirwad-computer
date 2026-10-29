'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  TrendingUp,
  ShoppingCart,
  Truck,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  Plus,
  Camera,
  Users,
  Wallet,
  CheckCircle2,
  RefreshCw,
  FileText,
  Search,
  ShieldCheck,
  Laptop,
  Cpu,
  HardDrive,
  Sparkles,
  Download,
  MessageCircle,
  Clock,
  Printer,
  ChevronRight,
  Check,
  Copy,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Globe
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import WhatsAppShareModal from '@/components/invoice/WhatsAppShareModal';

export default function DashboardPage() {
  const [range, setRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Products Showcase State
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [productsLoading, setProductsLoading] = useState(true);

  // Serial Number Warranty Lookup State
  const [serialQuery, setSerialQuery] = useState('');
  const [searchingSerial, setSearchingSerial] = useState(false);
  const [serialResult, setSerialResult] = useState<any | null>(null);
  const [serialSearched, setSerialSearched] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);

  // WhatsApp Share Modal
  const [shareInvoice, setShareInvoice] = useState<any | null>(null);

  // Settings
  const [settings, setSettings] = useState<any>(null);

  const fetchDashboard = async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?range=${selectedRange}`);
      const json = await res.json();
      if (json.success) {
        setDashboardData(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (cat: string) => {
    setProductsLoading(true);
    try {
      const url = cat && cat !== 'All' ? `/api/products?category=${encodeURIComponent(cat)}` : '/api/products';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.slice(0, 8)); // Display top 8 showcase items
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSerialSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialQuery.trim()) return;
    setSearchingSerial(true);
    setSerialSearched(true);
    try {
      const res = await fetch(`/api/serial-numbers?search=${encodeURIComponent(serialQuery.trim())}`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setSerialResult(json.data[0]);
      } else {
        setSerialResult(null);
      }
    } catch (err) {
      console.error(err);
      setSerialResult(null);
    } finally {
      setSearchingSerial(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  useEffect(() => {
    fetchDashboard(range);
    fetchProducts(selectedCategory);
    fetch('/api/settings')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSettings(json.data);
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    fetchDashboard(range);
  }, [range]);

  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BRAND BANNER & COMMAND CENTER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#101524] to-[#090d14] text-white p-6 sm:p-10 shadow-2xl border border-amber-500/30">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Brand Identity & Tagline */}
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Ashirwad Tech ERP • Command Center</span>
              </div>
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 hover:text-white text-xs font-semibold hover:bg-blue-500/30 transition"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>View Public Website ↗</span>
              </Link>
            </div>

            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-xl shrink-0 bg-white p-1">
                <img
                  src="/brand/logo.png"
                  alt="Ashirwad Tech"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight flex items-center gap-2">
                  <span className="text-white">ASHIRWAD</span>
                  <span className="gold-gradient-text">TECH</span>
                </h1>
                <p className="text-xs sm:text-sm font-bold tracking-widest text-amber-300 uppercase mt-1">
                  Beyond Tech Limits...
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Certified Refurbished Laptops, Desktops, Custom PC Builds, Genuine Hardware Upgrades, and Chip-Level Repair Services. Fast GST Invoicing with instant WhatsApp delivery.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 backdrop-blur-xs text-[11px] font-semibold text-amber-300 border border-amber-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>6 Months Hardware Warranty</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs text-[11px] font-semibold text-slate-200 border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Bench Tested Grade-A</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs text-[11px] font-semibold text-slate-200 border border-white/10">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>GST Tax Invoicing Ready</span>
              </div>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="flex flex-col gap-3 sm:w-72 shrink-0">
            <Link
              href="/sales/new"
              className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>+ New Tax Invoice</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-80" />
            </Link>

            <Link
              href="/purchases/import-bill"
              className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-amber-200 font-bold text-sm border border-amber-500/30 hover:border-amber-400 transition transform hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-sm shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-amber-400" />
                <span>📷 Import Bill (AI OCR)</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-70" />
            </Link>

            <Link
              href="/inventory/products"
              className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-slate-200 font-semibold text-sm border border-slate-700/80 transition backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-amber-400" />
                <span>Inventory Catalog</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME SERIAL & WARRANTY VERIFIER WIDGET */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Laptop Serial Number & Warranty Verifier
              </h2>
              <p className="text-xs text-slate-500">
                Instantly check hardware specs, sale date, customer warranty status, or stock availability.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full self-start sm:self-auto border border-purple-200">
            Real-Time Hardware Lookup
          </span>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSerialSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={serialQuery}
              onChange={(e) => setSerialQuery(e.target.value)}
              placeholder="Enter Laptop Serial Number (e.g. DL5410-XYZ-9981 or customer name)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={searchingSerial}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition disabled:opacity-50 shrink-0"
          >
            {searchingSerial ? 'Searching...' : 'Verify Status'}
          </button>
        </form>

        {/* Search Results Display */}
        {serialSearched && (
          <div className="pt-2">
            {serialResult ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-purple-900">
                      {serialResult.serialNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(serialResult.serialNumber)}
                      className="p-1 text-purple-600 hover:text-purple-800"
                      title="Copy Serial Number"
                    >
                      {copiedSerial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        serialResult.status === 'Sold'
                          ? 'bg-blue-100 text-blue-700'
                          : serialResult.status === 'In Stock'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {serialResult.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">
                    {serialResult.product?.name || 'Refurbished Computer'}
                  </h4>

                  <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                    {serialResult.customer && (
                      <span>
                        Sold To: <strong className="text-slate-800">{serialResult.customer.name}</strong>
                      </span>
                    )}
                    {serialResult.saleDate && (
                      <span>
                        Purchase Date: <strong>{formatDate(serialResult.saleDate)}</strong>
                      </span>
                    )}
                    {serialResult.warrantyEnd && (
                      <span className="text-emerald-700 font-semibold">
                        Warranty Valid Until: {formatDate(serialResult.warrantyEnd)}
                      </span>
                    )}
                    {serialResult.status === 'In Stock' && (
                      <span className="text-emerald-700 font-semibold">
                        ✓ In Stock & Tested — Ready for Immediate Dispatch
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {serialResult.salesInvoiceId && (
                    <Link
                      href={`/sales/invoices/${serialResult.salesInvoiceId}`}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                    >
                      View Tax Invoice →
                    </Link>
                  )}
                  {serialResult.status === 'In Stock' && (
                    <Link
                      href={`/sales/new?productId=${serialResult.productId}&serial=${serialResult.serialNumber}`}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                    >
                      Generate Bill for this Laptop →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No matching hardware serial number found for <strong className="text-slate-800">"{serialQuery}"</strong>. Please verify the serial tag on the laptop bottom cover.
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. BUSINESS PERFORMANCE PULSE & LIVE METRICS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Business Performance & Cashflow Pulse</span>
            </h2>
            <p className="text-xs text-slate-500">
              Real-time ledger overview of sales volume, supplier payments, and receivables.
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'all_time', label: 'All Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRange(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  range === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => fetchDashboard(range)}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition ml-1"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sales Billed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Sales Billed</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">
                {loading ? '...' : formatCurrency(dashboardData?.salesTotal)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Received: {loading ? '...' : formatCurrency(dashboardData?.salesReceived)}</span>
              </div>
            </div>
          </div>

          {/* Supplier Purchases */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-200 transition">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Stock Inward / Purchases</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">
                {loading ? '...' : formatCurrency(dashboardData?.purchasesTotal)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                <span>Expenses: {loading ? '...' : formatCurrency(dashboardData?.periodExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Customer Receivables */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-cyan-200 transition">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Customer Receivables</span>
              <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-cyan-900">
                {loading ? '...' : formatCurrency(dashboardData?.totalReceivables)}
              </div>
              <Link
                href="/reports?tab=customer_outstanding"
                className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold mt-1 inline-flex items-center gap-1"
              >
                <span>View Outstanding Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Supplier Payables */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-200 transition">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Supplier Payables</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-900">
                {loading ? '...' : formatCurrency(dashboardData?.totalPayables)}
              </div>
              <Link
                href="/reports?tab=supplier_outstanding"
                className="text-xs text-amber-600 hover:text-amber-800 font-semibold mt-1 inline-flex items-center gap-1"
              >
                <span>View Payables Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Inventory Valuation Bar */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/10 text-amber-400 shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium">Total Inventory Asset Valuation</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {loading ? '...' : formatCurrency(dashboardData?.currentStockValue)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="border-l border-white/10 pl-4">
              <div className="text-slate-400">Total Units in Stock</div>
              <div className="text-base font-bold text-white mt-0.5">
                {loading ? '...' : dashboardData?.totalStockUnits || 0} Units
              </div>
            </div>
            <div className="border-l border-white/10 pl-4">
              <div className="text-slate-400">Product Models</div>
              <div className="text-base font-bold text-white mt-0.5">
                {loading ? '...' : dashboardData?.totalProductsCount || 0} Catalog Items
              </div>
            </div>
            <Link
              href="/inventory/products"
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition shrink-0 ml-auto sm:ml-0"
            >
              Full Inventory →
            </Link>
          </div>
        </div>
      </section>

      {/* 4. FEATURED HARDWARE & CERTIFIED LAPTOP SHOWCASE */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Laptop className="w-5 h-5 text-indigo-600" />
              <span>Certified Laptops & Hardware Catalog</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ready-to-ship business laptops, desktops, NVMe SSDs, and RAM with warranty coverage.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'All', label: 'All Models' },
              { id: 'Refurbished Laptop', label: '💻 Laptops' },
              { id: 'Desktop', label: '🖥️ Desktops' },
              { id: 'SSD', label: '⚡ SSDs' },
              { id: 'RAM', label: '🧠 RAM' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {productsLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-8 bg-slate-200 rounded w-1/2 mt-4" />
              </div>
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              No products found in this category.
            </div>
          ) : (
            products.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {item.brand || item.category}
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full ${
                        item.currentStock > 3
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.currentStock > 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.currentStock > 0 ? `${item.currentStock} In Stock` : 'Out of Stock'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-2">
                    {item.name}
                  </h3>

                  {/* Hardware Specs Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.cpu && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        <Cpu className="w-3 h-3 text-slate-500" />
                        {item.cpu}
                      </span>
                    )}
                    {item.ram && (
                      <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {item.ram}
                      </span>
                    )}
                    {item.storage && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        {item.storage}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Selling Price</span>
                    <span className="text-base font-black text-slate-900">
                      {formatCurrency(item.sellingPrice)}
                    </span>
                  </div>

                  <Link
                    href={`/sales/new?productId=${item.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    title="Create Tax Invoice with this item"
                  >
                    <span>Bill Item</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 5. RECENT ACTIVITY & DIRECT DOWNLOAD/SHARE STREAM */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customer Sales Invoices */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Customer Invoices</h3>
                <p className="text-xs text-slate-500">Instant PDF download & WhatsApp sharing</p>
              </div>
            </div>
            <Link href="/sales/invoices" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              View All Invoices →
            </Link>
          </div>

          <div className="space-y-3">
            {(!dashboardData?.recentSales || dashboardData.recentSales.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">No invoices recorded yet.</div>
            ) : (
              dashboardData.recentSales.map((inv: any) => (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/sales/invoices/${inv.id}`}
                        className="font-bold text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Customer: <strong className="text-slate-800">{inv.customer?.name}</strong> • {formatDate(inv.date)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">
                        {formatCurrency(inv.grandTotal)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {inv.items?.length || 1} item(s)
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        download
                        className="p-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition"
                        title="Download Bill PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setShareInvoice(inv)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 border border-emerald-100 rounded-xl transition"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/sales/invoices/${inv.id}`}
                        className="p-2 text-slate-500 hover:bg-slate-100 border border-slate-100 rounded-xl transition"
                        title="Print / View"
                      >
                        <Printer className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Supplier Purchases */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Supplier Inward Bills</h3>
                <p className="text-xs text-slate-500">Stock updates & vendor balance tracking</p>
              </div>
            </div>
            <Link href="/purchases/all" className="text-xs font-bold text-emerald-600 hover:text-emerald-800">
              View Purchases →
            </Link>
          </div>

          <div className="space-y-3">
            {(!dashboardData?.recentPurchases || dashboardData.recentPurchases.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">No supplier purchases yet.</div>
            ) : (
              dashboardData.recentPurchases.map((po: any) => (
                <div
                  key={po.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {po.supplierInvoiceNumber || po.purchaseNumber}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          po.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {po.paymentStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Supplier: <strong className="text-slate-700">{po.supplier?.name}</strong> • {formatDate(po.date)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">
                      {formatCurrency(po.grandTotal)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Due: {formatCurrency(po.balanceDue)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 6. STORE IDENTITY & CONTACT FOOTER CARD */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Location & Address */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-900">Workshop & Retail Store</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {settings?.address || 'Ashraya 10, GST compound, new ranip, Ahmedabad 382470.'}
              </p>
              <div className="text-xs font-semibold text-indigo-700 pt-1">
                State: Gujarat (State Code: 24)
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-900">Direct Contact & Support</h4>
              <p className="text-xs text-slate-600">
                Phone / WhatsApp: <strong className="text-slate-900">+91 {settings?.phone || '9662278994'}</strong>
              </p>
              <p className="text-xs text-slate-600">
                Email: <strong className="text-slate-900">{settings?.email || 'rajsoni2962@gmail.com'}</strong>
              </p>
              <a
                href={`https://wa.me/91${settings?.phone || '9662278994'}?text=Hello%20Ashirwad%20Technologies,%20I%20have%20an%20inquiry.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 pt-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp Directly →</span>
              </a>
            </div>
          </div>

          {/* Banking Details */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-900">Official Banking & Details</h4>
              {settings?.gstin && settings.gstin.trim() !== '' && settings.gstin !== 'null' ? (
                <p className="text-xs text-slate-600">
                  GSTIN: <strong className="text-slate-900 font-mono">{settings.gstin}</strong>
                </p>
              ) : null}
              <p className="text-xs text-slate-600">
                Bank: {settings?.bankName || 'State Bank of India'} (A/C: {settings?.accountNumber || '39485720194'})
              </p>
              <p className="text-xs font-semibold text-purple-700 font-mono">
                UPI: {settings?.upiId || '9662278994@upi'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Share Modal for Recent Invoices */}
      {shareInvoice && (
        <WhatsAppShareModal
          isOpen={Boolean(shareInvoice)}
          onClose={() => setShareInvoice(null)}
          invoice={shareInvoice}
          settings={settings}
          onShared={() => fetchDashboard(range)}
        />
      )}
    </div>
  );
}
