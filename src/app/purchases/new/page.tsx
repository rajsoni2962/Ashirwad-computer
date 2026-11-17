'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Plus, Trash2, CheckCircle2, ArrowLeft, Camera } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function NewManualPurchasePage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<any[]>([
    {
      productId: '',
      description: '',
      hsn: '8471',
      quantity: 1,
      unit: 'Pcs',
      rate: 0,
      discount: 0,
      gstPercent: 18,
      taxableAmount: 0,
      gstAmount: 0,
      total: 0,
      serialNumbers: '',
    },
  ]);

  useEffect(() => {
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSuppliers(res.data);
      });
    fetch('/api/products')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setProducts(res.data);
      });
  }, []);

  const round2 = (num: number) => Math.round(num * 100) / 100;

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const updated = [...items];
    const item = { ...updated[index] };
    item.productId = prodId;
    item.description = prod.name;
    item.hsn = prod.hsn || '8471';
    item.rate = prod.purchasePrice || 0;
    item.gstPercent = prod.gstPercent || 18;

    const qty = item.quantity || 1;
    const baseAmount = Math.max(0, qty * item.rate - (item.discount || 0));
    const taxable = round2(baseAmount / (1 + item.gstPercent / 100));
    const gstAmt = round2(baseAmount - taxable);

    item.taxableAmount = taxable;
    item.gstAmount = gstAmt;
    item.total = round2(baseAmount);

    updated[index] = item;
    setItems(updated);
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    const it = { ...updated[index], [field]: val };

    const qty = parseFloat(it.quantity) || 1;
    const rate = parseFloat(it.rate) || 0;
    const disc = parseFloat(it.discount) || 0;
    const gstPct = parseFloat(it.gstPercent) || 18;

    const baseAmount = Math.max(0, qty * rate - disc);
    const taxable = round2(baseAmount / (1 + gstPct / 100));
    const gstAmt = round2(baseAmount - taxable);

    it.taxableAmount = taxable;
    it.gstAmount = gstAmt;
    it.total = round2(baseAmount);

    updated[index] = it;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        description: '',
        hsn: '8471',
        quantity: 1,
        unit: 'Pcs',
        rate: 0,
        discount: 0,
        gstPercent: 18,
        taxableAmount: 0,
        gstAmount: 0,
        total: 0,
        serialNumbers: '',
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = round2(items.reduce((s, it) => s + (it.total || 0), 0));
  const taxableTotal = round2(items.reduce((s, it) => s + (it.taxableAmount || 0), 0));
  const gstTotal = round2(items.reduce((s, it) => s + (it.gstAmount || 0), 0));
  const cgst = round2(gstTotal / 2);
  const sgst = round2(gstTotal / 2);
  const grandTotal = subtotal;

  const handleSave = async () => {
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }
    if (!supplierInvoiceNumber) {
      alert('Please enter supplier invoice number');
      return;
    }

    try {
      const payload = {
        supplierId,
        supplierInvoiceNumber,
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal: taxableTotal,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: taxableTotal,
        cgst,
        sgst,
        igst: 0,
        grandTotal,
        paidAmount: parseFloat(paidAmount) || 0,
        paymentMode,
        paymentReference,
        notes,
        items: items.map((it) => ({
          productId: it.productId,
          serialNumbers: it.serialNumbers || null,
          description: it.description,
          hsn: it.hsn,
          quantity: it.quantity,
          unit: it.unit,
          rate: it.rate,
          discount: it.discount,
          gstPercent: it.gstPercent,
          taxableAmount: it.taxableAmount,
          gstAmount: it.gstAmount,
          total: it.total,
        })),
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert(`Purchase PO ${json.data.purchaseNumber} saved and stock updated!`);
        router.push('/purchases/all');
      } else {
        alert(json.error || 'Failed to save purchase');
      }
    } catch (err) {
      alert('Error saving purchase');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/purchases/all"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-slate-700" />
              <span>New Purchase</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter supplier invoice, record payables, and increase inventory stock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/purchases/import-bill"
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition inline-flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-slate-600" />
            <span>Import Bill (OCR)</span>
          </Link>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition inline-flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Purchase</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          {/* Supplier Info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Supplier & Bill Reference
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Supplier <span className="text-rose-500">*</span></label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.currentBalance > 0 ? `(Due: ₹${s.currentBalance.toLocaleString('en-IN')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Supplier Bill / Invoice # <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-DELL-9921"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Purchased Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500 tabular-nums">#{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                    <div className="sm:col-span-6">
                      <label className="block text-slate-700 font-medium mb-1">Inventory Product</label>
                      <select
                        value={it.productId}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.currentStock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-slate-700 font-medium mb-1">Description</label>
                      <input
                        type="text"
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        step="any"
                        value={it.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">GST %</label>
                      <select
                        value={it.gstPercent}
                        onChange={(e) => handleItemChange(idx, 'gstPercent', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="18">18%</option>
                        <option value="12">12%</option>
                        <option value="28">28%</option>
                        <option value="5">5%</option>
                        <option value="0">0%</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Total (₹)</label>
                      <input
                        type="text"
                        readOnly
                        value={formatCurrency(it.total)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">HSN Code</label>
                      <input
                        type="text"
                        value={it.hsn}
                        onChange={(e) => handleItemChange(idx, 'hsn', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[11px] font-medium mb-1">
                      Serial Numbers (comma-separated for individual tracking)
                    </label>
                    <input
                      type="text"
                      value={it.serialNumbers}
                      onChange={(e) => handleItemChange(idx, 'serialNumbers', e.target.value)}
                      placeholder="e.g. DELL7480-101, DELL7480-102"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Summary & Payment
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value</span>
              <span className="font-mono text-slate-900 tabular-nums">{formatCurrency(taxableTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>CGST (9%)</span>
              <span className="font-mono text-slate-900 tabular-nums">{formatCurrency(cgst)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>SGST (9%)</span>
              <span className="font-mono text-slate-900 tabular-nums">{formatCurrency(sgst)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="font-mono text-slate-900 tabular-nums">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/80 space-y-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Amount Paid (₹)</label>
              <input
                type="number"
                step="any"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-2 mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Update Stock</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
