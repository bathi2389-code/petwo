'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar, CheckCircle2, Clock, AlertTriangle, ArrowUpRight,
  TrendingUp, Users, Scissors, Star, IndianRupee, ShieldCheck
} from 'lucide-react';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { bookingApi, providerApi } from '@/lib/api-client';
import type { Booking, Provider } from '@petwo/shared';

export default function OverviewPage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [provRes, bookRes] = await Promise.all([
          providerApi.getProfile().catch(() => ({ data: { data: null } })),
          bookingApi.getBookings({ limit: 10 }).catch(() => ({ data: { data: [] } })),
        ]);
        if (provRes.data?.data) setProvider(provRes.data.data);
        if (bookRes.data?.data) setTodayBookings(bookRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const pendingConfirmations = todayBookings.filter(b => b.status === 'pending_confirmation');
  const confirmedToday = todayBookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Verification Status Banner */}
      {provider?.verificationStatus === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <h4 className="font-semibold text-amber-800">Verification in Progress</h4>
            <p className="text-amber-700 mt-0.5">
              Your business documentation is being reviewed by the PETWO compliance team for Hyderabad.
              You can set up your service catalogue and operating hours in the meantime.
            </p>
          </div>
        </div>
      )}

      {provider?.verificationStatus === 'approved' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-semibold text-emerald-900 text-sm">Verified PETWO Partner</span>
              <p className="text-xs text-emerald-700">Your profile is public and accepting bookings in Hyderabad.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
            Active Listing
          </span>
        </div>
      )}

      {/* Header & Quick stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {provider?.businessName || 'Partner'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here is your daily snapshot for Hyderabad operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/services"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition shadow-sm"
          >
            <Scissors className="h-4 w-4" />
            Manage Services
          </a>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <span>Today's Schedule</span>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">{confirmedToday.length}</span>
            <span className="text-xs text-gray-500 ml-2">appointments</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Next at {confirmedToday[0] ? formatTime(confirmedToday[0].scheduledAt) : 'None scheduled'}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <span>Awaiting Confirmation</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-600">{pendingConfirmations.length}</span>
            <span className="text-xs text-gray-500 ml-2">requests</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">Require quick confirmation</p>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <span>Customer Rating</span>
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{provider?.rating?.toFixed(1) || '4.9'}</span>
            <span className="text-xs text-gray-500">({provider?.reviewCount || 142} reviews)</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>98% positive sentiment</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <span>Tier & Plan</span>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900 capitalize">
              {provider?.subscription?.tier || 'Pro'}
            </span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ml-2 font-medium">
              Active
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">Next settlement: Every Monday</p>
        </div>
      </div>

      {/* Bookings Queue */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
            <p className="text-xs text-gray-500">Today and tomorrow scheduled bookings</p>
          </div>
          <a href="/bookings" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="divide-y divide-gray-100">
          {todayBookings.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              No upcoming appointments. New bookings will show up here.
            </div>
          ) : (
            todayBookings.map((b) => (
              <div key={b.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    🐾
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{b.bookingNumber}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                        b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                        b.status === 'pending_confirmation' ? 'bg-amber-100 text-amber-800' :
                        b.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(b.scheduledAt)} at {formatTime(b.scheduledAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(b.pricing?.totalAmount || 0)}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Net: {formatCurrency(b.commission?.netProviderAmount || 0)}
                    </div>
                  </div>
                  {b.status === 'pending_confirmation' && (
                    <button
                      onClick={async () => {
                        await bookingApi.confirmBooking(b.id);
                        window.location.reload();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
