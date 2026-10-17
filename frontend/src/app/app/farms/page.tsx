'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Plus, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function FarmsListPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFarms = async () => {
    try {
      const data = await api.getFarms();
      setFarms(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load farms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registered Farm Plots</h1>
          <p className="text-xs text-gray-500 mt-1">Manage field boundaries and review active cropping systems.</p>
        </div>

        <Link
          href="/app/farms/new"
          className="bg-forest-900 hover:bg-forest-950 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center space-x-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Farm</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-7 h-7 text-forest-700 animate-spin" />
          <p className="text-xs text-gray-500">Loading farm plots...</p>
        </div>
      ) : farms.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-4">
          <MapPin className="w-12 h-12 text-forest-700 mx-auto" />
          <h3 className="font-bold text-base text-gray-900">No Farm Plots Registered</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You have not registered any farm boundary yet. Demarcate your first plot to access satellite soil and climate analysis.
          </p>
          <Link
            href="/app/farms/new"
            className="inline-flex items-center space-x-1.5 bg-forest-900 text-white text-xs font-semibold px-5 py-2.5 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Farm Boundary</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {farms.map((f) => (
            <div key={f.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3 hover:border-forest-600 transition flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-base text-gray-900">{f.name}</h3>
                  <span className="text-xs bg-forest-50 text-forest-900 font-bold px-2 py-0.5 rounded border border-forest-200">
                    {f.calculated_area_hectares} Ha
                  </span>
                </div>
                <div className="text-xs text-gray-500">{f.state || 'Kaduna'}, {f.country_code} • {f.farming_system}</div>
                <div className="text-xs font-medium text-forest-800">
                  Zone: {f.agroecological_zone || 'Guinea Savannah'}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                <span className="text-gray-400 font-mono text-[10px]">
                  Fields: {f.fields?.length || 1}
                </span>
                <Link
                  href={`/app/crop-planner?farm_id=${f.id}`}
                  className="font-bold text-forest-800 hover:text-forest-950 flex items-center space-x-1"
                >
                  <span>Evaluate Crops</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
