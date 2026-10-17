'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('ologunemmanuel2015@gmail.com');
  const [password, setPassword] = useState('123456789');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.adminLogin({ email, password });
      
      if (res.access_token && res.user) {
        login(res.access_token, res.user);
        router.push('/admin');
        return;
      }

      setError('Authentication failed. Please verify administrator credentials.');
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-forest-600 flex items-center justify-center mx-auto text-white shadow-lg mb-3">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Super Admin Console
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Farm Intelligence Operations & Control Center
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-2xl border border-slate-700 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 bg-red-950/80 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Admin Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">
                  Initial temp: <code className="text-forest-400">123456789</code>
                </span>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-600 hover:bg-forest-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Admin Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition">
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
