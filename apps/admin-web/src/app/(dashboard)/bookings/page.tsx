'use client';

import React, { useState } from 'react';
import { Calendar, Search, Filter, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const bookings = [
    {
      id: 'PTC-20241102-8812',
      customer: 'Priya Sharma',
      phone: '+91 98765 43210',
      pet: 'Simba (Golden Retriever)',
      provider: 'Dr. Rao Pet Hospital (Banjara Hills)',
      service: 'Veterinary Comprehensive Checkup',
      date: '02 Nov 2026, 11:30 AM',
      amount: 85000,
      commission: 12750,
      status: 'confirmed',
    },
    {
      id: 'PTC-20241102-7741',
      customer: 'Rahul Varma',
      phone: '+91 91234 56789',
      pet: 'Bella (Shih Tzu)',
      provider: 'Paws & Bubbles Grooming (Jubilee Hills)',
      service: 'Full Luxury Grooming & Spa',
      date: '02 Nov 2026, 02:00 PM',
      amount: 149900,
      commission: 22485,
      status: 'in_progress',
    },
    {
      id: 'PTC-20241101-3390',
      customer: 'Ananya Reddy',
      phone: '+91 99887 76655',
      pet: 'Leo (Beagle)',
      provider: 'TailWaggers Resort & Boarding (Gachibowli)',
      service: 'AC Suite Boarding (2 Nights)',
      date: '01 Nov 2026',
      amount: 320000,
      commission: 48000,
      status: 'completed',
    },
    {
      id: 'PTC-20241101-1102',
      customer: 'Karthik Kumar',
      phone: '+91 90123 45678',
      pet: 'Coco (Indie)',
      provider: 'Dr. Rao Pet Hospital (Banjara Hills)',
      service: 'Annual Multi-Vaccination Shot',
      date: '01 Nov 2026, 04:30 PM',
      amount: 120000,
      commission: 18000,
      status: 'cancelled',
    },
  ];

  const filteredBookings = bookings.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search && !b.customer.toLowerCase().includes(search.toLowerCase()) && !b.id.toLowerCase().includes(search.toLowerCase()) && !b.provider.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-3 h-3" /> Confirmed</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><AlertCircle className="w-3 h-3" /> In Progress</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Bookings & Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Live monitoring of all veterinary, grooming, and boarding bookings</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Booking ID, customer, or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                filter === tab ? 'bg-orange-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
              <tr>
                <th className="px-6 py-3.5">Booking ID</th>
                <th className="px-6 py-3.5">Customer & Pet</th>
                <th className="px-6 py-3.5">Provider & Service</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Order Total</th>
                <th className="px-6 py-3.5">Commission</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-4 font-mono font-semibold text-slate-900 text-xs">{b.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{b.customer}</div>
                    <div className="text-xs text-slate-500">{b.pet}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{b.provider}</div>
                    <div className="text-xs text-slate-500">{b.service}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">{b.date}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(b.amount)}</td>
                  <td className="px-6 py-4 font-medium text-emerald-600">{formatCurrency(b.commission)}</td>
                  <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
