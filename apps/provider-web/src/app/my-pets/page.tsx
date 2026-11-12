'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PawPrint, Plus, CalendarDays, LogOut, ShieldCheck, Syringe, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

type Pet = { id: string; name: string; species: string; breed: string; gender: string; dob?: string; weight?: number };
type Vaccination = { id: string; vaccineName: string; administeredAt: string; administeredBy?: string; nextDueAt?: string; notes?: string };
type VaccineSchedule = { name: string; frequency: string; mandatory: boolean; status: string };
type Passport = {
  passportNumber: string;
  healthStatus: string;
  vaccinationLedger: Vaccination[];
  upcomingVaccinationSchedule: VaccineSchedule[];
};

export default function MyPetsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('unknown');
  const [dob, setDob] = useState('');
  const [expandedPetId, setExpandedPetId] = useState<string | null>(null);
  const [passports, setPassports] = useState<Record<string, Passport>>({});
  const [passportLoadingId, setPassportLoadingId] = useState<string | null>(null);
  const [passportError, setPassportError] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const response = await apiClient.get('/pets');
      setPets(response.data?.data || []);
      setError('');
    } catch (cause: any) {
      setError(cause.message || 'Could not load pets.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace('/customer/login?next=/my-pets');
    else if (user) void load();
  }, [loading, user, router, load]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/pets', { name, species, breed, gender, ...(dob ? { dob } : {}) });
      setName('');
      setBreed('');
      setDob('');
      setForm(false);
      const next = new URLSearchParams(window.location.search).get('next');
      if (next && next.startsWith('/') && !next.startsWith('//')) router.push(next);
      else await load();
    } catch (cause: any) {
      setError(cause.message || 'Could not save pet.');
    } finally {
      setSaving(false);
    }
  }

  async function togglePassport(petId: string) {
    if (expandedPetId === petId) {
      setExpandedPetId(null);
      return;
    }
    setExpandedPetId(petId);
    setPassportError('');
    if (passports[petId]) return;
    setPassportLoadingId(petId);
    try {
      const response = await apiClient.get(`/health-passport/${encodeURIComponent(petId)}`);
      setPassports((current) => ({ ...current, [petId]: response.data?.data as Passport }));
    } catch (cause: any) {
      setPassportError(cause.message || 'Could not load the health passport.');
    } finally {
      setPassportLoadingId(null);
    }
  }

  if (loading || busy) return <main className="min-h-screen bg-[#f6faf8] p-10 text-center text-slate-500">Loading your pets…</main>;

  return (
    <main className="min-h-screen bg-[#f6faf8]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link href="/" className="font-extrabold text-teal-900">PETWO</Link>
          <button onClick={async () => { await signOut(); router.replace('/'); }} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Pet parent space</p>
            <h1 className="mt-2 text-3xl font-extrabold">Your pets</h1>
            <p className="mt-2 text-sm text-slate-500">Manage pet profiles, health passports and appointments.</p>
          </div>
          <button onClick={() => setForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white">
            <Plus className="h-4 w-4" /> Add a pet
          </button>
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        {form && (
          <form onSubmit={add} className="mt-6 grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-2">
            <label className="text-sm font-semibold">Pet name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border p-3" /></label>
            <label className="text-sm font-semibold">Species<select value={species} onChange={(event) => setSpecies(event.target.value)} className="mt-2 w-full rounded-lg border p-3">{['dog','cat','bird','rabbit','hamster','fish','reptile','other'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="text-sm font-semibold">Breed<input required value={breed} onChange={(event) => setBreed(event.target.value)} className="mt-2 w-full rounded-lg border p-3" /></label>
            <label className="text-sm font-semibold">Gender<select value={gender} onChange={(event) => setGender(event.target.value)} className="mt-2 w-full rounded-lg border p-3"><option value="unknown">Unknown</option><option value="male">Male</option><option value="female">Female</option></select></label>
            <label className="text-sm font-semibold">Date of birth (optional)<input type="date" value={dob} onChange={(event) => setDob(event.target.value)} className="mt-2 w-full rounded-lg border p-3" /></label>
            <div className="flex items-end gap-2">
              <button disabled={saving} className="rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white">{saving ? 'Saving…' : 'Save pet'}</button>
              <button type="button" onClick={() => setForm(false)} className="rounded-xl border px-5 py-3 text-sm font-bold">Cancel</button>
            </div>
          </form>
        )}

        {pets.length ? (
          <div className="mt-7 grid gap-4">
            {pets.map((pet) => (
              <article key={pet.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-teal-50 p-3 text-teal-800"><PawPrint /></div>
                    <div>
                      <h2 className="font-extrabold">{pet.name}</h2>
                      <p className="text-xs capitalize text-slate-500">{pet.species} · {pet.breed}</p>
                      <p className="mt-1 text-sm capitalize text-slate-500">{pet.gender}{pet.dob ? ' · Born ' + pet.dob : ''}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void togglePassport(pet.id)} className="inline-flex items-center gap-2 rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-bold text-teal-800 hover:bg-teal-50">
                      <ShieldCheck className="h-4 w-4" /> Health passport
                      {expandedPetId === pet.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <Link href="/my-bookings" className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-bold text-white">
                      <CalendarDays className="h-4 w-4" /> Appointments
                    </Link>
                  </div>
                </div>

                {expandedPetId === pet.id && (
                  <div className="mt-6 border-t pt-5">
                    {passportLoadingId === pet.id ? <p className="text-sm text-slate-500">Loading health passport from PETWO…</p> : null}
                    {passportError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{passportError}</p>}
                    {passports[pet.id] && (
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Digital health passport</p><p className="mt-1 text-sm font-extrabold text-slate-900">{passports[pet.id].passportNumber}</p></div>
                          <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800">{passports[pet.id].healthStatus}</span>
                        </div>
                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                          <section>
                            <h3 className="flex items-center gap-2 text-sm font-extrabold"><Syringe className="h-4 w-4 text-teal-700" /> Vaccination history</h3>
                            {passports[pet.id].vaccinationLedger.length ? <ul className="mt-3 space-y-2">{passports[pet.id].vaccinationLedger.map((vaccine) => <li key={vaccine.id} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-bold">{vaccine.vaccineName}</p><p className="mt-1 text-xs text-slate-500">Given {new Date(vaccine.administeredAt).toLocaleDateString('en-IN')}{vaccine.administeredBy ? ' · ' + vaccine.administeredBy : ''}</p>{vaccine.nextDueAt && <p className="mt-1 text-xs font-semibold text-teal-800">Next due: {new Date(vaccine.nextDueAt).toLocaleDateString('en-IN')}</p>}</li>)}</ul> : <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No vaccination records have been added yet.</p>}
                          </section>
                          <section>
                            <h3 className="text-sm font-extrabold">Recommended vaccine schedule</h3>
                            <ul className="mt-3 space-y-2">{passports[pet.id].upcomingVaccinationSchedule.map((vaccine) => <li key={vaccine.name} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold">{vaccine.name}</p><span className="text-[10px] font-bold text-teal-800">{vaccine.mandatory ? 'IMPORTANT' : 'OPTIONAL'}</span></div><p className="mt-1 text-xs text-slate-500">{vaccine.frequency} · {vaccine.status}</p></li>)}</ul>
                            <p className="mt-3 text-[11px] leading-5 text-slate-400">Suggested schedule from PETWO. Confirm timing with your veterinarian.</p>
                          </section>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-dashed bg-white px-6 py-14 text-center">
            <PawPrint className="mx-auto h-9 w-9 text-slate-300" />
            <h2 className="mt-3 font-bold">No pets added yet</h2>
            <p className="mt-2 text-sm text-slate-500">Add your pet’s details to continue to appointment booking.</p>
            <button onClick={() => setForm(true)} className="mt-5 rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white">Add your first pet</button>
          </div>
        )}
      </section>
    </main>
  );
}
