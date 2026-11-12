'use client';

import { AlertCircle, IndianRupee, ShieldCheck } from 'lucide-react';

export default function EarningsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-700">Partner finances</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Payments & payouts</h1><p className="mt-2 text-sm leading-6 text-slate-500">A transparent view of payment features currently available in PETWO.</p></div>
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
        <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700"><AlertCircle className="h-6 w-6" /></span><div><h2 className="text-lg font-extrabold text-amber-950">Online payments are not enabled yet</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-amber-900/80">PETWO is currently running its MVP without online payment collection or automated provider settlements. This page will show real transaction and payout records only after the payment workflow is enabled and verified.</p></div></div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><IndianRupee className="h-5 w-5" /></div><h3 className="mt-4 font-extrabold text-slate-900">No settlement totals shown</h3><p className="mt-2 text-sm leading-6 text-slate-500">We do not invent revenue, commission, GST, payout dates or transaction history. Booking prices remain visible in booking details where available.</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><ShieldCheck className="h-5 w-5" /></div><h3 className="mt-4 font-extrabold text-slate-900">No bank details collected here</h3><p className="mt-2 text-sm leading-6 text-slate-500">No bank account is linked or verified by this screen. PETWO will add a secure payout setup only when the settlement feature is ready.</p></article>
      </section>
    </div>
  );
}
