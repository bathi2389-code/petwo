'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Heart, PawPrint, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const formattedPhone = phone.startsWith('+91') ? phone : '+91' + phone.replace(/\D/g, '');

  async function handleSendOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!/^\+91[6-9]\d{9}$/.test(formattedPhone)) {
        throw new Error('Enter a valid 10-digit Indian mobile number.');
      }
      const response = await sendOtp(formattedPhone);
      setDevOtp(response?.otp ?? null);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(formattedPhone, otp);
      if (result.role !== 'provider') {
        router.push('/register');
        return;
      }
      try {
        await apiClient.get('/providers/me');
        router.push('/overview');
      } catch (profileError: any) {
        if (profileError?.response?.status === 404) {
          router.push('/register');
          return;
        }
        throw profileError;
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8f7] lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#073f3d] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-teal-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <img src="/petwo-logo.svg" alt="PETWO" className="h-11 w-auto brightness-0 invert" />
          <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-100">Care partner portal</span>
        </div>
        <div className="relative z-10 mx-auto w-full max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-white/10 px-4 py-2 text-xs font-semibold text-teal-100">
            <Sparkles className="h-4 w-4" /> Better care starts together
          </div>
          <h1 className="max-w-lg text-4xl font-bold leading-[1.12] tracking-tight xl:text-5xl">
            Your care.<span className="block text-[#9be4ce]">Their happy place.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-teal-50/75">
            Manage your clinic, connect with pet parents and make every visit a little easier.
          </p>
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b5550]/70 p-4 shadow-2xl shadow-black/20">
            <img src="/pet-care-illustration.svg" alt="Friendly dog and cat with pet care essentials" className="mx-auto max-h-[330px] w-full object-contain" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-teal-50/80">
            <div className="flex items-center gap-2"><PawPrint className="h-4 w-4 text-[#9be4ce]" /> Pet-first</div>
            <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-[#9be4ce]" /> Trusted care</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#9be4ce]" /> Secure access</div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-teal-100/50">© {new Date().getFullYear()} PETWO. Made for every paw.</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-200/45 blur-3xl lg:hidden" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-emerald-100/80 blur-3xl lg:hidden" />
        <div className="relative w-full max-w-[440px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <img src="/petwo-logo.svg" alt="PETWO" className="h-10 w-auto" />
            <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800">Partner portal</span>
          </div>
          <div className="rounded-[2rem] border border-white bg-white/95 p-7 shadow-[0_24px_80px_-32px_rgba(15,65,60,0.25)] backdrop-blur sm:p-10">
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
                {step === 'phone' ? <PawPrint className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Welcome to PETWO</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{step === 'phone' ? 'Welcome back' : 'Verify your number'}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {step === 'phone' ? 'Sign in with the mobile number registered to your clinic or pet-care business.' : 'Enter the 6-digit code sent to ' + formattedPhone + '.'}
              </p>
            </div>
            {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {devOtp && step === 'otp' && <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800"><strong>Development OTP:</strong> <span className="font-mono tracking-widest">{devOtp}</span></div>}
            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700">Mobile number</label>
                  <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-teal-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-600/10">
                    <span className="flex items-center border-r border-slate-200 px-4 text-sm font-semibold text-slate-500">+91</span>
                    <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required maxLength={10} placeholder="98765 43210" value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">We’ll send a one-time verification code.</p>
                </div>
                <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087f70] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-[#066b60] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? 'Sending code…' : 'Send verification code'}<ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label htmlFor="otp" className="mb-2 block text-sm font-semibold text-slate-700">6-digit verification code</label>
                  <input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={6} placeholder="••••••" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center font-mono text-2xl tracking-[0.55em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10" />
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087f70] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-[#066b60] focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? 'Verifying…' : 'Verify and continue'}<CheckCircle2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => { setStep('phone'); setOtp(''); setDevOtp(null); setError(null); }} className="w-full rounded-lg py-2 text-sm font-semibold text-slate-500 transition hover:text-teal-800">Change mobile number</button>
              </form>
            )}
            <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
              New to PETWO? <Link href="/register" className="font-bold text-teal-700 underline-offset-4 hover:underline">Register your clinic</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">By continuing, you agree to PETWO’s terms and privacy policy.</p>
        </div>
      </section>
    </main>
  );
}
