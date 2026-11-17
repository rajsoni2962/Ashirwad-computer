'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Keyboard, X, Sparkles, Command } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  label: string;
  action: () => void;
  category: 'Billing' | 'Navigation' | 'General';
}

export default function GlobalKeyboardShortcuts() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept normal typing in text fields if no modifier key is held
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // F1 or Alt+K: open shortcut cheat sheet
      if (e.key === 'F1' || (e.altKey && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Escape: close shortcut modal
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        return;
      }

      // Alt key accelerators for instant navigation
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        switch (key) {
          case 's':
            e.preventDefault();
            router.push('/sales/new');
            break;
          case 'p':
            e.preventDefault();
            router.push('/purchases/new');
            break;
          case 'r':
            e.preventDefault();
            router.push('/sales/payments');
            break;
          case 'e':
            e.preventDefault();
            router.push('/expenses');
            break;
          case 'b':
            e.preventDefault();
            router.push('/banking');
            break;
          case 'i':
            e.preventDefault();
            router.push('/inventory');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, isOpen]);

  const shortcuts: { keys: string[]; label: string; desc: string }[] = [
    { keys: ['Alt', 'S'], label: 'New Sales Invoice', desc: 'Open billing screen to create invoice / quotation' },
    { keys: ['Alt', 'P'], label: 'New Purchase Bill', desc: 'Record goods inwards and supplier bills' },
    { keys: ['Alt', 'R'], label: 'Record Payment', desc: 'Record customer receipt or outstanding recovery' },
    { keys: ['Alt', 'E'], label: 'Expenses', desc: 'Log operational, tea, rent or repair expenses' },
    { keys: ['Alt', 'B'], label: 'Cash & Bank', desc: 'Manage liquidity, bank balances & contra transfers' },
    { keys: ['Alt', 'I'], label: 'Inventory Items', desc: 'View stock levels, serial numbers & items' },
    { keys: ['F1', 'or', 'Alt', 'K'], label: 'Shortcuts Help', desc: 'Open or close this keyboard reference cheat sheet' },
  ];

  return (
    <>
      {/* Floating Shortcut Badge for Desktop */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 text-[11px] font-bold rounded-xl border border-slate-200/80 shadow-xs backdrop-blur-sm transition"
        title="Keyboard Shortcuts (Press F1 or Alt+K)"
      >
        <Keyboard className="w-3.5 h-3.5 text-slate-500" />
        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
          Alt+K
        </span>
      </button>

      {/* Shortcuts Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Keyboard className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Keyboard Shortcuts & Accelerators
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    High-speed keyboard navigation designed for rapid counter billing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {shortcuts.map((sc, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{sc.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{sc.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {sc.keys.map((k, ki) => (
                      <kbd
                        key={ki}
                        className={`text-[11px] font-mono font-bold px-2 py-1 rounded-md border ${
                          k === 'or'
                            ? 'border-transparent text-slate-400 bg-transparent px-0.5'
                            : 'bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                        }`}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Press <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">Esc</kbd> to close</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
