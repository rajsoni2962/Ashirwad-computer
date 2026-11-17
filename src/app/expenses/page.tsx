'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  X,
  CreditCard,
  Building,
  Zap,
  Truck,
  Wrench,
  Globe,
  Wifi,
  Package
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  notes?: string | null;
}

const CATEGORIES = [
  'All',
  'Electricity',
  'Rent',
  'Transport',
  'Repair',
  'Software',
  'Internet',
  'Salary',
  'Packaging',
  'Miscellaneous',
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Miscellaneous',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?category=${encodeURIComponent(selectedCategory)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setExpenses(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormData({
          category: 'Miscellaneous',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Cash',
          notes: '',
        });
        fetchExpenses();
      } else {
        setErrorMsg(data.error || 'Failed to record expense');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense record?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchExpenses();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const filtered = expenses.filter((e) =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalExpense = filtered.reduce((acc, e) => acc + e.amount, 0);

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'electricity': return <Zap className="w-3.5 h-3.5 text-slate-500" />;
      case 'rent': return <Building className="w-3.5 h-3.5 text-slate-500" />;
      case 'transport': return <Truck className="w-3.5 h-3.5 text-slate-500" />;
      case 'repair': return <Wrench className="w-3.5 h-3.5 text-slate-500" />;
      case 'internet': return <Wifi className="w-3.5 h-3.5 text-slate-500" />;
      case 'software': return <Globe className="w-3.5 h-3.5 text-slate-500" />;
      case 'packaging': return <Package className="w-3.5 h-3.5 text-slate-500" />;
      default: return <Receipt className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Expenses
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Operational overheads and daily business costs.
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
            {formatCurrency(totalExpense)}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Vouchers: <span className="font-semibold text-slate-900 tabular-nums font-mono">{filtered.length}</span>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expense description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <span className="text-sm">Loading records...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="font-medium text-slate-700">No records found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-mono tabular-nums">
                      {new Date(e.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {getCategoryIcon(e.category)}
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div>{e.description}</div>
                      {e.notes && <div className="text-xs text-slate-400 font-normal">{e.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {e.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 tabular-nums font-mono">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Recording Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-600" />
                Record Expense
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
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
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Courier charges, shop maintenance"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
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
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Optional reference / invoice number"
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
                  {submitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
