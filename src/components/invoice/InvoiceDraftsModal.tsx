'use client';

import React from 'react';
import {
  X,
  FileClock,
  Play,
  Trash2,
  Calendar,
  Package,
  PlusCircle,
} from 'lucide-react';
import { InvoiceDraft } from '@/lib/invoiceDraftManager';
import { formatCurrency, getInvoiceTypeLabel } from '@/lib/utils';

interface InvoiceDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: InvoiceDraft[];
  activeDraftId: string | null;
  onResume: (draft: InvoiceDraft) => void;
  onDelete: (id: string) => void;
  onNewBill: () => void;
}

export default function InvoiceDraftsModal({
  isOpen,
  onClose,
  drafts,
  activeDraftId,
  onResume,
  onDelete,
  onNewBill,
}: InvoiceDraftsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <FileClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Saved Drafts</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 tabular-nums font-mono">
                  {drafts.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Resume previously saved invoice drafts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Draft List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {drafts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileClock className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              <p className="font-semibold text-slate-700 text-sm">No saved drafts</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                In-progress invoices are automatically saved here.
              </p>
            </div>
          ) : (
            drafts.map((d) => {
              const isCurrent = d.id === activeDraftId;
              const dateObj = new Date(d.updatedAt);
              const formattedTime = dateObj.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const formattedDate = dateObj.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={d.id}
                  className={`p-4 rounded-xl border transition-all ${isCurrent
                      ? 'border-slate-900 bg-slate-50/70'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {d.customerName || 'Walk-in Customer'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {getInvoiceTypeLabel(d.invoiceType)}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-mono tabular-nums">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate} {formattedTime}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono tabular-nums">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span>{d.items?.length || 0} item(s)</span>
                        </span>
                        {d.customerPhone && (
                          <span className="font-mono tabular-nums">Ph: {d.customerPhone}</span>
                        )}
                      </div>
                      {/* Items Preview */}
                      {d.items && d.items.length > 0 && (
                        <div className="text-[11px] text-slate-600 mt-2 line-clamp-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                          <span className="font-medium text-slate-700">Items:</span>{' '}
                          {d.items
                            .map((it) => it.description || it.product?.name || 'Item')
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Total & Action Buttons */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0 w-full sm:w-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">Total</span>
                        <span className="font-bold text-slate-900 text-sm font-mono tabular-nums">
                          {formatCurrency(d.grandTotal || 0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => onResume(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition"
                          title="Resume draft"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Resume</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(d.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNewBill}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>New Invoice</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
