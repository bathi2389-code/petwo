'use client';

import React, { useState } from 'react';
import { Headphones, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function AdminSupportPage() {
  const tickets = [
    {
      id: 'TKT-20241102-001',
      customer: 'Suresh Varma',
      phone: '+91 94401 23456',
      subject: 'Refund request for cancelled vet consultation',
      bookingId: 'PTC-20241101-1102',
      priority: 'high',
      status: 'open',
      createdAt: 'Today, 10:15 AM',
    },
    {
      id: 'TKT-20241101-098',
      customer: 'Kavita Nair',
      phone: '+91 98840 98765',
      subject: 'Groomer arrived 30 minutes late for home service',
      bookingId: 'PTC-20241031-4421',
      priority: 'medium',
      status: 'in_progress',
      createdAt: 'Yesterday, 03:40 PM',
    },
    {
      id: 'TKT-20241030-045',
      customer: 'Mahesh Babu',
      phone: '+91 97000 11223',
      subject: 'Vaccination certificate digital passport sync issue',
      bookingId: 'PTC-20241029-9912',
      priority: 'low',
      status: 'resolved',
      createdAt: '30 Oct 2026',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support & Dispute Resolution</h1>
        <p className="text-sm text-slate-500 mt-1">Manage customer grievances, refund disputes, and provider complaints</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold text-slate-500">Open Tickets</div>
          <div className="text-2xl font-bold text-rose-600 mt-2">1</div>
          <div className="text-xs text-rose-600 font-medium mt-1">Requires immediate attention</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold text-slate-500">In Progress</div>
          <div className="text-2xl font-bold text-amber-600 mt-2">1</div>
          <div className="text-xs text-amber-600 font-medium mt-1">Assigned to support executive</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold text-slate-500">Resolved Today</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">8</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Avg turnaround: 28 mins</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold text-slate-500">CSAT Score</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">4.8 / 5.0</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Based on 340 ratings</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
            <tr>
              <th className="px-6 py-3.5">Ticket ID</th>
              <th className="px-6 py-3.5">Customer & Phone</th>
              <th className="px-6 py-3.5">Subject & Booking</th>
              <th className="px-6 py-3.5">Priority</th>
              <th className="px-6 py-3.5">Created At</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/70">
                <td className="px-6 py-4 font-mono font-semibold text-slate-900 text-xs">{t.id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{t.customer}</div>
                  <div className="text-xs text-slate-500">{t.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-800 font-medium text-xs">{t.subject}</div>
                  <div className="text-[11px] font-mono text-orange-600">{t.bookingId}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                    t.priority === 'high' ? 'bg-rose-100 text-rose-800' :
                    t.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {t.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{t.createdAt}</td>
                <td className="px-6 py-4">
                  {t.status === 'open' && <span className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium"><Clock className="w-3 h-3" /> Open</span>}
                  {t.status === 'in_progress' && <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium"><AlertTriangle className="w-3 h-3" /> In Progress</span>}
                  {t.status === 'resolved' && <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium"><CheckCircle className="w-3 h-3" /> Resolved</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs text-orange-600 hover:text-orange-700 font-semibold">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
