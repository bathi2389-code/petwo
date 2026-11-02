'use client';

import React, { useState } from 'react';
import { Ticket, Plus, Tag, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminCouponsPage() {
  const coupons = [
    {
      code: 'PETCOFIRST',
      description: 'First booking 20% discount up to ₹300',
      type: 'percentage',
      value: '20%',
      minOrder: 50000,
      usageCount: 412,
      usageLimit: 1000,
      validUntil: '31 Dec 2026',
      status: 'active',
    },
    {
      code: 'HYDPAWS50',
      description: 'Flat ₹50 off on all grooming services in Hyderabad',
      type: 'fixed',
      value: '₹50',
      minOrder: 49900,
      usageCount: 88,
      usageLimit: 500,
      validUntil: '15 Nov 2026',
      status: 'active',
    },
    {
      code: 'DIWALI2026',
      description: 'Festival offer: ₹200 off on pet boarding',
      type: 'fixed',
      value: '₹200',
      minOrder: 150000,
      usageCount: 250,
      usageLimit: 250,
      validUntil: '30 Oct 2026',
      status: 'expired',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promotions & Discount Coupons</h1>
          <p className="text-sm text-slate-500 mt-1">Manage platform-wide promo codes, discounts, and customer incentives</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Create New Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold text-slate-500">Active Coupons</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">2</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Currently redeemable by users</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold text-slate-500">Total Redemptions</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">750</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Across all campaigns</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold text-slate-500">Discounts Funded</div>
          <div className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(14500000)}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Total customer savings distributed</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
            <tr>
              <th className="px-6 py-3.5">Promo Code</th>
              <th className="px-6 py-3.5">Description</th>
              <th className="px-6 py-3.5">Discount</th>
              <th className="px-6 py-3.5">Min Order</th>
              <th className="px-6 py-3.5">Usage</th>
              <th className="px-6 py-3.5">Valid Until</th>
              <th className="px-6 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coupons.map((c) => (
              <tr key={c.code} className="hover:bg-slate-50/70">
                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-1.5 font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md text-xs">
                    <Tag className="w-3 h-3" /> {c.code}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700 text-xs">{c.description}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{c.value}</td>
                <td className="px-6 py-4 text-slate-600 text-xs">{formatCurrency(c.minOrder)}</td>
                <td className="px-6 py-4 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">{c.usageCount}</span> / {c.usageLimit}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{c.validUntil}</td>
                <td className="px-6 py-4">
                  {c.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      <AlertCircle className="w-3 h-3" /> Expired
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
