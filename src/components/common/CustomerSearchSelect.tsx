'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Phone, Check, Plus, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  state?: string | null;
  stateCode?: string | null;
  currentBalance?: number;
}

interface CustomerSearchSelectProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onAddNewCustomer?: () => void;
  disabled?: boolean;
}

export default function CustomerSearchSelect({
  selectedCustomer,
  onSelectCustomer,
  onAddNewCustomer,
  disabled = false,
}: CustomerSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);

  // Debounced live database search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setResults(data.data);
          setHighlightedIndex(data.data.length > 0 ? 0 : -1);
        }
      } catch (err) {
        console.error('Failed to search customers:', err);
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

  // Keyboard navigation
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

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCustomer(null);
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* If a customer is already selected, show selected customer chip with Clear button */}
      {selectedCustomer ? (
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {selectedCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2 truncate">
                <span>{selectedCustomer.name}</span>
                {selectedCustomer.currentBalance && selectedCustomer.currentBalance > 0 ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0 font-mono tabular-nums">
                    Due: {formatCurrency(selectedCustomer.currentBalance)}
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 truncate mt-0.5">
                <span className="flex items-center gap-1 font-mono tabular-nums">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {selectedCustomer.phone}
                </span>
                {selectedCustomer.gstin && (
                  <span className="font-mono text-slate-600 font-semibold">• GSTIN: {selectedCustomer.gstin}</span>
                )}
                {selectedCustomer.address && (
                  <span className="truncate hidden sm:inline">• {selectedCustomer.address}</span>
                )}
              </div>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition shrink-0 ml-2"
              title="Clear customer selection"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Search Input */
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
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
              placeholder="Search Customer by name, mobile, or GSTIN..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-slate-900 rounded-xl text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 transition focus:outline-none shadow-xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-[11px] text-slate-500 font-semibold">
                <span>
                  {loading ? 'Searching...' : `${results.length} record${results.length === 1 ? '' : 's'}`}
                </span>
                {onAddNewCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onAddNewCustomer();
                    }}
                    className="text-slate-900 hover:text-slate-700 font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Customer</span>
                  </button>
                )}
              </div>

              <ul ref={resultsRef} className="max-h-64 overflow-y-auto divide-y divide-slate-100 custom-scrollbar text-xs">
                {loading && results.length === 0 ? (
                  <li className="p-4 text-center text-slate-400">Loading...</li>
                ) : results.length === 0 ? (
                  <li className="p-5 text-center text-slate-500 space-y-2">
                    <p className="font-medium">No matching customers found</p>
                    {onAddNewCustomer && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onAddNewCustomer();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create &ldquo;{query}&rdquo;</span>
                      </button>
                    )}
                  </li>
                ) : (
                  results.map((c, idx) => {
                    const isHighlighted = idx === highlightedIndex;
                    return (
                      <li
                        key={c.id}
                        onClick={() => handleSelect(c)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`p-3 cursor-pointer transition flex items-center justify-between ${
                          isHighlighted ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                            <span>{c.name}</span>
                            <span className="text-slate-400 font-normal font-mono tabular-nums">• {c.phone}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 truncate">
                            {c.gstin && (
                              <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">
                                GST: {c.gstin}
                              </span>
                            )}
                            {c.address && <span className="truncate">{c.address}</span>}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {c.currentBalance && c.currentBalance > 0 ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono tabular-nums">
                              Due: {formatCurrency(c.currentBalance)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Nil</span>
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
