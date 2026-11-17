'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Printer,
  TrendingUp,
  ShoppingCart,
  Truck,
  Layers,
  Users,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

type TabKey =
  | 'sales'
  | 'purchases'
  | 'stock'
  | 'profit'
  | 'customer_outstanding'
  | 'supplier_outstanding'
  | 'gst';

function ReportsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'sales';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Calculate from & to dates based on preset
  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === 'today') {
      const from = now.toISOString().split('T')[0];
      return { from, to: from };
    }
    if (dateFilter === 'week') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      return { from: past.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    if (dateFilter === 'month') {
      const past = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: past.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    return { from: '', to: '' };
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      const params = new URLSearchParams({ type: activeTab });
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, dateFilter]);

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { key: 'sales', label: 'Sales', icon: ShoppingCart },
    { key: 'purchases', label: 'Purchases', icon: Truck },
    { key: 'stock', label: 'Stock Valuation', icon: Layers },
    { key: 'profit', label: 'Profit & Margins', icon: TrendingUp },
    { key: 'customer_outstanding', label: 'Customer Dues', icon: Users },
    { key: 'supplier_outstanding', label: 'Supplier Payables', icon: Truck },
    { key: 'gst', label: 'GST & HSN', icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Financial summaries, taxation reports, and profit & loss statements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === 'today' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === 'week' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === 'month' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === 'all' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="print:hidden flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 custom-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as TabKey)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Printable Business Header */}
      <div className="hidden print:flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ASHIRWAD TECHNOLOGIES</h2>
          <div className="text-xs text-slate-500 mt-1">
            Ashraya 10, GST compound, New Ranip, Ahmedabad 382470 | Phone: 9662278994
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-slate-900 uppercase">
            {tabs.find((t) => t.key === activeTab)?.label} Report
          </div>
          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Generated: {new Date().toLocaleDateString('en-IN')}
          </div>
        </div>
      </div>

      {/* Report Dynamic Content */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
          <span className="text-sm font-medium text-slate-500">Loading report data...</span>
        </div>
      ) : !reportData ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center text-slate-400 text-sm">
          No records found for the selected period.
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: SALES REPORT */}
          {activeTab === 'sales' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Total Sales</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalSales || 0)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 tabular-nums font-mono">{reportData.summary?.count || 0} Invoices</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Taxable Sales</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalTaxable || 0)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Pre-tax sales amount</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Payments Collected</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalReceived || 0)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Settled payments</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Pending Collection</div>
                  <div className="text-2xl font-bold text-rose-600 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalBalance || 0)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Outstanding dues</div>
                </div>
              </div>

              {/* Invoices List */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-semibold text-slate-900 text-sm">
                  Sales Transactions
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200/80 font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3 px-4">Invoice & Date</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4 text-right">Taxable Amount</th>
                        <th className="py-3 px-4 text-right">GST</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-4 text-right">Received</th>
                        <th className="py-3 px-4 text-right">Balance</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.invoices?.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <Link href={`/sales/invoices/${inv.id}`} className="font-mono font-semibold text-slate-900 hover:underline tabular-nums">
                              {inv.invoiceNumber}
                            </Link>
                            <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                              {new Date(inv.date).toLocaleDateString('en-IN')}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">{inv.customer?.name}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(inv.taxableAmount)}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0))}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono tabular-nums">{formatCurrency(inv.grandTotal)}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(inv.paidAmount)}</td>
                          <td className={`py-3 px-4 text-right font-semibold font-mono tabular-nums ${inv.balanceDue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {formatCurrency(inv.balanceDue)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                              {inv.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PURCHASES REPORT */}
          {activeTab === 'purchases' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Total Purchases</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalPurchases || 0)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 tabular-nums font-mono">{reportData.summary?.count || 0} Bills registered</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Taxable Purchase Value</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalTaxable || 0)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Disbursed to Suppliers</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalPaid || 0)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Payable Balance</div>
                  <div className="text-2xl font-bold text-rose-600 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalPayable || 0)}
                  </div>
                </div>
              </div>

              {/* Purchases List */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-semibold text-slate-900 text-sm">
                  Supplier Purchase Bills
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200/80 font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3 px-4">PO & Bill</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4 text-right">Taxable Value</th>
                        <th className="py-3 px-4 text-right">Bill Total</th>
                        <th className="py-3 px-4 text-right">Paid</th>
                        <th className="py-3 px-4 text-right">Balance</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.purchases?.map((po: any) => (
                        <tr key={po.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-slate-900 tabular-nums">{po.purchaseNumber}</span>
                            {po.supplierInvoiceNumber && (
                              <div className="text-[10px] text-slate-400 font-mono tabular-nums">Bill: {po.supplierInvoiceNumber}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums">{new Date(po.date).toLocaleDateString('en-IN')}</td>
                          <td className="py-3 px-4 font-medium text-slate-900">{po.supplier?.name}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(po.taxableAmount)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono tabular-nums">{formatCurrency(po.grandTotal)}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(po.paidAmount)}</td>
                          <td className={`py-3 px-4 text-right font-semibold font-mono tabular-nums ${po.balanceDue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {formatCurrency(po.balanceDue)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                              {po.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 3: STOCK VALUATION */}
          {activeTab === 'stock' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Units in Stock</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {reportData.summary?.totalStockUnits || 0}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Valuation at Cost</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalPurchaseValue || 0)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Potential Retail Value</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalSalesValue || 0)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Potential Margin</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.potentialMargin || 0)}
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-semibold text-slate-900 text-sm">
                  Inventory Breakdown
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200/80 font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-center">In Stock</th>
                        <th className="py-3 px-4 text-right">Cost Rate</th>
                        <th className="py-3 px-4 text-right">Selling Rate</th>
                        <th className="py-3 px-4 text-right">Cost Value</th>
                        <th className="py-3 px-4 text-right">Retail Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.products?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                          <td className="py-3 px-4">{p.category}</td>
                          <td className="py-3 px-4 text-center font-semibold tabular-nums font-mono">{p.currentStock}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(p.purchasePrice)}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(p.sellingPrice)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono tabular-nums">
                            {formatCurrency((p.currentStock || 0) * (p.purchasePrice || 0))}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono tabular-nums">
                            {formatCurrency((p.currentStock || 0) * (p.sellingPrice || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 4: PROFIT & MARGINS */}
          {activeTab === 'profit' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Sales Revenue</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalRevenue || 0)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Cost of Goods Sold (COGS)</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalCost || 0)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Gross Profit</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.grossProfit || 0)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 tabular-nums font-mono">
                    {reportData.summary?.marginPercent?.toFixed(1) || 0}% Margin
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Net Profit</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.netProfit || 0)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 tabular-nums font-mono">
                    Expenses: {formatCurrency(reportData.summary?.totalExpenses || 0)}
                  </div>
                </div>
              </div>

              {/* Item Margins Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-semibold text-slate-900 text-sm">
                  Profit Margins by Item
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200/80 font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Cost</th>
                        <th className="py-3 px-4 text-right">Revenue</th>
                        <th className="py-3 px-4 text-right">Gross Profit</th>
                        <th className="py-3 px-4 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.itemsProfit?.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">{it.invoiceNumber}</td>
                          <td className="py-3 px-4 font-medium text-slate-900">{it.productName}</td>
                          <td className="py-3 px-4 text-center tabular-nums font-mono">{it.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(it.cost)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono tabular-nums">{formatCurrency(it.revenue)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-600 font-mono tabular-nums">{formatCurrency(it.profit)}</td>
                          <td className="py-3 px-4 text-right text-slate-700 font-mono tabular-nums">{it.marginPercent?.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 5: CUSTOMER OUTSTANDING */}
          {activeTab === 'customer_outstanding' && (
            <>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Total Receivables</div>
                  <div className="text-2xl font-bold text-rose-600 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalOutstanding || 0)}
                  </div>
                </div>
                <div className="text-xs text-slate-500 text-right">
                  Accounts with Dues: <span className="font-semibold text-slate-900 tabular-nums font-mono">{reportData.summary?.count || 0}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200/80 font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3 px-4">Customer & Phone</th>
                        <th className="py-3 px-4">Unpaid Invoices</th>
                        <th className="py-3 px-4 text-right">Outstanding Amount</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.customers?.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{c.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono tabular-nums">{c.phone}</div>
                          </td>
                          <td className="py-3 px-4">
                            {c.invoices?.map((inv: any) => (
                              <div key={inv.id} className="text-xs text-slate-600 font-mono tabular-nums">
                                {inv.invoiceNumber} (Due: {formatCurrency(inv.balanceDue)})
                              </div>
                            ))}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-rose-600 text-sm tabular-nums font-mono">
                            {formatCurrency(c.currentBalance)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              href={`/customers/ledger?customerId=${c.id}`}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 text-xs transition"
                            >
                              Ledger
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 6: SUPPLIER OUTSTANDING */}
          {activeTab === 'supplier_outstanding' && (
            <>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Total Payables</div>
                  <div className="text-2xl font-bold text-rose-600 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalPayable || 0)}
                  </div>
                </div>
                <div className="text-xs text-slate-500 text-right">
                  Suppliers to Settle: <span className="font-semibold text-slate-900 tabular-nums font-mono">{reportData.summary?.count || 0}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200/80 font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Pending Bills</th>
                        <th className="py-3 px-4 text-right">Payable Balance</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.suppliers?.map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                          <td className="py-3 px-4">
                            {s.purchases?.map((po: any) => (
                              <div key={po.id} className="text-xs text-slate-600 font-mono tabular-nums">
                                {po.purchaseNumber} (Due: {formatCurrency(po.balanceDue)})
                              </div>
                            ))}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-rose-600 text-sm tabular-nums font-mono">
                            {formatCurrency(s.currentBalance)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              href={`/suppliers/ledger?supplierId=${s.id}`}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 text-xs transition"
                            >
                              Ledger
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 7: GST & HSN REPORT */}
          {activeTab === 'gst' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Taxable Turnover</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalTaxable || 0)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">CGST Collected</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalCgst || 0)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">SGST Collected</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalSgst || 0)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Total GST Output</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
                    {formatCurrency(reportData.summary?.totalGst || 0)}
                  </div>
                </div>
              </div>

              {/* HSN Summary Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-semibold text-slate-900 text-sm">
                  HSN / SAC Summary (GSTR-1 Format)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200/80 font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3 px-4">HSN / SAC</th>
                        <th className="py-3 px-4 text-center">Quantity</th>
                        <th className="py-3 px-4 text-right">Taxable Value</th>
                        <th className="py-3 px-4 text-right">GST Amount</th>
                        <th className="py-3 px-4 text-right">Total Invoice Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {reportData.hsnTable?.map((h: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">{h.hsn}</td>
                          <td className="py-3 px-4 text-center font-sans">{h.count} Pcs</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(h.taxable)}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">{formatCurrency(h.gst)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatCurrency(h.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
