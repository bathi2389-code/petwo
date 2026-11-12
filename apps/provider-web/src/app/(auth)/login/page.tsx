'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Heart, PawPrint, ShieldCheck, Sparkles,
  Mail, Lock, Eye, EyeOff, Stethoscope, CalendarCheck, BadgeCheck,
} from 'lucide-react';
import { friendlyFirebaseAuthError, useAuth } from '@/lib/auth-context';
import { useResendCooldown } from '@/lib/use-resend-cooldown';
import { apiClient } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, sendVerification, refreshVerification, signOut, configError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resendCooldown = useResendCooldown();

  async function routeProvider() {
    let profile;
    try {
      profile = await apiClient.get('/auth/me');
    } catch (problem: any) {
      if (problem?.status === 404 || problem?.raw?.response?.status === 404) {
        router.push('/register');
        return;
      }
      throw problem;
    }
    if (profile.data?.data?.role !== 'provider') {
      throw new Error('This account is not registered as a provider. Use the customer portal or register your business.');
    }
    try {
      await apiClient.get('/providers/me');
      router.push('/overview');
    } catch (problem: any) {
      if (problem?.status === 404 || problem?.raw?.response?.status === 404) router.push('/register');
      else throw problem;
    }
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const user = await signIn(email.trim().toLowerCase(), password);
      if (!user.emailVerified) {
        setPending(true);
        setNotice('Verify your email using the link we sent before signing in to PETWO.');
        return;
      }
      await routeProvider();
    } catch (cause: any) {
      setError(friendlyFirebaseAuthError(cause));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      await sendVerification();
      resendCooldown.start(60);
      setNotice('Verification link sent. Check your inbox and spam folder.');
    } catch (cause: any) {
      setError(friendlyFirebaseAuthError(cause));
    } finally {
      setLoading(false);
    }
  }

  async function checkVerification() {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (!await refreshVerification()) {
        setNotice('Your email is not verified yet. Open the link in the email, then check again.');
        return;
      }
      setPending(false);
      await routeProvider();
    } catch (cause: any) {
      setError(friendlyFirebaseAuthError(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f8f6] lg:grid lg:grid-cols-[1.02fr_.98fr]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#073f3d] px-10 py-9 text-white lg:flex xl:px-16 xl:py-12">
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 right-0 h-[30rem] w-[30rem] rounded-full bg-teal-400/15 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" aria-label="PETWO home"><img src="/petwo-logo.svg" alt="PETWO" className="h-12 w-auto brightness-0 invert" /></Link>
          <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-teal-100">Partner workspace</span>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-xl py-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-white/10 px-4 py-2 text-xs font-bold text-teal-100">
            <Sparkles className="h-4 w-4" /> A better day for pet care
          </div>
          <h1 className="max-w-lg text-4xl font-black leading-[1.08] tracking-tight xl:text-[3.5rem]">
            Great care teams make
            <span className="mt-1 block text-[#9be4ce]"> happier, healthier pets.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-teal-50/75">
            One calm workspace for your clinic, your appointments and the pet parents who trust you.
          </p>
          <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-sm">
            <div className="absolute right-5 top-5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-teal-100">CARE PARTNERS</div>
            <img src="/pet-care-illustration.svg" alt="A friendly dog and cat" className="mx-auto max-h-[285px] w-full object-contain" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"><Stethoscope className="h-5 w-5 text-[#9be4ce]" /><p className="mt-2 text-xs font-bold">Your services</p><p className="mt-1 text-[10px] text-teal-100/60">Showcase your care</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"><CalendarCheck className="h-5 w-5 text-[#9be4ce]" /><p className="mt-2 text-xs font-bold">Your schedule</p><p className="mt-1 text-[10px] text-teal-100/60">Manage appointments</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"><BadgeCheck className="h-5 w-5 text-[#9be4ce]" /><p className="mt-2 text-xs font-bold">Your profile</p><p className="mt-1 text-[10px] text-teal-100/60">Build trust</p></div>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between text-[11px] text-teal-100/50">
          <span>© {new Date().getFullYear()} PETWO. Made for every paw.</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Secure partner access</span>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="relative w-full max-w-[460px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" aria-label="PETWO home"><img src="/petwo-logo.svg" alt="PETWO" className="h-10 w-auto" /></Link>
            <span className="rounded-full bg-teal-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-900">Partner portal</span>
          </div>

          <div className="rounded-[2rem] border border-white bg-white p-6 shadow-[0_30px_100px_-45px_rgba(7,63,61,.35)] sm:p-10">
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f6f0] text-[#087f70]">
                {pending ? <ShieldCheck className="h-7 w-7" /> : <PawPrint className="h-7 w-7" />}
              </div>
              <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#087f70]">PETWO for care partners</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-[2.15rem]">{pending ? 'Verify your email' : 'Welcome back'}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {pending ? `Open the verification link sent to ${email}, then return here.` : 'Sign in to manage your clinic or pet-care business.'}
              </p>
            </div>

            {configError && <div role="alert" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"><strong>Setup required:</strong> {configError}</div>}
            {error && <div role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</div>}
            {notice && <div role="status" className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">{notice}</div>}

            {pending ? (
              <div className="space-y-3">
                <button type="button" onClick={checkVerification} disabled={loading} className="provider-login-submit">{loading ? 'Checking…' : 'I have verified my email'}<CheckCircle2 className="h-4 w-4" /></button>
                <button type="button" onClick={resend} disabled={loading || resendCooldown.seconds > 0} className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-teal-800 transition hover:bg-teal-50 disabled:opacity-50">{loading ? 'Please wait…' : resendCooldown.seconds ? `Resend in ${resendCooldown.seconds}s` : 'Resend verification email'}</button>
                <button type="button" onClick={async () => { await signOut(); setPending(false); setPassword(''); setNotice(null); }} className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-teal-800">Use another account</button>
              </div>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <label htmlFor="provider-email" className="provider-login-label">Work email</label>
                  <div className="provider-login-field"><Mail className="provider-login-icon" /><input id="provider-email" type="email" autoComplete="email" required maxLength={254} placeholder="you@yourclinic.com" value={email} onChange={event => setEmail(event.target.value)} className="provider-login-input" /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between"><label htmlFor="provider-password" className="provider-login-label">Password</label></div>
                  <div className="provider-login-field"><Lock className="provider-login-icon" /><input id="provider-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required minLength={6} value={password} onChange={event => setPassword(event.target.value)} className="provider-login-input pr-12" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                </div>
                <button type="submit" disabled={loading || Boolean(configError)} className="provider-login-submit">{loading ? 'Signing you in…' : 'Sign in to your workspace'}<ArrowRight className="h-4 w-4" /></button>
                <p className="text-center text-xs text-slate-400">Your account is protected with Firebase Authentication.</p>
              </form>
            )}

            <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
              New to PETWO? <Link href="/register" className="font-extrabold text-[#087f70] hover:underline">Register your business</Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
            <Link href="/" className="transition hover:text-teal-800">Visit PETWO</Link>
            <Link href="/care" className="transition hover:text-teal-800">Explore care</Link>
            <Link href="/customer/login" className="transition hover:text-teal-800">Pet parent login</Link>
          </div>
          <p className="mt-4 text-center text-[10px] leading-5 text-slate-400">By continuing, you agree to PETWO’s terms and privacy policy.</p>
        </div>
      </section>
    </main>
  );
}
