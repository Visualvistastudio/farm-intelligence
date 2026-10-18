'use client';

import React, { useEffect, useState } from 'react';
import { 
  Mail, Server, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, 
  Send, Eye, EyeOff, Info, Zap, Lock
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Preset {
  id: string;
  name: string;
  host: string;
  port: number;
  defaultUser?: string;
  hint: string;
}

const PRESETS: Preset[] = [
  {
    id: 'gmail',
    name: 'Gmail / Google Workspace',
    host: 'smtp.gmail.com',
    port: 587,
    hint: 'Requires 2-Step Verification enabled and a 16-character Google App Password (not your normal Google account password).'
  },
  {
    id: 'resend',
    name: 'Resend',
    host: 'smtp.resend.com',
    port: 587,
    defaultUser: 'resend',
    hint: 'Use username "resend" and generate an API key (re_...) from your Resend dashboard as the password.'
  },
  {
    id: 'brevo',
    name: 'Brevo (Sendinblue)',
    host: 'smtp-relay.brevo.com',
    port: 587,
    hint: 'Get your SMTP login & master key from Brevo Dashboard > Settings > SMTP & API.'
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    defaultUser: 'apikey',
    hint: 'Use username "apikey" and your SendGrid API key (SG....) as the password.'
  },
  {
    id: 'custom',
    name: 'Custom SMTP Server',
    host: '',
    port: 587,
    hint: 'Connect any RFC-compliant SMTP relay on port 587 (STARTTLS) or port 465 (SSL).'
  }
];

export default function AdminEmailSettingsPage() {
  const { user } = useAuth();
  const [smtpSettings, setSmtpSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [host, setHost] = useState('');
  const [port, setPort] = useState(587);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('Farm Intelligence');

  // Test Email
  const [testRecipient, setTestRecipient] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Feedback notifications
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadSettings = async () => {
    try {
      const data = await api.getSMTPSettings();
      setSmtpSettings(data);
      setHost(data.smtp_host || '');
      setPort(data.smtp_port || 587);
      setUsername(data.smtp_user || '');
      setFromEmail(data.smtp_from_email || 'noreply@farmintelligence.africa');
      setFromName(data.smtp_from_name || 'Farm Intelligence');
      if (user?.email && !testRecipient) {
        setTestRecipient(user.email);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load SMTP settings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  const applyPreset = (preset: Preset) => {
    if (preset.host) setHost(preset.host);
    setPort(preset.port);
    if (preset.defaultUser) setUsername(preset.defaultUser);
    setSuccess(`Loaded configuration preset for ${preset.name}.`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    setTestResult(null);

    try {
      const payload: any = {
        smtp_host: host,
        smtp_port: Number(port),
        smtp_user: username,
        smtp_from_email: fromEmail,
        smtp_from_name: fromName,
      };

      if (password.trim()) {
        payload.smtp_password = password.trim();
      }

      const res = await api.updateSMTPSettings(payload);
      setSuccess(res.message || 'SMTP settings updated and applied successfully.');
      setPassword(''); // clear plain input field
      await loadSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to update SMTP mail settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) {
      setError('Please provide a recipient email address for testing.');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setError('');

    try {
      const res = await api.testSMTPConnection(testRecipient);
      setTestResult({
        success: res.success,
        message: res.message || (res.success ? 'Test email dispatched successfully!' : res.error || 'Failed to deliver test email.')
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Test dispatch failed. Check server logs.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Mail className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-extrabold text-white">Email & SMTP Setup</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure live outgoing mail server delivery for account verification OTPs, password reset challenges, and agronomy alerts.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          {smtpSettings?.is_configured ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>SMTP Configured (Live Delivery)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Sandbox Fallback Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Messages */}
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

      {/* Provider Quick Presets */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Quick Fill Presets</h2>
        </div>
        <p className="text-xs text-slate-400">
          Click your email delivery provider to automatically fill the recommended SMTP host and port:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="p-3 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-emerald-500/50 rounded-xl text-left transition group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 truncate">
                {p.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                {p.host ? `${p.host}:${p.port}` : 'Custom Relay'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">SMTP Connection Credentials</h2>
          </div>
          <button
            type="button"
            onClick={loadSettings}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SMTP Host */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase">
              SMTP Server Host
            </label>
            <input
              type="text"
              required
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="e.g. smtp.gmail.com or smtp.resend.com"
              className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* SMTP Port */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase">
              SMTP Port
            </label>
            <input
              type="number"
              required
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              placeholder="587"
              className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Use 587 for STARTTLS or 465 for SSL</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SMTP Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase">
              SMTP Username / Account Email
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. your-email@gmail.com or resend"
              className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* SMTP Password */}
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                SMTP Password / App Key
              </label>
              {smtpSettings?.smtp_password_set && (
                <span className="text-[10px] text-emerald-400 font-mono">
                  Saved ({smtpSettings.smtp_password_masked})
                </span>
              )}
            </div>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={smtpSettings?.smtp_password_set ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter SMTP password or App Password'}
                className="block w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              For Gmail, use a 16-character App Password. Your credentials are encrypted in transit.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
          {/* From Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase">
              Sender Address (From Email)
            </label>
            <input
              type="email"
              required
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="noreply@farmintelligence.africa"
              className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* From Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase">
              Sender Display Name
            </label>
            <input
              type="text"
              required
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Farm Intelligence"
              className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-emerald-900/30"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{saving ? 'Applying Settings...' : 'Save & Apply Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Send Test Email Card */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Send className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Live Diagnostic Test</h2>
        </div>
        <p className="text-xs text-slate-400">
          Send a verification test email to verify that your SMTP host, port, authentication, and TLS handshake are functioning properly.
        </p>

        <form onSubmit={handleTestEmail} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder="Recipient email address (e.g. ologunemmanuel2015@gmail.com)"
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={testing}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 hover:border-emerald-500/50 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shrink-0"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <Send className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{testing ? 'Testing Handshake...' : 'Send Test Email'}</span>
          </button>
        </form>

        {testResult && (
          <div className={`p-4 rounded-xl border text-xs flex items-start space-x-2.5 ${
            testResult.success 
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200' 
              : 'bg-red-950/80 border-red-500 text-red-200'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold">
                {testResult.success ? 'SMTP Connection Successful' : 'Delivery Test Failed'}
              </div>
              <div className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                {testResult.message}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Provider Guide / Instructions */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-slate-300">
          <Info className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider">How to configure popular SMTP providers</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 pt-1">
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-slate-200 font-bold flex items-center space-x-1.5">
              <span>Google / Gmail (Free or Workspace)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-400">
              <li>Turn on <strong>2-Step Verification</strong> in your Google Account.</li>
              <li>Go to <code className="text-emerald-300 font-mono">myaccount.google.com/apppasswords</code>.</li>
              <li>Generate an <strong>App Password</strong> (select &quot;Mail&quot; or custom name).</li>
              <li>Copy the 16-character code (e.g. <code className="text-emerald-300 font-mono">abcd efgh ijkl mnop</code>) into the SMTP Password field above.</li>
              <li>Host: <code className="text-slate-300 font-mono">smtp.gmail.com</code> | Port: <code className="text-slate-300 font-mono">587</code>.</li>
            </ol>
          </div>

          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-slate-200 font-bold flex items-center space-x-1.5">
              <span>Resend / Brevo / SendGrid</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-slate-400">
              <li><strong>Resend</strong>: Host <code className="text-slate-300 font-mono">smtp.resend.com:587</code>, user <code className="text-slate-300 font-mono">resend</code>, password = your API key.</li>
              <li><strong>Brevo</strong>: Host <code className="text-slate-300 font-mono">smtp-relay.brevo.com:587</code>, user = your account email, password = Brevo SMTP master key.</li>
              <li><strong>SendGrid</strong>: Host <code className="text-slate-300 font-mono">smtp.sendgrid.net:587</code>, user <code className="text-slate-300 font-mono">apikey</code>, password = your API key.</li>
              <li>Verify that your sender domain has proper SPF and DKIM DNS records.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
