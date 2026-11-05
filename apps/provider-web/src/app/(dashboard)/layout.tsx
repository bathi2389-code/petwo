'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Calendar, Scissors, IndianRupee, Star,
  LogOut, Menu, X, PawPrint, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/services', label: 'Services', icon: Scissors },
  { href: '/earnings', label: 'Earnings', icon: IndianRupee },
  { href: '/reviews', label: 'Reviews', icon: Star },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    let active = true;
    if (loading) return;
    if (!user) {
      router.replace('/login');
      setCheckingRole(false);
      return;
    }
    apiClient.get('/auth/me')
      .then(({ data }) => {
        if (active && data?.data?.role !== 'provider') router.replace('/my-pets');
      })
      .catch(() => {
        if (active) router.replace('/login');
      })
      .finally(() => { if (active) setCheckingRole(false); });
    return () => { active = false; };
  }, [user, loading, router]);

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  if (loading || checkingRole) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f6faf8]">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
    </div>;
  }
  if (!user) return null;

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#f6faf8]">
      {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
          <Link href="/overview" className="flex items-center gap-3" aria-label="PETWO provider dashboard">
            <img src="/petwo-logo.svg" alt="PETWO" className="h-10 w-auto" />
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-800">Partner</span>
          </Link>
          <button aria-label="Close menu" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-5 pb-2 pt-7">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p>
        </div>
        <nav aria-label="Provider navigation" className="flex-1 space-y-1 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + '/');
            return <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={cn('group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition',
                active ? 'bg-teal-800 text-white shadow-md shadow-teal-900/15' : 'text-slate-600 hover:bg-teal-50 hover:text-teal-900')}>
              <Icon className={cn('h-[18px] w-[18px]', active ? 'text-teal-100' : 'text-slate-400 group-hover:text-teal-700')} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-4 w-4 text-teal-100" />}
            </Link>;
          })}
        </nav>
        <div className="m-4 rounded-2xl bg-gradient-to-br from-teal-900 to-teal-700 p-4 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15"><PawPrint className="h-5 w-5" /></div>
          <p className="mt-3 text-sm font-bold">Care starts here.</p>
          <p className="mt-1 text-xs leading-5 text-teal-50/75">Thank you for being part of the PETWO care network.</p>
        </div>
        <div className="border-t border-slate-100 p-3">
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <button aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"><Menu className="h-5 w-5" /></button>
            <div>
              <p className="text-xs font-medium text-slate-400">PETWO / Partner workspace</p>
              <p className="text-sm font-bold text-slate-800">Good to see you{user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-xs font-bold text-slate-800">{user.displayName || 'Provider account'}</p><p className="text-[11px] text-slate-400">Verified account access</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-extrabold text-teal-900">{user.displayName?.[0]?.toUpperCase() || 'P'}</div>
          </div>
        </header>
        <main className="w-full flex-1 overflow-y-auto px-4 py-6 sm:px-7 sm:py-8 xl:px-10">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
