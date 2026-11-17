'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import {
  Package,
  Layers,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Tag,
  Plus
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

export default function StockOverviewPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProducts(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const physicalProducts = products.filter(
    (p: any) => p.productType !== 'SERVICE' && p.category?.toLowerCase() !== 'service'
  );
  const totalStockUnits = physicalProducts.reduce((acc, p) => acc + p.currentStock, 0);
  const totalCostValuation = physicalProducts.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);
  const totalRetailValuation = physicalProducts.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);
  const lowStockCount = physicalProducts.filter(
    (p: any) => p.currentStock <= (p.minStock ?? p.minimumStock ?? 1)
  ).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-slate-700" />
              Stock & Valuation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Current stock quantities, asset valuation, and inventory health
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/inventory/adjustment"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              Stock Adjustment
            </Link>
            <Link
              href="/inventory/products"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Manage Products
            </Link>
          </div>
        </div>

        {/* Valuation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500">In-Stock Units</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{totalStockUnits}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{products.length} product SKUs</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500">Cost Valuation</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">₹{totalCostValuation.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Inventory purchase capital</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500">Retail Valuation</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">₹{totalRetailValuation.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Projected revenue</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500">Low Stock</div>
            <div className={`text-2xl font-bold font-mono mt-1 tabular-nums ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{lowStockCount}</div>
            <Link href="/inventory/low-stock" className="text-[11px] font-medium text-slate-700 hover:underline mt-0.5 inline-block">
              View items &rarr;
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition ${selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Inventory Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-600" />
              <span className="text-xs">Loading stock data...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">No records found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Available Stock</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Valuation</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p: any) => {
                    const threshold = p.minStock ?? p.minimumStock ?? 1;
                    const isLow = p.currentStock <= threshold;
                    const isOut = p.currentStock === 0;
                    const costVal = p.currentStock * p.purchasePrice;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-400">{p.brand} {p.condition ? `• ${p.condition}` : ''}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded font-medium">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.productType === 'SERVICE' || p.category?.toLowerCase() === 'service' ? (
                            <span className="font-medium text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              Service
                            </span>
                          ) : (
                            <>
                              <span
                                className={`font-mono font-semibold text-xs px-2 py-0.5 rounded tabular-nums ${isOut
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : isLow
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}
                              >
                                {p.currentStock}
                              </span>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 tabular-nums">Min: {threshold}</div>
                            </>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                          ₹{p.purchasePrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 tabular-nums">
                          ₹{p.sellingPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {p.productType === 'SERVICE' || p.category?.toLowerCase() === 'service' ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            `₹${costVal.toLocaleString('en-IN')}`
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.productType === 'SERVICE' || p.category?.toLowerCase() === 'service' ? (
                            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Service
                            </span>
                          ) : isOut ? (
                            <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              In Stock
                            </span>
                          )}
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
