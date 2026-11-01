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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Analytics Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time performance across the Hyderabad pet care ecosystem
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
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
          <p className="mt-2 text-xs text-slate-500">Effective net commission rate: 15.0%</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Completed Appointments</span>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {kpis.totalBookings.toLocaleString()}
          </div>
          <p className="mt-2 text-xs text-slate-500">96.4% fulfillment rate across Hyderabad</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Verified Clinic & Vet Partners</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {kpis.totalVerifiedProviders}
          </div>
          <p className="mt-2 text-xs text-emerald-600 font-medium">Banjara Hills, Jubilee Hills, Gachibowli</p>
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
          <p className="mt-2 text-xs text-slate-500">6,120 active pet profiles</p>
        </div>
      </div>
    </div>
  );
}
