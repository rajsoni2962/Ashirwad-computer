'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trash2,
  RotateCcw,
  Eye,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  DollarSign,
  ArrowLeft,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function RecentlyDeletedInvoicesPage() {
  const [deletedInvoices, setDeletedInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgingId, setPurgingId] = useState<string | null>(null);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices/recently-deleted');
      const json = await res.json();
      if (json.success) {
        setDeletedInvoices(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching recently deleted invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Restore invoice ${invoiceNumber} back to All Invoices? Physical product stock will be safely reconciled.`)) {
      return;
    }

    setRestoringId(id);
    try {
      const res = await fetch(`/api/invoices/recently-deleted/${id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restoredBy: 'admin' }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message || `Invoice ${invoiceNumber} restored successfully!`);
        fetchDeleted();
      } else {
        alert(json.error || 'Failed to restore invoice');
      }
    } catch (err: any) {
      alert(err.message || 'Error restoring invoice');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id: string, invoiceNumber: string) => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY DELETE invoice ${invoiceNumber}?\n\nWARNING: This cannot be undone! Historical financial records and payment logs will remain detached for compliance.`
      )
    ) {
      return;
    }

    setPurgingId(id);
    try {
      const res = await fetch(`/api/invoices/recently-deleted/${id}/permanent`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message || `Invoice ${invoiceNumber} permanently purged.`);
        fetchDeleted();
      } else {
        alert(json.error || 'Failed to permanently purge invoice');
      }
    } catch (err: any) {
      alert(err.message || 'Error purging invoice');
    } finally {
      setPurgingId(null);
    }
  };

  const filtered = deletedInvoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q) ||
      inv.customer?.phone?.includes(q) ||
      inv.deletedBy?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/sales/invoices"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-slate-700" />
              <span>Recently Deleted Invoices</span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                7-Day Retention
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Restore deleted invoices within 7 days with automated inventory and ledger reconciliation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDeleted}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            href="/sales/invoices"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition"
          >
            <span>Active Invoices</span>
          </Link>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-900">Retention Policy:</span> Deleted invoices are held for 7 days before permanent expiry. Restoring an invoice safely reconciles stock and customer ledger balances.
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or customer..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
          />
        </div>
        <div className="text-xs text-slate-500">
          Records: <span className="font-mono font-semibold text-slate-800 tabular-nums">{filtered.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Deleted At</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-center">Remaining</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading deleted invoices...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Trash2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Recycle bin is empty.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const delDate = inv.deletedAt
                    ? new Date(inv.deletedAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  const expDate = inv.expiresAt
                    ? new Date(inv.expiresAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                        <Link
                          href={`/sales/invoices/${inv.id}`}
                          className="hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        {inv.deletionReason && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {inv.deletionReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{inv.customer?.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums">{inv.customer?.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono tabular-nums whitespace-nowrap">
                        {formatDate(inv.date)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] tabular-nums">
                        <div className="text-slate-700">{delDate}</div>
                        <div className="text-[10px] text-slate-400">by {inv.deletedBy || 'admin'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px] tabular-nums">
                        {expDate}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {inv.isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            <Clock className="w-3 h-3" />
                            {inv.timeRemaining}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <Link
                          href={`/sales/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </Link>

                        {!inv.isExpired && (
                          <button
                            onClick={() => handleRestore(inv.id, inv.invoiceNumber)}
                            disabled={restoringId === inv.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition disabled:opacity-50"
                            title="Restore invoice"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{restoringId === inv.id ? 'Restoring...' : 'Restore'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handlePermanentDelete(inv.id, inv.invoiceNumber)}
                          disabled={purgingId === inv.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                          title="Permanently purge invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{purgingId === inv.id ? 'Purging...' : 'Delete'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
