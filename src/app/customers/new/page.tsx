'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewCustomerPage() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/customers');
      } else {
        setError(data.error || 'Failed to create customer');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Add Customer
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create a customer account for sales invoicing and ledgers.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Contact Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Customer / Business Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ronak Jain"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono tabular-nums"
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
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN</label>
            <input
              type="text"
              placeholder="24AAAAA0000A1Z5"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              className="w-full px-3.5 py-2 text-sm uppercase bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono tabular-nums"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3">Address & Billing</h2>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Billing Address</label>
            <textarea
              rows={2}
              placeholder="Street address, shop / flat number"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">State Code</label>
            <input
              type="text"
              value={formData.stateCode}
              onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Opening Balance (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={formData.openingBalance}
              onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
          <input
            type="text"
            placeholder="Credit terms or remarks"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/customers"
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loading ? 'Saving...' : 'Save Customer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
