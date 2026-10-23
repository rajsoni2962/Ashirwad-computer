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
  DollarSign,
  Printer,
  Download,
  MessageCircle,
  Edit,
  Trash2,
  AlertTriangle,
  FileImage,
} from 'lucide-react';
import { formatCurrency, formatDate, getInvoiceTypeTitle } from '@/lib/utils';
import WhatsAppShareModal from '@/components/invoice/WhatsAppShareModal';
import InvoiceImageModal from '@/components/invoice/InvoiceImageModal';

export default function AllInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [shareModalInvoice, setShareModalInvoice] = useState<any | null>(null);
  const [imageModalInvoice, setImageModalInvoice] = useState<any | null>(null);

  // Soft Delete State
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deletionReason, setDeletionReason] = useState('Customer requested return / correction');
  const [deleting, setDeleting] = useState(false);

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
    if (!confirm(`Are you sure you want to cancel Invoice ${invoiceNumber}? This will automatically restore product stock and deduct the customer balance.`)) {
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
        alert(`Invoice ${invoiceNumber} cancelled and inventory stock restored!`);
        fetchInvoices();
      } else {
        alert(json.error || 'Failed to cancel invoice');
      }
    } catch (err) {
      alert('Error cancelling invoice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>Customer Sales Invoices</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage tax invoices, print A4 PDFs, track customer dues, and handle invoice cancellations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/sales/recently-deleted"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 shadow-xs transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Recently Deleted</span>
          </Link>
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-indigo-600"
          >
            <option value="All">All Types</option>
            <option value="TAX_INVOICE">Tax Invoice</option>
            <option value="BILL_OF_SUPPLY">Bill of Supply</option>
            <option value="NON_GST">Non-GST Invoice</option>
            <option value="PROFORMA">Proforma Invoice</option>
            <option value="QUOTATION">Quotation / Estimate</option>
            <option value="CASH_MEMO">Cash Memo</option>
          </select>

          <div className="flex items-center gap-1 overflow-x-auto">
            {['All', 'Paid', 'Partial', 'Unpaid', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items / Serials</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No sales invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <Link
                        href={`/sales/invoices/${inv.id}`}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline block"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      {inv.invoiceType && inv.invoiceType !== 'TAX_INVOICE' && (
                        <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {getInvoiceTypeTitle(inv.invoiceType)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(inv.date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{inv.customer?.name}</div>
                      <div className="text-[11px] text-slate-400">{inv.customer?.phone}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      {inv.items?.map((it: any) => it.description || it.product?.name).join(', ')}
                      {inv.items?.some((i: any) => i.serialNumber) && (
                        <div className="text-[10px] font-mono text-purple-600 font-semibold truncate">
                          SN: {inv.items.filter((i: any) => i.serialNumber).map((i: any) => i.serialNumber).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {formatCurrency(inv.balanceDue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inv.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-700'
                              : inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : inv.paymentStatus === 'Partial'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {inv.status === 'Cancelled' ? 'Cancelled' : inv.paymentStatus}
                        </span>
                        {inv.whatsappSharedAt && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            WhatsApp Shared ✓
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <a
                        href={`/api/invoices/${inv.id}/pdf?inline=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition"
                        title="View Tax Invoice PDF in new tab"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View</span>
                      </a>

                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
                        title="Download Bill PDF directly"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-600" />
                        <span>PDF</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setImageModalInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
                        title="Download or View invoice as PNG / JPEG image"
                      >
                        <FileImage className="w-3.5 h-3.5 text-purple-600" />
                        <span>Image</span>
                      </button>

                      <button
                        onClick={() => setShareModalInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>

                      <Link
                        href={`/sales/invoices/${inv.id}/edit`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition"
                        title="Edit permitted invoice details"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                        <span>Edit</span>
                      </Link>

                      <button
                        onClick={() => setDeleteTarget(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                        title="Move to Recently Deleted (7-day recovery)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>

                      {inv.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleCancelInvoice(inv.id, inv.invoiceNumber)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Cancel Invoice & Restore Stock"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
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

      {/* Soft Delete Confirmation Modal (Requirement 4) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-rose-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Move to Recently Deleted?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Invoice: <span className="font-mono font-bold text-slate-800">{deleteTarget.invoiceNumber}</span>
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Move this invoice to Recently Deleted? It can be recovered for 7 days.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Deletion Reason (Optional)
                </label>
                <input
                  type="text"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="e.g. Returned by customer, entered in error..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-rose-600"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSoftDelete}
                disabled={deleting}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {deleting ? 'Moving...' : 'Move to Recently Deleted'}
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
    </div>
  );
}
