'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  RotateCcw,
  Search,
  ShoppingCart,
  Calendar,
  AlertCircle,
  RefreshCw,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  grandTotal: number;
  paymentStatus: string;
  customer?: {
    name: string;
    phone: string;
  };
  items: Array<{
    description?: string | null;
    quantity: number;
  }>;
}

export default function SalesReturnsPage() {
  const [cancelledInvoices, setCancelledInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCancelled = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (data.success && data.data) {
        // Cancelled sales are recorded as returns
        const returns = data.data.filter((inv: any) => inv.paymentStatus === 'Cancelled');
        setCancelledInvoices(returns);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelled();
  }, []);

  const filtered = cancelledInvoices.filter((inv) => {
    const q = search.toLowerCase();
    const cust = inv.customer?.name.toLowerCase() || '';
    const num = inv.invoiceNumber.toLowerCase();
    return cust.includes(q) || num.includes(q);
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-slate-700" />
              Sales Returns
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cancelled invoices and restored inventory records
            </p>
          </div>
          <Link
            href="/sales/invoices"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <ShoppingCart className="w-4 h-4 text-slate-600" />
            Active Invoices
          </Link>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-600">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900">Inventory Restoration</div>
            <div className="text-slate-500 mt-0.5">
              Cancelled invoices automatically return items to inventory, restore serial numbers to stock, and reverse customer ledger entries.
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer or invoice #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
            />
          </div>
          <div className="text-xs text-slate-500">
            Returns: <span className="font-mono font-semibold text-slate-800 tabular-nums">{cancelledInvoices.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-600" />
              <span className="text-xs">Loading returns...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">No records found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                        {new Date(inv.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{inv.customer?.name || 'Walk-in'}</div>
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums">{inv.customer?.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {inv.items.map((i) => i.description).filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        ₹{inv.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          Restored
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/sales/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
