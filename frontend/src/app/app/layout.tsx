'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sprout, Home, MapPin, Compass, FileText, Settings, User as UserIcon, LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function FarmerAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/app', icon: Home },
    { label: 'My Farms', href: '/app/farms', icon: MapPin },
    { label: 'Crop Planner', href: '/app/crop-planner', icon: Compass },
    { label: 'Billing', href: '/app/settings/billing', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-16 md:pb-0">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/app" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-forest-900 flex items-center justify-center text-white">
              <Sprout className="w-4 h-4 text-forest-300" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Farm<span className="text-forest-600">Intelligence</span></span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 py-1 px-2.5 rounded-lg transition ${
                    isActive ? 'text-forest-900 bg-forest-50 font-semibold' : 'hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Pill */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="text-right hidden sm:block">
              <div className="font-semibold text-gray-800">{user?.full_name || 'Farmer'}</div>
              <div className="text-gray-500">{user?.email || ''}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation (PRD Section 14) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex items-center justify-around h-16 shadow-lg px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                isActive ? 'text-forest-900 font-bold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-forest-900' : 'text-gray-400'}`} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
