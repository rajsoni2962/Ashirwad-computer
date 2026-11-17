'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  BookOpen,
  ArrowUpRight,
  RefreshCw,
  X,
  Archive,
  ArchiveRestore,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  state: string;
  stateCode: string;
  openingBalance: number;
  currentBalance: number;
  notes?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  _count?: {
    invoices: number;
    payments: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBalance, setFilterBalance] = useState<'all' | 'due' | 'clear'>('all');
  const [statusTab, setStatusTab] = useState<'active' | 'archived'>('active');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteCustomer, setConfirmDeleteCustomer] = useState<Customer | null>(null);

  // Modal for Edit or Quick Add
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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

  const fetchCustomers = async (statusOverride?: 'active' | 'archived') => {
    setLoading(true);
    try {
      const currentStatus = statusOverride || statusTab;
      const res = await fetch(`/api/customers?status=${currentStatus}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleTabChange = (tab: 'active' | 'archived') => {
    setStatusTab(tab);
    fetchCustomers(tab);
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
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

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      gstin: customer.gstin || '',
      state: customer.state || 'Gujarat',
      stateCode: customer.stateCode || '24',
      openingBalance: customer.openingBalance.toString(),
      notes: customer.notes || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        setErrorMsg(data.error || 'Operation failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!confirmDeleteCustomer) return;
    try {
      const res = await fetch(`/api/customers/${confirmDeleteCustomer.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: data.message || (data.archived ? 'Customer archived successfully.' : 'Customer deleted successfully.'),
        });
        setConfirmDeleteCustomer(null);
        fetchCustomers();
      } else {
        alert(data.error || 'Failed to delete customer');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const handleRestore = async (customer: Customer) => {
    try {
      const res = await fetch(`/api/customers/${customer.id}/restore`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: `Customer "${customer.name}" restored to active list.`,
        });
        fetchCustomers();
      } else {
        alert(data.error || 'Failed to restore customer');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const handleCascadePurge = async (customer: Customer) => {
    if (
      !confirm(
        `DANGER: Permanently purge customer "${customer.name}" and all associated invoices and payments? This is irreversible.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/customers/${customer.id}?cascade=true`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: `Customer "${customer.name}" and all records permanently purged.`,
        });
        fetchCustomers();
      } else {
        alert(data.error || 'Failed to purge customer');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (filterBalance === 'due') return c.currentBalance > 0;
    if (filterBalance === 'clear') return c.currentBalance <= 0;
    return true;
  });

  const totalReceivables = customers.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Client accounts, balances, and transaction history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleTabChange('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusTab === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active Accounts
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('archived')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                statusTab === 'archived'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archived</span>
            </button>
          </div>

          <Link
            href="/customers/ledger"
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
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Archived notice if on archived tab */}
      {statusTab === 'archived' && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 text-amber-900 text-xs">
          <Archive className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-amber-950">Archived Customer Records</p>
            <p className="text-amber-800 mt-0.5">
              These customer accounts have transaction history and are archived to protect invoice records and audit trails. Click Restore to reactivate.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {statusTab === 'active' ? 'Active Customers' : 'Archived Records'}
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">{customers.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Receivables</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">{formatCurrency(totalReceivables)}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accounts with Dues</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
            {customers.filter((c) => c.currentBalance > 0).length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, email, GSTIN..."
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
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilterBalance('due')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterBalance === 'due'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Dues ({customers.filter((c) => c.currentBalance > 0).length})
          </button>
          <button
            onClick={() => setFilterBalance('clear')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterBalance === 'clear'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Settled ({customers.filter((c) => c.currentBalance <= 0).length})
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <span className="text-sm">Loading records...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="font-medium text-slate-700">No records found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer & Contact</th>
                  <th className="py-3 px-4">Location & GSTIN</th>
                  <th className="py-3 px-4">Invoices</th>
                  <th className="py-3 px-4 text-right">Current Balance</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 font-mono tabular-nums">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.phone}
                        </span>
                        {c.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {c.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {c.address ? (
                        <div className="flex items-start gap-1 text-slate-600 max-w-xs truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>{c.address}, {c.state} ({c.stateCode})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">{c.state} ({c.stateCode})</span>
                      )}
                      {c.gstin && (
                        <div className="mt-1 font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-fit tabular-nums">
                          GST: {c.gstin}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-slate-700 tabular-nums font-mono">
                        {c._count?.invoices || 0} Invoices
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums font-mono">
                        {c._count?.payments || 0} Payments
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className={`font-bold text-sm tabular-nums font-mono ${
                          c.currentBalance > 0 ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {formatCurrency(c.currentBalance)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {c.currentBalance > 0 ? 'Pending' : 'Settled'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {statusTab === 'active' ? (
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/customers/ledger?customerId=${c.id}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Ledger"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/sales/new?customerId=${c.id}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="New Invoice"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteCustomer(c)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Archive / Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/customers/ledger?customerId=${c.id}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="View Ledger"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleRestore(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition"
                          >
                            <ArchiveRestore className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => handleCascadePurge(c)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Purge"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
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
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full or business name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="10-digit number"
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
                    placeholder="customer@example.com"
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
                  placeholder="Address details"
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
                    disabled={!!editingCustomer}
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
                  placeholder="Internal notes"
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
                  {submitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Delete / Archive Confirmation Modal */}
      {confirmDeleteCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  (confirmDeleteCustomer._count?.invoices || 0) > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {(confirmDeleteCustomer._count?.invoices || 0) > 0 ? (
                  <Archive className="w-5 h-5" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">
                  {(confirmDeleteCustomer._count?.invoices || 0) > 0 ? 'Archive Customer' : 'Delete Customer'}
                </h3>
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  {confirmDeleteCustomer.name} ({confirmDeleteCustomer.phone})
                </p>
              </div>
            </div>

            {(confirmDeleteCustomer._count?.invoices || 0) > 0 ? (
              <div className="space-y-2">
                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
                  <p className="font-medium">
                    This customer has recorded transactions:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800 font-mono tabular-nums">
                    <li>{confirmDeleteCustomer._count?.invoices || 0} Invoice(s)</li>
                    <li>{confirmDeleteCustomer._count?.payments || 0} Payment(s)</li>
                  </ul>
                  <p className="pt-1 text-[11px] text-amber-700">
                    To preserve tax and audit records, this account will be archived instead of deleted.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                This customer has no transactions. The record will be permanently deleted.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteCustomer(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition flex items-center gap-1.5 ${
                  (confirmDeleteCustomer._count?.invoices || 0) > 0
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {(confirmDeleteCustomer._count?.invoices || 0) > 0 ? (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive Account</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom-2 duration-150">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
