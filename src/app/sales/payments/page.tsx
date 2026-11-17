'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  IndianRupee,
  Plus,
  Search,
  Users,
  FileText,
  Calendar,
  CreditCard,
  RefreshCw,
  X,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface Payment {
  id: string;
  paymentNumber: string;
  date: string;
  amount: number;
  paymentMode: string;
  referenceNumber?: string | null;
  notes?: string | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
    currentBalance: number;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    grandTotal: number;
  };
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  currentBalance: number;
}

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    paymentMode: 'UPI',
    referenceNumber: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments?type=CUSTOMER_PAYMENT');
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

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success && data.data) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      customerId: customers.length > 0 ? customers[0].id : '',
      amount: '',
      paymentMode: 'UPI',
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
          type: 'CUSTOMER_PAYMENT',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchPayments();
        fetchCustomers();
      } else {
        setErrorMsg(data.error || 'Failed to record payment');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = payments.filter((p) => {
    const custName = p.customer?.name || '';
    const num = p.paymentNumber || '';
    const ref = p.referenceNumber || '';
    const q = search.toLowerCase();
    return custName.toLowerCase().includes(q) || num.toLowerCase().includes(q) || ref.toLowerCase().includes(q);
  });

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-slate-700" />
              Payments Received
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer payments and settlement history
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>

        {/* Total Summary Banner */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500">Total Receipts</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">₹{totalCollected.toLocaleString('en-IN')}</div>
          </div>
          <div className="text-xs text-slate-500">
            Total records: <span className="font-mono font-semibold text-slate-800 tabular-nums">{payments.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, receipt # or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-600" />
              <span className="text-xs">Loading payments...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">No records found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                        {new Date(p.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {p.customer ? (
                          <Link
                            href={`/customers/ledger?customerId=${p.customer.id}`}
                            className="font-medium text-slate-900 hover:underline"
                          >
                            {p.customer.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">Walk-in</span>
                        )}
                        {p.invoice && (
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                            Inv: {p.invoice.invoiceNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                        {p.referenceNumber || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {p.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for Recording Customer Payment */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-700" />
                  Record Payment
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
                {errorMsg && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Customer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) — Due: ₹{c.currentBalance.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Amount in ₹"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="Card">Card</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Reference / UTR
                    </label>
                    <input
                      type="text"
                      placeholder="Transaction reference"
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Optional notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
