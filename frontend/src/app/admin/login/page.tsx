'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  // Step tracking: 'credentials' | 'otp' | 'mandatory_password_change'
  const [step, setStep] = useState<'credentials' | 'otp' | 'mandatory_password_change'>('credentials');
  
  const [email, setEmail] = useState('ologunemmanuel2015@gmail.com');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // Password change fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Submit Credentials
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.adminLogin({ email, password });
      if (res.requires_otp) {
        setStep('otp');
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.adminVerifyOtp({ email, otp });
      login(res.access_token, res.user);

      if (res.user.must_change_password) {
        setStep('mandatory_password_change');
        setSuccessMsg('Initial setup: You must establish a new permanent password to secure your Super Admin account.');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Mandatory Password Rotation
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword === '123456789') {
      setError('Cannot reuse temporary bootstrap password.');
      return;
    }

    setLoading(true);
    try {
      await api.adminChangePassword({
        email,
        current_password: password,
        new_password: newPassword
      });
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to update permanent password.');
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
          Strict Role-Based Access Control • PRD Addendum Sec. 4
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

          {successMsg && (
            <div className="mb-4 bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-lg text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step 1: Credentials Form */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialSubmit} className="space-y-5">
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
                  <Link href="/admin/forgot-password" className="text-xs text-forest-400 hover:underline">
                    Forgot password?
                  </Link>
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
                <span>{loading ? 'Validating...' : 'Verify Credentials →'}</span>
              </button>
            </form>
          )}

          {/* Step 2: Email OTP Form */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="text-center space-y-1">
                <KeyRound className="w-8 h-8 text-forest-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">Enter Email OTP Challenge</h3>
                <p className="text-xs text-slate-400">
                  A 6-digit code was sent to <strong className="text-slate-200">{email}</strong>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="block w-full py-3 text-center tracking-[10px] text-2xl font-mono bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2.5 rounded-lg font-medium transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-2/3 bg-forest-600 hover:bg-forest-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                >
                  <span>{loading ? 'Verifying OTP...' : 'Authenticate'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Mandatory Initial Password Change */}
          {step === 'mandatory_password_change' && (
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-amber-400 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  Mandatory Security Rotation
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  The initial bootstrap password must be replaced with your permanent credentials before dashboard access is permitted.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  New Permanent Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  Confirm Permanent Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition text-sm disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Securing Account...' : 'Set Permanent Password & Enter Dashboard'}</span>
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition">
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
