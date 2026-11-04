'use client';

import React from 'react';
import {
  TrendingUp, Users, Calendar, ShieldCheck,
  CreditCard, IndianRupee, AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminOverviewPage() {
  const kpis = {
    grossMerchandiseValue: 124800000, // ₹1,248,000 (₹12.48 Lakhs)
    platformCommission: 18720000, // ₹187,200 (15%)
    totalBookings: 1420,
    totalVerifiedProviders: 48,
    pendingVerifications: 6,
    activeCustomers: 3890,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">\n          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">PETWO operations</p><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Platform overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Marketplace performance and operational health
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Gross Marketplace Volume</span>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {formatCurrency(kpis.grossMerchandiseValue)}
          </div>
          <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +24.8% growth vs last month
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Platform Commission Revenue</span>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-orange-600">
            {formatCurrency(kpis.platformCommission)}
          </div>
          <p className="mt-2 text-xs text-slate-500">Sample value · Not live</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Completed Appointments</span>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {kpis.totalBookings.toLocaleString()}
          </div>
          <p className="mt-2 text-xs text-slate-500">Sample value · Not live</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Verified Clinic & Vet Partners</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {kpis.totalVerifiedProviders}
          </div>
          <p className="mt-2 text-xs text-emerald-600 font-medium">Sample value · Not live</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Pending Provider Audits</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-600">
            {kpis.pendingVerifications}
          </div>
          <p className="mt-2 text-xs text-amber-700 font-medium">
            <a href="/providers" className="hover:underline">Review registrations →</a>
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Registered Pet Parents</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {kpis.activeCustomers.toLocaleString()}
          </div>
          <p className="mt-2 text-xs text-slate-500">Sample value · Not live</p>
        </div>
      </div>
    </div>
  );
}
