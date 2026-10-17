'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      setMsg(res.message);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password recovery challenge.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.resetPassword({
        email,
        otp,
        new_password: newPassword
      });
      setMsg(res.message);
      setTimeout(() => {
        router.push('/admin/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-forest-600 flex items-center justify-center mx-auto text-white shadow-lg mb-3">
          <KeyRound className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Admin Password Recovery
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Cryptographically Secure Single-Use OTP • PRD Addendum Sec. 5
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

          {msg && (
            <div className="mb-4 bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-lg text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{msg}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  Registered Admin Email
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
                    placeholder="admin@farmintelligence.africa"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-forest-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest-600 hover:bg-forest-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition"
              >
                {loading ? 'Dispatching Challenge...' : 'Send Recovery OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  className="mt-1 block w-full py-2.5 text-center font-mono tracking-widest text-lg bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="mt-1 block w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest-600 hover:bg-forest-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition"
              >
                {loading ? 'Updating Password...' : 'Reset Password & Proceed to Login'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <Link href="/admin/login" className="text-xs text-slate-400 hover:text-white transition">
              ← Return to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
