'use client';

import React, { useState, useMemo } from 'react';
import { X, GitCompare, ArrowRight, DollarSign, Package, User, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvoiceVersionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export default function InvoiceVersionCompareModal({
  isOpen,
  onClose,
  invoice,
}: InvoiceVersionCompareModalProps) {
  if (!isOpen || !invoice) return null;

  // Build version snapshots list
  // Revisions are ordered desc by default, let's sort them ascending so Version 1 is first
  const revisionsList = useMemo(() => {
    const list = [...(invoice.revisions || [])].sort((a, b) => a.revisionNumber - b.revisionNumber);

    // Each version snapshot can be reconstructed from newSnapshot
    const versionMap = new Map<number, any>();

    list.forEach((rev) => {
      let snap: any = null;
      try {
        snap = typeof rev.newSnapshot === 'string' ? JSON.parse(rev.newSnapshot) : rev.newSnapshot;
      } catch {}
      if (snap) {
        versionMap.set(rev.revisionNumber, {
          revisionNumber: rev.revisionNumber,
          label: `Version ${rev.revisionNumber} — ${rev.changeReason || rev.action}`,
          action: rev.action,
          changedBy: rev.changedBy,
          createdAt: rev.createdAt,
          data: snap,
        });
      }
    });

    // Also ensure current latest version is present
    if (!versionMap.has(invoice.revisionNumber || 1)) {
      versionMap.set(invoice.revisionNumber || 1, {
        revisionNumber: invoice.revisionNumber || 1,
        label: `Version ${invoice.revisionNumber || 1} — Current Active`,
        action: 'CURRENT',
        changedBy: 'admin',
        createdAt: invoice.updatedAt || new Date().toISOString(),
        data: invoice,
      });
    }

    // If version 1 is missing, synthesize from previousSnapshot of version 2 or current
    if (!versionMap.has(1)) {
      const firstRev = list[0];
      let prevSnap: any = null;
      if (firstRev?.previousSnapshot) {
        try {
          prevSnap = typeof firstRev.previousSnapshot === 'string' ? JSON.parse(firstRev.previousSnapshot) : firstRev.previousSnapshot;
        } catch {}
      }
      versionMap.set(1, {
        revisionNumber: 1,
        label: `Version 1 — Original Invoice`,
        action: 'ORIGINAL',
        changedBy: 'admin',
        createdAt: invoice.createdAt,
        data: prevSnap || invoice,
      });
    }

    return Array.from(versionMap.values()).sort((a, b) => a.revisionNumber - b.revisionNumber);
  }, [invoice]);

  const [verAIndex, setVerAIndex] = useState<number>(0);
  const [verBIndex, setVerBIndex] = useState<number>(Math.max(0, revisionsList.length - 1));

  const verA = revisionsList[verAIndex] || revisionsList[0];
  const verB = revisionsList[verBIndex] || revisionsList[revisionsList.length - 1];

  const totalA = verA?.data?.grandTotal || verA?.data?.total || 0;
  const totalB = verB?.data?.grandTotal || verB?.data?.total || 0;
  const totalDiff = totalB - totalA;

  // Extract customer data
  const getCustomer = (ver: any) => {
    const d = ver?.data;
    if (d?.customerSnapshot) {
      try {
        return typeof d.customerSnapshot === 'string' ? JSON.parse(d.customerSnapshot) : d.customerSnapshot;
      } catch {}
    }
    return d?.customer || {};
  };

  const custA = getCustomer(verA);
  const custB = getCustomer(verB);

  // Extract items
  const itemsA: any[] = verA?.data?.items || [];
  const itemsB: any[] = verB?.data?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Version Comparison</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {invoice.invoiceNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect changes between revisions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Pickers & Difference Highlight */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Version A Dropdown */}
            <div className="md:col-span-5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Baseline (Version A)
              </label>
              <select
                value={verAIndex}
                onChange={(e) => setVerAIndex(Number(e.target.value))}
                className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-slate-900"
              >
                {revisionsList.map((rev, idx) => (
                  <option key={idx} value={idx}>
                    {rev.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Compare Arrow & Difference Badge */}
            <div className="md:col-span-2 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 mb-1">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div
                className={`text-xs font-bold font-mono tabular-nums px-2.5 py-1 rounded-full ${
                  totalDiff === 0
                    ? 'bg-slate-200 text-slate-700'
                    : totalDiff > 0
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {totalDiff === 0
                  ? 'No Delta'
                  : totalDiff > 0
                  ? `+${formatCurrency(totalDiff)}`
                  : formatCurrency(totalDiff)}
              </div>
            </div>

            {/* Version B Dropdown */}
            <div className="md:col-span-5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Comparison (Version B)
              </label>
              <select
                value={verBIndex}
                onChange={(e) => setVerBIndex(Number(e.target.value))}
                className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-slate-900"
              >
                {revisionsList.map((rev, idx) => (
                  <option key={idx} value={idx}>
                    {rev.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Financial Totals & Payments Comparison */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Financials & Payments Summary</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-200 text-xs">
              <div className="p-4 space-y-2 bg-slate-50/30">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Version {verA.revisionNumber}</div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Grand Total:</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">{formatCurrency(totalA)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Paid Amount:</span>
                  <span className="font-medium text-emerald-700 font-mono tabular-nums">{formatCurrency(verA?.data?.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Balance Due:</span>
                  <span className="font-medium text-rose-700 font-mono tabular-nums">{formatCurrency(verA?.data?.balanceDue || 0)}</span>
                </div>
              </div>

              <div className="p-4 space-y-2 bg-slate-50/60">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Version {verB.revisionNumber}</div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Grand Total:</span>
                  <span className={`font-bold font-mono tabular-nums ${totalDiff !== 0 ? 'text-slate-950 font-black' : 'text-slate-900'}`}>
                    {formatCurrency(totalB)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Paid Amount:</span>
                  <span className="font-medium text-emerald-700 font-mono tabular-nums">{formatCurrency(verB?.data?.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Balance Due:</span>
                  <span className="font-medium text-rose-700 font-mono tabular-nums">{formatCurrency(verB?.data?.balanceDue || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Customer Details Comparison */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-slate-600" />
              <span>Customer Details</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-200 text-xs">
              <div className="p-4 space-y-1.5 bg-slate-50/30">
                <div className="font-bold text-slate-800">{custA.name || 'N/A'}</div>
                <div className="text-slate-600">Phone: <span className="font-mono tabular-nums">{custA.phone || '-'}</span></div>
                <div className="text-slate-600">GSTIN: <span className="font-mono">{custA.gstin || '-'}</span></div>
              </div>

              <div className="p-4 space-y-1.5 bg-slate-50/60">
                <div className={`font-bold ${custB.name !== custA.name ? 'text-slate-900 font-black' : 'text-slate-800'}`}>
                  {custB.name || 'N/A'}
                </div>
                <div className="text-slate-600">
                  Phone:{' '}
                  <span className={`font-mono tabular-nums ${custB.phone !== custA.phone ? 'text-amber-700 font-bold' : ''}`}>
                    {custB.phone || '-'}
                  </span>
                </div>
                <div className="text-slate-600">
                  GSTIN:{' '}
                  <span className={`font-mono ${custB.gstin !== custA.gstin ? 'text-amber-700 font-bold' : ''}`}>
                    {custB.gstin || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Items & Line Totals Comparison */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-600" />
              <span>Items & Pricing</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-200 text-xs">
              {/* Version A Items */}
              <div className="p-4 space-y-3 bg-slate-50/30">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Version {verA.revisionNumber} ({itemsA.length} items)</div>
                {itemsA.length === 0 ? (
                  <p className="text-slate-400 italic">No line items snapshot recorded</p>
                ) : (
                  itemsA.map((it, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-white">
                      <div className="font-bold text-slate-800">{it.productName || it.description || it.product?.name || `Item ${idx+1}`}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                        Qty: {it.quantity} • Rate: {formatCurrency(it.rate)} • Disc: {formatCurrency(it.discount || 0)}
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 mt-1 font-mono tabular-nums">
                        Total: {formatCurrency(it.total || (it.rate * it.quantity))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Version B Items */}
              <div className="p-4 space-y-3 bg-slate-50/60">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Version {verB.revisionNumber} ({itemsB.length} items)</div>
                {itemsB.length === 0 ? (
                  <p className="text-slate-400 italic">No line items snapshot recorded</p>
                ) : (
                  itemsB.map((it, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-white">
                      <div className="font-bold text-slate-800">{it.productName || it.description || it.product?.name || `Item ${idx+1}`}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                        Qty: {it.quantity} • Rate: {formatCurrency(it.rate)} • Disc: {formatCurrency(it.discount || 0)}
                      </div>
                      <div className="text-[11px] font-bold text-slate-900 mt-1 font-mono tabular-nums">
                        Total: {formatCurrency(it.total || (it.rate * it.quantity))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
