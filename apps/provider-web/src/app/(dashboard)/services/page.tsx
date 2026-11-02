'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Scissors, Clock, IndianRupee, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { serviceApi, providerApi } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import type { Service, Provider } from '@petwo/shared';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState(800);
  const [duration, setDuration] = useState(45);
  const [priceType, setPriceType] = useState<'fixed' | 'starting_from'>('fixed');
  const [categoryId, setCategoryId] = useState('cat-veterinary');
  const [locationId, setLocationId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [srvRes, provRes, locRes] = await Promise.all([
        serviceApi.getServices().catch(() => ({ data: { data: [] } })),
        providerApi.getProfile().catch(() => ({ data: { data: null } })),
        providerApi.getLocations().catch(() => ({ data: { data: [] } })),
      ]);
      if (srvRes.data?.data) setServices(srvRes.data.data);
      if (provRes.data?.data) setProvider(provRes.data.data);
      if (locRes.data?.data) {
        setLocations(locRes.data.data);
        if (locRes.data.data.length > 0) {
          setLocationId(locRes.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    try {
      await serviceApi.createService({
        locationId: locationId || 'loc-default',
        categoryId,
        name,
        description,
        price: {
          amount: amountRupees * 100, // paisa
          currency: 'INR',
          priceType,
        },
        duration: Number(duration),
        isFeatured: false,
      });
      setShowAddModal(false);
      setName('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create service');
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to remove this service?')) {
      try {
        await serviceApi.deleteService(id);
        loadData();
      } catch (err) {
        alert('Failed to delete service');
      }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Catalogue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Offerings displayed to pet owners on the PETWO mobile marketplace
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      {/* Grid of services */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading service catalogue...</div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          <Scissors className="h-10 w-10 mx-auto text-gray-300 mb-2" />
          <h3 className="font-semibold text-gray-900">No Services Added Yet</h3>
          <p className="text-sm mt-1">Start by adding your first service to start accepting bookings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map(srv => (
            <div key={srv.id} className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-base leading-snug">{srv.name}</h3>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    srv.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {srv.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {srv.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{srv.description}</p>
                )}
              </div>

              <div className="mt-5 border-t pt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span>{srv.duration} mins</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-gray-900 text-sm">
                    <span>{formatCurrency(srv.price.amount)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(srv.id)}
                  className="text-gray-400 hover:text-red-600 transition p-1"
                  title="Remove Service"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Add New Service</h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Grooming & Tick Bath"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Category</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-primary"
                >
                  <option value="cat-veterinary">Veterinary Care</option>
                  <option value="cat-grooming">Pet Grooming & Spa</option>
                  <option value="cat-boarding">Boarding & Daycare</option>
                  <option value="cat-training">Pet Training</option>
                  <option value="cat-diagnostics">Diagnostics & Pathology</option>
                  <option value="cat-home-services">Home Visit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Price (INR ₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amountRupees}
                    onChange={e => setAmountRupees(Number(e.target.value))}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    required
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed description of what is included in this service..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
