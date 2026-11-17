'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Wrench, Check, AlertTriangle, Hash, FileText, PackagePlus, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface Product {
  id: string;
  name: string;
  productType?: 'PHYSICAL' | 'SERVICE' | string;
  brand?: string | null;
  model?: string | null;
  category?: string;
  cpu?: string | null;
  generation?: string | null;
  ram?: string | null;
  storage?: string | null;
  condition?: string | null;
  hsn?: string | null;
  gstPercent?: number;
  sellingPrice?: number;
  currentStock: number;
  warranty?: string | null;
  serialNumbers?: { id: string; serialNumber: string; status: string }[];
}

interface ProductSearchSelectProps {
  selectedProduct: Product | null;
  onSelectProduct: (product: Product | null) => void;
  disabled?: boolean;
  placeholder?: string;
  onAddToInvoiceOnly?: (query: string) => void;
  onCreateAndAddToStock?: (query: string) => void;
}

export default function ProductSearchSelect({
  selectedProduct,
  onSelectProduct,
  disabled = false,
  placeholder = 'Search Product: Dell Latitude 5410, i5, 8GB, Cleaning, Repair...',
  onAddToInvoiceOnly,
  onCreateAndAddToStock,
}: ProductSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setResults(data.data);
          setHighlightedIndex(data.data.length > 0 ? 0 : -1);
        }
      } catch (err) {
        console.error('Failed to search products:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectProduct(null);
    setQuery('');
    inputRef.current?.focus();
  };

  const isService =
    selectedProduct?.productType === 'SERVICE' || selectedProduct?.category?.toLowerCase() === 'service';

  return (
    <div className="relative w-full" ref={containerRef}>
      {selectedProduct ? (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                isService ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 text-white'
              }`}
            >
              {isService ? <Wrench className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
            </div>

            <div className="min-w-0">
              <div className="font-semibold text-slate-900 text-xs flex items-center gap-2 truncate">
                <span className="truncate">{selectedProduct.name}</span>
                {isService ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                    Service
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 font-mono tabular-nums ${
                      selectedProduct.currentStock <= 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    Stock: {selectedProduct.currentStock}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 truncate space-x-1.5">
                {selectedProduct.brand && <span>{selectedProduct.brand}</span>}
                {selectedProduct.cpu && <span>• {selectedProduct.cpu}</span>}
                {selectedProduct.ram && <span>• {selectedProduct.ram}</span>}
                {selectedProduct.storage && <span>• {selectedProduct.storage}</span>}
                <span className="font-semibold text-slate-900 font-mono tabular-nums">
                  • Rate: {formatCurrency(selectedProduct.sellingPrice || 0)}
                </span>
              </div>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition shrink-0 ml-2"
              title="Change product"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              disabled={disabled}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 focus:border-slate-900 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none shadow-xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-[11px] text-slate-500 font-semibold">
                <span>
                  {loading ? 'Searching...' : `${results.length} record${results.length === 1 ? '' : 's'}`}
                </span>
              </div>

              <ul ref={resultsRef} className="max-h-60 overflow-y-auto divide-y divide-slate-100 custom-scrollbar text-xs">
                {loading && results.length === 0 ? (
                  <li className="p-4 text-center text-slate-400">Loading...</li>
                ) : results.length === 0 ? (
                  <li className="p-4 bg-slate-50/50">
                    <div className="text-center mb-3">
                      <p className="text-xs font-semibold text-slate-700">
                        No products match &ldquo;<span className="text-slate-900 font-bold">{query || '...'}</span>&rdquo;
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* Action 1: Add to Invoice Only */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onAddToInvoiceOnly?.(query.trim());
                        }}
                        className="p-3 text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-1">
                          <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                          <span className="truncate">Add to Invoice Only</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug">
                          Bill directly without creating inventory product.
                        </p>
                      </button>

                      {/* Action 2: Create Item & Add to Stock */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onCreateAndAddToStock?.(query.trim());
                        }}
                        className="p-3 text-left bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                          <PackagePlus className="w-4 h-4 text-slate-300 shrink-0" />
                          <span className="truncate">Add to Inventory & Stock</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-snug">
                          Open product form, record stock, and insert.
                        </p>
                      </button>
                    </div>
                  </li>
                ) : (
                  results.map((p, idx) => {
                    const isHighlighted = idx === highlightedIndex;
                    const itemIsService =
                      p.productType === 'SERVICE' || p.category?.toLowerCase() === 'service';

                    return (
                      <li
                        key={p.id}
                        onClick={() => handleSelect(p)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`p-2.5 cursor-pointer transition flex items-center justify-between ${
                          isHighlighted ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                            <span>{p.name}</span>
                            {itemIsService ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                Service
                              </span>
                            ) : p.currentStock <= 0 ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono tabular-nums">
                                Out of Stock
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono tabular-nums">
                                {p.currentStock} in stock
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 space-x-1.5 truncate">
                            {p.brand && <span className="font-semibold text-slate-700">{p.brand}</span>}
                            {p.model && <span>{p.model}</span>}
                            {p.cpu && <span>• {p.cpu}</span>}
                            {p.ram && <span>• {p.ram}</span>}
                            {p.storage && <span>• {p.storage}</span>}
                            {p.hsn && <span>• HSN: {p.hsn}</span>}
                          </div>
                        </div>

                        <div className="shrink-0 text-right font-bold text-slate-900 font-mono tabular-nums text-xs">
                          {formatCurrency(p.sellingPrice || 0)}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>

              {/* Action menu in dropdown footer */}
              {(onAddToInvoiceOnly || onCreateAndAddToStock) && (
                <div className="p-2 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500 font-medium">Quick Actions:</span>
                  <div className="flex items-center gap-2">
                    {onAddToInvoiceOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onAddToInvoiceOnly(query.trim());
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                      >
                        <FileText className="w-3 h-3 text-slate-500" />
                        <span>Bill Directly</span>
                      </button>
                    )}
                    {onCreateAndAddToStock && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onCreateAndAddToStock(query.trim());
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                      >
                        <PackagePlus className="w-3 h-3" />
                        <span>Add to Inventory</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
