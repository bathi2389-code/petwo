'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Mail, PawPrint } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';

type CustomerDraft = { displayName: string; pet?: { name: string; species: string; breed: string; gender: string; dob?: string } };

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, refreshVerification } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Open the verification link from Firebase, then check your account status here.');
  const [error, setError] = useState('');
  async function finish() {
    setBusy(true); setError('');
    try {
      if (!await refreshVerification()) { setMessage('Your email is not verified yet. Open the link in your inbox, then try again.'); return; }
      const providerRaw = sessionStorage.getItem('petwo:provider-registration');
      if (providerRaw) {
        setMessage('Your email is verified. Return to provider registration to review your business details and submit the application. Re-enter the optional PAN field before submitting.');
        return;
      }
      const customerRaw = sessionStorage.getItem('petwo:customer-registration');
      if (customerRaw) {
        const draft = JSON.parse(customerRaw) as CustomerDraft;
        await apiClient.post('/auth/customer/profile', draft);
        sessionStorage.removeItem('petwo:customer-registration'); router.replace('/my-pets'); return;
      }
      setMessage('Your email is verified. Sign in to continue to your PETWO account.');
    } catch (cause: any) { setError(cause?.response?.data?.error?.message || cause?.message || 'Could not complete account setup. Sign in and try again.'); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#f4f8f7] px-5 py-12"><section className="w-full max-w-lg rounded-3xl border border-white bg-white p-8 shadow-xl sm:p-10"><img src="/petwo-logo.svg" alt="PETWO" className="mb-8 h-10 w-auto" /><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><Mail /></div><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Email verification</p><h1 className="mt-2 text-3xl font-extrabold text-slate-950">Check your email</h1><p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>{error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<button onClick={finish} disabled={busy || !user} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Checking…' : 'Check verification status'}<CheckCircle2 className="h-4 w-4" /></button>{!user && <p className="mt-3 text-center text-xs text-slate-500">If you opened this link in another browser, sign in to PETWO in that browser first.</p>}<div className="mt-6 flex justify-center gap-5 text-sm font-semibold"><Link href="/customer/login" className="text-teal-800 hover:underline">Customer sign in</Link><Link href="/login" className="text-teal-800 hover:underline">Provider sign in</Link><Link href="/register" className="text-teal-800 hover:underline">Provider registration</Link></div><div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400"><PawPrint className="h-4 w-4" /> PETWO account security</div></section></main>;
}
