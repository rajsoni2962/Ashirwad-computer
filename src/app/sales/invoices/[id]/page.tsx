'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import InvoicePrintView from '@/components/invoice/InvoicePrintView';

export default function InvoiceDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ])
      .then(([invRes, setRes]) => {
        if (invRes.success) setInvoice(invRes.data);
        if (setRes.success) setSettings(setRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-20 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Invoice not found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested document does not exist or has been removed.</p>
      </div>
    );
  }

  return <InvoicePrintView invoice={invoice} settings={settings} />;
}
