'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  SlidersHorizontal,
  History,
  Plus,
  Minus,
  Save,
  RefreshCw,
  AlertCircle,
  Package,
  Calendar,
  CheckCircle2,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  currentStock: number;
  purchasePrice: number;
}

interface StockMovement {
  id: string;
  date: string;
  type: string;
  referenceType: string;
  referenceNumber?: string | null;
  quantityChange: number;
  balanceAfter: number;
  unitPrice?: number | null;
  notes?: string | null;
  product?: {
    name: string;
    brand: string;
  };
}

export default function StockAdjustmentPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('Physical Stock Count');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data);
        if (!selectedProductId && data.data.length > 0) {
          setSelectedProductId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchMovements = async () => {
    setLoadingMovements(true);
    try {
      const res = await fetch('/api/stock-adjustments');
      const data = await res.json();
      if (data.success && data.data) {
        setMovements(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMovements();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setErrorMsg('');
    setSuccessMsg('');

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Please enter a valid positive quantity.');
      return;
    }

    const change = adjustmentType === 'ADD' ? qty : -qty;

    if (adjustmentType === 'REMOVE' && selectedProduct && selectedProduct.currentStock < qty) {
      setErrorMsg(`Cannot remove ${qty} units. Current stock is only ${selectedProduct.currentStock}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          quantityChange: change,
          reason: `${reason}: ${notes}`,
          unitPrice: selectedProduct?.purchasePrice || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Successfully adjusted stock for ${selectedProduct?.name}.`);
        setQuantity('1');
        setNotes('');
        fetchProducts();
        fetchMovements();
      } else {
        setErrorMsg(data.error || 'Failed to adjust stock');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-slate-700" />
            Stock Adjustment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical stock count reconciliation and movement audit log
          </p>
        </div>

        {/* Top: Adjustment Form + Product Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Adjustment Input Box */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-600" />
              Adjust Stock Level
            </h2>

            {errorMsg && (
              <div className="mb-3.5 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-3.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Product <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand}) — Stock: {p.currentStock} units
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Action
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustmentType('ADD')}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition border ${
                        adjustmentType === 'ADD'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentType('REMOVE')}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition border ${
                        adjustmentType === 'REMOVE'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                      Reduce Stock
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Reason
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Physical Stock Count Reconciliation">Physical Stock Count</option>
                    <option value="Damaged / Dead on Arrival">Damaged / Dead on Arrival</option>
                    <option value="Demo Unit Dispatched">Demo Unit Dispatched</option>
                    <option value="Internal Repair Usage">Internal Repair Usage</option>
                    <option value="Supplier Return Replacement">Supplier Return</option>
                    <option value="Other Correction">Other Correction</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Specific remarks"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submitting ? 'Saving...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>

          {/* Product Realtime Snapshot */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col justify-between border border-slate-800">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                Selected Product
              </div>
              {selectedProduct ? (
                <div>
                  <div className="text-base font-bold">{selectedProduct.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{selectedProduct.brand} • {selectedProduct.category}</div>
                  
                  <div className="mt-5 p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                    <div className="text-[11px] text-slate-400 font-medium">Current Stock</div>
                    <div className="text-2xl font-bold font-mono text-white mt-0.5 tabular-nums">
                      {selectedProduct.currentStock} <span className="text-xs font-normal text-slate-400">units</span>
                    </div>

                    <div className="border-t border-slate-700 mt-3 pt-2.5 flex justify-between text-xs">
                      <span className="text-slate-400">After adjustment:</span>
                      <span className="font-mono font-bold text-white tabular-nums">
                        {adjustmentType === 'ADD'
                          ? selectedProduct.currentStock + (parseInt(quantity) || 0)
                          : Math.max(0, selectedProduct.currentStock - (parseInt(quantity) || 0))}{' '}
                        units
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">Select a product to view stock</div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3 mt-4">
              All stock adjustments are logged permanently in the audit ledger.
            </div>
          </div>
        </div>

        {/* Complete Movement History Log */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                Stock Movement Log
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of purchases, sales, returns, and manual adjustments
              </p>
            </div>
            <button
              onClick={fetchMovements}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingMovements ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-600" />
              <span className="text-xs">Loading movement logs...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No stock movements recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 text-center">Change</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => {
                    const isPositive = m.quantityChange > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px] tabular-nums">
                          {new Date(m.date).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {m.product?.name || 'Unknown Product'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {m.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                          {m.referenceNumber || m.referenceType}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-mono font-semibold text-xs px-2 py-0.5 rounded tabular-nums ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 tabular-nums">
                          {m.balanceAfter}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {m.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
