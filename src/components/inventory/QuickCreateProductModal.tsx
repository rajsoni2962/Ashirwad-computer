'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Tag,
  DollarSign,
  Hash,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { COMPUTER_SYSTEM_CATEGORIES, isComputerSystemCategory } from '@/lib/product-validation';

interface QuickCreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess: (product: any) => void;
}

export default function QuickCreateProductModal({
  isOpen,
  onClose,
  initialName = '',
  onSuccess,
}: QuickCreateProductModalProps) {
  const [productType, setProductType] = useState<'PHYSICAL' | 'SERVICE'>('PHYSICAL');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Laptop');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState('Refurbished Grade A');
  const [cpu, setCpu] = useState('');
  const [generation, setGeneration] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [hsn, setHsn] = useState('8471');
  const [gstPercent, setGstPercent] = useState('18');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [initialStock, setInitialStock] = useState('1');
  const [warranty, setWarranty] = useState('6 Months');
  const [serialInput, setSerialInput] = useState('');
  const [serialList, setSerialList] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateProduct, setDuplicateProduct] = useState<any | null>(null);

  // Auto-fill initial values when opening
  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      // Try to intelligently extract brand from search query
      const lower = (initialName || '').toLowerCase();
      if (lower.includes('dell')) setBrand('Dell');
      else if (lower.includes('hp')) setBrand('HP');
      else if (lower.includes('lenovo')) setBrand('Lenovo');
      else if (lower.includes('apple') || lower.includes('macbook')) setBrand('Apple');
      else if (lower.includes('asus')) setBrand('Asus');
      else if (lower.includes('acer')) setBrand('Acer');
      else setBrand('');

      if (lower.includes('service') || lower.includes('repair') || lower.includes('cleaning')) {
        setProductType('SERVICE');
        setCategory('Repair Service');
        setHsn('9987');
        setInitialStock('0');
      } else {
        setProductType('PHYSICAL');
        setCategory('Laptop');
        setHsn('8471');
        setInitialStock('1');
      }

      setErrorMsg(null);
      setDuplicateProduct(null);
      setSerialList([]);
      setSerialInput('');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const isComputer = isComputerSystemCategory(category) || category === 'Laptop' || category === 'Desktop';

  const handleAddSerial = () => {
    const trimmed = serialInput.trim();
    if (trimmed && !serialList.includes(trimmed)) {
      setSerialList([...serialList, trimmed]);
      setSerialInput('');
    }
  };

  const handleRemoveSerial = (index: number) => {
    setSerialList(serialList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setDuplicateProduct(null);

    try {
      const payload: any = {
        name: name.trim(),
        productType,
        category,
        brand: brand.trim() || null,
        model: model.trim() || null,
        hsn: hsn.trim() || (productType === 'SERVICE' ? '9987' : '8471'),
        gstPercent: parseFloat(gstPercent) || 0,
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        notes: notes.trim() || null,
      };

      if (productType === 'PHYSICAL') {
        payload.condition = condition;
        payload.initialStock = parseInt(initialStock) || 1;
        payload.minStock = 1;
        payload.warranty = warranty.trim() || '6 Months';
        if (isComputer) {
          payload.cpu = cpu.trim() || null;
          payload.generation = generation.trim() || null;
          payload.ram = ram.trim() || null;
          payload.storage = storage.trim() || null;
        }
        if (serialList.length > 0) {
          payload.serialNumbers = serialList;
        }
      } else {
        payload.initialStock = 0;
        payload.minStock = 0;
        payload.warranty = warranty.trim() || '30 Days Service Warranty';
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.status === 409 && json.existingProduct) {
        setDuplicateProduct(json.existingProduct);
        setErrorMsg(json.error || 'A product with this name already exists in inventory.');
        return;
      }

      if (json.success && json.data) {
        onSuccess(json.data);
        onClose();
      } else {
        setErrorMsg(json.error || 'Failed to create product.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Create Item & Add to Stock</h3>
              <p className="text-[11px] text-slate-500">
                Save product to inventory and insert directly into current invoice
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMsg}</p>
              {duplicateProduct && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSuccess(duplicateProduct);
                      onClose();
                    }}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition"
                  >
                    Use Existing Product ({duplicateProduct.name})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Product Type Tabs */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Item Nature *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setProductType('PHYSICAL');
                  if (category === 'Repair Service') setCategory('Laptop');
                  setHsn('8471');
                  setInitialStock('1');
                }}
                className={`py-2 px-3 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                  productType === 'PHYSICAL'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Physical Product</span>
                </div>
                <span className="text-[10px] font-semibold text-indigo-600">Tracked in Stock</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProductType('SERVICE');
                  setCategory('Repair Service');
                  setHsn('9987');
                  setInitialStock('0');
                }}
                className={`py-2 px-3 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                  productType === 'SERVICE'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span>Service / Labor</span>
                </div>
                <span className="text-[10px] font-semibold text-blue-600">No Physical Stock</span>
              </button>
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dell Latitude 5410, HP EliteBook 840 G5, etc."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Category, Brand, Model */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800"
              >
                {productType === 'SERVICE' ? (
                  <>
                    <option value="Repair Service">Repair Service</option>
                    <option value="Installation">Installation & Setup</option>
                    <option value="Maintenance">Cleaning & Maintenance</option>
                    <option value="Data Recovery">Data Recovery</option>
                    <option value="Other Service">Other Service</option>
                  </>
                ) : (
                  <>
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Custom PC">Custom PC</option>
                    <option value="Accessories">Accessories</option>
                    <option value="SSD">SSD</option>
                    <option value="RAM">RAM</option>
                    <option value="Motherboard">Motherboard</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Printer">Printer</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Dell, HP, Lenovo"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Model / Sub-series</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. 5490, T480, G3"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Computer Specifications (Visible for laptops / desktops / PCs) */}
          {productType === 'PHYSICAL' && isComputer && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>Hardware Specifications</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-0.5">CPU / Processor</label>
                  <input
                    type="text"
                    value={cpu}
                    onChange={(e) => setCpu(e.target.value)}
                    placeholder="e.g. Intel Core i5"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-0.5">Generation</label>
                  <input
                    type="text"
                    value={generation}
                    onChange={(e) => setGeneration(e.target.value)}
                    placeholder="e.g. 8th Gen"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-0.5">RAM</label>
                  <input
                    type="text"
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    placeholder="e.g. 8GB DDR4"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-0.5">Storage</label>
                  <input
                    type="text"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    placeholder="e.g. 256GB NVMe SSD"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pricing, Tax & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Selling Rate (₹) *</label>
              <input
                type="number"
                step="any"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="e.g. 24000"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-indigo-700"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Purchase Cost (₹)</label>
              <input
                type="number"
                step="any"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="e.g. 19500"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">GST Rate (%)</label>
              <select
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">HSN Code</label>
              <input
                type="text"
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800"
              />
            </div>
          </div>

          {/* Stock, Condition, Warranty */}
          {productType === 'PHYSICAL' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Initial Stock Units *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800"
                >
                  <option value="Brand New">Brand New</option>
                  <option value="Refurbished Grade A">Refurbished Grade A</option>
                  <option value="Used / Second Hand">Used / Second Hand</option>
                  <option value="Open Box">Open Box</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Warranty</label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="e.g. 6 Months, 1 Year"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Serial Number entry (optional for physical products) */}
          {productType === 'PHYSICAL' && (
            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-purple-600" />
                <span>Serial Numbers (Optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSerial();
                    }
                  }}
                  placeholder="Enter serial number & press Add"
                  className="flex-1 px-3 py-1.5 bg-white border border-purple-200 rounded-xl font-mono text-xs focus:outline-none focus:border-purple-600"
                />
                <button
                  type="button"
                  onClick={handleAddSerial}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-xl font-bold text-xs hover:bg-purple-700 transition"
                >
                  Add Serial
                </button>
              </div>

              {serialList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {serialList.map((sn, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-900 rounded-md font-mono text-[11px] font-semibold"
                    >
                      {sn}
                      <button
                        type="button"
                        onClick={() => handleRemoveSerial(idx)}
                        className="text-purple-500 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving & Adding...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create & Add to Invoice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
