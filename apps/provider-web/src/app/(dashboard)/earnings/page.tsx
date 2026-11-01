'use client';

import React, { useState } from 'react';
import { IndianRupee, ArrowDownToLine, CheckCircle2, Clock, Building, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function EarningsPage() {
  // Mock data representing standard multi-tenant payout cycle
  const earningsSummary = {
    totalGross: 4850000, // ₹48,500
    commissionPaid: 727500, // ₹7,275 (15%)
    gstOnCommission: 130950, // ₹1,309.50
    netPayout: 3991550, // ₹39,915.50
    pendingSettlement: 1240000, // ₹12,400
  };

  const settlements = [
    {
      id: 'stl-202411-01',
      period: '21 Oct 2024 - 27 Oct 2024',
      gross: 2400000,
      commission: 360000,
      net: 1975200,
      utr: 'HDFC0001234987654',
      status: 'settled',
      settledAt: '2024-10-29T10:30:00.000Z',
    },
    {
      id: 'stl-202410-04',
      period: '14 Oct 2024 - 20 Oct 2024',
      gross: 2450000,
      commission: 367500,
      net: 2016350,
      utr: 'HDFC0001234887612',
      status: 'settled',
      settledAt: '2024-10-22T11:15:00.000Z',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings & Settlements</h1>
        <p className="text-sm text-gray-500 mt-1">
          Automated weekly payouts directly credited to your registered bank account in Hyderabad
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Gross Bookings Revenue</span>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(earningsSummary.totalGross)}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">Total customer bookings</span>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <span className="text-xs text-gray-500 font-medium">PETCO Platform Commission</span>
          <div className="mt-2 text-2xl font-bold text-gray-700">
            {formatCurrency(earningsSummary.commissionPaid)}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">Avg 15% marketplace fee</span>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <span className="text-xs text-emerald-700 font-medium">Total Net Settled</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(earningsSummary.netPayout)}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">Successfully deposited</span>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <span className="text-xs text-amber-700 font-medium">Pending Settlement</span>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {formatCurrency(earningsSummary.pendingSettlement)}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">Disbursed on next Monday</span>
        </div>
      </div>

      {/* Bank Account Details Card */}
      <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Linked Bank Account</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              HDFC Bank Ltd • A/C ending with •••• 9821 • IFSC: HDFC0001234
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <ShieldCheck className="h-4 w-4" />
          Verified for Direct Transfers
        </div>
      </div>

      {/* Settlement History Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Settlement Ledger</h3>
          <p className="text-xs text-gray-500">Every payout batch transferred via Razorpay Route</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
              <tr>
                <th className="px-6 py-3">Settlement ID</th>
                <th className="px-6 py-3">Billing Cycle</th>
                <th className="px-6 py-3">Gross</th>
                <th className="px-6 py-3">Platform Fee</th>
                <th className="px-6 py-3">Net Payout</th>
                <th className="px-6 py-3">UTR Reference</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-900">
                    {s.id}
                  </td>
                  <td className="px-6 py-4 text-gray-700 text-xs">{s.period}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatCurrency(s.gross)}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    -{formatCurrency(s.commission)}
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    {formatCurrency(s.net)}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{s.utr}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      Settled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
