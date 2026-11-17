'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Camera,
  Menu,
  ShieldCheck,
  User,
  Building2,
  FileText,
  LogOut,
  ChevronDown,
  Check,
  Store,
} from 'lucide-react';
import GlobalSearchModal from '../common/GlobalSearchModal';

interface HeaderProps {
  onToggleMobile?: () => void;
}

export default function Header({ onToggleMobile }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('/api/business-profiles')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.length > 0) {
          setProfiles(json.data);
          const savedId = typeof window !== 'undefined' ? localStorage.getItem('activeProfileId') : null;
          const match = json.data.find((p: any) => p.id === savedId) || json.data.find((p: any) => p.isDefault) || json.data[0];
          setActiveProfile(match);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectProfile = (p: any) => {
    setActiveProfile(p);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeProfileId', p.id);
      window.dispatchEvent(new Event('businessProfileChanged'));
    }
    setProfileDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200/90 shadow-2xs">
        {/* Left: Mobile Toggle & Quick Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200/70 hover:text-slate-800 rounded-lg border border-slate-200 transition sm:w-64 justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Search records...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white rounded border border-slate-200">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Business Branch Switcher & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Business Profile Switcher */}
          {profiles.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 transition max-w-[180px] sm:max-w-xs"
                title="Active Branch"
              >
                <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate text-left">{activeProfile?.name || 'Main Branch'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <span>Branches</span>
                      <Link
                        href="/settings/profiles"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="text-blue-600 hover:underline capitalize"
                      >
                        Manage
                      </Link>
                    </div>

                    <div className="py-1 max-h-56 overflow-y-auto">
                      {profiles.map((p) => {
                        const isCurrent = activeProfile?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleSelectProfile(p)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition ${
                              isCurrent ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="truncate">{p.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{p.companyName}</div>
                            </div>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* New Invoice Action */}
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Invoice</span>
          </Link>

          {/* User Profile & Logout */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 text-slate-700 transition"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="font-semibold text-slate-800">Administrator</div>
                    <div className="text-[11px] text-slate-400">Apna Vyaapar</div>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>User Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Settings</span>
                  </Link>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition text-left font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
