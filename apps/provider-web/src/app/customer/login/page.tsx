'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, PawPrint, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function CustomerLoginPage() {
  const router = useRouter();
  const { sendOtp, verifyCustomerOtp, configError } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [devOtp, setDevOtp] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const formattedPhone = '+91' + phone;

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (!/^[6-9]\d{9}$/.test(phone)) throw new Error('Enter a valid 10-digit Indian mobile number.');
      const response = await sendOtp(formattedPhone);
      setDevOtp(response.otp || '');
      setDeliveryMessage(response.message || 'Check your phone for the verification code.');
      setStep('otp');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (cause as {message?:string})?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await verifyCustomerOtp(formattedPhone, otp, name.trim() || undefined);
      if (result.role !== 'customer') throw new Error('This number belongs to a provider account. Please use provider login.');
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/my-pets');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (cause as {message?:string})?.message || 'OTP verification failed. Check the code and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8f7] lg:grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#073f3d] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute -left-36 top-20 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-emerald-300/15 blur-3xl" />
        <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3" aria-label="PETWO home">
          <img src="/petwo-logo.svg" alt="PETWO" className="h-12 w-auto brightness-0 invert" />
          <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-teal-100">Pet parent</span>
        </Link>
        <div className="relative z-10 mx-auto w-full max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-teal-100">
            <PawPrint className="h-4 w-4" /> A little more love in every visit
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
            Their health is your happiness. <span className="text-[#9be4ce]">Let’s care together.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-8 text-teal-50/75">
            Find trusted pet-care professionals, keep your pet details together and manage appointment requests in one place.
          </p>
          <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#0b5550]/65 p-5 shadow-2xl shadow-black/20">
            <img src="/pet-care-illustration.svg" alt="Friendly pets and pet care essentials" className="mx-auto max-h-[310px] w-full object-contain" />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-teal-50/80">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#9be4ce]" /> Secure sign in</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#9be4ce]" /> Approved providers</span>
          </div>
        </div>
        <p className="relative z-10 text-xs text-teal-100/50">© {new Date().getFullYear()} PETWO. Made for every paw.</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-200/50 blur-3xl lg:hidden" />
        <div className="relative w-full max-w-[440px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" aria-label="PETWO home"><img src="/petwo-logo.svg" alt="PETWO" className="h-10 w-auto" /></Link>
            <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800">Pet parent portal</span>
          </div>
          <div className="rounded-[2rem] border border-white bg-white/95 p-7 shadow-[0_24px_80px_-32px_rgba(15,65,60,0.28)] sm:p-10">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-teal-800"><ArrowLeft className="h-3.5 w-3.5" /> Back to PETWO</Link>
            <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
              {step === 'phone' ? <Smartphone className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <p className="mt-6 text-[11px] font-extrabold uppercase tracking-[.2em] text-teal-700">Welcome to PETWO</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{step === 'phone' ? 'Sign in with your phone' : 'Verify it’s you'}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {step === 'phone' ? 'Enter your mobile number and we’ll send a one-time verification code.' : `Enter the 6-digit code sent to +91 ${phone}.`}
            </p>
            {configError && <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">{configError}</div>}
            {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

            {step === 'phone' ? (
              <form onSubmit={handleSend} className="mt-7 space-y-5">
                <label className="block text-sm font-bold text-slate-700">Mobile number
                  <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-600/10">
                    <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-500">+91</span>
                    <input required inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone}
                      onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number" className="min-w-0 flex-1 px-4 py-3.5 text-sm outline-none" />
                  </div>
                </label>
                <button disabled={busy || !!configError || phone.length !== 10} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? 'Sending code…' : 'Send verification code'} {!busy && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="mt-7 space-y-5">
                <label className="block text-sm font-bold text-slate-700">Your name <span className="font-normal text-slate-400">(optional)</span>
                  <input value={name} onChange={event => setName(event.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10" placeholder="How should we address you?" />
                </label>
                <label className="block text-sm font-bold text-slate-700">6-digit verification code
                  <input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp}
                    onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-2xl font-extrabold tracking-[.55em] outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10" placeholder="••••••" />
                </label>
                {deliveryMessage && <p role="status" className="rounded-xl bg-teal-50 p-3 text-xs leading-5 text-teal-900">{deliveryMessage}</p>}
                {devOtp && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Local development code: <strong className="tracking-widest">{devOtp}</strong>. This is shown only when MSG91 is not configured.</p>}
                <button disabled={busy || otp.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? 'Verifying…' : 'Verify and continue'} {!busy && <ArrowRight className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => { setStep('phone'); setOtp(''); setDevOtp(''); setDeliveryMessage(''); setError(''); }}
                  className="w-full py-2 text-sm font-bold text-teal-800 hover:text-teal-950">Change mobile number</button>
              </form>
            )}
            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="text-xs text-slate-400">Clinic or care provider? <Link href="/login" className="font-bold text-teal-800 hover:underline">Provider sign in</Link></p>
              <p className="mt-3 text-[10px] leading-5 text-slate-400">By continuing, you agree to use PETWO responsibly and provide a mobile number you can access.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
