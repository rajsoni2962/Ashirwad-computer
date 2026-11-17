'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import {
  AlertTriangle,
  Package,
  ShoppingCart,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Search,
  Camera
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  condition: string;
  currentStock: number;
  minimumStock: number;
  purchasePrice: number;
  sellingPrice: number;
}

export default function LowStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.data) {
        // filter for low stock: physical products only where currentStock <= minStock
        const low = data.data.filter(
          (p: any) =>
            p.productType !== 'SERVICE' &&
            p.category?.toLowerCase() !== 'service' &&
            p.currentStock <= (p.minStock ?? p.minimumStock ?? 1)
        );
        setProducts(low);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Low Stock Alerts
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Products at or below minimum inventory reorder threshold
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/purchases/import-bill"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <Camera className="w-3.5 h-3.5 text-slate-600" />
              Import Bill (OCR)
            </Link>
            <Link
              href="/purchases/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              New Purchase
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product, brand or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
            />
          </div>
          <div className="text-xs text-slate-500">
            Critical items: <span className="font-mono font-semibold text-rose-600 tabular-nums">{products.length}</span>
          </div>
        </div>

        {/* Low Stock Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-600" />
              <span className="text-xs">Checking stock levels...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Package className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <div className="font-semibold text-slate-900 text-sm">All Stock Levels Normal</div>
              <p className="text-xs text-slate-400 mt-0.5">
                No items are currently below minimum stock threshold.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Minimum Threshold</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => {
                    const isZero = p.currentStock === 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-400">{p.brand} {p.condition ? `• ${p.condition}` : ''}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded font-medium">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-mono font-semibold text-xs px-2 py-0.5 rounded tabular-nums ${isZero
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                          >
                            {p.currentStock} {isZero ? '(Out)' : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-700 tabular-nums">
                          {p.minimumStock}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                          ₹{p.purchasePrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/purchases/new?productId=${p.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Reorder</span>
                          </Link>
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
