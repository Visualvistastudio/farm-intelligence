'use client';

import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw, AlertCircle, Shield } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLogs(100);
      setLogs(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Platform Security & Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable system audit records tracking administrative logins, permission edits, payments, and data synchronizations.
          </p>
        </div>

        <button
          onClick={loadLogs}
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

      {/* Audit Log Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Action</th>
              <th className="px-5 py-3.5">Actor</th>
              <th className="px-5 py-3.5">Entity</th>
              <th className="px-5 py-3.5">Metadata / Details</th>
              <th className="px-5 py-3.5 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-850/50 transition">
                <td className="px-5 py-3.5">
                  <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                    {l.action}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-300">{l.actor_email || 'system'}</td>
                <td className="px-5 py-3.5 text-slate-400">
                  {l.entity_type} {l.entity_id ? `(${l.entity_id.slice(0, 8)})` : ''}
                </td>
                <td className="px-5 py-3.5 text-[10px] text-slate-400 max-w-xs truncate">
                  {JSON.stringify(l.details)}
                </td>
                <td className="px-5 py-3.5 text-right text-slate-400 text-[11px]">
                  {new Date(l.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500 font-sans">
                  No audit events recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
