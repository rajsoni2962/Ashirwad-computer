'use client';

import React from 'react';
import {
  X,
  FileClock,
  Play,
  Trash2,
  Calendar,
  User,
  Package,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { InvoiceDraft } from '@/lib/invoiceDraftManager';
import { formatCurrency, getInvoiceTypeTitle, getInvoiceTypeLabel } from '@/lib/utils';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-amber-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
              <FileClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Half-Filled & Saved Draft Bills</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                  {drafts.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Continue working on previously started bills right where you left off.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Draft List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
          {drafts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileClock className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
              <p className="font-bold text-slate-700 text-sm">No saved drafts</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Any bill you start filling will automatically appear here so you never lose your progress.
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
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {d.customerName || 'Walk-in Customer'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {getInvoiceTypeLabel(d.invoiceType)}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate} at {formattedTime}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span>{d.items?.length || 0} item(s)</span>
                        </span>
                        {d.customerPhone && (
                          <span>Phone: {d.customerPhone}</span>
                        )}
                      </div>
                      {/* Items Preview */}
                      {d.items && d.items.length > 0 && (
                        <div className="text-[11px] text-slate-600 mt-2 line-clamp-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                          <strong>Items:</strong>{' '}
                          {d.items
                            .map((it) => it.description || it.product?.name || 'Unnamed product')
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Total & Action Buttons */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0 w-full sm:w-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
                        <span className="font-black text-slate-900 text-sm">
                          {formatCurrency(d.grandTotal || 0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => onResume(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
                          title="Continue filling this invoice"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Continue</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(d.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl transition"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Start Fresh New Bill</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
