'use client';

import React, { useEffect, useState } from 'react';
import { Users, Search, Shield, Ban, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const data = await api.getAdminUsers(statusFilter || undefined);
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [statusFilter]);

  const toggleStatus = async (user: any) => {
    const nextStatus = user.account_status === 'active' ? 'suspended' : 'active';
    const confirm = window.confirm(`Are you sure you want to change status of ${user.email} to ${nextStatus}?`);
    if (!confirm) return;

    try {
      await api.updateUserStatus(user.id, nextStatus);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const filtered = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white">User Directory & Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Oversee registered farmers, manage account statuses, and review active plan subscriptions.
          </p>
        </div>

        <button
          onClick={loadUsers}
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

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-between items-center text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by farmer name or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-forest-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-slate-200 px-3 py-1.5 text-xs focus:ring-forest-500"
          >
            <option value="">All Accounts</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Farmer / Email</th>
              <th className="px-5 py-3.5">Country</th>
              <th className="px-5 py-3.5">Farms</th>
              <th className="px-5 py-3.5">Assessments</th>
              <th className="px-5 py-3.5">Subscription Plan</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-850/60 transition">
                <td className="px-5 py-3.5">
                  <div className="font-bold text-white">{u.full_name}</div>
                  <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                </td>
                <td className="px-5 py-3.5">{u.country_code}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-200">{u.farms_count}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-200">{u.assessments_count}</td>
                <td className="px-5 py-3.5">
                  <span className="bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded text-[11px] font-medium text-slate-300">
                    {u.plan_name}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.account_status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                  }`}>
                    {u.account_status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => toggleStatus(u)}
                    className={`text-xs px-2.5 py-1 rounded transition font-medium ${
                      u.account_status === 'active'
                        ? 'text-red-400 hover:bg-red-950/60'
                        : 'text-emerald-400 hover:bg-emerald-950/60'
                    }`}
                  >
                    {u.account_status === 'active' ? 'Suspend' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  No user records match the query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
