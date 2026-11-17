'use client';

import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  Truck,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierInvoiceNumber?: string | null;
  date: string;
  grandTotal: number;
  paymentStatus: string;
  supplier?: {
    name: string;
    phone?: string | null;
  };
  items: Array<{
    description?: string | null;
    quantity: number;
  }>;
}

export default function PurchaseReturnsPage() {
  const [cancelledPurchases, setCancelledPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCancelled = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases');
      const data = await res.json();
      if (data.success && data.data) {
        const returns = data.data.filter((po: any) => po.paymentStatus === 'Cancelled');
        setCancelledPurchases(returns);
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

  const filtered = cancelledPurchases.filter((po) => {
    const q = search.toLowerCase();
    const sup = po.supplier?.name.toLowerCase() || '';
    const num = po.purchaseNumber.toLowerCase();
    const invNum = po.supplierInvoiceNumber?.toLowerCase() || '';
    return sup.includes(q) || num.includes(q) || invNum.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Purchase Returns
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit log of returned goods, vendor reversals, and cancelled purchase bills.
          </p>
        </div>
        <Link
          href="/purchases/all"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
        >
          <Truck className="w-4 h-4 text-slate-500" />
          <span>All Purchases</span>
        </Link>
      </div>

      {/* Filter & Metric */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by PO, bill number or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total Returns: <span className="font-semibold text-slate-900 tabular-nums font-mono">{cancelledPurchases.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <span className="text-sm">Loading records...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="font-medium text-slate-700">No records found</div>
            <p className="text-xs text-slate-400 mt-1">
              Cancelled vendor purchase bills will appear in this log.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">PO & Bill</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4 text-right">Reversed Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-900 tabular-nums">{po.purchaseNumber}</div>
                      {po.supplierInvoiceNumber && (
                        <div className="text-xs text-slate-400 font-mono tabular-nums">Bill: {po.supplierInvoiceNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500 tabular-nums font-mono">
                      {new Date(po.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {po.supplier?.name || 'Supplier'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {po.items.map((i) => i.description).filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums font-mono">
                      {formatCurrency(po.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        Cancelled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
