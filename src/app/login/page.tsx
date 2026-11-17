'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
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
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 250);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-8 bg-white rounded-2xl border border-slate-200 shadow-sm relative">
      {/* Header & Product Identity */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex p-2 rounded-xl bg-slate-50 border border-slate-200 mb-1">
          <div className="relative w-9 h-9 rounded-lg overflow-hidden">
            <Image
              src="/brand/logo.png"
              alt="Apna Vyaapar Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Apna Vyaapar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Billing & Business Management
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div
          id="login-error-alert"
          className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div
          id="login-success-alert"
          className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">Verified. Loading workspace...</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="login-username"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-9 pr-10 py-2 bg-slate-50 text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
            />
            <button
              type="button"
              id="toggle-password-visibility"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
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
          className="w-full mt-2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">
          Apna Vyaapar • Secure Business Access
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-slate-900 selection:text-white">
      <Suspense
        fallback={
          <div className="w-full max-w-sm p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
