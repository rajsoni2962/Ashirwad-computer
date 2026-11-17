'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Printer,
  RefreshCw,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SupplierSummary {
  id: string;
  name: string;
  phone?: string | null;
  currentBalance: number;
}

interface LedgerEntry {
  type: 'PURCHASE' | 'PAYMENT';
  id: string;
  date: string;
  reference: string;
  credit: number;
  debit: number;
  balanceChange: number;
  runningBalance: number;
  paymentStatus: string;
  details: string;
}

interface SupplierDetails {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  state: string;
  stateCode: string;
  openingBalance: number;
  currentBalance: number;
  notes?: string | null;
}

function SupplierLedgerContent() {
  const searchParams = useSearchParams();
  const initialSupplierId = searchParams.get('supplierId') || '';

  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupplierId);
  const [supplier, setSupplier] = useState<SupplierDetails | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/suppliers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSuppliers(data.data);
          if (!selectedSupplierId && data.data.length > 0) {
            setSelectedSupplierId(data.data[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedSupplierId) return;
    setLoading(true);
    fetch(`/api/suppliers/${selectedSupplierId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSupplier(data.data.supplier);
          setLedger(data.data.ledger);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedSupplierId]);

  const handlePrint = () => {
    window.print();
  };

  const totalPurchased = ledger.reduce((acc, curr) => acc + curr.credit, 0);
  const totalPaid = ledger.reduce((acc, curr) => acc + curr.debit, 0);

  return (
    <div className="space-y-6">
      {/* Action Header - hidden on print */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Supplier Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Running statement of bills, payments, and payable balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Supplier Selector Card - hidden on print */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Select Supplier
          </label>
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="w-full px-3.5 py-2 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.phone ? `(${s.phone})` : ''} — Payable: {formatCurrency(s.currentBalance)}
              </option>
            ))}
          </select>
        </div>

        {supplier && (
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <div className="text-xs text-slate-400 font-medium">Opening Balance</div>
              <div className="font-semibold text-slate-700 tabular-nums font-mono">{formatCurrency(supplier.openingBalance)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Purchases</div>
              <div className="font-semibold text-slate-900 tabular-nums font-mono">{formatCurrency(totalPurchased)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Disbursed</div>
              <div className="font-semibold text-slate-900 tabular-nums font-mono">{formatCurrency(totalPaid)}</div>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <div className="text-xs text-slate-400 font-medium">Net Payable</div>
              <div className={`font-bold text-lg tabular-nums font-mono ${supplier.currentBalance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatCurrency(supplier.currentBalance)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statement Document */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 print:border-none print:shadow-none print:p-0">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <span className="text-sm">Loading statement...</span>
          </div>
        ) : !supplier ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Please select a supplier to display statement.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white p-1 shrink-0">
                  <img src="/brand/logo.png" alt="Ashirwad Tech Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">ASHIRWAD TECHNOLOGIES</h2>
                  <div className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                    Ashraya 10, GST compound, New Ranip, Ahmedabad 382470<br />
                    Phone: 9662278994 | Email: rajsoni2962@gmail.com
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg">
                  Supplier Statement
                </span>
                <div className="text-xs text-slate-500 mt-2 font-mono tabular-nums">
                  Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Supplier Details Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Vendor Details
                </div>
                <div className="font-bold text-slate-900 text-base">{supplier.name}</div>
                {supplier.phone && (
                  <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="font-mono tabular-nums">{supplier.phone}</span>
                    {supplier.email && (
                      <span className="flex items-center gap-1 ml-2">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {supplier.email}
                      </span>
                    )}
                  </div>
                )}
                {supplier.address && (
                  <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>{supplier.address}, {supplier.state} ({supplier.stateCode})</span>
                  </div>
                )}
                {supplier.gstin && (
                  <div className="text-xs font-mono text-slate-700 mt-1 tabular-nums">
                    GSTIN: {supplier.gstin}
                  </div>
                )}
              </div>

              <div className="text-right flex flex-col justify-end">
                <div className="text-xs text-slate-500">Net Payable Balance</div>
                <div className={`text-2xl font-bold tabular-nums font-mono ${supplier.currentBalance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {formatCurrency(supplier.currentBalance)}
                </div>
                <div className="text-[11px] text-slate-400">
                  {supplier.currentBalance > 0 ? 'Pending Payment' : 'Settled'}
                </div>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 border-b border-slate-200">Date</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">Type</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">Reference</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">Description</th>
                    <th className="py-2.5 px-3 border-b border-slate-200 text-right">Credit (+)</th>
                    <th className="py-2.5 px-3 border-b border-slate-200 text-right">Debit (-)</th>
                    <th className="py-2.5 px-3 border-b border-slate-200 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {/* Opening Balance Row */}
                  <tr className="bg-slate-50/50 font-medium">
                    <td className="py-2.5 px-3 text-slate-400">-</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-600">OPENING</td>
                    <td className="py-2.5 px-3 text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-slate-500 italic">Opening Balance</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {supplier.openingBalance > 0 ? formatCurrency(supplier.openingBalance) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">-</td>
                    <td className="py-2.5 px-3 text-right font-semibold font-mono tabular-nums">
                      {formatCurrency(supplier.openingBalance)}
                    </td>
                  </tr>

                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        No transactions recorded for this supplier.
                      </td>
                    </tr>
                  ) : (
                    ledger.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono tabular-nums">
                          {new Date(item.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              item.type === 'PURCHASE'
                                ? 'bg-slate-100 text-slate-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium tabular-nums">
                          {item.reference}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                          {item.details || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-rose-600 font-mono tabular-nums">
                          {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 font-mono tabular-nums">
                          {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono tabular-nums">
                          {formatCurrency(item.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={4} className="py-3 px-3 text-right text-slate-700 uppercase">
                      Total Summary
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 font-mono tabular-nums">
                      {formatCurrency(totalPurchased)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 font-mono tabular-nums">
                      {formatCurrency(totalPaid)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-900 text-sm font-mono tabular-nums">
                      {formatCurrency(supplier.currentBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Terms and Signatory on Print */}
            <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
              <div>
                <p>Computer-generated statement of account.</p>
                <p>Please report any discrepancies within 7 days.</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-12 flex items-center justify-center mx-auto mb-1">
                  <img
                    src="/brand/signature.jpeg"
                    alt="Authorized Signatory"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="border-t border-slate-300 pt-1 font-semibold text-slate-700">
                  Authorized Signatory
                </div>
                <div className="text-[10px] text-slate-400">Ashirwad Technologies</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SupplierLedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading ledger...</div>}>
      <SupplierLedgerContent />
    </Suspense>
  );
}
