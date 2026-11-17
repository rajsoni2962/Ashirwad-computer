'use client';

import React, { useState } from 'react';
import {
  Download,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

  // Reset database modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetAcknowledged, setResetAcknowledged] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleExportAll = async () => {
    setDownloading(true);
    setExportSuccess('');
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Backup export failed');
      }

      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apna_vyaapar_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportSuccess('Complete database export downloaded successfully.');
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmText !== 'RESET DATABASE') {
      setResetError('Type RESET DATABASE exactly to proceed.');
      return;
    }
    if (!resetPassword) {
      setResetError('Admin password is required.');
      return;
    }
    if (!resetAcknowledged) {
      setResetError('Confirm the checkbox acknowledgment.');
      return;
    }

    setResetting(true);
    setResetError('');

    try {
      const res = await fetch('/api/settings/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmText: resetConfirmText,
          password: resetPassword,
          acknowledgeLoss: resetAcknowledged,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Reset operation failed');
      }

      alert('Database reset successful. Refreshing workspace...');
      window.location.href = '/';
    } catch (err: any) {
      setResetError(err.message || 'Reset failed. Verify admin password.');
    } finally {
      setResetting(false);
    }
  };

  const handleExportTable = async (table: string, filename: string) => {
    try {
      const res = await fetch(`/api/backup?table=${table}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Data Backup & Export
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Export system records and database archives in structured JSON format.
        </p>
      </div>

      {exportSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Full Backup Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Complete System Snapshot
            </div>
            <h2 className="text-xl font-bold">Full Database Archive</h2>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              Export all customers, suppliers, inventory, serial numbers, sales invoices, purchase bills, and ledgers into a single JSON file.
            </p>
          </div>

          <button
            onClick={handleExportAll}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50 shrink-0"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Full Backup (.json)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Granular Table Exports */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Granular Table Downloads</h2>
          <p className="text-xs text-slate-500">Download specific data tables for Excel import or accounting audits.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 text-sm">Products Catalog</div>
              <div className="text-xs text-slate-500">Specs, pricing, and current stock</div>
            </div>
            <button
              onClick={() => handleExportTable('products', 'apna_vyaapar_products')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Export JSON
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 text-sm">Customer Directory</div>
              <div className="text-xs text-slate-500">Names, contact numbers, and balances</div>
            </div>
            <button
              onClick={() => handleExportTable('customers', 'apna_vyaapar_customers')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Export JSON
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 text-sm">Supplier Accounts</div>
              <div className="text-xs text-slate-500">Vendor directory and pending payables</div>
            </div>
            <button
              onClick={() => handleExportTable('suppliers', 'apna_vyaapar_suppliers')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Export JSON
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 text-sm">Sales Invoices & Items</div>
              <div className="text-xs text-slate-500">Full billing and item breakdown history</div>
            </div>
            <button
              onClick={() => handleExportTable('invoices', 'apna_vyaapar_invoices')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Cloud Persistence Notice */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex items-start gap-3 text-xs text-slate-600">
        <HardDrive className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">Database Engine: Cloud PostgreSQL</div>
          <p>
            Commercial data is stored in PostgreSQL with real-time replication and atomic transactions. Regular JSON backups are recommended prior to administrative maintenance.
          </p>
        </div>
      </div>

      {/* Danger Zone: Reset Database */}
      <div className="bg-rose-50/70 rounded-2xl border border-rose-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-200/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone: Reset Business Database</span>
            </div>
            <p className="text-xs text-rose-900/80 max-w-xl leading-relaxed">
              Permanently wipes sales invoices, purchases, payments, inventory products, serial numbers, customers, suppliers, and expense records.
              <strong className="block text-rose-950 font-bold mt-1">
                Your administrator login account and company settings will remain intact.
              </strong>
            </p>
          </div>

          <button
            onClick={() => {
              setResetConfirmText('');
              setResetPassword('');
              setResetAcknowledged(false);
              setResetError('');
              setShowResetModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Database</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-rose-700">
          <span>Always export a backup before proceeding.</span>
          <button
            onClick={handleExportAll}
            className="underline font-semibold hover:text-rose-900"
          >
            Download safety backup now →
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Confirm Database Reset</span>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1.5 leading-relaxed">
              <div className="font-bold">⚠️ Warning: Irreversible Action</div>
              <p>
                This will delete all transactional data, customers, products, stock movements, and invoices from the database. This action CANNOT be undone.
              </p>
            </div>

            {resetError && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type <span className="font-mono font-bold text-rose-600 select-all">RESET DATABASE</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="RESET DATABASE"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-rose-600 focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Account Password:
                </label>
                <input
                  type="password"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter current admin password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-slate-900 focus:border-slate-900"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={resetAcknowledged}
                  onChange={(e) => setResetAcknowledged(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 mt-0.5"
                />
                <span className="leading-snug">
                  I understand that this action is permanent and all business records will be deleted immediately.
                </span>
              </label>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="text-xs font-semibold text-slate-700 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Backup First
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetting || resetConfirmText !== 'RESET DATABASE' || !resetPassword || !resetAcknowledged}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
                  >
                    {resetting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Resetting Database...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        Permanently Wipe Database
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}