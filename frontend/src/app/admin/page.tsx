'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, MapPin, Sprout, CreditCard, DollarSign, Database, 
  ShieldAlert, RefreshCw, Key, Settings, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { api } from '@/lib/api';

export default function SuperAdminOverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOverview = async () => {
    try {
      const data = await api.getAdminOverview();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-forest-500" />
        <p className="text-sm">Calculating platform metrics from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Platform Operations & Revenue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time database metrics, Paystack gateway status, and spatial agronomic pipeline health.
          </p>
        </div>

        <button
          onClick={loadOverview}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/80 border border-red-500 text-red-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Paystack Environment Status Banner (PRD Addendum Section 10 & 19) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 text-xs">
        <div className="flex items-center space-x-3">
          <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
          <div>
            <span className="font-bold text-white">Payment Gateway Mode: </span>
            <span className="text-amber-300 font-semibold">{metrics?.paystack_mode}</span>
            <span className="text-slate-400 ml-2">
              ({metrics?.paystack_configured ? 'API Keys Configured' : 'Running in Safe Test Sandbox'})
            </span>
          </div>
        </div>
        <Link
          href="/admin/settings/payments"
          className="text-forest-400 hover:text-forest-300 font-semibold underline flex items-center space-x-1"
        >
          <span>Configure Paystack Credentials</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Metrics Row 1: Core Product & User Volumes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-forest-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics?.total_users || 0}</div>
          <div className="text-[11px] text-slate-400">
            {metrics?.active_users || 0} active accounts
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Demarcated Farms</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics?.total_farms || 0}</div>
          <div className="text-[11px] text-slate-400">
            Across {metrics?.total_fields || 0} total field plots
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Completed Assessments</span>
            <Sprout className="w-4 h-4 text-forest-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics?.total_assessments || 0}</div>
          <div className="text-[11px] text-slate-400">
            {metrics?.processing_jobs || 0} in active pipeline
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Active Subscribers</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics?.active_subscriptions || 0}</div>
          <div className="text-[11px] text-slate-400">
            {metrics?.confirmed_payments_count || 0} total verified payments
          </div>
        </div>
      </div>

      {/* Metrics Row 2: Financial Collections & Settlements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Confirmed Gross Revenue
          </span>
          <div className="text-3xl font-extrabold text-emerald-400">
            ₦{metrics?.gross_revenue_ngn?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-500">
            Verified provider collections through Paystack.
          </p>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Authorized Refunds
          </span>
          <div className="text-3xl font-extrabold text-red-400">
            ₦{metrics?.refund_totals_ngn?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-500">
            Reconciled refund totals with provider confirmation.
          </p>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Net Collected Revenue
          </span>
          <div className="text-3xl font-extrabold text-white">
            ₦{metrics?.net_revenue_ngn?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <p className="text-[11px] text-slate-500">
            Gross minus refunds (excluding merchant payout fees).
          </p>
        </div>
      </div>

      {/* External Data Sources Registry Health */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Database className="w-4 h-4 text-forest-400" />
            <span>Geospatial Data Sources Registry</span>
          </h2>
          <Link href="/admin/data-sources" className="text-xs text-forest-400 hover:underline">
            Manage Registry →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {Object.entries(metrics?.data_sources_status || {}).map(([key, stat]: [string, any]) => (
            <div key={key} className="bg-slate-850 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
              <span className="font-medium text-slate-300">{key.replace('_', ' ')}</span>
              <span className="font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded uppercase text-[10px]">
                {stat}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Administrative Shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <Link href="/admin/access-control" className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition flex items-center space-x-2">
          <Key className="w-4 h-4 text-forest-400" />
          <span className="font-semibold text-slate-200">Manage RBAC Roles</span>
        </Link>
        <Link href="/admin/payments" className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition flex items-center space-x-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">View Transactions</span>
        </Link>
        <Link href="/admin/settings/payments" className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition flex items-center space-x-2">
          <Settings className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-200">Paystack Settings</span>
        </Link>
        <Link href="/admin/audit-logs" className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-200">Security Audit Logs</span>
        </Link>
      </div>
    </div>
  );
}
