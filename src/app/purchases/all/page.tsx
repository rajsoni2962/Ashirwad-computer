'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  Camera,
  Search,
  Eye,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  Download
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AllPurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/purchases?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) setPurchases(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [search]);

  const handleCancelPurchase = async (id: string, poNumber: string) => {
    if (!confirm(`Are you sure you want to cancel Purchase ${poNumber}? This will deduct the added inventory stock and adjust supplier balance.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/purchases/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`Purchase ${poNumber} cancelled and stock reversed!`);
        fetchPurchases();
      } else {
        alert(json.error || 'Failed to cancel purchase');
      }
    } catch (err) {
      alert('Error cancelling purchase');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-slate-700" />
            <span>Purchases</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supplier purchase invoices, incoming inventory, and payables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/purchases/import-bill"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition"
          >
            <Camera className="w-3.5 h-3.5 text-slate-600" />
            <span>Import Bill</span>
          </Link>

          <Link
            href="/purchases/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Purchase</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by supplier, bill #, PO #..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
          />
        </div>
        <div className="text-xs text-slate-500">
          Records: <span className="font-mono font-semibold text-slate-800 tabular-nums">{purchases.length}</span>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">PO Ref</th>
                <th className="py-3 px-4">Supplier Bill #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading purchases...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No records found.
                  </td>
                </tr>
              ) : (
                purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">{po.purchaseNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-700 tabular-nums">{po.supplierInvoiceNumber || '—'}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap tabular-nums">{formatDate(po.date)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{po.supplier?.name}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {po.items?.map((it: any) => `${it.product?.name || it.description} (+${it.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(po.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 tabular-nums">
                      {formatCurrency(po.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600 tabular-nums">
                      {formatCurrency(po.balanceDue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${po.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : po.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                      >
                        {po.status === 'Cancelled' ? 'Cancelled' : po.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setSelectedBill(po)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View</span>
                      </button>

                      {po.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleCancelPurchase(po.id, po.purchaseNumber)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition"
                          title="Cancel Purchase"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-5 border border-slate-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Purchase Bill: <span className="font-mono tabular-nums">{selectedBill.supplierInvoiceNumber || selectedBill.purchaseNumber}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supplier: {selectedBill.supplier?.name} • PO: {selectedBill.purchaseNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Items Received</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Taxable</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBill.items?.map((it: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {it.product?.name || it.description}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-medium text-slate-900 tabular-nums">
                          +{it.quantity} {it.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">{formatCurrency(it.rate)}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">{formatCurrency(it.taxableAmount)}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">{formatCurrency(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attached Scanned Document */}
            {selectedBill.billFileUrl && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Attached Bill Document</h4>
                <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center max-h-72 overflow-hidden">
                  <img
                    src={selectedBill.billFileUrl}
                    alt="Original Bill"
                    className="max-h-64 object-contain rounded-md"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {selectedBill.billFileUrl ? (
                <a
                  href={selectedBill.billFileUrl}
                  download={`Purchase_Bill_${selectedBill.supplierInvoiceNumber || selectedBill.purchaseNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Scan</span>
                </a>
              ) : (
                <div />
              )}

              <button
                onClick={() => setSelectedBill(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
