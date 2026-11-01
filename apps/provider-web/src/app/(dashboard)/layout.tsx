'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Scissors, MapPin, Users,
  IndianRupee, Star, Settings, LogOut, Bell, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/overview',   label: 'Overview',   icon: LayoutDashboard },
  { href: '/bookings',   label: 'Bookings',   icon: Calendar },
  { href: '/services',   label: 'Services',   icon: Scissors },
  { href: '/locations',  label: 'Locations',  icon: MapPin },
  { href: '/staff',      label: 'Staff',      icon: Users },
  { href: '/earnings',   label: 'Earnings',   icon: IndianRupee },
  { href: '/reviews',    label: 'Reviews',    icon: Star },
  { href: '/settings',   label: 'Settings',   icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out',
          'lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <Link href="/overview" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
              P
            </div>
            <span className="font-bold text-lg text-gray-900">PETCO</span>
            <span className="text-xs text-muted-foreground">Provider</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname?.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User footer */}
        <div className="border-t px-3 py-4">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <button className="relative text-gray-400 hover:text-gray-600">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                {user.displayName?.[0]?.toUpperCase() ?? 'P'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                <p className="text-xs text-gray-500">Provider</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
