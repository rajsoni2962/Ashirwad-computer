'use client';

import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Cloud,
  RefreshCw,
  CheckCircle2,
  Download,
  QrCode,
  Database,
  Laptop,
  ArrowLeftRight,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function MobileAppSyncPage() {
  const [syncData, setSyncData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [appUrl, setAppUrl] = useState('https://ashirwad-computer.vercel.app');

  const fetchSyncStatus = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setSyncData(json);
      }
    } catch (err) {
      console.error('Failed to fetch sync state:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin);
    }
    fetchSyncStatus();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    const handleCloudSynced = () => {
      fetchSyncStatus();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('cloudDataSynced', handleCloudSynced);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('cloudDataSynced', handleCloudSynced);
    };
  }, []);

  const handleInstallAndroidApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'On your Android phone in Chrome:\n\n1. Tap the 3-dots menu (⋮) in the top-right corner.\n2. Tap "Install app" or "Add to Home screen".\n\nApna Vyaapar will install as a full-screen Android app synced directly to your live database!'
      );
    }
  };

  const handleManualSyncAll = async () => {
    await fetchSyncStatus();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cloudDataSynced'));
      if ('BroadcastChannel' in window) {
        const ch = new BroadcastChannel('apna_vyaapar_cloud_sync');
        ch.postMessage({ type: 'FORCE_SYNC', timestamp: Date.now() });
        ch.close();
      }
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `${appUrl}/mobile-app`
  )}`;

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-Time Multi-Platform Cloud Database Sync</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 pt-1">
            <Smartphone className="w-6 h-6 text-blue-400" />
            <span>Apna Vyaapar Android App & Cloud Sync</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Directly connected to your live MongoDB Atlas cloud database. Every invoice, stock update, customer balance, and payment created on one device automatically updates across Android, Tablet, and Desktop Web in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleManualSyncAll}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold transition"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-blue-400' : 'text-emerald-400'}`} />
            <span>{syncing ? 'Syncing Database...' : 'Sync All Devices Now'}</span>
          </button>

          <button
            type="button"
            onClick={handleInstallAndroidApp}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>{installed ? 'Installed on Device' : 'Install Android App'}</span>
          </button>
        </div>
      </div>

      {/* Architecture Visual Flow */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Single Database — Multi-Device Architecture</h2>
            <p className="text-xs text-slate-500">
              Zero manual backup/restore required between devices. All platforms read and write to one unified cloud database.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <Wifi className="w-3.5 h-3.5" />
            <span>Active Sync</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          {/* Android Phone */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3.5 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Android App (APK / WebAPK)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Counter billing, WhatsApp PDF sharing, barcode/OCR scan & stock lookup
              </div>
            </div>
          </div>

          {/* Central Cloud DB */}
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex items-center gap-3.5 shadow-sm relative">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>MongoDB Atlas Cloud</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <div className="text-[11px] text-slate-300 truncate font-mono mt-0.5">
                db: ashirwad_vyaapar
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                Instant 2-Way Live Replication
              </div>
            </div>
          </div>

          {/* Desktop & Web */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3.5 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Desktop Web & Tablet</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                A4 / Thermal printing, GST reports, ledger management & bulk actions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Install & Live Database Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Install on Android (QR + Direct APK + WebAPK) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Install on Your Android Phone</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose either instant 1-click install or download the standalone Android APK package.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            {/* QR Code Box */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs mb-2">
                <img
                  src={qrCodeImageUrl}
                  alt="Scan to open on Android"
                  className="w-36 h-36 object-contain"
                />
              </div>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                <span>Scan with Android Camera</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Opens Apna Vyaapar directly on your phone
              </p>
            </div>

            {/* Install Methods */}
            <div className="sm:col-span-7 space-y-3.5">
              {/* Method 1: Instant WebAPK */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Method 1: Instant Android Install (Recommended)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                    Fastest
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Open this page on your Android phone and tap <strong>Install Android App</strong> below (or tap Chrome menu <strong>⋮ → Install app</strong>). Installs to your home screen & app drawer with auto-updates.
                </p>
                <button
                  type="button"
                  onClick={handleInstallAndroidApp}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Android App Now</span>
                </button>
              </div>

              {/* Method 2: Standalone Native Android APK */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Method 2: Native Android Studio APK
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                    .apk
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Full native Android wrapper (<code className="font-mono text-[10px]">android-app/</code>) with hardware back-button, pull-to-refresh, camera OCR, and native PDF download. Built automatically via GitHub Actions.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://github.com/rajsoni2962/Ashirwad-computer/actions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download APK from GitHub Actions</span>
                    <ExternalLink className="w-3 h-3 opacity-75" />
                  </a>
                </div>
              </div>

              {/* Copy App Link */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Cloud Database Sync Telemetry */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  <span>Live Database Sync Status</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time state of your shared MongoDB Atlas records
                </p>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  syncData?.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {loading ? 'Checking...' : syncData?.connected ? 'Connected' : 'Reconnecting'}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Checking cloud database state...
              </div>
            ) : syncData ? (
              <div className="space-y-4 pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Sales Invoices</div>
                    <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                      {syncData.counts?.invoices ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Inventory Items</div>
                    <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                      {syncData.counts?.products ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Customers</div>
                    <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                      {syncData.counts?.customers ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Purchases</div>
                    <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                      {syncData.counts?.purchases ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Payments</div>
                    <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                      {syncData.counts?.payments ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Expenses</div>
                    <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                      {syncData.counts?.expenses ?? 0}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Database Cluster:</span>
                    <span className="font-mono font-semibold text-slate-900">ashirwad_vyaapar</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Latest Invoice:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {syncData.latestActivity?.invoice || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Last Cloud Check:</span>
                    <span className="font-mono text-slate-800">
                      {syncData.serverTime ? new Date(syncData.serverTime).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-rose-600">
                Could not reach sync endpoint. Check internet connection.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto-syncs every 6s across all devices</span>
            </span>
            <button
              type="button"
              onClick={handleManualSyncAll}
              className="text-blue-600 hover:underline font-semibold"
            >
              Refresh Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
