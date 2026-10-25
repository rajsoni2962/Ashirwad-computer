'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, FileText, Info } from 'lucide-react';

export interface InvoiceTypeOption {
  value: string;
  label: string;
  shortDesc: string;
  badge?: string;
}

export const INVOICE_TYPE_OPTIONS: InvoiceTypeOption[] = [
  {
    value: 'TAX_INVOICE',
    label: 'Tax Invoice',
    shortDesc: 'Standard GST tax invoice for B2B or B2C transactions with full tax breakdown.',
    badge: 'GST Standard',
  },
  {
    value: 'BILL_OF_SUPPLY',
    label: 'Bill of Supply',
    shortDesc: 'For composition dealers or exempt / nil-rated goods. Taxes cannot be charged under GST law.',
    badge: 'Composition / Nil',
  },
  {
    value: 'NON_GST',
    label: 'Invoice',
    shortDesc: 'Standard invoice for unregistered dealers or non-taxable goods without tax breakdown.',
    badge: 'Standard Bill',
  },
  {
    value: 'PROFORMA',
    label: 'Proforma Invoice',
    shortDesc: 'Preliminary commercial invoice issued to request advance payment or quote terms prior to final sale.',
    badge: 'Preliminary',
  },
  {
    value: 'QUOTATION',
    label: 'Quotation / Estimate',
    shortDesc: 'Formal price quote for customer review. Does not deduct inventory stock or affect customer balance.',
    badge: 'No Stock Impact',
  },
  {
    value: 'CASH_MEMO',
    label: 'Cash Memo',
    shortDesc: 'Immediate counter cash sale receipt for retail purchases paid in cash.',
    badge: 'Counter Cash',
  },
];

export interface InvoiceTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  showHelperDescription?: boolean;
  includeAllOption?: boolean;
  variant?: 'form' | 'compact';
}

export default function InvoiceTypeSelect({
  value,
  onChange,
  disabled = false,
  className = '',
  id,
  name = 'invoiceType',
  showHelperDescription = false,
  includeAllOption = false,
  variant = 'form',
}: InvoiceTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const allOption: InvoiceTypeOption = {
    value: 'All',
    label: 'All Types',
    shortDesc: 'Show invoices across all document types.',
    badge: 'Filter',
  };

  const options: InvoiceTypeOption[] = includeAllOption
    ? [allOption, ...INVOICE_TYPE_OPTIONS]
    : INVOICE_TYPE_OPTIONS;

  const selectedOption =
    options.find((opt) => opt.value === value) ||
    options.find((opt) => opt.value === 'TAX_INVOICE') ||
    options[0];

  // Close on outside click
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
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        const idx = options.findIndex((opt) => opt.value === selectedOption.value);
        setFocusedIndex(idx >= 0 ? idx : 0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < options.length) {
        onChange(options[focusedIndex].value);
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const isCompact = variant === 'compact';

  return (
    <div className={`relative ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Hidden native select for form serialization and automated integration accessibility */}
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Styled Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 bg-white border rounded-xl text-left font-semibold transition shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
            ? 'border-indigo-600 ring-2 ring-indigo-500/20 text-slate-900 bg-white'
            : 'border-slate-300 hover:border-slate-400 text-slate-900 hover:bg-slate-50/50'
        } ${isCompact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2.5 text-xs'}`}
      >
        <span className="flex items-center gap-2 truncate">
          {!isCompact && <FileText className="w-4 h-4 text-indigo-600 shrink-0" />}
          <span className="truncate">{selectedOption.label}</span>
        </span>

        <span className="flex items-center gap-1.5 shrink-0">
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'
            }`}
          />
        </span>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1 overflow-hidden ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-100 min-w-[220px]"
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isFocused = idx === focusedIndex;

            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`w-full flex items-center justify-between gap-2 text-left cursor-pointer transition select-none ${
                  isCompact ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-xs'
                } ${
                  isSelected
                    ? 'bg-indigo-50/90 text-indigo-950 font-bold border-l-3 border-indigo-600'
                    : isFocused
                    ? 'bg-slate-50 text-slate-900 font-medium'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{opt.label}</span>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[2.5]" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Short description beneath the selected type */}
      {showHelperDescription && selectedOption.shortDesc && (
        <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-slate-500 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
          <span>{selectedOption.shortDesc}</span>
        </div>
      )}
    </div>
  );
}
