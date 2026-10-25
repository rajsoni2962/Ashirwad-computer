'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  Building2,
  Plus,
  CheckCircle2,
  Edit,
  Trash2,
  Star,
  RefreshCw,
  X,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export default function BusinessProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState<any>({
    name: '',
    companyName: '',
    tagline: 'Beyond Tech Limits',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    state: 'Gujarat',
    stateCode: '24',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    invoicePrefix: 'AT/2026/',
    nextInvoiceNumber: 1,
    purchasePrefix: 'PO/2026/',
    nextPurchaseNumber: 1,
    logoUrl: '/brand/logo.png',
    signatureUrl: '/brand/signature.jpeg',
    terms: '',
    footer: '',
    authorizedSignatory: '',
    isDefault: false,
  });
  const [modalHasGstin, setModalHasGstin] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business-profiles');
      const json = await res.json();
      if (json.success) {
        setProfiles(json.data || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const openAddModal = () => {
    setEditingProfile(null);
    setFormData({
      name: '',
      companyName: 'ASHIRWAD TECHNOLOGIES',
      tagline: 'Beyond Tech Limits',
      address: 'A/1, 902, Ashraya 10, GST compound, New Ranip, Ahmedabad 382470.',
      phone: '9662278994',
      email: 'rajsoni2962@gmail.com',
      gstin: '',
      state: 'Gujarat',
      stateCode: '24',
      bankName: 'Kotak Mahindra Bank',
      accountNumber: '5947557983',
      ifscCode: 'KKBK0000879',
      upiId: 'rajsoni2962-2@okaxis',
      invoicePrefix: `AT-${profiles.length + 1}/2026/`,
      nextInvoiceNumber: 1,
      purchasePrefix: `PO-${profiles.length + 1}/2026/`,
      nextPurchaseNumber: 1,
      logoUrl: '/brand/logo.png',
      signatureUrl: '/brand/signature.jpeg',
      terms: '* Tested and working perfectly.\n* 6 Months of warranty covers technical issues only.\n* Thank you for choosing us.',
      footer: "Thank you for choosing us—we're always here to help if you need support.",
      authorizedSignatory: 'Ashirwad Technologies\nProprietor',
      isDefault: profiles.length === 0,
    });
    setModalHasGstin(false);
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (p: any) => {
    setEditingProfile(p);
    setFormData({
      name: p.name || '',
      companyName: p.companyName || '',
      tagline: p.tagline || '',
      address: p.address || '',
      phone: p.phone || '',
      email: p.email || '',
      gstin: p.gstin || '',
      state: p.state || 'Gujarat',
      stateCode: p.stateCode || '24',
      bankName: p.bankName || '',
      accountNumber: p.accountNumber || '',
      ifscCode: p.ifscCode || '',
      upiId: p.upiId || '',
      invoicePrefix: p.invoicePrefix || 'AT/2026/',
      nextInvoiceNumber: p.nextInvoiceNumber || 1,
      purchasePrefix: p.purchasePrefix || 'PO/2026/',
      nextPurchaseNumber: p.nextPurchaseNumber || 1,
      logoUrl: p.logoUrl || '/brand/logo.png',
      signatureUrl: p.signatureUrl || '/brand/signature.jpeg',
      terms: p.terms || '',
      footer: p.footer || '',
      authorizedSignatory: p.authorizedSignatory || '',
      isDefault: Boolean(p.isDefault),
    });
    const hasValidGstin = Boolean(p.gstin && p.gstin.trim() !== '' && p.gstin !== 'null');
    setModalHasGstin(hasValidGstin);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const url = editingProfile ? `/api/business-profiles/${editingProfile.id}` : '/api/business-profiles';
      const method = editingProfile ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        gstin: modalHasGstin ? (formData.gstin?.trim() || '') : '',
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(editingProfile ? 'Profile updated successfully!' : 'New business profile created!');
        setShowModal(false);
        fetchProfiles();
      } else {
        setErrorMsg(json.error || 'Failed to save profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (p: any) => {
    try {
      const res = await fetch(`/api/business-profiles/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true, ...p }),
      });
      const json = await res.json();
      if (json.success) {
        fetchProfiles();
      } else {
        alert(json.error || 'Failed to update default profile');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating default profile');
    }
  };

  const handleDelete = async (p: any) => {
    if (!confirm(`Are you sure you want to delete profile "${p.name}"?`)) return;
    try {
      const res = await fetch(`/api/business-profiles/${p.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchProfiles();
      } else {
        alert(json.error || 'Failed to delete profile');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting profile');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              <span>Multi-Business Account Profiles</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage multiple business entities, branches, and retail storefronts with distinct GSTIN, address, bank accounts, and invoice sequences.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Business Profile</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-slate-400">Loading business profiles...</div>
          ) : profiles.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400">No business profiles found. Click "+ Add Business Profile" to get started.</div>
          ) : (
            profiles.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs relative transition ${
                  p.isDefault ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Top Badge & Actions */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-slate-900">{p.name}</span>
                      {p.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Star className="w-3 h-3 fill-indigo-500 text-indigo-500" />
                          Default Profile
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">{p.companyName}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!p.isDefault && (
                      <button
                        onClick={() => handleSetDefault(p)}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition"
                        title="Set as Default Business Profile"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Profile"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!p.isDefault && profiles.length > 1 && (
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{p.address}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.phone}</span>
                    </div>
                    {p.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold text-slate-700">
                      GST: {p.gstin && p.gstin.trim() !== '' && p.gstin !== 'null' ? p.gstin : 'Unregistered / Non-GST'}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-50 rounded text-[11px] font-mono font-bold text-amber-800">
                      Prefix: {p.invoicePrefix} (Next #{p.nextInvoiceNumber})
                    </span>
                  </div>
                </div>

                {/* Bank Preview */}
                {p.bankName && (
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-medium">{p.bankName} • A/C: {p.accountNumber?.slice(-4) ? `••••${p.accountNumber.slice(-4)}` : 'Set'}</span>
                    </div>
                    {p.upiId && <span className="text-slate-500 font-mono text-[10px]">{p.upiId}</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 my-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">
                  {editingProfile ? 'Edit Business Profile' : 'Add New Business Account / Branch'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Profile / Branch Label *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Head Office - Ahmedabad or Service Center"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company Legal Trade Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="ASHIRWAD TECHNOLOGIES"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full commercial premises address"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State / Code</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Gujarat"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Optional GSTIN Section - Hidden When Not Configured */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-800">GST Registration (Optional)</span>
                      <p className="text-[11px] text-slate-500">
                        {modalHasGstin
                          ? 'Entity has a valid GSTIN.'
                          : 'Entity is unregistered / non-GST. GSTIN is hidden from invoices.'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={modalHasGstin}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setModalHasGstin(checked);
                        if (!checked) setFormData({ ...formData, gstin: '' });
                      }}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  {modalHasGstin && (
                    <div className="mt-2.5">
                      <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number (Optional)</label>
                      <input
                        type="text"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                        placeholder="Enter 15-digit GSTIN if registered"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs uppercase font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Kotak Mahindra Bank"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID</label>
                    <input
                      type="text"
                      value={formData.upiId}
                      onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                      placeholder="name@upi"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Prefix</label>
                    <input
                      type="text"
                      value={formData.invoicePrefix}
                      onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                      placeholder="AT/2026/"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Next Invoice Sequence #</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.nextInvoiceNumber}
                      onChange={(e) => setFormData({ ...formData, nextInvoiceNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Make this the Default Business Profile for new billing</span>
                </label>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      editingProfile ? 'Update Profile' : 'Create Profile'
                    )}
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
