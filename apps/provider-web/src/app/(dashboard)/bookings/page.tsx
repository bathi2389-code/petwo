'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, Clock, Filter, CheckCircle2, XCircle,
  PlayCircle, MoreHorizontal, User, Phone, MapPin, IndianRupee
} from 'lucide-react';
import { bookingApi } from '@/lib/api-client';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import type { Booking, BookingStatus } from '@petco/shared';

const statusTabs: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending_confirmation' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  async function loadBookings() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      const res = await bookingApi.getBookings(params);
      if (res.data?.data) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(id: string, newStatus: string) {
    try {
      await bookingApi.updateStatus(id, { status: newStatus });
      loadBookings();
      if (selectedBooking?.id === id) {
        setSelectedBooking(null);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings & Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage scheduled consultations, visits, and services</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table or Cards */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            No bookings found in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
                <tr>
                  <th className="px-6 py-3">Booking #</th>
                  <th className="px-6 py-3">Scheduled Time</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Total / Net</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {b.bookingNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div>{formatDate(b.scheduledAt)}</div>
                      <div className="text-xs text-gray-400">{formatTime(b.scheduledAt)}</div>
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-600">
                      {b.bookingType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(b.pricing?.totalAmount || 0)}
                      </div>
                      <div className="text-xs text-emerald-600">
                        Net: {formatCurrency(b.commission?.netProviderAmount || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full capitalize ${
                        b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        b.status === 'pending_confirmation' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        b.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        b.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {b.status === 'pending_confirmation' && (
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                        >
                          Confirm
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'in_progress')}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                        >
                          Start
                        </button>
                      )}
                      {b.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'completed')}
                          className="px-2.5 py-1 bg-gray-900 text-white rounded text-xs font-medium hover:bg-black"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="px-2.5 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-100"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer for Details */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="font-bold text-lg text-gray-900">Booking {selectedBooking.bookingNumber}</h2>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Customer ID</span>
                <span className="font-medium text-gray-900">{selectedBooking.customerId}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Scheduled At</span>
                <span className="font-medium text-gray-900">
                  {formatDate(selectedBooking.scheduledAt)} at {formatTime(selectedBooking.scheduledAt)}
                </span>
              </div>
              {selectedBooking.notes && (
                <div>
                  <span className="text-gray-500 block text-xs">Special Instructions</span>
                  <p className="bg-gray-50 p-2.5 rounded text-gray-700 mt-1">{selectedBooking.notes}</p>
                </div>
              )}
              <div className="border-t pt-4 space-y-2">
                <h4 className="font-semibold text-gray-900">Financial Breakdown</h4>
                <div className="flex justify-between text-gray-600">
                  <span>Service Fee</span>
                  <span>{formatCurrency(selectedBooking.pricing.serviceAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span>{formatCurrency(selectedBooking.pricing.taxAmount)}</span>
                </div>
                {selectedBooking.pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedBooking.pricing.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                  <span>Customer Total</span>
                  <span>{formatCurrency(selectedBooking.pricing.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 border-t pt-2">
                  <span>Platform Commission ({selectedBooking.commission.rate}%)</span>
                  <span>-{formatCurrency(selectedBooking.commission.amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 text-base">
                  <span>Your Net Payout</span>
                  <span>{formatCurrency(selectedBooking.commission.netProviderAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
