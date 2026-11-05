'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, FileText, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { verifyOtp, sendOtp } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('veterinary_clinic');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  async function handleSendOtpAndNext(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const digits = phone.replace(/\D/g, '').replace(/^91/, '');
      if (!/^[6-9]\d{9}$/.test(digits)) throw new Error('Enter a valid 10-digit Indian mobile number.');
      const formatted = `+91${digits}`;
      const res = await sendOtp(formatted);
      if (res?.otp) setDevOtp(res.otp);
      setStep(2);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteRegistration(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const digits = phone.replace(/\D/g, '').replace(/^91/, '');
      if (!/^[6-9]\d{9}$/.test(digits)) throw new Error('Enter a valid 10-digit Indian mobile number.');
      if (!/^\d{6}$/.test(otp)) throw new Error('Enter the 6-digit verification code.');
      const formatted = `+91${digits}`;
      // Verify OTP and authenticate user session
      await verifyOtp(formatted, otp, businessName);

      // Register provider profile
      await apiClient.post('/providers/register', {
        businessName,
        businessType,
        tagline,
        description,
        contact: {
          phone: formatted,
          email,
        },
        registrationNo,
        panNumber: panNumber ? panNumber.toUpperCase() : undefined,
        gstNumber: gstNumber ? gstNumber.toUpperCase() : undefined,
      });

      router.push('/overview');
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 via-slate-50 to-white px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="relative w-full max-w-2xl space-y-6 rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-9">
        <div>
          <img src="/petwo-logo.svg" alt="PETWO" className="mb-4 h-10 w-auto object-contain" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Partner with PETWO</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Grow your veterinary clinic, hospital, grooming or pet care business in Hyderabad.
          </p>
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

        {/* Step indicator */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-xs font-semibold text-slate-500">
          <span className={step === 1 ? 'text-primary' : 'text-gray-400'}>1. Business Details</span>
          <span>→</span>
          <span className={step === 2 ? 'text-primary' : 'text-gray-400'}>2. Verification & OTP</span>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtpAndNext} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Business or Practice Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Hyderabad Veterinary Specialty Hospital"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Provider Type</label>
              <select
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-primary"
              >
                <option value="veterinary_hospital">Veterinary Hospital (24/7 or Multi-doc)</option>
                <option value="veterinary_clinic">Veterinary Clinic</option>
                <option value="individual_vet">Solo Veterinarian</option>
                <option value="grooming_salon">Pet Grooming Salon / Spa</option>
                <option value="boarding_facility">Boarding & Resort Facility</option>
                <option value="daycare_facility">Daycare Facility</option>
                <option value="diagnostic_centre">Veterinary Diagnostic & Lab</option>
                <option value="pet_trainer">Pet Trainer</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Business Phone</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-gray-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="contact@vetclinic.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">VCI / Reg. No.</label>
                <input
                  type="text"
                  placeholder="TG-VET-1234"
                  value={registrationNo}
                  onChange={e => setRegistrationNo(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">PAN Number</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChange={e => setPanNumber(e.target.value.toUpperCase())}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:outline-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">GSTIN (Optional)</label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="36ABCDE1234F1Z5"
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value.toUpperCase())}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:outline-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending OTP...' : 'Next: Verify Phone Number'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div className="text-center py-2">
              <p className="text-xs text-gray-600">
                We sent a 6-digit confirmation OTP to <strong>+91 {phone}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 text-center">
                Enter Verification Code
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                minLength={6}
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center font-mono text-2xl tracking-[0.45em] text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {loading ? 'Submitting Application...' : 'Complete Registration'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full rounded-lg py-2 text-center text-sm font-medium text-slate-500 underline-offset-4 hover:text-primary hover:underline"
            >
              Back to Edit Business Details
            </button>
          </form>
        )}

        <div className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
