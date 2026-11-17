'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingCart,
  Truck,
  Package,
  ArrowUpRight,
  ArrowRight,
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
  Download,
  MessageCircle,
  Printer,
  ChevronRight,
  Check,
  Copy,
  Receipt
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
      console.error('Failed to load dashboard:', err);
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
        setProducts(json.data.slice(0, 8));
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
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchDashboard(range);
  }, [range]);

  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    const handleCloudSync = () => {
      fetchDashboard(range);
      fetchProducts(selectedCategory);
    };
    window.addEventListener('cloudDataSynced', handleCloudSync);
    return () => window.removeEventListener('cloudDataSynced', handleCloudSync);
  }, [range, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time sales, inventory, and ledger overview
          </p>
        </div>

        {/* Action Controls & Range Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'Week' },
              { id: 'this_month', label: 'Month' },
              { id: 'all_time', label: 'All' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRange(tab.id)}
                className={`px-2.5 py-1 font-semibold rounded-md transition ${range === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => fetchDashboard(range)}
              className="p-1 text-slate-500 hover:text-slate-800 rounded ml-0.5"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <Link
            href="/sales/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </Link>

          <Link
            href="/purchases/import-bill"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold text-xs rounded-lg border border-slate-200 transition"
          >
            <Camera className="w-3.5 h-3.5 text-slate-600" />
            <span>Import Bill</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Sales Billed</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
              {loading ? '—' : formatCurrency(dashboardData?.salesTotal)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Received:</span>
              <span className="font-semibold text-emerald-600 tabular-nums font-mono">
                {loading ? '—' : formatCurrency(dashboardData?.salesReceived)}
              </span>
            </div>
          </div>
        </div>

        {/* Purchases */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Purchases</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
              {loading ? '—' : formatCurrency(dashboardData?.purchasesTotal)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Expenses:</span>
              <span className="font-semibold text-slate-700 tabular-nums font-mono">
                {loading ? '—' : formatCurrency(dashboardData?.periodExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Receivables */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Receivables</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
              {loading ? '—' : formatCurrency(dashboardData?.totalReceivables)}
            </div>
            <Link
              href="/reports?tab=customer_outstanding"
              className="text-xs text-blue-600 hover:underline font-semibold mt-1 inline-flex items-center gap-1"
            >
              <span>View Outstanding</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Payables */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Payables</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
              {loading ? '—' : formatCurrency(dashboardData?.totalPayables)}
            </div>
            <Link
              href="/reports?tab=supplier_outstanding"
              className="text-xs text-amber-700 hover:underline font-semibold mt-1 inline-flex items-center gap-1"
            >
              <span>View Payables</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Inventory Asset Summary */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-800 text-blue-400 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Stock Asset Valuation</div>
            <div className="text-xl sm:text-2xl font-bold text-white tabular-nums font-mono mt-0.5">
              {loading ? '—' : formatCurrency(dashboardData?.currentStockValue)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="border-l border-slate-800 pl-4">
            <div className="text-slate-400">Total Units</div>
            <div className="text-sm font-semibold text-white tabular-nums font-mono mt-0.5">
              {loading ? '—' : dashboardData?.totalStockUnits || 0} Units
            </div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <div className="text-slate-400">Products</div>
            <div className="text-sm font-semibold text-white tabular-nums font-mono mt-0.5">
              {loading ? '—' : dashboardData?.totalProductsCount || 0} Items
            </div>
          </div>
          <Link
            href="/inventory/products"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shrink-0 ml-auto sm:ml-0"
          >
            Inventory Catalog →
          </Link>
        </div>
      </div>

      {/* 4. Serial Number & Warranty Verifier */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Hardware Serial & Warranty Lookup
              </h2>
              <p className="text-xs text-slate-500">
                Verify stock status, sale date, and warranty coverage
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSerialSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={serialQuery}
              onChange={(e) => setSerialQuery(e.target.value)}
              placeholder="Enter serial number..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono transition"
            />
          </div>
          <button
            type="submit"
            disabled={searchingSerial}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-lg transition disabled:opacity-50 shrink-0"
          >
            {searchingSerial ? 'Searching...' : 'Lookup'}
          </button>
        </form>

        {serialSearched && (
          <div className="pt-2 animate-in fade-in duration-150">
            {serialResult ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {serialResult.serialNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(serialResult.serialNumber)}
                      className="p-1 text-slate-500 hover:text-slate-800"
                      title="Copy Serial"
                    >
                      {copiedSerial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${serialResult.status === 'Sold'
                          ? 'bg-blue-100 text-blue-700'
                          : serialResult.status === 'In Stock'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                    >
                      {serialResult.status}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-800">
                    {serialResult.product?.name || 'Hardware Unit'}
                  </div>

                  <div className="text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                    {serialResult.customer && (
                      <span>Customer: <strong>{serialResult.customer.name}</strong></span>
                    )}
                    {serialResult.saleDate && (
                      <span>Sold: <strong className="tabular-nums font-mono">{formatDate(serialResult.saleDate)}</strong></span>
                    )}
                    {serialResult.warrantyEnd && (
                      <span className="text-emerald-700 font-semibold">
                        Warranty Valid Until: <strong className="tabular-nums font-mono">{formatDate(serialResult.warrantyEnd)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {serialResult.salesInvoiceId && (
                    <Link
                      href={`/sales/invoices/${serialResult.salesInvoiceId}`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                    >
                      View Invoice →
                    </Link>
                  )}
                  {serialResult.status === 'In Stock' && (
                    <Link
                      href={`/sales/new?productId=${serialResult.productId}&serial=${serialResult.serialNumber}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition"
                    >
                      Bill Serial →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No record found for "{serialQuery}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Recent Activity: Invoices & Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Invoices</h3>
            </div>
            <Link href="/sales/invoices" className="text-xs font-semibold text-blue-600 hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-2">
            {(!dashboardData?.recentSales || dashboardData.recentSales.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">No records found.</div>
            ) : (
              dashboardData.recentSales.map((inv: any) => (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/sales/invoices/${inv.id}`}
                        className="font-bold text-blue-600 hover:underline font-mono"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                          }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      {inv.customer?.name} • <span className="tabular-nums font-mono">{formatDate(inv.date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                    <div className="text-right">
                      <div className="font-bold text-slate-900 tabular-nums font-mono">
                        {formatCurrency(inv.grandTotal)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        download
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setShareInvoice(inv)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/sales/invoices/${inv.id}`}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                        title="Print / View"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Purchase Bills</h3>
            </div>
            <Link href="/purchases/all" className="text-xs font-semibold text-emerald-700 hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-2">
            {(!dashboardData?.recentPurchases || dashboardData.recentPurchases.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">No records found.</div>
            ) : (
              dashboardData.recentPurchases.map((po: any) => (
                <div
                  key={po.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">
                        {po.supplierInvoiceNumber || po.purchaseNumber}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${po.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                          }`}
                      >
                        {po.paymentStatus}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      {po.supplier?.name} • <span className="tabular-nums font-mono">{formatDate(po.date)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-slate-900 tabular-nums font-mono">
                      {formatCurrency(po.grandTotal)}
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums font-mono">
                      Due: {formatCurrency(po.balanceDue)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
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
