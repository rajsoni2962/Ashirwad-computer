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
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                isService ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {isService ? <Wrench className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
            </div>

            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-2 truncate">
                <span className="truncate">{selectedProduct.name}</span>
                {isService ? (
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    Service
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                      selectedProduct.currentStock <= 0
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-800'
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
                <span className="font-semibold text-indigo-700">
                  • Price: {formatCurrency(selectedProduct.sellingPrice || 0)}
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
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none shadow-xs"
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
            <div className="absolute z-50 mt-1 w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-50 duration-150">
              <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 text-[11px] text-slate-500 font-semibold">
                <span>
                  {loading ? 'Searching products...' : `${results.length} item${results.length === 1 ? '' : 's'} found`}
                </span>
              </div>

              <ul ref={resultsRef} className="max-h-60 overflow-y-auto divide-y divide-slate-100 custom-scrollbar text-xs">
                {loading && results.length === 0 ? (
                  <li className="p-4 text-center text-slate-400">Loading inventory...</li>
                ) : results.length === 0 ? (
                  <li className="p-4 bg-slate-50/50">
                    <div className="text-center mb-3">
                      <p className="text-xs font-semibold text-slate-700">
                        0 items found matching &ldquo;<span className="text-slate-900 font-bold">{query || '...'}</span>&rdquo;
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Choose how you would like to add this item:
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
                        className="p-3 text-left bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-xl transition group shadow-2xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                          <FileText className="w-4 h-4 text-amber-700 shrink-0 group-hover:scale-110 transition" />
                          <span className="truncate">Add &ldquo;{query || 'item'}&rdquo; to Invoice Only</span>
                        </div>
                        <p className="text-[10px] text-amber-800/80 leading-snug">
                          Bill item directly without creating an inventory product or tracking stock.
                        </p>
                      </button>

                      {/* Action 2: Create Item & Add to Stock */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onCreateAndAddToStock?.(query.trim());
                        }}
                        className="p-3 text-left bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl transition group shadow-2xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-1">
                          <PackagePlus className="w-4 h-4 text-indigo-700 shrink-0 group-hover:scale-110 transition" />
                          <span className="truncate">Create &ldquo;{query || 'item'}&rdquo; & Add to Stock</span>
                        </div>
                        <p className="text-[10px] text-indigo-800/80 leading-snug">
                          Open form to save specs, serials & stock in inventory, then insert into invoice.
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
                          isHighlighted ? 'bg-indigo-50/80 text-indigo-950' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <span>{p.name}</span>
                            {itemIsService ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                Service
                              </span>
                            ) : p.currentStock <= 0 ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700">
                                Out of Stock
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
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

                        <div className="shrink-0 text-right font-black text-indigo-700 text-xs">
                          {formatCurrency(p.sellingPrice || 0)}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>

              {/* Action menu in dropdown footer - accessible even when search results exist */}
              {(onAddToInvoiceOnly || onCreateAndAddToStock) && (
                <div className="p-2 border-t border-slate-100 bg-slate-50/90 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500 font-medium">Additional Actions:</span>
                  <div className="flex items-center gap-2">
                    {onAddToInvoiceOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onAddToInvoiceOnly(query.trim());
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                      >
                        <FileText className="w-3 h-3 text-amber-600" />
                        <span>Add &ldquo;{query.trim() || 'Item'}&rdquo; to Invoice Only</span>
                      </button>
                    )}
                    {onCreateAndAddToStock && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onCreateAndAddToStock(query.trim());
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
                      >
                        <PackagePlus className="w-3 h-3 text-indigo-600" />
                        <span>Create &ldquo;{query.trim() || 'Item'}&rdquo; & Add to Stock</span>
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
