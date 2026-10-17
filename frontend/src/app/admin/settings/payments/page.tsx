'use client';

import React, { useEffect, useState } from 'react';
import { Sliders, Key, Lock, CheckCircle2, AlertCircle, RefreshCw, Copy } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminPaymentSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [secretKey, setSecretKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadSettings = async () => {
    try {
      const data = await api.getPaymentSettings();
      setSettings(data);
      setTestMode(data.test_mode);
      if (data.public_key) setPublicKey(data.public_key);
    } catch (err: any) {
      setError(err.message || 'Failed to load Paystack settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.updatePaymentSettings({
        secret_key: secretKey || undefined,
        public_key: publicKey || undefined,
        webhook_secret: webhookSecret || undefined,
        test_mode: testMode
      });
      setSuccess('Paystack settings updated successfully.');
      setSecretKey('');
      setWebhookSecret('');
      await loadSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to save Paystack settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Paystack Gateway Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure API credentials, environment modes, and webhook endpoints for Nigerian transactions.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-950/80 border border-red-500 text-red-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-5">
        {/* Environment Status Toggle */}
        <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 flex justify-between items-center">
          <div>
            <div className="text-sm font-bold text-white">Gateway Mode</div>
            <p className="text-xs text-slate-400">
              {testMode ? 'Test Sandbox Mode (safe simulated test transactions)' : 'Live Production Mode (real debit transactions)'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTestMode(!testMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              testMode
                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
            }`}
          >
            {testMode ? 'Switch to Live' : 'Switch to Test'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase">
            Paystack Public Key
          </label>
          <input
            type="text"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="pk_test_... or pk_live_..."
            className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase">
            Paystack Secret Key (Masked in Storage)
          </label>
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder={settings?.secret_key_masked || "sk_test_... or sk_live_..."}
            className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">
            Current status: {settings?.secret_key_masked}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase">
            Paystack Webhook Secret (HMAC-SHA512)
          </label>
          <input
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder="Webhook secret key for signature verification"
            className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
          />
        </div>

        {/* Webhook Endpoint Display */}
        <div className="pt-2 border-t border-slate-800 space-y-1">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase">
            Server-Side Webhook Endpoint URL
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={settings?.webhook_url || ''}
              className="w-full px-3 py-2 bg-slate-850 border border-slate-800 rounded-lg text-xs font-mono text-slate-300"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            Paste this URL into your Paystack Dashboard under Settings &gt; API Keys &amp; Webhooks.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-forest-600 hover:bg-forest-500 text-white font-semibold py-2.5 px-6 rounded-lg text-xs transition shadow-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Gateway Settings'}
        </button>
      </form>
    </div>
  );
}
