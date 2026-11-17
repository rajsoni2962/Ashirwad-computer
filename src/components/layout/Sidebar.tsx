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
  Trash2,
  FileText,
  CreditCard,
  Building2,
  ShieldAlert,
  Landmark,
  Smartphone
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
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/settings'));

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800/90 transition-transform duration-200 ease-in-out select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Banner Header */}
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={onCloseMobile}>
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700/80 bg-white p-0.5 shrink-0 flex items-center justify-center">
              <img
                src="/brand/logo.png"
                alt="Apna Vyaapar"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-white truncate flex items-center gap-1.5">
                <span>Apna Vyaapar</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide truncate">
                Billing & Inventory
              </div>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-xs custom-scrollbar">
          {/* Dashboard */}
          <Link
            href="/"
            onClick={onCloseMobile}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
              isActive('/')
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </Link>

          {/* Quick OCR Scanner Action */}
          <Link
            href="/purchases/import-bill"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-800/70 hover:text-white border border-slate-800/80 transition my-1.5"
          >
            <Camera className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Import Bill (OCR)</span>
          </Link>

          {/* Sales Section */}
          <div className="pt-1">
            <button
              onClick={() => setSalesOpen(!salesOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Sales</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                  salesOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {salesOpen && (
              <div className="ml-3 pl-2.5 border-l border-slate-800 space-y-0.5 mt-0.5">
                <Link
                  href="/sales/new"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition ${
                    isActive('/sales/new')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>New Invoice</span>
                </Link>
                <Link
                  href="/sales/invoices"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/sales/invoices')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Invoices
                </Link>
                <Link
                  href="/sales/payments"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/sales/payments')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Payments Received
                </Link>
                <Link
                  href="/sales/returns"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/sales/returns')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Sales Returns
                </Link>
                <Link
                  href="/sales/recently-deleted"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition ${
                    isActive('/sales/recently-deleted')
                      ? 'text-rose-400 bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800/40'
                  }`}
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Recently Deleted</span>
                </Link>
              </div>
            )}
          </div>

          {/* Purchases Section */}
          <div>
            <button
              onClick={() => setPurchasesOpen(!purchasesOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Purchases</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                  purchasesOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {purchasesOpen && (
              <div className="ml-3 pl-2.5 border-l border-slate-800 space-y-0.5 mt-0.5">
                <Link
                  href="/purchases/new"
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition ${
                    isActive('/purchases/new')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>New Purchase</span>
                </Link>
                <Link
                  href="/purchases/all"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/purchases/all')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Purchase Bills
                </Link>
                <Link
                  href="/purchases/payments"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/purchases/payments')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Supplier Payments
                </Link>
                <Link
                  href="/purchases/returns"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/purchases/returns')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Purchase Returns
                </Link>
              </div>
            )}
          </div>

          {/* Inventory Section */}
          <div>
            <button
              onClick={() => setInventoryOpen(!inventoryOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Inventory</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                  inventoryOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {inventoryOpen && (
              <div className="ml-3 pl-2.5 border-l border-slate-800 space-y-0.5 mt-0.5">
                <Link
                  href="/inventory/products"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/inventory/products')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Products Catalog
                </Link>
                <Link
                  href="/inventory/stock"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/inventory/stock')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Stock Summary
                </Link>
                <Link
                  href="/inventory/low-stock"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/inventory/low-stock')
                      ? 'text-amber-400 bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Low Stock Alerts
                </Link>
                <Link
                  href="/inventory/serial-numbers"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/inventory/serial-numbers')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Serial Numbers
                </Link>
                <Link
                  href="/inventory/adjustment"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/inventory/adjustment')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Stock Adjustments
                </Link>
              </div>
            )}
          </div>

          {/* Customers Section */}
          <div>
            <button
              onClick={() => setCustomersOpen(!customersOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Customers</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                  customersOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {customersOpen && (
              <div className="ml-3 pl-2.5 border-l border-slate-800 space-y-0.5 mt-0.5">
                <Link
                  href="/customers"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/customers')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  All Customers
                </Link>
                <Link
                  href="/customers/new"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/customers/new')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Add Customer
                </Link>
                <Link
                  href="/customers/ledger"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/customers/ledger')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Customer Ledger
                </Link>
              </div>
            )}
          </div>

          {/* Suppliers Section */}
          <div>
            <button
              onClick={() => setSuppliersOpen(!suppliersOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Suppliers</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                  suppliersOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {suppliersOpen && (
              <div className="ml-3 pl-2.5 border-l border-slate-800 space-y-0.5 mt-0.5">
                <Link
                  href="/suppliers"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/suppliers')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  All Suppliers
                </Link>
                <Link
                  href="/suppliers/new"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/suppliers/new')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Add Supplier
                </Link>
                <Link
                  href="/suppliers/ledger"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/suppliers/ledger')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Supplier Ledger
                </Link>
              </div>
            )}
          </div>

          {/* Expenses */}
          <Link
            href="/expenses"
            onClick={onCloseMobile}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
              isActive('/expenses')
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Expenses</span>
          </Link>

          {/* Cash & Bank */}
          <Link
            href="/banking"
            onClick={onCloseMobile}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
              isActive('/banking')
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <Landmark className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cash & Bank</span>
          </Link>

          {/* Reports */}
          <Link
            href="/reports"
            onClick={onCloseMobile}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition ${
              isActive('/reports')
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-violet-400 shrink-0" />
            <span>Reports & GST</span>
          </Link>

          {/* Android App & Cloud Sync */}
          <Link
            href="/mobile-app"
            onClick={onCloseMobile}
            className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
              isActive('/mobile-app')
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Android App & Sync</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              LIVE
            </span>
          </Link>

          {/* Settings Section */}
          <div className="pt-1">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Settings</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                  settingsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {settingsOpen && (
              <div className="ml-3 pl-2.5 border-l border-slate-800 space-y-0.5 mt-0.5">
                <Link
                  href="/settings"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/settings')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  General Settings
                </Link>
                <Link
                  href="/settings/profiles"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/settings/profiles')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Business Branches
                </Link>
                <Link
                  href="/settings/users"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/settings/users')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Users & Access
                </Link>
                <Link
                  href="/settings/invoice"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/settings/invoice')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Invoice Designer
                </Link>
                <Link
                  href="/settings/backup"
                  onClick={onCloseMobile}
                  className={`block px-2.5 py-1.5 rounded-md transition ${
                    isActive('/settings/backup')
                      ? 'text-white bg-slate-800 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Backup & Export
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer User Profile Card */}
        <Link
          href="/profile"
          onClick={onCloseMobile}
          className="p-3 border-t border-slate-800 bg-slate-950/50 hover:bg-slate-900 transition text-xs block group"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 group-hover:text-blue-400 transition truncate">
              Admin User
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700/80">
              Active
            </span>
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">
            Apna Vyaapar ERP
          </div>
        </Link>
      </aside>
    </>
  );
}
