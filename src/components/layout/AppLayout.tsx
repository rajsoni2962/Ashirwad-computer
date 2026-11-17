'use client';

import React, { useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import GlobalKeyboardShortcuts from '@/components/common/GlobalKeyboardShortcuts';

const AppLayoutContext = createContext<boolean>(false);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isInside = useContext(AppLayoutContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // If on login page or already inside an AppLayout, avoid rendering outer frame/sidebar/header
  if (isInside || pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <AppLayoutContext.Provider value={true}>
      <div className="flex h-screen bg-slate-50 text-slate-800 antialiased overflow-hidden">
        {/* Sidebar */}
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header onToggleMobile={() => setMobileOpen(!mobileOpen)} />
          <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 sm:pb-20 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
          <MobileBottomNav />
        </div>
        <GlobalKeyboardShortcuts />
      </div>
    </AppLayoutContext.Provider>
  );
}
