'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Smartphone, CheckCircle2, WifiOff, Cloud } from 'lucide-react';

export interface SyncStatusData {
  connected: boolean;
  fingerprint: string;
  lastModifiedAt: string;
  serverTime: string;
  counts?: {
    invoices: number;
    products: number;
    customers: number;
    purchases: number;
    payments: number;
    expenses: number;
    bankAccounts: number;
  };
  latestActivity?: {
    invoice: string | null;
    product: string | null;
    customer: string | null;
  };
}

export default function LiveCloudSync() {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [remoteUpdateToast, setRemoteUpdateToast] = useState<string | null>(null);
  const lastFingerprintRef = useRef<string | null>(null);
  const isCheckingRef = useRef<boolean>(false);

  const checkCloudSync = useCallback(
    async (isManual = false) => {
      if (isCheckingRef.current) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setStatus('offline');
        return;
      }

      isCheckingRef.current = true;
      if (isManual) setStatus('syncing');

      try {
        const res = await fetch('/api/sync', { cache: 'no-store' });
        if (!res.ok) {
          setStatus('offline');
          return;
        }
        const data: SyncStatusData & { success: boolean } = await res.json();
        if (!data.success) {
          setStatus('offline');
          return;
        }

        setStatus('synced');
        setLastSynced(new Date());

        const prevFp = lastFingerprintRef.current;
        if (prevFp && prevFp !== data.fingerprint) {
          // Database changed on another device or tab!
          lastFingerprintRef.current = data.fingerprint;

          // Broadcast to pages listening for cloud sync
          window.dispatchEvent(new CustomEvent('cloudDataSynced', { detail: data }));

          // Avoid interrupting active form entry
          const activeEl = document.activeElement;
          const isTyping =
            activeEl &&
            (activeEl.tagName === 'INPUT' ||
              activeEl.tagName === 'TEXTAREA' ||
              activeEl.tagName === 'SELECT');

          const isFormRoute =
            pathname?.includes('/new') || pathname?.includes('/edit');

          if (!isTyping && !isFormRoute) {
            router.refresh();
            setRemoteUpdateToast('Cloud database updated from another device');
            setTimeout(() => setRemoteUpdateToast(null), 3500);
          }
        } else if (!prevFp) {
          lastFingerprintRef.current = data.fingerprint;
        }
      } catch {
        setStatus('offline');
      } finally {
        isCheckingRef.current = false;
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    // Initial check
    checkCloudSync(false);

    // Poll every 6 seconds while app is visible
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkCloudSync(false);
      }
    }, 6000);

    // Instant sync when switching back to app on Android or desktop
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkCloudSync(false);
      }
    };
    const handleOnline = () => checkCloudSync(true);
    const handleOffline = () => setStatus('offline');

    // Same-browser tab BroadcastChannel sync
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('apna_vyaapar_cloud_sync');
      channel.onmessage = () => {
        checkCloudSync(false);
      };
    }

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (channel) channel.close();
    };
  }, [checkCloudSync]);

  // Register Service Worker for Android PWA installability
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            checkCloudSync(true);
            window.dispatchEvent(new CustomEvent('cloudDataSynced'));
            router.refresh();
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
            status === 'offline'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : status === 'syncing'
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800'
          }`}
          title={
            lastSynced
              ? `Live Cloud DB Synced (${lastSynced.toLocaleTimeString()}) — Click to sync all devices`
              : 'Live Cloud DB Sync'
          }
        >
          {status === 'offline' ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="hidden md:inline">Offline</span>
            </>
          ) : status === 'syncing' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
              <span className="hidden md:inline">Syncing...</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0 hidden sm:inline" />
              <span className="hidden md:inline">Live Sync</span>
            </>
          )}
        </button>

        <Link
          href="/mobile-app"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition"
          title="Install Android App & Multi-Device Sync"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="hidden xl:inline">Android App</span>
        </Link>
      </div>

      {/* Live Remote Sync Notification Toast */}
      {remoteUpdateToast && (
        <div className="fixed bottom-16 sm:bottom-5 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{remoteUpdateToast}</span>
        </div>
      )}
    </>
  );
}
