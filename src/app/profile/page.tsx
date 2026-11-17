'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Package,
  Globe,
  ExternalLink,
  Sparkles,
  Building2,
  Cpu,
  Layers,
  Check,
} from 'lucide-react';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState<'details' | 'security' | 'integrations'>('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [profile, setProfile] = useState({
    name: 'Raj Soni',
    username: 'admin',
    email: 'rajsoni2962@gmail.com',
    phone: '9662278994',
    bio: 'Proprietor & Lead Systems Specialist at Ashirwad Technologies. Beyond Tech Limits...',
    role: 'admin',
    createdAt: '',
    stats: {
      totalInvoices: 0,
      totalCustomers: 0,
      totalProducts: 0,
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setProfile((prev) => ({
            ...prev,
            ...res.data,
            stats: res.data.stats || prev.stats,
          }));
        }
      })
      .catch((err) => console.error('Failed to load profile:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Your profile has been successfully updated and saved.');
      } else {
        setErrorMsg(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMsg('New password and confirm password do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Password changed successfully.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setErrorMsg(data.error || 'Failed to change password');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Banner & Profile Hero Card */}
      <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Top Banner */}
        <div className="h-28 sm:h-36 bg-slate-900 relative overflow-hidden">
          <div className="absolute right-6 top-6 flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/20 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-300" />
              Administrator
            </span>
          </div>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800 text-white border-4 border-white shadow-sm flex items-center justify-center font-bold text-2xl sm:text-3xl shrink-0">
                {profile.name
                  ? profile.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'RS'}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  {profile.name}
                  <span className="inline-block p-1 bg-emerald-50 text-emerald-700 rounded-full" title="Verified Owner">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  @{profile.username} • {profile.role === 'admin' ? 'Super Admin' : 'Staff'}
                </p>
              </div>
            </div>

              {/* Action Links */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/settings/profile"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200"
                >
                  <Building2 className="w-4 h-4 text-slate-500" />
                  Business Profile
                </Link>
                <a
                  href="https://github.com/rajsoni2962/Apna-vyaapar"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 rounded-xl transition border border-slate-200 shadow-2xs"
                >
                  <GithubIcon className="w-4 h-4" />
                  GitHub Repository
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Bio description */}
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed mt-2">
              {profile.bio}
            </p>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="p-3 sm:p-4 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums font-mono">
                    {profile.stats.totalInvoices}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">Invoices Billed</div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums font-mono">
                    {profile.stats.totalCustomers}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">Total Customers</div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums font-mono">
                    {profile.stats.totalProducts}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">Inventory Items</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center gap-2.5 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl flex items-center gap-2.5 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
          <button
            onClick={() => {
              setActiveTab('details');
              setSuccessMsg('');
              setErrorMsg('');
            }}
            className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            General Profile
          </button>

          <button
            onClick={() => {
              setActiveTab('security');
              setSuccessMsg('');
              setErrorMsg('');
            }}
            className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Security & Password
          </button>

          <button
            onClick={() => {
              setActiveTab('integrations');
              setSuccessMsg('');
              setErrorMsg('');
            }}
            className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'integrations'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            System & Cloud Links
          </button>
        </div>

        {/* Tab 1: General Profile Details */}
        {activeTab === 'details' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    System Username
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    readOnly
                    disabled
                    className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={profile.email || ''}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Professional Bio / Role Tagline
                </label>
                <textarea
                  rows={3}
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell clients or team members about your role..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === 'security' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure your administrative password is strong and updated periodically.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  required
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  required
                  placeholder="Re-type new password"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: System & Cloud Links */}
        {activeTab === 'integrations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GitHub Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                    <GithubIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    Connected & Pushed
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">GitHub Repository</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Source repository on your personal account: <code>rajsoni2962/Apna-vyaapar</code>.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <a
                  href="https://github.com/rajsoni2962/Apna-vyaapar"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-800"
                >
                  View Repo on GitHub
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Cloud Render Service Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
                    <Globe className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">
                    render.yaml Ready
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Render Persistent Web Service</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Auto-configured with 1GB disk mounted at <code>/data/dev.db</code> for persistent storage.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <a
                  href="https://dashboard.render.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-800"
                >
                  Open Render Dashboard
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* AI Vision Engine Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Sparkles className="w-6 h-6 text-slate-950" />
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                    Gemini 2.5 Flash
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Multimodal Bill Vision AI</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Automates invoice scanning, HSN parsing, and supplier terms extraction.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  href="/purchases/import-bill"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  Test Bill Scanner
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* System Engine Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-semibold rounded-full">
                    PostgreSQL (Supabase)
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Database Engine</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Managed cloud PostgreSQL instance with connection pooling and automated backups.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  href="/settings/backup"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  Manage Backups
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
