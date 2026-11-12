import Link from 'next/link';
import {
  ArrowRight, CalendarCheck, HeartHandshake, MapPin, PawPrint,
  ShieldCheck, Star, Stethoscope, Scissors, Activity, Home as HomeIcon,
  CheckCircle2, Sparkles,
} from 'lucide-react';

const careCategories = [
  { icon: Stethoscope, title: 'Vet & hospital care', description: 'Find veterinary clinics and hospitals for everyday care and medical support.', href: '/care', tone: 'bg-[#e6f5ef] text-[#087f70]' },
  { icon: Scissors, title: 'Grooming & bathing', description: 'Discover grooming professionals to help your pet look and feel their best.', href: '/care', tone: 'bg-[#fff1df] text-[#a85b16]' },
  { icon: Activity, title: 'Physiotherapy', description: 'Explore movement, recovery and mobility-focused pet care providers.', href: '/care', tone: 'bg-[#edf0ff] text-[#5864b7]' },
  { icon: HomeIcon, title: 'Boarding & daycare', description: 'Look for care options when your pet needs a safe place away from home.', href: '/care', tone: 'bg-[#f8eafa] text-[#9252a0]' },
];

const steps = [
  { number: '01', title: 'Explore care', description: 'Search providers and compare the information available on their profiles.' },
  { number: '02', title: 'Choose with confidence', description: 'Review ratings, feedback and location before deciding who to contact.' },
  { number: '03', title: 'Request a visit', description: 'Continue to the provider profile and follow the available booking steps.' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf8] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="PETWO home" className="shrink-0"><img src="/petwo-logo.svg" alt="PETWO" className="h-10 w-auto" /></Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#care" className="transition hover:text-teal-800">Explore care</a>
            <a href="#how-it-works" className="transition hover:text-teal-800">How it works</a>
            <a href="#partners" className="transition hover:text-teal-800">For providers</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/customer/login" className="hidden rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 sm:inline-flex">Sign in</Link>
            <Link href="/customer/register" className="inline-flex items-center rounded-xl bg-[#087f70] px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-[#066b60]">Join PETWO <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:pb-28 lg:pt-20">
        <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-xs font-extrabold tracking-wide text-teal-800 shadow-sm">
            <PawPrint className="h-4 w-4" /> A little more love in every visit
          </div>
          <h1 className="max-w-2xl text-5xl font-black leading-[1.04] tracking-tight text-slate-950 sm:text-6xl xl:text-[4.5rem]">
            Better pet care.
            <span className="block text-[#078573]">Happier every day.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            From vet visits to grooming and physiotherapy, discover pet-care providers and find the right next step for your furry family.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/care" className="inline-flex items-center justify-center rounded-xl bg-[#087f70] px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-[#066b60]">Explore pet care <ArrowRight className="ml-2 h-4 w-4" /></Link>
            <Link href="/customer/register" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-extrabold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50">Create pet-parent account</Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-700" /> Approved providers</span>
            <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Ratings & feedback</span>
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-700" /> Nearby care discovery</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-100 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-teal-200/60 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white bg-[#e5f3ed] p-5 shadow-[0_35px_90px_-35px_rgba(8,87,75,0.35)] sm:p-8">
            <img src="/pet-care-illustration.svg" alt="A friendly dog and cat with pet-care essentials" className="mx-auto aspect-[4/3] w-full object-contain" />
            <div className="mx-auto mt-1 max-w-sm rounded-2xl border border-white/80 bg-white/95 p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><HeartHandshake className="h-5 w-5" /></div>
                <div><p className="text-sm font-extrabold text-slate-900">Care that puts pets first</p><p className="mt-1 text-xs text-slate-500">Explore options for every stage of their journey</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="care" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-700">Explore PETWO</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Care for every kind of paw.</h2><p className="mt-4 leading-7 text-slate-600">Start with the service your pet needs. You can explore listed providers and the details available on each profile.</p></div>
            <Link href="/care" className="inline-flex items-center gap-2 text-sm font-extrabold text-teal-800 hover:text-teal-950">Browse all providers <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {careCategories.map(({ icon: Icon, title, description, href, tone }) => (
              <Link key={title} href={href} className="group rounded-3xl border border-slate-100 bg-[#fbfdfc] p-6 transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5 focus:outline-none focus:ring-4 focus:ring-teal-600/20">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-6 w-6" /></div>
                <h3 className="mt-6 flex items-center justify-between gap-2 text-base font-extrabold">{title}<ArrowRight className="h-4 w-4 shrink-0 text-teal-700 transition group-hover:translate-x-1" /></h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                <span className="mt-5 inline-flex text-xs font-extrabold text-teal-800">Explore providers <ArrowRight className="ml-1 h-3.5 w-3.5" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-700">A simpler way to start</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">From search to the next step.</h2><p className="mt-4 leading-7 text-slate-600">A clear path for pet parents to explore care and connect with providers.</p></div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map(step => <article key={step.number} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><span className="text-xs font-black tracking-[.2em] text-teal-700">{step.number}</span><h3 className="mt-5 text-lg font-extrabold">{step.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p></article>)}
        </div>
      </section>

      <section id="partners" className="mx-5 mb-16 overflow-hidden rounded-[2rem] bg-[#073f3d] px-6 py-12 text-white sm:mx-8 sm:px-12 lg:mx-auto lg:max-w-7xl lg:py-16">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#9be4ce]">For clinics & care teams</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Care for pets? Grow with PETWO.</h2><p className="mt-4 leading-7 text-teal-50/75">Create a provider profile, submit your business details and manage your care services through the partner workspace.</p></div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-4 text-sm font-extrabold text-teal-900 transition hover:-translate-y-0.5 hover:bg-teal-50">Join as a provider <ArrowRight className="ml-2 h-4 w-4" /></Link><Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-4 text-sm font-extrabold text-white transition hover:bg-white/10">Provider sign in</Link></div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 pb-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>© {new Date().getFullYear()} PETWO. Made for every paw.</span>
        <div className="flex flex-wrap gap-4"><Link href="/customer/login" className="hover:text-teal-800">Pet parent sign in</Link><Link href="/login" className="hover:text-teal-800">Provider sign in</Link><span>Pet care, connected with care.</span></div>
      </footer>
    </main>
  );
}
