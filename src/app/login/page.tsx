'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed.');
      }

      setSuccess(true);
      // Small pause for visual feedback, then navigate
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl obsidian-card shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Brand Identity */}
      <div className="text-center space-y-3 relative z-10 mb-8">
        <div className="inline-flex p-2.5 rounded-2xl bg-gradient-to-tr from-amber-400/20 to-amber-200/5 border border-amber-400/30 shadow-lg shadow-amber-500/10">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-inner">
            <Image
              src="/brand/logo.png"
              alt="Ashirwad Technologies Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>ASHIRWAD TECH</span>
          </h1>
          <p className="text-xs font-semibold tracking-wider uppercase gold-gradient-text mt-0.5">
            Repair | Upgrade | Build | Service
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-[11px] font-medium text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Authorized Staff & Admin Access</span>
        </div>
      </div>

      {/* Notification Alerts */}
      {error && (
        <div
          id="login-error-alert"
          className="mb-6 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div
          id="login-success-alert"
          className="mb-6 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">Authentication confirmed! Redirecting to workspace...</div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <div>
          <label
            htmlFor="login-username"
            className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
          >
            Username or Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username or email"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 text-white placeholder-slate-500 text-sm rounded-xl border border-slate-700/80 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your security password"
              className="w-full pl-10 pr-11 py-2.5 bg-slate-900/90 text-white placeholder-slate-500 text-sm rounded-xl border border-slate-700/80 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
            <button
              type="button"
              id="toggle-password-visibility"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          id="btn-login-submit"
          disabled={loading || success}
          className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In to System</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </>
          )}
        </button>
      </form>

      {/* Security notice footer */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 text-center relative z-10 space-y-3">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          ASHIRWAD TECHNOLOGIES Secure Billing & ERP Environment.
          <br />
          All actions, invoice revisions, and payments are cryptographically audited.
        </p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400/90 hover:text-amber-300 transition hover:underline"
          >
            ← Return to Ashirwad Technologies Website
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#070a10] flex items-center justify-center p-4 selection:bg-amber-400 selection:text-slate-950">
      <Suspense
        fallback={
          <div className="w-full max-w-md p-10 rounded-3xl obsidian-card text-center text-slate-400 text-sm">
            Loading secure interface...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
