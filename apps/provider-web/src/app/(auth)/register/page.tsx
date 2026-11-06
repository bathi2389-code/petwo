'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { friendlyFirebaseAuthError, useAuth } from '@/lib/auth-context';
import { useResendCooldown } from '@/lib/use-resend-cooldown';

export default function RegisterPage() {
  const router = useRouter();
  const { user, createAccount, sendVerification, refreshVerification, signOut, configError } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [contactName, setContactName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('veterinary_clinic');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [registrationNo, setRegistrationNo] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState('');
  const resendCooldown = useResendCooldown();

  useEffect(() => {
    if (!user) return;
    if (user.email) setEmail(user.email);
    try {
      const saved = sessionStorage.getItem('petwo:provider-registration');
      if (!saved) return;
      const draft = JSON.parse(saved);
      setContactName(draft.contactName || '');
      setBusinessName(draft.businessName || '');
      setBusinessType(draft.businessType || 'veterinary_clinic');
      setPhone((draft.contact?.phone || '').replace(/^\\+91/, ''));
      setEmail(draft.contact?.email || user.email || '');
      setRegistrationNo(draft.registrationNo || '');
      setGstNumber(draft.gstNumber || '');
      setStep(2);
      setNotice(user.emailVerified
        ? 'Your email is verified. Complete your provider application below.'
        : 'Your account already exists. Open the verification link sent to your email, then return here to continue.');
    } catch {
      setError('Saved registration details could not be restored. Enter them again to continue.');
    }
  }, [user]);

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null); setNotice('');
    try {
      if (contactName.trim().length < 2) throw new Error('Enter the contact person’s name.');
      const digits = phone.replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(digits)) throw new Error('Enter a valid business contact number.');
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Enter a valid official email address.');
      if (!user?.emailVerified && password.length < 8) throw new Error('Use a password with at least 8 characters.');
      if (!user?.emailVerified && password !== confirmPassword) throw new Error('The passwords do not match.');
      const draft = { contactName: contactName.trim(), businessName: businessName.trim(), businessType, contact: { phone: `+91${digits}`, email: email.trim().toLowerCase() }, registrationNo: registrationNo.trim() || undefined, gstNumber: gstNumber.trim().toUpperCase() || undefined };
      sessionStorage.setItem('petwo:provider-registration', JSON.stringify(draft));
      if (user?.emailVerified) {
        if (user.email?.toLowerCase() !== email.trim().toLowerCase()) throw new Error('Use the email address of the verified Firebase account.');
        setStep(2);
        setNotice('Your email is verified. Complete your provider application below.');
        return;
      }
      const account = await createAccount(email.trim().toLowerCase(), password, contactName.trim());
      await sendVerification(account);
      resendCooldown.start(60);
      setStep(2);
      setNotice(`Your account is ready. Open the verification link sent to ${email.trim()} and return here.`);
    } catch (cause: any) { setError(cause?.response?.data?.error?.message || friendlyFirebaseAuthError(cause)); }
    finally { setLoading(false); }
  }

  async function handleResendVerification() {
    setLoading(true); setError(null); setNotice('');
    try { await sendVerification(); resendCooldown.start(60); setNotice('A fresh verification link was sent. Check your inbox and spam folder.'); }
    catch (cause: any) { setError(friendlyFirebaseAuthError(cause)); }
    finally { setLoading(false); }
  }

  async function handleCompleteRegistration() { setLoading(true); setError(null); setNotice('');
    try {
      if (!await refreshVerification()) throw new Error('Open the verification link in your email, then check again.');
      const digits = phone.replace(/\D/g, '').slice(-10);
      const response = await apiClient.post('/providers/register', {
        contactName: contactName.trim(), businessName: businessName.trim(), businessType,
        contact: { phone: `+91${digits}`, email: email.trim().toLowerCase() },
        registrationNo: registrationNo.trim() || undefined,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        gstNumber: gstNumber.trim().toUpperCase() || undefined,
      });
      sessionStorage.removeItem('petwo:provider-registration');
      if (response.data?.data?.verificationStatus === 'pending') setNotice('Your application is submitted and pending PETWO review.');
      router.push('/overview');
    } catch (cause: any) { setError(cause?.response?.data?.error?.message || friendlyFirebaseAuthError(cause)); }
    finally { setLoading(false); }
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

        {configError && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{configError}</div>}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-xs font-semibold text-slate-500">
          <span className={step === 1 ? 'text-primary' : 'text-gray-400'}>1. Business Details</span>
          <span>→</span>
          <span className={step === 2 ? 'text-primary' : 'text-gray-400'}>2. Email Verification</span>
        </div>

        {step === 1 ? (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-700">Contact person’s name</label>
              <input id="contact-name" type="text" required autoComplete="name" minLength={2} maxLength={100}
                placeholder="Your full name" value={contactName} onChange={e => setContactName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" />
            </div>
            <div>
              <label htmlFor="business-name" className="block text-sm font-semibold text-slate-700">Business or practice name</label>
              <input
                id="business-name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                placeholder="e.g. Hyderabad Veterinary Specialty Hospital"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="business-type" className="block text-sm font-semibold text-slate-700">Provider type</label>
              <select
                id="business-type"
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="business-phone" className="block text-sm font-semibold text-slate-700">Business contact phone</label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    id="business-phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                  />
                </div>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">Contact detail only. PETWO sends verification codes by email.</p>
              </div>

              <div>
                <label htmlFor="official-email" className="block text-sm font-semibold text-slate-700">Official email</label>
                <input
                  id="official-email"
                  type="email"
                  required
                  autoComplete="email"
                  maxLength={254}
                  placeholder="contact@vetclinic.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="block text-sm font-semibold text-slate-700">Password</label><div className="relative mt-2"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="password" required={!user?.emailVerified} minLength={user?.emailVerified ? undefined : 8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10" /></div></div>
              <div><label className="block text-sm font-semibold text-slate-700">Confirm password</label><input type="password" required={!user?.emailVerified} minLength={user?.emailVerified ? undefined : 8} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10" /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700">VCI / Reg. No.</label>
                <input
                  type="text"
                  placeholder="TG-VET-1234"
                  value={registrationNo}
                  onChange={e => setRegistrationNo(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">PAN number</label>
                <input
                  type="text"
                  maxLength={10}
                  pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]"
                  title="Enter a valid PAN (for example, ABCDE1234F), or leave this optional field blank."
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChange={e => setPanNumber(e.target.value.toUpperCase())}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm uppercase focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">GSTIN <span className="font-normal text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  maxLength={15}
                  pattern="[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][0-9][A-Za-z][A-Za-z0-9]"
                  title="Enter a 15-character GSTIN, or leave this optional field blank."
                  placeholder="36ABCDE1234F1Z5"
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value.toUpperCase())}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm uppercase focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account and verify email'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm leading-6 text-teal-900">{notice || <>Open the Firebase verification link sent to <strong>{email}</strong>. Then return and check the status below.</>}</div>
            <button type="button" onClick={handleCompleteRegistration} disabled={loading || Boolean(configError)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Checking verification…' : 'I verified my email — continue'}<CheckCircle2 className="h-4 w-4" /></button>
            <button type="button" onClick={handleResendVerification} disabled={loading || resendCooldown.seconds > 0} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-primary disabled:opacity-50">{resendCooldown.seconds ? `Resend in ${resendCooldown.seconds}s` : 'Resend verification link'}</button>
            <button type="button" onClick={async () => { await signOut(); setStep(1); setNotice(''); }} className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-primary">Sign out</button>
          </div>
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
