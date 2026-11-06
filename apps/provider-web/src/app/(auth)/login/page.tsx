'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Heart, PawPrint, ShieldCheck, Sparkles, Mail, Lock } from 'lucide-react';
import { friendlyFirebaseAuthError, useAuth } from '@/lib/auth-context';
import { useResendCooldown } from '@/lib/use-resend-cooldown';
import { apiClient } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, sendVerification, refreshVerification, signOut, configError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resendCooldown = useResendCooldown();

  async function routeProvider() {
    let profile;
    try { profile = await apiClient.get('/auth/me'); }
    catch (problem: any) {
      if (problem?.status === 404 || problem?.raw?.response?.status === 404) { router.push('/register'); return; }
      throw problem;
    }
    if (profile.data?.data?.role !== 'provider') throw new Error('This account is not registered as a provider. Use the customer portal or register your business.');
    try { await apiClient.get('/providers/me'); router.push('/overview'); }
    catch (problem: any) { if (problem?.status === 404 || problem?.raw?.response?.status === 404) router.push('/register'); else throw problem; }
  }
  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setNotice(null); setLoading(true);
    try {
      const user = await signIn(email.trim().toLowerCase(), password);
      if (!user.emailVerified) { setPending(true); setNotice('Verify your email using the link we sent before signing in to PETWO.'); return; }
      await routeProvider();
    } catch (cause: any) {
      setError(friendlyFirebaseAuthError(cause));
    } finally { setLoading(false); }
  }
  async function resend() {
    setLoading(true); setError(null); setNotice(null);
    try { await sendVerification(); resendCooldown.start(60); setNotice('Verification link sent. Check your inbox and spam folder.'); }
    catch (cause: any) { setError(friendlyFirebaseAuthError(cause)); }
    finally { setLoading(false); }
  }
  async function checkVerification() {
    setLoading(true); setError(null); setNotice(null);
    try {
      if (!await refreshVerification()) { setNotice('Your email is not verified yet. Open the link in the email, then check again.'); return; }
      setPending(false); await routeProvider();
    } catch (cause: any) { setError(friendlyFirebaseAuthError(cause)); }
    finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-[#f4f8f7] lg:grid lg:grid-cols-[1.08fr_.92fr]">
    <section className="relative hidden min-h-screen overflow-hidden bg-[#073f3d] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-teal-300/15 blur-3xl" />
      <div className="relative z-10 flex items-center gap-3"><img src="/petwo-logo.svg" alt="PETWO" className="h-11 w-auto brightness-0 invert" /><span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.2em] text-teal-100">Care partner portal</span></div>
      <div className="relative z-10 mx-auto w-full max-w-xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-white/10 px-4 py-2 text-xs font-semibold text-teal-100"><Sparkles className="h-4 w-4" /> Better care starts together</div><h1 className="max-w-lg text-4xl font-bold leading-[1.12] tracking-tight xl:text-5xl">Your care.<span className="block text-[#9be4ce]">Their happy place.</span></h1><p className="mt-5 max-w-md text-base leading-7 text-teal-50/75">Manage your clinic, connect with pet parents and make every visit a little easier.</p><div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b5550]/70 p-4 shadow-2xl"><img src="/pet-care-illustration.svg" alt="Friendly pets with care essentials" className="mx-auto max-h-[330px] w-full object-contain" /></div><div className="mt-6 grid grid-cols-3 gap-3 text-xs text-teal-50/80"><div className="flex items-center gap-2"><PawPrint className="h-4 w-4 text-[#9be4ce]" /> Pet-first</div><div className="flex items-center gap-2"><Heart className="h-4 w-4 text-[#9be4ce]" /> Trusted care</div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#9be4ce]" /> Secure access</div></div></div>
      <p className="relative z-10 text-xs text-teal-100/50">© {new Date().getFullYear()} PETWO. Made for every paw.</p>
    </section>
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8"><div className="relative w-full max-w-[440px]"><div className="mb-8 flex items-center justify-between lg:hidden"><img src="/petwo-logo.svg" alt="PETWO" className="h-10 w-auto" /><span className="rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800">Partner portal</span></div><div className="provider-login-card">
      <div className="mb-8"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">{pending ? <ShieldCheck className="h-6 w-6" /> : <Mail className="h-6 w-6" />}</div><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Welcome to PETWO</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{pending ? 'Verify your email' : 'Welcome back'}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{pending ? `Open the verification link sent to ${email}, then return here.` : 'Sign in using the email and password for your clinic or pet-care business.'}</p></div>
      {configError && <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>Setup required:</strong> {configError}</div>}
      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {notice && <div role="status" className="mb-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{notice}</div>}
      {pending ? <div className="space-y-3"><button type="button" onClick={checkVerification} disabled={loading} className="provider-login-submit">{loading ? 'Checking…' : 'I verified my email'}<CheckCircle2 className="h-4 w-4" /></button><button type="button" onClick={resend} disabled={loading || resendCooldown.seconds > 0} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-teal-800 disabled:opacity-50">{loading ? 'Please wait…' : resendCooldown.seconds ? `Resend in ${resendCooldown.seconds}s` : 'Resend verification email'}</button><button type="button" onClick={async () => { await signOut(); setPending(false); setPassword(''); setNotice(null); }} className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-teal-800">Sign out</button></div> : <form onSubmit={handleSignIn} className="space-y-5"><div><label htmlFor="provider-email" className="provider-login-label">Provider email</label><div className="provider-login-field"><Mail className="provider-login-icon" /><input id="provider-email" type="email" autoComplete="email" required maxLength={254} placeholder="you@yourclinic.com" value={email} onChange={event => setEmail(event.target.value)} className="provider-login-input" /></div></div><div><label htmlFor="provider-password" className="provider-login-label">Password</label><div className="provider-login-field"><Lock className="provider-login-icon" /><input id="provider-password" type="password" autoComplete="current-password" required minLength={6} value={password} onChange={event => setPassword(event.target.value)} className="provider-login-input" /></div></div><button type="submit" disabled={loading || Boolean(configError)} className="provider-login-submit">{loading ? 'Signing in…' : 'Sign in'}<ArrowRight className="h-4 w-4" /></button></form>}
      <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">New to PETWO? <Link href="/register" className="font-bold text-teal-700 hover:underline">Register your clinic</Link></div>
    </div><p className="mt-6 text-center text-xs text-slate-400">By continuing, you agree to PETWO’s terms and privacy policy.</p></div></section>
  </main>;
}
