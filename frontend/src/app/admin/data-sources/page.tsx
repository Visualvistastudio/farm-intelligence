'use client';

import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminDataSourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSources = async () => {
    try {
      const data = await api.getDataSources();
      setSources(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data sources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleSync = async (id: string, name: string) => {
    setSyncingId(id);
    setError('');
    setSuccess('');
    try {
      const res = await api.syncDataSource(id);
      setSuccess(res.message);
      await loadSources();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger dataset sync.');
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Geospatial Data Sources Registry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor external data providers, inspect spatial resolutions, and trigger synchronization jobs.
          </p>
        </div>

        <button
          onClick={loadSources}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {success && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-950/80 border border-red-500 text-red-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((s) => {
          const resMeta = s.resolution_metadata_json ? JSON.parse(s.resolution_metadata_json) : {};
          const covMeta = s.coverage_metadata_json ? JSON.parse(s.coverage_metadata_json) : {};

          return (
            <div key={s.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-white">{s.dataset_name}</h3>
                    <div className="text-xs font-mono text-forest-400">{s.provider} ({s.dataset_version})</div>
                  </div>
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                    {s.status}
                  </span>
                </div>

                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div><strong>License:</strong> {s.license}</div>
                  <div><strong>Spatial Resolution:</strong> {resMeta.spatial_res || 'Regional Gridded'}</div>
                  <div><strong>Coverage:</strong> {covMeta.coverage || 'Nigeria'}</div>
                  <div><strong>Last Synchronized:</strong> {s.last_sync_at ? new Date(s.last_sync_at).toLocaleString() : 'System Baseline Seed'}</div>
                </div>
              </div>

              <button
                onClick={() => handleSync(s.id, s.dataset_name)}
                disabled={syncingId === s.id}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingId === s.id ? 'animate-spin' : ''}`} />
                <span>{syncingId === s.id ? 'Synchronizing...' : 'Trigger Dataset Synchronization'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
