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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md shadow-primary/20">
            P
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">PETWO Provider Portal</h2>
          <p className="text-sm text-gray-500">Sign in with your registered business phone number</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {devOtp && (
          <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-200">
            <strong>Development OTP:</strong> {devOtp}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                  className="pl-12 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm"
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
                className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
              className="w-full text-center text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Change Phone Number
            </button>
          </form>
        )}

        <div className="border-t pt-4 text-center text-xs text-gray-500">
          New to PETWO?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Register your clinic or business
          </Link>
        </div>
      </div>
    </div>
  );
}
