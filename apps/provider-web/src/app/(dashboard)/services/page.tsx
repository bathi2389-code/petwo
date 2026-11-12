'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Scissors, Clock3, Trash2, X, MapPin, AlertCircle, RefreshCw, CheckCircle2, IndianRupee } from 'lucide-react';
import { serviceApi, providerApi } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import type { Service, Provider } from '@petwo/shared';

type LocationOption = { id: string; name?: string; address?: { line1?: string; city?: string } };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState(800);
  const [duration, setDuration] = useState(45);
  const [priceType, setPriceType] = useState<'fixed' | 'starting_from'>('fixed');
  const [categoryId, setCategoryId] = useState('cat-veterinary');
  const [locationId, setLocationId] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [srvRes, provRes, locRes] = await Promise.all([
        serviceApi.getServices(),
        providerApi.getProfile(),
        providerApi.getLocations(),
      ]);
      setServices(Array.isArray(srvRes.data?.data) ? srvRes.data.data : []);
      setProvider(provRes.data?.data ?? null);
      const rows: LocationOption[] = Array.isArray(locRes.data?.data) ? locRes.data.data : [];
      setLocations(rows);
      setLocationId(current => current || rows[0]?.id || '');
    } catch (problem: any) {
      setError(problem?.message || 'We could not load your service catalogue. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  async function handleCreateService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!locationId) {
      setError('Add a business location before publishing a service.');
      return;
    }
    setSaving(true);
    try {
      await serviceApi.createService({
        locationId,
        categoryId,
        name: name.trim(),
        description: description.trim(),
        price: { amount: Math.round(amountRupees * 100), currency: 'INR', priceType },
        duration: Number(duration),
        isFeatured: false,
      });
      setShowAddModal(false);
      setName('');
      setDescription('');
      setAmountRupees(800);
      setDuration(45);
      setSuccess('Service added to your catalogue.');
      await loadData();
    } catch (problem: any) {
      setError(problem?.message || 'The service could not be saved. Check the details and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this service from your catalogue?')) return;
    setDeletingId(id);
    setError('');
    setSuccess('');
    try {
      await serviceApi.deleteService(id);
      setServices(current => current.filter(service => service.id !== id));
      setSuccess('Service removed.');
    } catch (problem: any) {
      setError(problem?.message || 'The service could not be removed. Please try again.');
    } finally {
      setDeletingId('');
    }
  }

  const activeCount = services.filter(service => service.isActive).length;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-700">Your offerings</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Services catalogue</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Create clear service listings that pet parents can understand and book. Keep prices, duration and location accurate.</p>
        </div>
        <button type="button" onClick={() => { setError(''); setShowAddModal(true); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-teal-900">
          <Plus className="h-4 w-4" /> Add a service
        </button>
      </section>

      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p className="flex-1">{error}</p><button type="button" onClick={() => void loadData()} className="font-bold underline">Retry</button></div>}
      {success && <div role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />{success}</div>}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total services</p><p className="mt-2 text-3xl font-black text-slate-950">{loading ? '—' : services.length}</p><p className="mt-1 text-xs text-slate-400">In your catalogue</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Active listings</p><p className="mt-2 text-3xl font-black text-emerald-700">{loading ? '—' : activeCount}</p><p className="mt-1 text-xs text-slate-400">Marked active by PETWO</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Business locations</p><p className="mt-2 text-3xl font-black text-slate-950">{loading ? '—' : locations.length}</p><p className="mt-1 text-xs text-slate-400">Available service locations</p></article>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-950">Published services</h2><p className="mt-1 text-xs text-slate-500">These are the services configured in your provider account.</p></div><button type="button" onClick={() => void loadData()} disabled={loading} aria-label="Refresh services" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button></div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0,1,2].map(item => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" /><div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-100" /><div className="mt-8 h-10 animate-pulse rounded bg-slate-100" /></div>)}</div>
        ) : services.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><Scissors className="h-7 w-7" /></div>
            <h3 className="mt-4 text-lg font-extrabold text-slate-950">Your catalogue is ready for its first service</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Add a service with a clear name, price, duration and business location. It can then be reviewed for customer discovery.</p>
            <button type="button" onClick={() => setShowAddModal(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Add your first service</button>
          </div>
        ) : (
          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map(service => (
              <article key={service.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><Scissors className="h-5 w-5" /></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${service.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{service.isActive ? 'Active' : 'Inactive'}</span></div>
                <h3 className="mt-5 break-words text-base font-extrabold text-slate-950">{service.name}</h3>
                <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">{service.description || 'No description added yet.'}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600"><span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-slate-400" />{service.duration} min</span><span className="inline-flex items-center gap-1.5 text-slate-900"><IndianRupee className="h-4 w-4 text-teal-700" />{formatCurrency(service.price.amount)}</span></div>
                <button type="button" disabled={deletingId === service.id} onClick={() => void handleDelete(service.id)} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-100 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />{deletingId === service.id ? 'Removing…' : 'Remove service'}</button>
              </article>
            ))}
          </div>
        )}
      </section>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setShowAddModal(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="add-service-title" className="my-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">Service setup</p><h2 id="add-service-title" className="mt-1 text-xl font-black text-slate-950">Add a new service</h2><p className="mt-1 text-xs text-slate-500">Fields marked required must be completed.</p></div><button type="button" disabled={saving} onClick={() => setShowAddModal(false)} aria-label="Close dialog" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleCreateService} className="mt-5 space-y-4">
              <label className="block text-sm font-bold text-slate-700">Service name <span className="text-rose-600">*</span><input required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Full grooming and tick bath" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10" /></label>
              <label className="block text-sm font-bold text-slate-700">Service category<select value={categoryId} onChange={event => setCategoryId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"><option value="cat-veterinary">Veterinary care</option><option value="cat-grooming">Pet grooming & spa</option><option value="cat-boarding">Boarding & daycare</option><option value="cat-training">Pet training</option><option value="cat-diagnostics">Diagnostics & pathology</option><option value="cat-home-services">Home visit</option></select></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-slate-700">Price (₹) <span className="text-rose-600">*</span><input type="number" min="1" step="1" required value={amountRupees} onChange={event => setAmountRupees(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10" /></label><label className="block text-sm font-bold text-slate-700">Duration (minutes) <span className="text-rose-600">*</span><input type="number" min="10" step="5" required value={duration} onChange={event => setDuration(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10" /></label></div>
              <label className="block text-sm font-bold text-slate-700">Price type<select value={priceType} onChange={event => setPriceType(event.target.value as 'fixed' | 'starting_from')} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"><option value="fixed">Fixed price</option><option value="starting_from">Starting from</option></select></label>
              <label className="block text-sm font-bold text-slate-700">Business location <span className="text-rose-600">*</span><select required value={locationId} onChange={event => setLocationId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"><option value="">Choose a location</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name || location.address?.line1 || location.id}{location.address?.city ? ` · ${location.address.city}` : ''}</option>)}</select>{locations.length === 0 && <span className="mt-1 block text-xs font-medium text-amber-700">Add a business location to your provider profile before creating a service.</span>}</label>
              <label className="block text-sm font-bold text-slate-700">Description<textarea rows={3} maxLength={1000} value={description} onChange={event => setDescription(event.target.value)} placeholder="Explain what is included in this service…" className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10" /></label>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={() => setShowAddModal(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving || !locations.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-teal-900 disabled:opacity-50">{saving ? 'Saving service…' : 'Save service'}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
