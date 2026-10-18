'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldCheck, LayoutDashboard, Users, Key, CreditCard, Sliders, 
  Database, FileText, LogOut, ExternalLink, Settings, KeyRound,
  AlertTriangle, X, CheckCircle2, AlertCircle, Lock, Mail
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, refreshUser } = useAuth();

  // In-dashboard password rotation modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

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

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (newPassword !== confirmPassword) {
      setModalError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setModalError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword === '123456789') {
      setModalError('Cannot reuse the temporary setup password.');
      return;
    }

    setModalLoading(true);
    try {
      await api.adminChangePassword({
        email: user?.email || undefined,
        current_password: currentPassword,
        new_password: newPassword,
      });

      setModalSuccess('Password changed successfully! Your new password is now active.');
      await refreshUser();
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setModalSuccess('');
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || 'Failed to update permanent password. Verify current password.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('fi_access_token');
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Access Control (RBAC)', href: '/admin/access-control', icon: Key },
    { label: 'Financials & Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Paystack Gateway', href: '/admin/settings/payments', icon: Sliders },
    { label: 'Email & SMTP Setup', href: '/admin/settings/email', icon: Mail },
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

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 font-medium transition"
              title="Change Password"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
            <button
              onClick={handleAdminLogout}
              className="text-red-400 hover:text-red-300 flex items-center space-x-1 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <Link href="/" target="_blank" className="text-slate-400 hover:text-white flex items-center justify-between text-xs transition">
              <span>View Public App</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Administrative Viewport */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl">
        {/* Temporary Password Rotation Banner */}
        {user?.must_change_password && (
          <div className="mb-6 bg-gradient-to-r from-amber-950/80 to-amber-900/60 border border-amber-600/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-md">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">Temporary Bootstrap Password In Use</h4>
                <p className="text-xs text-amber-200/90 mt-0.5">
                  Your administrator account is currently using temporary credentials (<code className="text-amber-300">123456789</code>). You can establish your permanent password here at any time.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition shrink-0 flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Set Permanent Password</span>
            </button>
          </div>
        )}

        {children}
      </main>

      {/* In-Dashboard Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Update Administrator Password</h3>
                  <p className="text-xs text-slate-400">Establish permanent credentials for {user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="bg-red-950/80 border border-red-500 text-red-200 px-3.5 py-2.5 rounded-lg text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-3.5 py-2.5 rounded-lg text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Current Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (e.g. 123456789)"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  New Permanent Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-forest-600 hover:bg-forest-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <span>{modalLoading ? 'Updating...' : 'Save New Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
