'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  ChevronDown,
  Camera,
  PlusCircle,
  Hash,
  AlertTriangle,
  History,
  BookOpen,
  SlidersHorizontal,
  X,
  Trash2
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const [salesOpen, setSalesOpen] = useState(pathname.startsWith('/sales'));
  const [purchasesOpen, setPurchasesOpen] = useState(pathname.startsWith('/purchases'));
  const [inventoryOpen, setInventoryOpen] = useState(pathname.startsWith('/inventory'));
  const [customersOpen, setCustomersOpen] = useState(pathname.startsWith('/customers'));
  const [suppliersOpen, setSuppliersOpen] = useState(pathname.startsWith('/suppliers'));
  const [reportsOpen, setReportsOpen] = useState(pathname.startsWith('/reports'));
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/settings'));

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Banner Header */}
        <div className="p-4 border-b border-amber-500/20 bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" onClick={onCloseMobile}>
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-amber-500/40 shadow-sm shrink-0 bg-white p-0.5">
              <img
                src="/brand/logo.png"
                alt="Ashirwad Tech"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black tracking-tight text-white truncate flex items-center gap-1.5">
                <span>ASHIRWAD</span>
                <span className="text-amber-400">TECH</span>
              </div>
              <div className="text-[10px] text-amber-300/80 font-medium tracking-wider truncate uppercase">
                Repair • Upgrade • Build
              </div>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-sm custom-scrollbar">
          {/* Dashboard */}
          <Link
            href="/"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition ${
              isActive('/')
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${isActive('/') ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>Dashboard</span>
          </Link>

          {/* Quick Scanner Action */}
          <Link
            href="/purchases/import-bill"
            onClick={onCloseMobile}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-amber-950/50 to-slate-900 text-amber-200 border border-amber-500/30 hover:border-amber-400 transition group my-2"
          >
            <Camera className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>📷 Import Supplier Bill</span>
          </Link>

          {/* Sales Section */}
          <div>
            <button
              onClick={() => setSalesOpen(!salesOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
                <span>Sales</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  salesOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {salesOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 space-y-0.5 mt-1">
                <Link
                  href="/sales/new"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/sales/new')
                      ? 'text-indigo-400 bg-indigo-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ New Invoice</span>
                </Link>
                <Link
                  href="/sales/invoices"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/sales/invoices')
                      ? 'text-indigo-400 bg-indigo-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>All Invoices</span>
                </Link>
                <Link
                  href="/sales/payments"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/sales/payments')
                      ? 'text-indigo-400 bg-indigo-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>Payments Received</span>
                </Link>
                <Link
                  href="/sales/returns"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/sales/returns')
                      ? 'text-indigo-400 bg-indigo-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>Sales Returns</span>
                </Link>
                <Link
                  href="/sales/recently-deleted"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/sales/recently-deleted')
                      ? 'text-rose-400 bg-rose-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Recently Deleted</span>
                </Link>
              </div>
            )}
          </div>

          {/* Purchases Section */}
          <div>
            <button
              onClick={() => setPurchasesOpen(!purchasesOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Purchases</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  purchasesOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {purchasesOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 space-y-0.5 mt-1">
                <Link
                  href="/purchases/new"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/purchases/new')
                      ? 'text-emerald-400 bg-emerald-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ New Purchase</span>
                </Link>
                <Link
                  href="/purchases/import-bill"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/purchases/import-bill')
                      ? 'text-purple-400 bg-purple-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  <span>Import Supplier Bill</span>
                </Link>
                <Link
                  href="/purchases/all"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/purchases/all')
                      ? 'text-emerald-400 bg-emerald-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>All Purchases</span>
                </Link>
                <Link
                  href="/purchases/payments"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/purchases/payments')
                      ? 'text-emerald-400 bg-emerald-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>Supplier Payments</span>
                </Link>
                <Link
                  href="/purchases/returns"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/purchases/returns')
                      ? 'text-emerald-400 bg-emerald-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>Purchase Returns</span>
                </Link>
              </div>
            )}
          </div>

          {/* Inventory Section */}
          <div>
            <button
              onClick={() => setInventoryOpen(!inventoryOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Inventory</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  inventoryOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {inventoryOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 space-y-0.5 mt-1">
                <Link
                  href="/inventory/products"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/inventory/products')
                      ? 'text-amber-400 bg-amber-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>Products</span>
                </Link>
                <Link
                  href="/inventory/stock"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/inventory/stock')
                      ? 'text-amber-400 bg-amber-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>Stock Overview</span>
                </Link>
                <Link
                  href="/inventory/adjustment"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/inventory/adjustment')
                      ? 'text-amber-400 bg-amber-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Stock Adjustment</span>
                </Link>
                <Link
                  href="/inventory/low-stock"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/inventory/low-stock')
                      ? 'text-amber-400 bg-amber-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Low Stock Alerts</span>
                </Link>
                <Link
                  href="/inventory/serial-numbers"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/inventory/serial-numbers')
                      ? 'text-amber-400 bg-amber-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 text-purple-400" />
                  <span>Serial Numbers</span>
                </Link>
              </div>
            )}
          </div>

          {/* Customers Section */}
          <div>
            <button
              onClick={() => setCustomersOpen(!customersOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Customers</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  customersOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {customersOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 space-y-0.5 mt-1">
                <Link
                  href="/customers"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/customers')
                      ? 'text-cyan-400 bg-cyan-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>All Customers</span>
                </Link>
                <Link
                  href="/customers/new"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/customers/new')
                      ? 'text-cyan-400 bg-cyan-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Customer</span>
                </Link>
                <Link
                  href="/customers/ledger"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/customers/ledger')
                      ? 'text-cyan-400 bg-cyan-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Customer Ledger</span>
                </Link>
              </div>
            )}
          </div>

          {/* Suppliers Section */}
          <div>
            <button
              onClick={() => setSuppliersOpen(!suppliersOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-orange-400" />
                <span>Suppliers</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  suppliersOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {suppliersOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 space-y-0.5 mt-1">
                <Link
                  href="/suppliers"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/suppliers')
                      ? 'text-orange-400 bg-orange-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>All Suppliers</span>
                </Link>
                <Link
                  href="/suppliers/new"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/suppliers/new')
                      ? 'text-orange-400 bg-orange-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Supplier</span>
                </Link>
                <Link
                  href="/suppliers/ledger"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive('/suppliers/ledger')
                      ? 'text-orange-400 bg-orange-950/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Supplier Ledger</span>
                </Link>
              </div>
            )}
          </div>

          {/* Expenses */}
          <Link
            href="/expenses"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition ${
              isActive('/expenses')
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4 text-rose-400" />
            <span>Expenses</span>
          </Link>

          {/* Reports */}
          <div>
            <button
              onClick={() => setReportsOpen(!reportsOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-teal-400" />
                <span>Reports</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  reportsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {reportsOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 space-y-0.5 mt-1">
                <Link
                  href="/reports?tab=sales"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  Sales Report
                </Link>
                <Link
                  href="/reports?tab=purchases"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  Purchase Report
                </Link>
                <Link
                  href="/reports?tab=stock"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  Stock Value Report
                </Link>
                <Link
                  href="/reports?tab=profit"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  Profit & Margin Report
                </Link>
                <Link
                  href="/reports?tab=customer_outstanding"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  Customer Outstanding
                </Link>
                <Link
                  href="/reports?tab=supplier_outstanding"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  Supplier Outstanding
                </Link>
                <Link
                  href="/reports?tab=gst"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  GST / HSN Summary
                </Link>
              </div>
            )}
          </div>

          {/* Settings */}
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  settingsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {settingsOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 space-y-0.5 mt-1">
                <Link
                  href="/profile"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-slate-800/40"
                >
                  My User Profile
                </Link>
                <Link
                  href="/settings/profiles"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  Business Profiles & Branches
                </Link>
                <Link
                  href="/settings/users"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  Team & User Accounts
                </Link>
                <Link
                  href="/settings/invoice"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  Visual Invoice Designer
                </Link>
                <Link
                  href="/settings/backup"
                  onClick={onCloseMobile}
                  className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                >
                  Backup & Database Reset
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer Quick Business & User Info */}
        <Link
          href="/profile"
          onClick={onCloseMobile}
          className="block p-3 border-t border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/80 transition text-xs group"
          title="Open User Profile"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300 group-hover:text-amber-400 transition">
              Raj Soni
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
              Admin
            </span>
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5 group-hover:text-slate-400">
            Ashirwad Technologies • Ahmedabad
          </div>
        </Link>
      </aside>
    </>
  );
}
