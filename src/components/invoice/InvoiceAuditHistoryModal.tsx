'use client';

import React from 'react';
import { X, History, Clock, User, ShieldAlert, ArrowRight, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface InvoiceAuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export default function InvoiceAuditHistoryModal({
  isOpen,
  onClose,
  invoice,
}: InvoiceAuditHistoryModalProps) {
  if (!isOpen || !invoice) return null;

  const revisions: any[] = invoice.revisions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Audit History</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 tabular-nums">
                  {invoice.invoiceNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of invoice revisions, modifications, and restorations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list of revisions */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {revisions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No revisions recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">This invoice is in its original created state (Version 1).</p>
            </div>
          ) : (
            revisions.map((rev, idx) => {
              let diffs: { field: string; oldVal: string; newVal: string }[] = [];
              if (rev.diffSummary) {
                try {
                  diffs = typeof rev.diffSummary === 'string' ? JSON.parse(rev.diffSummary) : rev.diffSummary;
                } catch { }
              }

              const formattedDate = new Date(rev.createdAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={rev.id || idx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition hover:border-slate-300"
                >
                  {/* Revision Top Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-slate-900 text-white shadow-xs">
                        v{rev.revisionNumber}
                      </span>
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${rev.action === 'CREATED_FINALIZED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : rev.action === 'EDITED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : rev.action === 'SOFT_DELETED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : rev.action === 'RESTORED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                      >
                        {rev.action === 'CREATED_FINALIZED'
                          ? 'Created & Finalized'
                          : rev.action === 'EDITED'
                            ? 'Invoice Edited'
                            : rev.action === 'SOFT_DELETED'
                              ? 'Moved to Recently Deleted'
                              : rev.action === 'RESTORED'
                                ? 'Restored to Active'
                                : rev.action}
                      </span>
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {rev.changedBy || 'admin'}
                      </span>
                    </div>
                  </div>

                  {/* Change Reason */}
                  <div className="px-4 py-3 bg-white text-xs border-b border-slate-100">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Reason:</span>{' '}
                    <span className="text-slate-800 font-medium">{rev.changeReason || 'No reason provided'}</span>
                  </div>

                  {/* Changes Diff Table */}
                  {diffs.length > 0 ? (
                    <div className="p-4 bg-slate-50/50">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Changes Breakdown
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                              <th className="py-2.5 px-3 w-1/3">Field</th>
                              <th className="py-2.5 px-3 w-1/3">Previous Value</th>
                              <th className="py-2.5 px-3 w-1/3">New Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {diffs.map((d, dIdx) => (
                              <tr key={dIdx} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-bold text-slate-700">{d.field}</td>
                                <td className="py-2 px-3 font-mono text-rose-700 bg-rose-50/50 font-medium">
                                  {d.oldVal || '-'}
                                </td>
                                <td className="py-2 px-3 font-mono text-emerald-700 bg-emerald-50/50 font-bold">
                                  {d.newVal || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : rev.action === 'CREATED_FINALIZED' ? (
                    <div className="p-4 text-xs text-slate-500 italic bg-slate-50/30">
                      Original version created with all line items and customer snapshot.
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}
