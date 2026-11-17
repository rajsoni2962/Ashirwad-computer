'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  CreditCard,
  RefreshCw,
  X
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface Payment {
  id: string;
  paymentNumber: string;
  date: string;
  amount: number;
  paymentMode: string;
  referenceNumber?: string | null;
  notes?: string | null;
  supplier?: {
    id: string;
    name: string;
    phone?: string | null;
    currentBalance: number;
  };
  purchase?: {
    id: string;
    purchaseNumber: string;
    grandTotal: number;
  };
}

interface SupplierOption {
  id: string;
  name: string;
  phone?: string | null;
  currentBalance: number;
}

export default function SupplierPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    amount: '',
    paymentMode: 'Bank Transfer',
    referenceNumber: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments?type=SUPPLIER_PAYMENT');
      const data = await res.json();
      if (data.success && data.data) {
        setPayments(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if (data.success && data.data) {
        setSuppliers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchSuppliers();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      supplierId: suppliers.length > 0 ? suppliers[0].id : '',
      amount: '',
      paymentMode: 'Bank Transfer',
      referenceNumber: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: 'SUPPLIER_PAYMENT',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchPayments();
        fetchSuppliers();
      } else {
        setErrorMsg(data.error || 'Failed to record supplier payment');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = payments.filter((p) => {
    const supName = p.supplier?.name || '';
    const num = p.paymentNumber || '';
    const ref = p.referenceNumber || '';
    const q = search.toLowerCase();
    return supName.toLowerCase().includes(q) || num.toLowerCase().includes(q) || ref.toLowerCase().includes(q);
  });

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Supplier Payments
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Disbursement records and vendor payment tracking.
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Disbursed</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
              {formatCurrency(totalPaid)}
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Payment Vouchers: <span className="font-semibold text-slate-900 tabular-nums font-mono">{payments.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by supplier, voucher # or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
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
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="font-medium text-slate-700">No records found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Voucher & Date</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900 tabular-nums">{p.paymentNumber}</div>
                        <div className="text-xs text-slate-400 tabular-nums font-mono">
                          {new Date(p.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {p.supplier ? (
                          <Link
                            href={`/suppliers/ledger?supplierId=${p.supplier.id}`}
                            className="font-medium text-slate-900 hover:text-slate-700 hover:underline"
                          >
                            {p.supplier.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">Supplier</span>
                        )}
                        {p.purchase && (
                          <div className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                            PO: {p.purchase.purchaseNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums">
                        {p.referenceNumber || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums font-mono">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 max-w-xs truncate">
                        {p.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for Recording Supplier Payment */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-slate-600" />
                  Record Supplier Payment
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
                {errorMsg && (
                  <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Supplier <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Payable: {formatCurrency(s.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm font-semibold tabular-nums font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    >
                      <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white tabular-nums font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Reference / Cheque No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR / Cheque #"
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Optional notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
