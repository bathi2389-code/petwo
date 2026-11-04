'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Phone, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formatted = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
      const res = await sendOtp(formatted);
      if (res?.otp) {
        setDevOtp(res.otp); // Dev helper
      }
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check phone number.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formatted = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
      await verifyOtp(formatted, otp);
      router.push('/overview');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 via-slate-50 to-white px-4 py-10">\n      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />\n      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="relative w-full max-w-[440px] space-y-7 rounded-3xl border border-white/80 bg-white/95 p-7 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-9">
        <div className="text-center space-y-2">
          <img src="/petwo-logo.svg" alt="PETWO" className="mx-auto h-12 w-auto max-w-[210px] object-contain transition-transform duration-300 hover:scale-[1.02]" />
          <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-800"><ShieldCheck className="h-3.5 w-3.5" /> Partner workspace</div>\n          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="text-sm leading-6 text-slate-500">Sign in with your registered business phone number</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {devOtp && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
            <strong>Development OTP:</strong> {devOtp}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Mobile Number
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-semibold text-gray-500">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending OTP...' : 'Send Verification OTP'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center font-mono text-2xl tracking-[0.45em] text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full rounded-lg py-2 text-center text-sm font-medium text-slate-500 underline-offset-4 hover:text-primary hover:underline"
            >
              Change Phone Number
            </button>
          </form>
        )}

        <div className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          New to PETWO?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Register your clinic or business
          </Link>
        </div>
      </div>
    </div>
  );
}
