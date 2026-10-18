'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Check, Users, RefreshCw, AlertCircle, Plus, Edit3, ShieldAlert, Award, Calendar, DollarSign, Layers } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<any>({ subscribers: [], plans: [] });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit Plan Modal State
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editInterval, setEditInterval] = useState('month');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editMaxFarms, setEditMaxFarms] = useState<number>(1);
  const [editMaxAssessments, setEditMaxAssessments] = useState<number>(3);
  const [editMaxPlotArea, setEditMaxPlotArea] = useState<number>(50);
  const [editExportPdf, setEditExportPdf] = useState(false);
  const [editSatResolution, setEditSatResolution] = useState('standard_10m');
  const [editWhatsapp, setEditWhatsapp] = useState(false);
  const [editTeamSeats, setEditTeamSeats] = useState<number>(1);
  const [savingPlan, setSavingPlan] = useState(false);

  // New Plan Modal State
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState<number>(5000);
  const [newInterval, setNewInterval] = useState('month');
  const [newIsActive, setNewIsActive] = useState(true);
  const [newMaxFarms, setNewMaxFarms] = useState<number>(5);
  const [newMaxAssessments, setNewMaxAssessments] = useState<number>(20);
  const [newMaxPlotArea, setNewMaxPlotArea] = useState<number>(200);
  const [newExportPdf, setNewExportPdf] = useState(true);
  const [newSatResolution, setNewSatResolution] = useState('high_resolution');
  const [newWhatsapp, setNewWhatsapp] = useState(true);
  const [newTeamSeats, setNewTeamSeats] = useState<number>(3);
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Override Subscriber Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideUserId, setOverrideUserId] = useState('');
  const [overrideUserEmail, setOverrideUserEmail] = useState('');
  const [overridePlanId, setOverridePlanId] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('active');
  const [overrideExtendDays, setOverrideExtendDays] = useState<number>(30);
  const [overridingSub, setOverridingSub] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [res, usersRes] = await Promise.all([
        api.getAdminSubscriptions(),
        api.getAdminUsers(),
      ]);
      setData(res);
      setAllUsers(usersRes?.users || usersRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setEditName(plan.name || '');
    setEditDesc(plan.description || '');
    setEditPrice(plan.price_ngn || 0);
    setEditInterval(plan.interval || 'month');
    setEditIsActive(plan.is_active ?? true);
    const limits = plan.limits || {};
    setEditMaxFarms(limits.max_farms ?? 1);
    setEditMaxAssessments(limits.max_assessments_per_month ?? 3);
    setEditMaxPlotArea(limits.max_plot_area_ha ?? 50);
    setEditExportPdf(Boolean(limits.export_pdf_reports));
    setEditSatResolution(limits.satellite_resolution || 'standard_10m');
    setEditWhatsapp(Boolean(limits.whatsapp_alerts || limits.seasonal_reminders));
    setEditTeamSeats(limits.team_seats ?? 1);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSavingPlan(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: editName,
        description: editDesc,
        price_ngn: Number(editPrice),
        billing_interval: editInterval,
        is_active: editIsActive,
        feature_limits: {
          max_farms: Number(editMaxFarms),
          max_assessments_per_month: Number(editMaxAssessments),
          max_plot_area_ha: Number(editMaxPlotArea),
          export_pdf_reports: editExportPdf,
          satellite_resolution: editSatResolution,
          whatsapp_alerts: editWhatsapp,
          seasonal_reminders: editWhatsapp,
          team_seats: Number(editTeamSeats),
        },
      };
      await api.updatePlan(editingPlan.id, payload);
      setSuccess(`Plan '${editName}' and entitlements updated successfully.`);
      setEditingPlan(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update plan.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPlan(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        code: newCode.trim().toLowerCase(),
        name: newName.trim(),
        description: newDesc.trim(),
        price_ngn: Number(newPrice),
        billing_interval: newInterval,
        is_active: newIsActive,
        feature_limits: {
          max_farms: Number(newMaxFarms),
          max_assessments_per_month: Number(newMaxAssessments),
          max_plot_area_ha: Number(newMaxPlotArea),
          export_pdf_reports: newExportPdf,
          satellite_resolution: newSatResolution,
          whatsapp_alerts: newWhatsapp,
          seasonal_reminders: newWhatsapp,
          team_seats: Number(newTeamSeats),
        },
      };
      await api.createPlan(payload);
      setSuccess(`New Tier '${newName}' added to the platform.`);
      setShowNewPlanModal(false);
      setNewCode('');
      setNewName('');
      setNewDesc('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create plan.');
    } finally {
      setCreatingPlan(false);
    }
  };

  const openOverrideModalForSub = (sub?: any) => {
    if (sub) {
      setOverrideUserId(sub.user_id || '');
      setOverrideUserEmail(sub.user_email || '');
      setOverridePlanId(sub.plan_id || (data.plans[0]?.id || ''));
      setOverrideStatus(sub.status || 'active');
    } else {
      const firstUser = allUsers[0];
      setOverrideUserId(firstUser?.id || '');
      setOverrideUserEmail(firstUser?.email || '');
      setOverridePlanId(data.plans[0]?.id || '');
      setOverrideStatus('active');
    }
    setOverrideExtendDays(30);
    setShowOverrideModal(true);
  };

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideUserId || !overridePlanId) {
      setError('Please select both a subscriber and target plan tier.');
      return;
    }
    setOverridingSub(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.overrideSubscriber({
        user_id: overrideUserId,
        plan_id: overridePlanId,
        status: overrideStatus,
        extend_days: Number(overrideExtendDays),
      });
      setSuccess(res.message || 'Subscriber quota and tier updated successfully.');
      setShowOverrideModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to apply subscriber override.');
    } finally {
      setOverridingSub(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">Subscription Tiers & Entitlements</h1>
            <span className="text-[11px] bg-forest-900/60 text-forest-300 border border-forest-700/60 px-2.5 py-0.5 rounded-full font-bold">
              Super Admin Authority
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure live pricing in Nigerian Naira (₦ NGN), adjust computational quotas, toggle feature entitlements, and override subscriber privileges.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewPlanModal(true)}
            className="bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Tier</span>
          </button>
          <button
            onClick={() => openOverrideModalForSub()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Override Subscriber</span>
          </button>
          <button
            onClick={loadData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-950/80 border border-red-500 text-red-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Plan Tiers Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-forest-400" />
            <span>Active Product Tiers & Quota Configurations</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">{data.plans?.length || 0} Tiers Configured</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.plans?.map((p: any) => {
            const limits = p.limits || {};
            return (
              <div
                key={p.id}
                className={`bg-slate-900 rounded-xl border p-5 space-y-3.5 transition flex flex-col justify-between ${
                  p.is_active ? 'border-slate-800 hover:border-slate-700' : 'border-red-900/40 opacity-75'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-white">{p.name}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{p.description || 'No description provided'}</p>
                    </div>
                    <span className="text-[10px] bg-slate-800 font-mono text-slate-300 px-2 py-0.5 rounded uppercase">
                      {p.code}
                    </span>
                  </div>

                  <div className="text-2xl font-extrabold text-emerald-400">
                    ₦{p.price_ngn?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    <span className="text-xs text-slate-400 font-normal">/{p.interval}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Farms:</span>
                      <strong className="text-white font-mono">{limits.max_farms ?? 'Unlimited'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Runs:</span>
                      <strong className="text-white font-mono">{limits.max_assessments_per_month ?? 'Unlimited'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Plot Area:</span>
                      <strong className="text-white font-mono">{limits.max_plot_area_ha ? `${limits.max_plot_area_ha} ha` : 'No Cap'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">PDF Dossiers:</span>
                      <span className={`font-semibold ${limits.export_pdf_reports ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {limits.export_pdf_reports ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Satellite Tier:</span>
                      <span className="text-forest-300 font-semibold text-[11px]">
                        {limits.satellite_resolution === 'high_resolution' ? 'High-Res Sentinel' : 'Standard 10m'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">WhatsApp Alerts:</span>
                      <span className={`font-semibold ${limits.whatsapp_alerts || limits.seasonal_reminders ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {limits.whatsapp_alerts || limits.seasonal_reminders ? 'Included' : 'Off'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Team Seats:</span>
                      <strong className="text-white font-mono">{limits.team_seats ?? 1}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.is_active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                    {p.is_active ? 'Active on Pricing' : 'Archived / Hidden'}
                  </span>

                  <button
                    onClick={() => openEditPlan(p)}
                    className="text-xs font-semibold bg-slate-800 hover:bg-forest-600 hover:text-white text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Adjust Entitlements</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Subscribers Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-800 flex justify-between items-center">
          <div className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-forest-400" />
            <span>Active & Overridden Subscribers ({data.subscribers?.length || 0})</span>
          </div>

          <button
            onClick={() => openOverrideModalForSub()}
            className="text-xs text-forest-400 hover:text-forest-300 font-bold flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Grant / Override Subscriber Tier</span>
          </button>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-850 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Subscriber</th>
              <th className="px-5 py-3">Assigned Tier</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Period Expiration</th>
              <th className="px-5 py-3 text-right">Super Admin Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.subscribers?.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-850/50 transition">
                <td className="px-5 py-3.5">
                  <div className="font-bold text-white">{s.user_name || s.user_email}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{s.user_email}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-forest-300 font-bold bg-forest-950 border border-forest-800/80 px-2 py-0.5 rounded text-[11px]">
                    {s.plan_name}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    s.status === 'active'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : s.status === 'trialing'
                      ? 'bg-blue-950 text-blue-400 border border-blue-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-[11px] font-mono">
                  {s.period_end ? new Date(s.period_end).toLocaleDateString() : 'Indefinite'}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => openOverrideModalForSub(s)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 transition"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Manage / Override</span>
                  </button>
                </td>
              </tr>
            ))}
            {data.subscribers?.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-500">
                  No active subscribers recorded yet. Use the "Grant / Override Subscriber Tier" button to assign any farmer an upgraded tier immediately.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-forest-400" />
                  <span>Adjust Plan Pricing & Quota Entitlements</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Editing Plan: <span className="font-mono text-emerald-400 font-bold">{editingPlan.code}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePlan} className="space-y-4 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300">Tier Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300">Price (₦ NGN)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Description</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="e.g. Full crop modeling, unlimited fields, and seasonal planning"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300">Billing Interval</label>
                  <select
                    value={editInterval}
                    onChange={(e) => setEditInterval(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="month">Monthly (₦ / month)</option>
                    <option value="year">Annual (₦ / year)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300">Plan Status</label>
                  <select
                    value={editIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="active">Active & Available for Purchase</option>
                    <option value="inactive">Archived / Hidden from Public</option>
                  </select>
                </div>
              </div>

              {/* Quotas & Entitlements Box */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-forest-400" />
                  <span>Enforced Usage Quotas & Feature Entitlements</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium">Max Registered Farms</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editMaxFarms}
                      onChange={(e) => setEditMaxFarms(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium">Assessments / Month</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editMaxAssessments}
                      onChange={(e) => setEditMaxAssessments(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium">Max Field Area (ha)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editMaxPlotArea}
                      onChange={(e) => setEditMaxPlotArea(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-400 font-medium">Satellite Imaging Tier</label>
                    <select
                      value={editSatResolution}
                      onChange={(e) => setEditSatResolution(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                    >
                      <option value="standard_10m">Sentinel-2 (10m Resolution)</option>
                      <option value="high_resolution">High-Res Planet / NICFI (4.7m)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium">Team / Organization Seats</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editTeamSeats}
                      onChange={(e) => setEditTeamSeats(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editExportPdf}
                      onChange={(e) => setEditExportPdf(e.target.checked)}
                      className="rounded border-slate-700 text-forest-600 focus:ring-forest-500"
                    />
                    <span className="text-slate-200 font-semibold">Enable PDF Agronomic Reports Download</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.checked)}
                      className="rounded border-slate-700 text-forest-600 focus:ring-forest-500"
                    />
                    <span className="text-slate-200 font-semibold">WhatsApp Weather & Stage Alerts</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg font-bold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {savingPlan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Plan Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-forest-400" />
                  <span>Provision New Custom or Regional Tier</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Define a new pricing level for agricultural cooperatives, outgrower networks, or donor schemes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPlanModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300">Plan Slug / Identifier</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. cooperative_kaduna"
                    className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300">Display Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Kaduna Outgrower Alliance"
                    className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300">Price (₦ NGN)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300">Billing Interval</label>
                  <select
                    value={newInterval}
                    onChange={(e) => setNewInterval(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Target audience or project partnership details"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              {/* Quotas Box */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  Configured Quotas & Flags
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium">Max Farms</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newMaxFarms}
                      onChange={(e) => setNewMaxFarms(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium">Assessments / Month</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newMaxAssessments}
                      onChange={(e) => setNewMaxAssessments(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium">Max Area (ha)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newMaxPlotArea}
                      onChange={(e) => setNewMaxPlotArea(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newExportPdf}
                      onChange={(e) => setNewExportPdf(e.target.checked)}
                      className="rounded border-slate-700 text-forest-600 focus:ring-forest-500"
                    />
                    <span className="text-slate-200">Export PDF Reports</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWhatsapp}
                      onChange={(e) => setNewWhatsapp(e.target.checked)}
                      className="rounded border-slate-700 text-forest-600 focus:ring-forest-500"
                    />
                    <span className="text-slate-200">WhatsApp Seasonal Reminders</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPlan}
                  className="px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg font-bold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {creatingPlan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Provision Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Override Subscriber Account Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Super Admin: Subscriber Override</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyOverride} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300">Target User Account</label>
                <select
                  value={overrideUserId}
                  onChange={(e) => {
                    setOverrideUserId(e.target.value);
                    const matched = allUsers.find((u) => u.id === e.target.value);
                    if (matched) setOverrideUserEmail(matched.email);
                  }}
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Assigned Plan Tier</label>
                <select
                  value={overridePlanId}
                  onChange={(e) => setOverridePlanId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                >
                  {data.plans?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₦{p.price_ngn?.toLocaleString()} / {p.interval})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300">Account Status</label>
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="active">Active (Full Access)</option>
                    <option value="trialing">Trialing</option>
                    <option value="past_due">Past Due</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300">Extend Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="1825"
                    value={overrideExtendDays}
                    onChange={(e) => setOverrideExtendDays(parseInt(e.target.value) || 30)}
                    className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-lg text-amber-200/90 text-[11px] leading-relaxed">
                Applying this override will immediately elevate the subscriber's quotas (farms, monthly runs, high-res satellite access) in accordance with the selected tier.
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overridingSub}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {overridingSub ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                  <span>Apply Override</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
