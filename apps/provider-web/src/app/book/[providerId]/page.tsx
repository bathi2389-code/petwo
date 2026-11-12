'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, PawPrint } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

type Provider = { id: string; businessName: string };
type Service = { id: string; name: string; duration: number; price: { amount: number }; locationId: string; allowedPetSpecies?: string[] };
type Pet = { id: string; name: string; species: string };

export default function BookingPage() {
  const { providerId } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [petId, setPetId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/customer/login?next=' + encodeURIComponent('/book/' + providerId));
      return;
    }

    let cancelled = false;
    async function verifyCustomerAndLoad() {
      try {
        const identity = await apiClient.get('/auth/me');
        const role = identity.data?.data?.role;
        if (role !== 'customer') {
          if (role === 'provider') {
            router.replace('/overview');
            return;
          }
          throw new Error('This account is not registered as a pet-parent account. Please use the correct PETWO portal.');
        }

        const [providerResponse, serviceResponse, petResponse] = await Promise.all([
          apiClient.get('/providers/' + providerId),
          apiClient.get('/services', { params: { providerId, limit: 50 } }),
          apiClient.get('/pets'),
        ]);
        if (cancelled) return;
        setProvider(providerResponse.data.data);
        const serviceRows: Service[] = serviceResponse.data?.data || [];
        setServices(serviceRows);
        setServiceId(serviceRows[0]?.id || '');
        const petRows: Pet[] = petResponse.data?.data || [];
        setPets(petRows);
        setPetId(petRows[0]?.id || '');
      } catch (problem: any) {
        if (!cancelled) setError(problem?.message || 'Could not load booking details.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void verifyCustomerAndLoad();
    return () => { cancelled = true; };
  }, [loading, user, providerId, router]);

  const selected = services.find(service => service.id === serviceId);
  const compatiblePets = pets.filter(pet => !selected?.allowedPetSpecies?.length || selected.allowedPetSpecies.includes(pet.species));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!selected || !petId || !date || !time) {
      setError('Choose a service, pet, date and time.');
      return;
    }
    const scheduled = new Date(date + 'T' + time);
    if (Number.isNaN(scheduled.getTime()) || scheduled <= new Date()) {
      setError('Choose a future date and time.');
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.post('/bookings', {
        petId,
        providerId: String(providerId),
        locationId: selected.locationId,
        serviceId: selected.id,
        bookingType: 'appointment',
        scheduledAt: scheduled.toISOString(),
        notes,
      });
      setSuccess('Booking request created. Reference: ' + (response.data?.data?.bookingNumber || response.data?.data?.id));
    } catch (problem: any) {
      setError(problem?.message || 'Booking could not be created. Please choose another slot or contact the clinic.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || busy) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f6faf8] px-5 text-sm font-semibold text-slate-500">Checking your PETWO account…</main>;
  }

  if (error && !provider) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6faf8] px-5 py-10">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><PawPrint className="h-7 w-7" /></div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">Customer access required</h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/care" className="rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white">Back to care directory</Link>
            <Link href="/login" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">Provider sign in</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6faf8]">
      <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <Link href={'/care/' + providerId} className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 hover:text-teal-950"><ArrowLeft className="h-4 w-4" /> Provider profile</Link>
        <div className="mt-6">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-700">Pet parent booking</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Book an appointment</h1>
          <p className="mt-2 text-slate-500">{provider?.businessName || 'PETWO provider'}</p>
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

        {success ? (
          <section className="mt-7 rounded-3xl border border-emerald-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-7 w-7" /></div>
            <h2 className="mt-4 text-xl font-extrabold text-slate-950">Request submitted</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{success}. The clinic needs to confirm your appointment.</p>
            <Link href="/my-bookings" className="mt-6 inline-flex rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white">Track appointment</Link>
          </section>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {services.length ? (
              <label className="block text-sm font-bold text-slate-700">Choose service
                <select required value={serviceId} onChange={event => setServiceId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10">
                  {services.map(service => <option key={service.id} value={service.id}>{service.name} · ₹{(service.price.amount / 100).toLocaleString('en-IN')} · {service.duration || 60} min</option>)}
                </select>
              </label>
            ) : <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">This provider has not published any bookable services yet.</p>}

            {pets.length ? (
              <label className="block text-sm font-bold text-slate-700">Choose your pet
                <select required value={petId} onChange={event => setPetId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10">
                  {compatiblePets.map(pet => <option key={pet.id} value={pet.id}>{pet.name} · {pet.species}</option>)}
                </select>
              </label>
            ) : <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Add a pet profile before booking. <Link href={'/my-pets?next=' + encodeURIComponent('/book/' + String(providerId))} className="font-bold underline">Manage pets</Link></div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">Appointment date
                <input required type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={event => setDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10" />
              </label>
              <label className="block text-sm font-bold text-slate-700">Preferred time
                <input required type="time" value={time} onChange={event => setTime(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10" />
              </label>
            </div>

            <label className="block text-sm font-bold text-slate-700">Notes for the clinic (optional)
              <textarea rows={4} maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10" placeholder="Share symptoms or anything the clinic should know." />
            </label>

            {selected && !selected.locationId && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">This service is missing a clinic location in its provider setup. Please contact the clinic to complete its listing.</p>}
            {selected && <div className="rounded-2xl bg-teal-50 p-4 text-sm text-teal-900">Estimated service fee: <strong>₹{(selected.price.amount / 100).toLocaleString('en-IN')}</strong>. Taxes and final amount are calculated by PETWO when the request is submitted.</div>}
            <button disabled={saving || !services.length || !pets.length || !compatiblePets.length || !selected?.locationId} className="w-full rounded-xl bg-teal-800 py-4 text-sm font-extrabold text-white shadow-lg shadow-teal-900/10 transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Submitting request…' : 'Request appointment'}</button>
            <p className="text-xs leading-5 text-slate-400">This submits an appointment request; it does not take payment. Slot availability is validated by the PETWO API.</p>
          </form>
        )}
      </div>
    </main>
  );
}
