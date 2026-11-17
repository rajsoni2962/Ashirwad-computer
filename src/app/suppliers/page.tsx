'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  ArrowUpRight,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Camera
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Supplier {
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
  _count?: {
    purchases: number;
    payments: number;
  };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBalance, setFilterBalance] = useState<'all' | 'payable' | 'clear'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    state: 'Gujarat',
    stateCode: '24',
    openingBalance: '0',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      state: 'Gujarat',
      stateCode: '24',
      openingBalance: '0',
      notes: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      gstin: sup.gstin || '',
      state: sup.state || 'Gujarat',
      stateCode: sup.stateCode || '24',
      openingBalance: sup.openingBalance.toString(),
      notes: sup.notes || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchSuppliers();
      } else {
        setErrorMsg(data.error || 'Operation failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete supplier "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchSuppliers();
      } else {
        alert(data.error || 'Failed to delete supplier');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (filterBalance === 'payable') return s.currentBalance > 0;
    if (filterBalance === 'clear') return s.currentBalance <= 0;
    return true;
  });

  const totalPayables = suppliers.reduce((acc, s) => acc + (s.currentBalance > 0 ? s.currentBalance : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Suppliers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Vendors, distributors, purchase history, and payables.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/purchases/import-bill"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition"
          >
            <Camera className="w-4 h-4 text-slate-500" />
            <span>Import Bill</span>
          </Link>
          <Link
            href="/suppliers/ledger"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Ledgers</span>
          </Link>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Quick KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Suppliers</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">{suppliers.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payables</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">{formatCurrency(totalPayables)}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suppliers with Balance</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
            {suppliers.filter((s) => s.currentBalance > 0).length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by vendor name, GSTIN, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterBalance('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterBalance === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({suppliers.length})
          </button>
          <button
            onClick={() => setFilterBalance('payable')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterBalance === 'payable'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Payables ({suppliers.filter((s) => s.currentBalance > 0).length})
          </button>
          <button
            onClick={() => setFilterBalance('clear')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterBalance === 'clear'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Settled ({suppliers.filter((s) => s.currentBalance <= 0).length})
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <span className="text-sm">Loading records...</span>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="font-medium text-slate-700">No records found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Location & GSTIN</th>
                  <th className="py-3 px-4">Purchase Bills</th>
                  <th className="py-3 px-4 text-right">Payable Balance</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {s.phone && (
                          <span className="flex items-center gap-1 font-mono tabular-nums">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {s.phone}
                          </span>
                        )}
                        {s.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {s.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {s.address ? (
                        <div className="flex items-start gap-1 text-slate-600 max-w-xs truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>{s.address}, {s.state} ({s.stateCode})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">{s.state} ({s.stateCode})</span>
                      )}
                      {s.gstin && (
                        <div className="mt-1 font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-fit tabular-nums">
                          GST: {s.gstin}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-slate-700 tabular-nums font-mono">
                        {s._count?.purchases || 0} Bills
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums font-mono">
                        {s._count?.payments || 0} Payments
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className={`font-bold text-sm tabular-nums font-mono ${
                          s.currentBalance > 0 ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {formatCurrency(s.currentBalance)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {s.currentBalance > 0 ? 'Payable' : 'Settled'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/suppliers/ledger?supplierId=${s.id}`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="Ledger"
                        >
                          <BookOpen className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/purchases/new?supplierId=${s.id}`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="New Purchase"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-base">
                {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
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
                    Supplier / Vendor Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Navkar Computers"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="vendor@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="24AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full px-3 py-2 text-sm uppercase bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  placeholder="Office address, market location"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">State Code</label>
                  <input
                    type="text"
                    value={formData.stateCode}
                    onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    disabled={!!editingSupplier}
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white disabled:opacity-60 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Contact person or payment terms"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
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
                  {submitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
