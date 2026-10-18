'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sprout, KeyRound, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [sandboxCode, setSandboxCode] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    try {
      const res = await api.forgotPassword({ email: email.trim().toLowerCase() });
      setMsg(res.message || 'Verification code has been dispatched.');
      if (res.dev_otp) {
        setSandboxCode(res.dev_otp);
        setOtp(res.dev_otp);
      }
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
    setMsg('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        new_password: newPassword,
      });

      setMsg(res.message || 'Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-forest-900 flex items-center justify-center text-white font-bold shadow-sm">
            <Sprout className="w-6 h-6 text-forest-300" />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            Farm<span className="text-forest-600">Intelligence</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Reset Account Password</h2>
        <p className="mt-1 text-sm text-gray-600">
          Recover your farm account and regain access to your seasonal intelligence.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {msg && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{msg}</span>
            </div>
          )}

          {sandboxCode && (
            <div className="mb-5 bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Sandbox Verification Code:</span>
              </div>
              <p className="text-amber-800">
                Live SMTP is not yet configured. Your verification code is:{' '}
                <strong className="font-mono text-sm bg-white px-2 py-0.5 rounded border border-amber-300 tracking-wider">
                  {sandboxCode}
                </strong>
              </p>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Account Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  We will send a 6-digit verification code to this address.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest-600 hover:bg-forest-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
              >
                <span>{loading ? 'Dispatching Code...' : 'Send Recovery Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs flex justify-between items-center text-gray-700">
                <span className="truncate">Email: <strong>{email}</strong></span>
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-forest-700 hover:underline font-semibold text-[11px] shrink-0 ml-2"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  6-Digit Verification Code
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your new password"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest-600 hover:bg-forest-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
              >
                <span>{loading ? 'Updating Password...' : 'Save Password & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-gray-200 pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-forest-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
