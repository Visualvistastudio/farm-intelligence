'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Key, CheckCircle2, AlertCircle, RefreshCw, CreditCard } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify both fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess(res.message || 'Your password has been updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-forest-700" />
          <span>Account Settings</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage your account credentials, security preferences, and subscription.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 text-sm font-semibold">
        <Link
          href="/app/settings/billing"
          className="pb-3 text-gray-500 hover:text-gray-900 flex items-center space-x-1.5 transition"
        >
          <CreditCard className="w-4 h-4" />
          <span>Subscription & Billing</span>
        </Link>
        <Link
          href="/app/settings/security"
          className="pb-3 border-b-2 border-forest-700 text-forest-800 flex items-center space-x-1.5"
        >
          <Lock className="w-4 h-4 text-forest-700" />
          <span>Password & Security</span>
        </Link>
      </div>

      {/* Security Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
            <Key className="w-4 h-4 text-forest-700" />
            <span>Change Your Password</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Ensure your farm account is using a long, random password to stay secure.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-start space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Current Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
              New Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-4 w-4 text-gray-400" />
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
                <Key className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-forest-600 hover:bg-forest-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition flex items-center space-x-2 text-sm disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
