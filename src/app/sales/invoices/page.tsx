'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Plus,
  Eye,
  XCircle,
  CheckCircle2,
  Calendar,
  Printer,
  Download,
  MessageCircle,
  Edit,
  Trash2,
  AlertTriangle,
  FileImage,
  Receipt,
} from 'lucide-react';
import { formatCurrency, formatDate, getInvoiceTypeTitle, getInvoiceTypeLabel } from '@/lib/utils';
import { requiresGstAccountingReview } from '@/lib/invoicePdfGenerator';
import WhatsAppShareModal from '@/components/invoice/WhatsAppShareModal';
import InvoiceImageModal from '@/components/invoice/InvoiceImageModal';
import ThermalPrintModal from '@/components/invoice/ThermalPrintModal';
import InvoiceTypeSelect from '@/components/common/InvoiceTypeSelect';

export default function AllInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [shareModalInvoice, setShareModalInvoice] = useState<any | null>(null);
  const [imageModalInvoice, setImageModalInvoice] = useState<any | null>(null);
  const [thermalInvoice, setThermalInvoice] = useState<any | null>(null);
  const [settings, setSettings] = useState<any>(null);

  // Soft Delete State
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deletionReason, setDeletionReason] = useState('Customer return / correction');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSettings(res.data);
      })
      .catch(() => {});
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const typeParam = typeFilter !== 'All' ? `&invoiceType=${typeFilter}` : '';
      const res = await fetch(`/api/invoices?search=${encodeURIComponent(search)}&status=${statusFilter}${typeParam}`);
      const json = await res.json();
      if (json.success) setInvoices(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    const handleCloudSync = () => fetchInvoices();
    window.addEventListener('cloudDataSynced', handleCloudSync);
    return () => window.removeEventListener('cloudDataSynced', handleCloudSync);
  }, [search, statusFilter, typeFilter]);

  const handleSoftDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deletionReason, deletedBy: 'admin' }),
      });
      const json = await res.json();
      if (json.success) {
        setDeleteTarget(null);
        fetchInvoices();
      } else {
        alert(json.error || 'Failed to move invoice to Recently Deleted');
      }
    } catch (err) {
      alert('Error moving invoice to Recently Deleted');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelInvoice = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Cancel invoice ${invoiceNumber}? This will restore inventory stock and adjust customer ledger.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const json = await res.json();
      if (json.success) {
        fetchInvoices();
      } else {
        alert(json.error || 'Failed to cancel invoice');
      }
    } catch (err) {
      alert('Error cancelling invoice');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Invoices</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage sales invoices, print PDFs, and track customer dues
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/sales/recently-deleted"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs rounded-lg border border-slate-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Recently Deleted</span>
          </Link>
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <InvoiceTypeSelect
            value={typeFilter}
            onChange={(val) => setTypeFilter(val)}
            includeAllOption={true}
            variant="compact"
            className="w-44"
          />

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 overflow-x-auto">
            {['All', 'Paid', 'Partial', 'Unpaid', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 font-semibold rounded-md transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3.5">Invoice</th>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5">Customer</th>
                <th className="py-2.5 px-3.5">Items</th>
                <th className="py-2.5 px-3.5 text-right">Grand Total</th>
                <th className="py-2.5 px-3.5 text-right">Paid</th>
                <th className="py-2.5 px-3.5 text-right">Balance Due</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No records found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      <Link
                        href={`/sales/invoices/${inv.id}`}
                        className="text-blue-600 hover:underline block font-mono"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {inv.invoiceType && inv.invoiceType !== 'TAX_INVOICE' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {getInvoiceTypeLabel(inv.invoiceType)}
                          </span>
                        )}
                        {inv.invoiceType === 'QUOTATION' && inv.convertedToInvoiceId && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Converted
                          </span>
                        )}
                        {requiresGstAccountingReview(inv, settings) && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-300"
                            title="Historical invoice issued with GST while Business GSTIN was unregistered. Preserved without silent recalculation."
                          >
                            GST Review
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap tabular-nums font-mono">
                      {formatDate(inv.date)}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-slate-800">{inv.customer?.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{inv.customer?.phone}</div>
                    </td>
                    <td className="py-2.5 px-3.5 max-w-xs truncate text-slate-600">
                      {inv.items?.map((it: any) => it.description || it.product?.name).join(', ')}
                      {inv.items?.some((i: any) => i.serialNumber) && (
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          SN: {inv.items.filter((i: any) => i.serialNumber).map((i: any) => i.serialNumber).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 tabular-nums font-mono">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-semibold text-emerald-600 tabular-nums font-mono">
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 tabular-nums font-mono">
                      {formatCurrency(inv.balanceDue)}
                    </td>
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            inv.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-700'
                              : inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : inv.paymentStatus === 'Partial'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {inv.status === 'Cancelled' ? 'Cancelled' : inv.paymentStatus}
                        </span>
                        {inv.whatsappSharedAt && (
                          <span className="text-[9px] font-semibold text-emerald-700">
                            Shared ✓
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap space-x-1">
                      <a
                        href={`/api/invoices/${inv.id}/pdf?inline=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition"
                        title="View PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>

                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        download
                        className="inline-flex items-center gap-1 px-2 py-1 text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setImageModalInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition"
                        title="Export Image"
                      >
                        <FileImage className="w-3.5 h-3.5" />
                        <span>Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setThermalInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition"
                        title="Print 80mm/58mm Thermal POS Receipt"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-600" />
                        <span>Thermal</span>
                      </button>

                      <button
                        onClick={() => setShareModalInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 transition"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>

                      <Link
                        href={`/sales/invoices/${inv.id}/edit`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>

                      <button
                        onClick={() => setDeleteTarget(inv)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>

                      {inv.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleCancelInvoice(inv.id, inv.invoiceNumber)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Cancel Invoice"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      {shareModalInvoice && (
        <WhatsAppShareModal
          isOpen={!!shareModalInvoice}
          onClose={() => setShareModalInvoice(null)}
          invoice={shareModalInvoice}
          onShared={() => {
            fetchInvoices();
          }}
        />
      )}

      {/* Soft Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  Delete Invoice
                </h3>
                <p className="text-slate-500 font-mono">
                  {deleteTarget.invoiceNumber}
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-slate-600">
                Move this invoice to Recently Deleted? It can be restored within 7 days.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Reason for deletion..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-3 py-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSoftDelete}
                disabled={deleting}
                className="px-3 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition disabled:opacity-50"
              >
                {deleting ? 'Moving...' : 'Move to Deleted'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Image Export Modal */}
      {imageModalInvoice && (
        <InvoiceImageModal
          isOpen={!!imageModalInvoice}
          onClose={() => setImageModalInvoice(null)}
          invoice={imageModalInvoice}
          onShareWhatsApp={() => {
            const target = imageModalInvoice;
            setImageModalInvoice(null);
            setShareModalInvoice(target);
          }}
        />
      )}

      {/* Thermal POS Receipt Modal */}
      {thermalInvoice && (
        <ThermalPrintModal
          isOpen={!!thermalInvoice}
          onClose={() => setThermalInvoice(null)}
          invoice={thermalInvoice}
          business={{
            companyName: settings?.companyName || 'ASHIRWAD TECHNOLOGIES',
            tagline: settings?.tagline || 'BEYOND TECH LIMITS',
            address: settings?.address || 'A/1, 902, Ashraya 10, GST compound, New Ranip, Ahmedabad 382470.',
            phone: settings?.phone || '9662278994',
            email: settings?.email || 'rajsoni2962@gmail.com',
            gstin: settings?.gstin || '',
            bankName: settings?.bankName || 'Kotak Mahindra Bank',
            accountNumber: settings?.accountNumber || '5947557983',
            ifscCode: settings?.ifscCode || 'KKBK0000879',
            upiId: settings?.upiId || 'rajsoni2962-2@okaxis',
            terms: settings?.terms,
          }}
        />
      )}
    </div>
  );
}
