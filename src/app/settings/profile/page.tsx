'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Landmark,
  QrCode
} from 'lucide-react';

export default function BusinessProfilePage() {
  const [formData, setFormData] = useState({
    companyName: 'ASHIRWAD TECH',
    tagline: 'Repair | Upgrade | Build | Service',
    address: 'Ashraya 10, GST compound, new ranip, Ahmedabad 382470.',
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
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-amber-500" />
            Business Profile & Details
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure your enterprise name, address, and banking details. GSTIN is optional.
          </p>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-sm text-slate-500">Loading business profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-8">
            {/* Identity */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-200/50 bg-white p-1 shrink-0 shadow-xs">
                  <img src="/brand/logo.png" alt="Ashirwad Tech Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Brand & Company Identity</h2>
                  <p className="text-xs text-slate-400">Printed on all Tax Invoices, Purchase Orders, and Statements.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Trade Name</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white italic"
                  />
                </div>
              </div>
            </div>

            {/* Contact & Location */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Registered Address & GST Details</h2>
                <p className="text-xs text-slate-400">Used for state-code intra/inter-state tax calculation.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State Code</label>
                  <input
                    type="text"
                    value={formData.stateCode}
                    onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Optional GSTIN Configuration - Hidden When Not Configured */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800">GST Registration (Optional)</span>
                    <p className="text-[11px] text-slate-500">
                      {isGstRegistered
                        ? 'GSTIN enabled and configured for this business profile.'
                        : 'Business is not GST-registered. GSTIN is hidden from invoices and documents.'}
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
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {isGstRegistered && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GSTIN Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      placeholder="Enter 15-digit GSTIN if registered"
                      className="w-full px-3.5 py-2.5 text-sm uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bank Details & UPI */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Banking & UPI Payment QR Details</h2>
                <p className="text-xs text-slate-400">Printed in the invoice payment instructions block.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 text-sm uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID (VPA)</label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-slate-950 gold-gradient-bg hover:opacity-95 rounded-xl shadow-md gold-glow transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Updating...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
