'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Mail, PawPrint, ShieldCheck } from 'lucide-react';
import { friendlyFirebaseAuthError, useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';

export default function CustomerLoginPage() {
  const router = useRouter();
  const { signIn, sendVerification, refreshVerification, signOut, configError } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  async function goToCustomer(displayName: string) {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data?.data?.role !== 'customer') throw new Error('This account is not a customer account. Choose the correct PETWO portal.');
    } catch (problem: any) {
      if (problem?.status !== 404 && problem?.raw?.response?.status !== 404) throw problem;
      let profile: { displayName: string; pet?: unknown } = { displayName };
      const draft = sessionStorage.getItem('petwo:customer-registration');
      if (draft) profile = JSON.parse(draft) as typeof profile;
      await apiClient.post('/auth/customer/profile', profile);
      sessionStorage.removeItem('petwo:customer-registration');
    }
    const next = new URLSearchParams(window.location.search).get('next');
    router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/my-pets');
  }
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const user = await signIn(email.trim().toLowerCase(), password);
      if (!user.emailVerified) { setPending(true); setNotice(`Please verify ${user.email} using the link we sent, then return here.`); return; }
      await goToCustomer(user.displayName || user.email?.split('@')[0] || 'PETWO Customer');
    } catch (cause: any) { setError(friendlyFirebaseAuthError(cause)); }
    finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true); setError('');
    try { await sendVerification(); setNotice('A new verification link was sent. Check your inbox and spam folder.'); }
    catch (cause: any) { setError(friendlyFirebaseAuthError(cause)); }
    finally { setBusy(false); }
  }
  async function checkVerified() {
    setBusy(true); setError(''); setNotice('');
    try {
      if (!await refreshVerification()) { setNotice('Your email is not verified yet. Open the link in your inbox and check again.'); return; }
      await goToCustomer(email.trim().split('@')[0] || 'PETWO Customer');
    } catch (cause: any) { setError(friendlyFirebaseAuthError(cause)); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#f4f8f7] lg:grid lg:grid-cols-[1.05fr_.95fr]"><section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#073f3d] px-12 py-10 text-white lg:flex xl:px-16"><Link href="/" className="w-fit"><img src="/petwo-logo.svg" alt="PETWO" className="h-11 brightness-0 invert" /></Link><div className="mx-auto max-w-xl"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-teal-100"><PawPrint /></div><h1 className="mt-7 text-5xl font-extrabold leading-tight">Care for your best friend, all in one place.</h1><p className="mt-5 max-w-md text-base leading-7 text-teal-50/75">Manage pet profiles, find trusted care providers and keep track of appointments.</p></div><p className="text-xs text-teal-100/50">© {new Date().getFullYear()} PETWO · Made for every paw</p></section><section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8"><div className="w-full max-w-[440px]"><div className="mb-8 flex items-center justify-between lg:hidden"><Link href="/"><img src="/petwo-logo.svg" alt="PETWO" className="h-10" /></Link><span className="rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800">Pet parent</span></div><div className="rounded-[2rem] border border-white bg-white/95 p-7 shadow-[0_24px_80px_-32px_rgba(15,65,60,.28)] sm:p-10"><Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-teal-800"><ArrowLeft className="h-3.5 w-3.5" /> Back to PETWO</Link><div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">{pending ? <ShieldCheck /> : <Mail />}</div><p className="mt-6 text-[11px] font-extrabold uppercase tracking-[.2em] text-teal-700">Welcome to PETWO</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{pending ? 'Verify your email' : 'Welcome back'}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{pending ? `Open the verification link sent to ${email}, then return here.` : 'Sign in securely with your email and password.'}</p>{configError && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{configError}</p>}{error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{notice && <p role="status" className="mt-5 rounded-xl bg-teal-50 p-3 text-sm text-teal-900">{notice}</p>}{pending ? <div className="mt-7 space-y-3"><button onClick={checkVerified} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 py-3.5 text-sm font-extrabold text-white disabled:opacity-50">{busy ? 'Checking…' : 'I verified my email'}<CheckCircle2 className="h-4 w-4" /></button><button onClick={resend} disabled={busy} className="w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-teal-800">Resend verification email</button><button onClick={async () => { await signOut(); setPending(false); }} className="w-full py-2 text-sm font-bold text-slate-500">Sign out</button></div> : <form onSubmit={login} className="mt-7 space-y-5"><label className="block text-sm font-bold text-slate-700">Email address<div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="email" maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 outline-none focus:border-teal-600" /></div></label><label className="block text-sm font-bold text-slate-700">Password<div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 outline-none focus:border-teal-600" /></div></label><button disabled={busy || !!configError} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 py-3.5 text-sm font-extrabold text-white disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}<ArrowRight className="h-4 w-4" /></button></form>}<div className="mt-7 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">New to PETWO? <Link href="/customer/register" className="font-bold text-teal-800 hover:underline">Create an account</Link></div></div></div></section></main>;
}
