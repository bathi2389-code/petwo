'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BadgeCheck, MapPin, Search, ShieldCheck,
  SlidersHorizontal, Star, Stethoscope, RefreshCw, X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type Provider = {
  id: string;
  businessName: string;
  businessType?: string;
  description?: string;
  tagline?: string;
  logoURL?: string;
  coverPhotoURL?: string;
  address?: { line1?: string; city?: string; state?: string };
  rating?: number;
  reviewCount?: number;
  verificationStatus?: string;
  distanceKm?: number;
  isNewProvider?: boolean;
};

const categories = [
  { value: '', label: 'All care' },
  { value: 'veterinary_clinic', label: 'Veterinary clinics' },
  { value: 'veterinary_hospital', label: 'Hospitals' },
  { value: 'individual_vet', label: 'Veterinarians' },
  { value: 'grooming_salon', label: 'Grooming' },
  { value: 'physiotherapy_centre', label: 'Physiotherapy' },
  { value: 'boarding_facility', label: 'Boarding' },
  { value: 'daycare_facility', label: 'Daycare' },
  { value: 'diagnostic_centre', label: 'Diagnostics' },
  { value: 'pet_trainer', label: 'Training' },
  { value: 'pet_sitter', label: 'Pet sitting' },
  { value: 'pet_walker', label: 'Pet walking' },
];

const sortOptions = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'highest_rated', label: 'Highest rated' },
  { value: 'most_reviewed', label: 'Most reviewed' },
  { value: 'nearest', label: 'Nearest first' },
];

export default function CareDirectoryPage() {
  const [query, setQuery] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  const loadProviders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/providers/search', {
        params: {
          query: query.trim() || undefined,
          businessType: businessType || undefined,
          sortBy,
          ...(coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : {}),
          page: 1,
          limit: 30,
        },
      });
      const rows = response.data?.data;
      setProviders(Array.isArray(rows) ? rows : []);
      setTotal(Number(response.data?.meta?.total ?? (Array.isArray(rows) ? rows.length : 0)));
    } catch (problem: any) {
      setError(problem?.message || 'We could not load approved providers. Please check your connection and try again.');
      setProviders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [query, businessType, sortBy, coordinates]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadProviders(); }, query.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [loadProviders, query]);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationMessage('Location is not supported by this browser. You can still search by clinic or city.');
      return;
    }
    setLocationLoading(true);
    setLocationMessage('Waiting for location permission…');
    navigator.geolocation.getCurrentPosition(
      position => {
        setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationMessage('Nearby distances are now included. Recommendations still prioritize quality and feedback.');
        setLocationLoading(false);
      },
      err => {
        const message = err.code === 1
          ? 'Location permission was denied. You can continue searching without it.'
          : err.code === 2
            ? 'Your location could not be determined. Check device location services and try again.'
            : 'Location request timed out. Please try again.';
        setLocationMessage(message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  const clearFilters = () => {
    setQuery('');
    setBusinessType('');
    setSortBy('recommended');
  };

  return (
    <main className="min-h-screen bg-[#f5f8f7] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="PETWO home">
            <img src="/petwo-logo.svg" alt="PETWO" className="h-9 w-auto" />
            <span className="hidden border-l border-slate-200 pl-3 text-sm font-semibold text-slate-500 sm:inline">Care directory</span>
          </Link>
          <Link href="/" className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-teal-800 transition hover:bg-teal-50">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 lg:pt-14">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.14em] text-teal-800">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified care partners
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">Find care that feels right.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Explore approved pet-care providers. Compare their published ratings, feedback and location before choosing the next step for your pet.
            </p>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-white px-5 py-4 shadow-sm lg:min-w-[210px]">
            <p className="text-xs font-semibold text-slate-500">Approved providers listed</p>
            <p className="mt-1 text-3xl font-black tabular-nums text-teal-800">{loading ? '—' : total}</p>
            <p className="mt-1 text-[11px] text-slate-400">Live marketplace results</p>
          </div>
        </div>

        <div className="mt-9 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_210px]">
            <label className="flex h-12 min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-600/10">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <span className="sr-only">Search providers</span>
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search clinic, service or city…"
                className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"><X className="h-4 w-4" /></button>}
            </label>

            <label className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-teal-700" />
              <span className="sr-only">Filter by service</span>
              <select value={businessType} onChange={event => setBusinessType(event.target.value)} className="h-full w-full min-w-0 bg-transparent text-sm font-semibold text-slate-800 outline-none">
                {categories.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
            </label>

            <label className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500">
              <Star className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="sr-only">Sort providers</span>
              <select value={sortBy} onChange={event => setSortBy(event.target.value)} className="h-full w-full min-w-0 bg-transparent text-sm font-semibold text-slate-800 outline-none">
                {sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={requestLocation} disabled={locationLoading} className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-100 disabled:opacity-50">
                {locationLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                {coordinates ? 'Location enabled' : 'Use my location'}
              </button>
              {(query || businessType || sortBy !== 'recommended') && <button type="button" onClick={clearFilters} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800">Clear filters</button>}
            </div>
            <p role="status" className="text-xs text-slate-400">{locationMessage || 'Location is optional. Search works without sharing it.'}</p>
          </div>
        </div>

        <div className="mt-9 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-teal-700">Your matches</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Care providers</h2>
          </div>
          <p className="text-xs font-semibold text-slate-500">{loading ? 'Updating results…' : `${providers.length} shown`}</p>
        </div>

        {error && (
          <div role="alert" className="mt-5 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <button type="button" onClick={() => void loadProviders()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 font-bold text-rose-800 shadow-sm"><RefreshCw className="h-4 w-4" /> Try again</button>
          </div>
        )}

        {loading ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map(item => <div key={item} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5"><div className="h-28 animate-pulse rounded-2xl bg-slate-100" /><div className="mt-5 h-5 w-2/3 animate-pulse rounded bg-slate-100" /><div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-100" /><div className="mt-6 h-10 animate-pulse rounded-xl bg-slate-100" /></div>)}
          </div>
        ) : !error && providers.length > 0 ? (
          <div className="mt-5 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
            {providers.map(provider => (
              <article key={provider.id} className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/5">
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[#e6f4ee] to-[#f4f8f6]">
                  {provider.coverPhotoURL ? <img src={provider.coverPhotoURL} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Stethoscope className="h-10 w-10 text-teal-700/25" /></div>}
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-[10px] font-extrabold text-emerald-800 shadow-sm"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>
                  {provider.isNewProvider && <span className="absolute left-4 top-4 rounded-full bg-slate-900/80 px-3 py-1.5 text-[10px] font-bold text-white">New on PETWO</span>}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="-mt-10 mb-3 flex items-end justify-between">
                    <div className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-teal-50 shadow-sm">
                      {provider.logoURL ? <img src={provider.logoURL} alt={provider.businessName} className="h-full w-full object-cover" /> : <Stethoscope className="h-7 w-7 text-teal-800" />}
                    </div>
                  </div>
                  <h3 className="text-lg font-black leading-snug text-slate-950">{provider.businessName}</h3>
                  <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[.13em] text-teal-700">{(provider.businessType || 'pet care provider').replaceAll('_', ' ')}</p>
                  <p className="mt-3 min-h-[44px] text-sm leading-6 text-slate-600">{provider.tagline || provider.description || 'A verified pet-care partner on PETWO.'}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    {provider.address?.city && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{provider.address.city}{provider.address.state ? `, ${provider.address.state}` : ''}</span>}
                    <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />{typeof provider.rating === 'number' ? provider.rating.toFixed(1) : 'New'}{provider.reviewCount ? ` · ${provider.reviewCount} reviews` : ' · No reviews yet'}</span>
                    {typeof provider.distanceKm === 'number' && <span>{provider.distanceKm.toFixed(1)} km away</span>}
                  </div>
                  <Link href={'/care/' + encodeURIComponent(provider.id)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#087f70] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#066b60] focus:outline-none focus:ring-4 focus:ring-teal-600/20">
                    View provider profile <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : !error ? (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><Stethoscope className="h-7 w-7" /></div>
            <h3 className="mt-5 text-lg font-black text-slate-900">No matching providers yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Try a different service or search term. Only active, admin-approved providers are shown in this directory.</p>
            {(query || businessType) && <button type="button" onClick={clearFilters} className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-teal-800 hover:bg-teal-50">Clear search and filters</button>}
          </div>
        ) : null}

        <p className="mt-8 text-xs leading-5 text-slate-400">PETWO displays providers only after admin approval. Provider ratings are shown only when published review data is available; new providers are not assigned invented ratings.</p>
      </section>
    </main>
  );
}
