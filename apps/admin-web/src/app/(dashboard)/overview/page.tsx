'use client';

import React from 'react';
import {
  TrendingUp, Users, Calendar, ShieldCheck, IndianRupee, AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const sampleMetrics = [
  {
    label: 'Gross marketplace volume',
    value: formatCurrency(124800000),
    note: 'Sample value · Not live',
    icon: IndianRupee,
    iconStyle: 'bg-teal-50 text-teal-700',
  },
  {
    label: 'Platform commission',
    value: formatCurrency(18720000),
    note: 'Sample value · Not live',
    icon: TrendingUp,
    iconStyle: 'bg-sky-50 text-sky-700',
  },
  {
    label: 'Completed appointments',
    value: '1,420',
    note: 'Sample value · Not live',
    icon: Calendar,
    iconStyle: 'bg-indigo-50 text-indigo-700',
  },
  {
    label: 'Verified care partners',
    value: '48',
    note: 'Sample value · Not live',
    icon: ShieldCheck,
    iconStyle: 'bg-emerald-50 text-emerald-700',
  },
  {
    label: 'Pending verifications',
    value: '6',
    note: 'Sample value · Not live',
    icon: AlertCircle,
    iconStyle: 'bg-amber-50 text-amber-700',
  },
  {
    label: 'Registered pet parents',
    value: '3,890',
    note: 'Sample value · Not live',
    icon: Users,
    iconStyle: 'bg-violet-50 text-violet-700',
  },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            PETWO operations
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Platform overview
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Marketplace performance and operational health
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Preview data · Not live
        </span>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3.5 text-sm leading-6 text-amber-950">
        These figures are sample dashboard values, not live marketplace records. Live analytics will appear after secure admin authentication and API integration are completed.
      </div>

      <section aria-label="Marketplace metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sampleMetrics.map(({ label, value, note, icon: Icon, iconStyle }) => (
          <article
            key={label}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="max-w-[220px] text-xs font-bold uppercase leading-5 tracking-[0.08em] text-slate-500">
                {label}
              </p>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
            <p className="mt-2 text-xs font-medium text-slate-400">{note}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">Marketplace control centre</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Use the navigation to review providers, bookings, commissions, promotions, support cases and audit history. Administrative actions must be authorized by the backend.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
