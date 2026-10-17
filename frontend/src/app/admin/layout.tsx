'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldCheck, LayoutDashboard, Users, Key, CreditCard, Sliders, 
  Sprout, Database, FileText, LogOut, ExternalLink, Settings
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Route protection
  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (pathname !== '/admin/login' && pathname !== '/admin/forgot-password') {
          router.push('/admin/login');
        }
      } else if (!user.is_admin) {
        router.push('/app');
      }
    }
  }, [user, loading, pathname, router]);

  if (pathname === '/admin/login' || pathname === '/admin/forgot-password') {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Access Control (RBAC)', href: '/admin/access-control', icon: Key },
    { label: 'Financials & Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Paystack Gateway', href: '/admin/settings/payments', icon: Sliders },
    { label: 'Subscription Tiers', href: '/admin/subscriptions', icon: Settings },
    { label: 'Data Sources Registry', href: '/admin/data-sources', icon: Database },
    { label: 'Security Audit Logs', href: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Title */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center text-white shadow-sm font-bold">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-white block">
                Farm<span className="text-forest-400">Admin</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">Super Admin Console</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg font-medium transition ${
                    isActive
                      ? 'bg-forest-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Active Admin Identity */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 text-xs">
            <div className="text-[11px] text-slate-400">Authenticated Administrator:</div>
            <div className="font-semibold text-white truncate">{user?.email || 'Admin'}</div>
            <div className="text-[10px] text-forest-400 font-bold uppercase mt-0.5">
              Role: Super Admin
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <Link href="/" target="_blank" className="text-slate-400 hover:text-white flex items-center space-x-1">
              <span>View Public App</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={logout}
              className="text-red-400 hover:text-red-300 flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Administrative Viewport */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
