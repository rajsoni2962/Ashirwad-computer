'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Landmark
} from 'lucide-react';

export default function BusinessProfilePage() {
  const [formData, setFormData] = useState({
    companyName: 'ASHIRWAD TECHNOLOGIES',
    tagline: 'Beyond Tech Limits...',
    address: 'Ashraya 10, GST compound, New Ranip, Ahmedabad 382470.',
    phone: '9662278994',
    email: 'rajsoni2962@gmail.com',
    gstin: '',
    state: 'Gujarat',
    stateCode: '24',
    bankName: 'State Bank of India',
    accountNumber: '39485720194',
    ifscCode: 'SBIN0001234',
    upiId: '9662278994@upi',
  });

  const [isGstRegistered, setIsGstRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const rawGstin = data.data.gstin || '';
          const hasGstin = Boolean(rawGstin && rawGstin.trim() !== '' && rawGstin !== 'null');
          setFormData((prev) => ({ ...prev, ...data.data, gstin: hasGstin ? rawGstin : '' }));
          setIsGstRegistered(hasGstin);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        ...formData,
        gstin: isGstRegistered ? (formData.gstin?.trim() || '') : '',
      };
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Business Profile updated successfully.');
      } else {
        setErrorMsg(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Business Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Company identity, address, tax details, and payment instructions.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
          <span className="text-sm text-slate-500">Loading business profile...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-8">
          {/* Identity */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white p-1 shrink-0">
                <img src="/brand/logo.png" alt="Ashirwad Tech Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Company Identity</h2>
                <p className="text-xs text-slate-400">Printed on invoices, purchase orders, and statements.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company / Trade Name</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">Address & Tax Details</h2>
              <p className="text-xs text-slate-400">Registered place of business and GST jurisdiction.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Registered Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Optional GSTIN Configuration */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-800">GST Registered</span>
                  <p className="text-[11px] text-slate-500">
                    {isGstRegistered
                      ? 'GSTIN enabled for this business profile.'
                      : 'GSTIN is hidden from documents if not registered.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGstRegistered}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsGstRegistered(checked);
                      if (!checked) {
                        setFormData({ ...formData, gstin: '' });
                      }
                    }}
                    className="w-4 h-4 text-slate-900 rounded cursor-pointer"
                  />
                </label>
              </div>

              {isGstRegistered && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="15-digit GSTIN"
                    className="w-full px-3.5 py-2 text-sm uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white tabular-nums"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bank Details & UPI */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">Banking & Payment Details</h2>
              <p className="text-xs text-slate-400">Printed on invoice settlement instructions.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-sm uppercase font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">UPI ID (VPA)</label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
