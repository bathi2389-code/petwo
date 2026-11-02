'use client';

import React from 'react';
import { Users, Search, Phone, Mail, Dog, Calendar } from 'lucide-react';

export default function AdminCustomersPage() {
  const customers = [
    {
      id: 'cust-hyd-001',
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya.s@gmail.com',
      location: 'Banjara Hills, Hyderabad',
      pets: ['Simba (Golden Retriever, 2y)'],
      totalBookings: 14,
      totalSpent: '₹18,400',
      joinedAt: 'March 2026',
    },
    {
      id: 'cust-hyd-002',
      name: 'Rahul Varma',
      phone: '+91 91234 56789',
      email: 'rahul.v@outlook.com',
      location: 'Jubilee Hills, Hyderabad',
      pets: ['Bella (Shih Tzu, 1y)', 'Milo (Cat, 3y)'],
      totalBookings: 8,
      totalSpent: '₹12,800',
      joinedAt: 'May 2026',
    },
    {
      id: 'cust-hyd-003',
      name: 'Ananya Reddy',
      phone: '+91 99887 76655',
      email: 'ananya.reddy@gmail.com',
      location: 'Gachibowli, Hyderabad',
      pets: ['Leo (Beagle, 4y)'],
      totalBookings: 21,
      totalSpent: '₹34,500',
      joinedAt: 'January 2026',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pet Parents & Customers</h1>
        <p className="text-sm text-slate-500 mt-1">Directory of registered customers and their pet health profiles</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
            <tr>
              <th className="px-6 py-3.5">Customer</th>
              <th className="px-6 py-3.5">Contact Details</th>
              <th className="px-6 py-3.5">Location</th>
              <th className="px-6 py-3.5">Registered Pets</th>
              <th className="px-6 py-3.5">Total Orders</th>
              <th className="px-6 py-3.5">Lifetime Value</th>
              <th className="px-6 py-3.5">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70">
                <td className="px-6 py-4 font-semibold text-slate-900">{c.name}</td>
                <td className="px-6 py-4 text-xs text-slate-600">
                  <div>{c.phone}</div>
                  <div className="text-slate-400">{c.email}</div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-700">{c.location}</td>
                <td className="px-6 py-4 text-xs text-slate-600">
                  {c.pets.map((p, i) => (
                    <div key={i} className="inline-block bg-slate-100 text-slate-800 rounded px-2 py-0.5 text-[11px] mr-1">
                      {p}
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-900">{c.totalBookings}</td>
                <td className="px-6 py-4 text-xs font-bold text-emerald-600">{c.totalSpent}</td>
                <td className="px-6 py-4 text-xs text-slate-500">{c.joinedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
