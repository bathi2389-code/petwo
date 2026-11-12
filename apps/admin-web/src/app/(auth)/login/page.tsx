'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { apiClient, ADMIN_SESSION_KEY, ADMIN_REFRESH_TOKEN_KEY } from '@/lib/api-client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!apiKey) throw new Error('Admin sign-in is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY.');

      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });
      if (!response.ok) throw new Error('Email or password is incorrect, or Firebase email/password sign-in is unavailable.');
      const auth = await response.json() as { idToken?: string; refreshToken?: string };
      if (!auth.idToken || !auth.refreshToken) throw new Error('Firebase did not return a complete authentication session.');

      const profile = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${auth.idToken}` },
      });
      const role = profile.data?.data?.role;
      if (role !== 'admin' && role !== 'super_admin') {
        throw new Error('This account is not authorized for the PETWO admin portal.');
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, auth.idToken);
      sessionStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, auth.refreshToken);
      router.push('/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f8f7] lg:grid lg:grid-cols-[1fr_0.9fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#082f35] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute -left-40 top-16 h-96 w-96 rounded-full bg-teal-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <img src="/petwo-logo.svg" alt="PETWO" className="h-11 w-auto brightness-0 invert" />
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-100">Platform administration</span>
        </div>
        <div className="relative z-10 mx-auto w-full max-w-xl py-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-white/10 px-4 py-2 text-xs font-semibold text-teal-100">
            <Sparkles className="h-4 w-4" /> PETWO operations
          </div>
          <h2 className="max-w-xl text-4xl font-bold leading-tight tracking-tight xl:text-5xl">One workspace for <span className="text-[#9be4ce]">better pet care.</span></h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-teal-50/75">Review provider applications, support the marketplace and keep daily operations moving from one secure console.</p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {['Provider network', 'Bookings & care', 'Platform health'].map((item, index) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <span className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-300/10 text-sm font-bold text-[#9be4ce]">0{index + 1}</span>
                <p className="text-xs font-semibold text-teal-50/85">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-teal-100/50">© {new Date().getFullYear()} PETWO · Care for every paw</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl lg:hidden" />
        <div className="relative w-full max-w-[440px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <img src="/petwo-logo.svg" alt="PETWO" className="h-10 w-auto" />
            <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800">Admin console</span>
          </div>
          <div className="admin-login-card">
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><ShieldCheck className="h-6 w-6" /></div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Secure administrator access</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Welcome back</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">Sign in with your authorized PETWO administrator account.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700">{error}</p>}
              <div>
                <label htmlFor="admin-email" className="admin-login-label">Admin email</label>
                <div className="admin-login-field">
                  <Mail className="admin-login-icon" />
                  <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@petwo.in" className="admin-login-input" />
                </div>
              </div>
              <div>
                <label htmlFor="admin-password" className="admin-login-label">Password</label>
                <div className="admin-login-field">
                  <Lock className="admin-login-icon" />
                  <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="admin-login-input" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="admin-login-submit">
                {loading ? 'Signing in…' : 'Sign in to admin'} {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
            <div className="mt-8 flex items-start gap-3 border-t border-slate-100 pt-6 text-xs leading-5 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              <p>Authorized personnel only. Admin access is verified before the console opens.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
