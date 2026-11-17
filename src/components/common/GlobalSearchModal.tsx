'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Laptop, FileText, Users, Truck, Hash } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    products: any[];
    invoices: any[];
    purchases: any[];
    customers: any[];
    suppliers: any[];
    serialNumbers: any[];
  }>({
    products: [],
    invoices: [],
    purchases: [],
    customers: [],
    suppliers: [],
    serialNumbers: [],
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({
        products: [],
        invoices: [],
        purchases: [],
        customers: [],
        suppliers: [],
        serialNumbers: [],
      });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.products.length +
    results.invoices.length +
    results.purchases.length +
    results.customers.length +
    results.suppliers.length +
    results.serialNumbers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 gap-3 bg-slate-50/50">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoices, inventory, serial numbers, customers, suppliers..."
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] text-slate-400 bg-slate-100 rounded border border-slate-200 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-500">
              <div className="animate-spin w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-2" />
              Searching records...
            </div>
          )}

          {!loading && query.length >= 2 && totalResults === 0 && (
            <div className="py-12 text-center text-xs text-slate-500">
              No matching records found for <span className="font-semibold text-slate-700">"{query}"</span>
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type at least 2 characters to search across all modules.
            </div>
          )}

          {/* Serial Numbers Match */}
          {results.serialNumbers.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3 h-3 text-slate-500" />
                Serial Numbers
              </div>
              <div className="space-y-1">
                {results.serialNumbers.map((sn) => (
                  <Link
                    key={sn.id}
                    href={`/inventory/serial-numbers?search=${encodeURIComponent(sn.serialNumber)}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-2 font-mono tabular-nums">
                        <span>{sn.serialNumber}</span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            sn.status === 'In Stock'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sn.status === 'Sold'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {sn.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {sn.product?.name}
                        {sn.customer ? ` • Sold to: ${sn.customer.name}` : ''}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 font-medium transition">
                      View →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Invoices Match */}
          {results.invoices.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-slate-500" />
                Sales Invoices
              </div>
              <div className="space-y-1">
                {results.invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/sales/invoices/${inv.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-2 font-mono tabular-nums">
                        <span>{inv.invoiceNumber}</span>
                        <span className="text-xs font-normal text-slate-400">
                          {formatDate(inv.date)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {inv.customer?.name} • {inv.paymentStatus}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-900 font-mono tabular-nums">
                        {formatCurrency(inv.grandTotal)}
                      </div>
                      <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 font-medium transition">
                        Open →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Products Match */}
          {results.products.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <Laptop className="w-3 h-3 text-slate-500" />
                Products & Inventory
              </div>
              <div className="space-y-1">
                {results.products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/inventory/products?search=${encodeURIComponent(p.name)}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums font-mono">
                        Stock: <span className="font-semibold text-slate-800">{p.currentStock}</span> • {formatCurrency(p.sellingPrice)}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 font-medium transition">
                      View →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Customers & Suppliers Match */}
          {(results.customers.length > 0 || results.suppliers.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.customers.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-slate-500" />
                    Customers
                  </div>
                  <div className="space-y-1">
                    {results.customers.map((c) => (
                      <Link
                        key={c.id}
                        href={`/customers/ledger?customerId=${c.id}`}
                        onClick={onClose}
                        className="block p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                      >
                        <div className="text-xs font-medium text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums">{c.phone}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.suppliers.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3 h-3 text-slate-500" />
                    Suppliers
                  </div>
                  <div className="space-y-1">
                    {results.suppliers.map((s) => (
                      <Link
                        key={s.id}
                        href={`/suppliers/ledger?supplierId=${s.id}`}
                        onClick={onClose}
                        className="block p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                      >
                        <div className="text-xs font-medium text-slate-900">{s.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums">{s.phone || s.gstin || 'Supplier'}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
