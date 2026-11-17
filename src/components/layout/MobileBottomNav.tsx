'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Plus,
  Package,
  Smartphone,
} from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav className="print:hidden lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      <Link
        href="/"
        className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
          isActive('/') ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Home</span>
      </Link>

      <Link
        href="/sales/invoices"
        className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
          isActive('/sales/invoices') ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>Invoices</span>
      </Link>

      <Link
        href="/sales/new"
        className="flex items-center justify-center -mt-4 w-11 h-11 rounded-full bg-blue-600 text-white shadow-md border-2 border-white active:scale-95 transition"
        title="New Sales Invoice"
      >
        <Plus className="w-5 h-5" />
      </Link>

      <Link
        href="/inventory/products"
        className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
          isActive('/inventory') ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Package className="w-4 h-4" />
        <span>Inventory</span>
      </Link>

      <Link
        href="/mobile-app"
        className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
          isActive('/mobile-app') ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Smartphone className="w-4 h-4" />
        <span>App Sync</span>
      </Link>
    </nav>
  );
}
