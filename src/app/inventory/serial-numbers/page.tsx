'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Hash,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Shield,
  Laptop,
  ArrowRight,
  Edit,
  X
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

function SerialNumbersContent() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [serials, setSerials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState('All');

  // Edit / Add Modal
  const [selectedSerial, setSelectedSerial] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('In Stock');
  const [newNotes, setNewNotes] = useState('');

  // Add Serial Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [addForm, setAddForm] = useState({
    serialNumber: '',
    productId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    status: 'In Stock',
    notes: '',
  });

  const fetchSerials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/serial-numbers?search=${encodeURIComponent(search)}&status=${statusFilter}`);
      const json = await res.json();
      if (json.success) setSerials(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSerials();
    fetch('/api/products')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setProducts(res.data);
      });
  }, [search, statusFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSerial) return;

    try {
      const res = await fetch('/api/serial-numbers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSerial.id,
          status: newStatus,
          notes: newNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedSerial(null);
        fetchSerials();
      } else {
        alert(json.error || 'Failed to update serial');
      }
    } catch (err) {
      alert('Error updating serial');
    }
  };

  const handleAddNewSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.serialNumber || !addForm.productId) {
      alert('Please fill serial number and choose product');
      return;
    }

    try {
      const res = await fetch('/api/serial-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (json.success) {
        alert(`Serial number ${addForm.serialNumber} added to stock!`);
        setShowAddModal(false);
        setAddForm({
          serialNumber: '',
          productId: '',
          purchasePrice: 0,
          sellingPrice: 0,
          status: 'In Stock',
          notes: '',
        });
        fetchSerials();
      } else {
        alert(json.error || 'Failed to add serial');
      }
    } catch (err) {
      alert('Error adding serial number');
    }
  };

  const statuses = [
    'All',
    'In Stock',
    'Sold',
    'Reserved',
    'Under Repair',
    'Returned',
    'Warranty Claim',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Hash className="w-5 h-5 text-slate-700" />
            <span>Serial Numbers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual hardware unit tracking, customer mapping, and warranty records
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Serial Number</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by serial number, product, customer..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition whitespace-nowrap ${statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Serials Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Customer & Sale Date</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Warranty</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading serial numbers...
                  </td>
                </tr>
              ) : serials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No serial numbers found.
                  </td>
                </tr>
              ) : (
                serials.map((sn) => (
                  <tr key={sn.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                      {sn.serialNumber}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 truncate">
                        {sn.product?.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        Cost: {formatCurrency(sn.purchasePrice)} • Selling: {formatCurrency(sn.sellingPrice)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${sn.status === 'In Stock'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : sn.status === 'Sold'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : sn.status === 'Under Repair'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                      >
                        {sn.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {sn.customer ? (
                        <div>
                          <div className="font-medium text-slate-800">{sn.customer.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums">{formatDate(sn.saleDate)}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      {sn.salesInvoice ? (
                        <span className="font-medium text-slate-900">
                          {sn.salesInvoice.invoiceNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600 font-mono tabular-nums">
                      {sn.warrantyEnd ? (
                        <span>Valid till {formatDate(sn.warrantyEnd)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSerial(sn);
                          setNewStatus(sn.status);
                          setNewNotes(sn.notes || '');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Status Modal */}
      {selectedSerial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Update Status for <span className="font-mono tabular-nums">{selectedSerial.serialNumber}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">{selectedSerial.product?.name}</p>

            <form onSubmit={handleUpdateStatus} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Sold">Sold</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Under Repair">Under Repair</option>
                  <option value="Returned">Returned</option>
                  <option value="Warranty Claim">Warranty Claim</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Remarks</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes or repair diagnostics"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSerial(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Serial Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add Serial Number</h3>
            <form onSubmit={handleAddNewSerial} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Serial Number <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={addForm.serialNumber}
                  onChange={(e) => setAddForm({ ...addForm, serialNumber: e.target.value })}
                  placeholder="e.g. LAT5410-99210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Product <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={addForm.productId}
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    setAddForm({
                      ...addForm,
                      productId: e.target.value,
                      purchasePrice: p?.purchasePrice || 0,
                      sellingPrice: p?.sellingPrice || 0,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={addForm.purchasePrice}
                    onChange={(e) => setAddForm({ ...addForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={addForm.sellingPrice}
                    onChange={(e) => setAddForm({ ...addForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  Save Serial Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SerialNumbersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading serial numbers...</div>}>
      <SerialNumbersContent />
    </Suspense>
  );
}

