'use client';

import React from 'react';
import { CreditCard, IndianRupee, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const transactions = [
    {
      id: 'pay_HyD99812A',
      bookingId: 'PTC-20241102-8812',
      customer: 'Priya Sharma',
      amount: 85000,
      platformFee: 12750,
      providerPayout: 72250,
      method: 'UPI (Google Pay)',
      date: '02 Nov 2026, 11:28 AM',
      status: 'captured',
    },
    {
      id: 'pay_HyD77123B',
      bookingId: 'PTC-20241102-7741',
      customer: 'Rahul Varma',
      amount: 149900,
      platformFee: 22485,
      providerPayout: 127415,
      method: 'Credit Card (Visa)',
      date: '02 Nov 2026, 01:54 PM',
      status: 'captured',
    },
    {
      id: 'pay_HyD33100C',
      bookingId: 'PTC-20241101-3390',
      customer: 'Ananya Reddy',
      amount: 320000,
      platformFee: 48000,
      providerPayout: 272000,
      method: 'Netbanking (HDFC)',
      date: '01 Nov 2026, 10:12 AM',
      status: 'settled',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments & Gateway Settlements</h1>
        <p className="text-sm text-slate-500 mt-1">Razorpay transaction monitoring, automated marketplace splits, and payout reconciliation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold text-slate-500">24h Gross Volume</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(554900)}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">100% gateway capture success rate</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold text-slate-500">Platform Take-Rate Retained</div>
          <div className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(83235)}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">15% net commission + GST deducted</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold text-slate-500">Provider Payouts Due</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(471665)}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Scheduled for T+2 banking settlement</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
            <tr>
              <th className="px-6 py-3.5">Gateway Payment ID</th>
              <th className="px-6 py-3.5">Booking ID</th>
              <th className="px-6 py-3.5">Customer</th>
              <th className="px-6 py-3.5">Payment Method</th>
              <th className="px-6 py-3.5">Order Amount</th>
              <th className="px-6 py-3.5">Platform Fee</th>
              <th className="px-6 py-3.5">Provider Net</th>
              <th className="px-6 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/70 font-mono text-xs">
                <td className="px-6 py-4 font-semibold text-slate-900">{t.id}</td>
                <td className="px-6 py-4 text-orange-600">{t.bookingId}</td>
                <td className="px-6 py-4 font-sans text-slate-800">{t.customer}</td>
                <td className="px-6 py-4 font-sans text-slate-600">{t.method}</td>
                <td className="px-6 py-4 font-sans font-bold text-slate-900">{formatCurrency(t.amount)}</td>
                <td className="px-6 py-4 font-sans font-semibold text-orange-600">{formatCurrency(t.platformFee)}</td>
                <td className="px-6 py-4 font-sans font-semibold text-emerald-600">{formatCurrency(t.providerPayout)}</td>
                <td className="px-6 py-4 font-sans">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
