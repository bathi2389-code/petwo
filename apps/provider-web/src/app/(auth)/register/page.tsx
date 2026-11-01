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
      const formatted = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
      const res = await sendOtp(formatted);
      if (res?.otp) setDevOtp(res.otp);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteRegistration(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formatted = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
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
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
        <div>
          <div className="h-10 w-10 rounded-xl bg-primary text-white font-black text-xl flex items-center justify-center mb-3">
            P
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Partner with PETCO</h2>
          <p className="text-sm text-gray-500 mt-1">
            Grow your veterinary clinic, hospital, grooming or pet care business in Hyderabad.
          </p>
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

        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 border-b pb-4">
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
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-primary"
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
                    onChange={e => setPhone(e.target.value)}
                    className="pl-11 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-primary"
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
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
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
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-widest focus:outline-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {loading ? 'Submitting Application...' : 'Complete Registration'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Back to Edit Business Details
            </button>
          </form>
        )}

        <div className="border-t pt-4 text-center text-xs text-gray-500">
          Already registered?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
