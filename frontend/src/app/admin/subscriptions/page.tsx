'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Check, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<any>({ subscribers: [], plans: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const res = await api.getAdminSubscriptions();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Subscription Tiers & Entitlements</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage product pricing plans, usage quotas, and inspect active subscriber accounts.
          </p>
        </div>

        <button
          onClick={loadData}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/80 border border-red-500 text-red-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plan Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.plans?.map((p: any) => (
          <div key={p.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-sm text-white">{p.name}</h3>
              <span className="text-[10px] bg-slate-800 font-mono text-slate-300 px-2 py-0.5 rounded uppercase">
                {p.code}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">
              ₦{p.price_ngn?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="text-xs text-slate-400 font-normal">/{p.interval}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div>• Max Farms: <strong>{p.limits?.max_farms}</strong></div>
              <div>• Monthly Assessments: <strong>{p.limits?.max_assessments_per_month}</strong></div>
              <div>• PDF Reports: <strong>{p.limits?.export_pdf_reports ? 'Included' : 'No'}</strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* Subscribers Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Users className="w-4 h-4 text-forest-400" />
          <span>Current Active Subscribers</span>
        </div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-850 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Subscriber</th>
              <th className="px-5 py-3">Tier Name</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Period Expiration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.subscribers?.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-850/50 transition">
                <td className="px-5 py-3.5 font-bold text-white">{s.user_email}</td>
                <td className="px-5 py-3.5 text-forest-300 font-semibold">{s.plan_name}</td>
                <td className="px-5 py-3.5">
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    {s.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                  {new Date(s.period_end).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {data.subscribers?.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  No active paid subscribers recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
