'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Sprout, MapPin, Calendar, Plus, Compass, ArrowRight, 
  CheckCircle2, Clock, AlertTriangle, ChevronRight, FileText
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [farms, setFarms] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [farmData, assessData] = await Promise.all([
          api.getFarms(),
          api.getAssessments(),
        ]);
        setFarms(farmData || []);
        setAssessments(assessData || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-forest-900 to-forest-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <span className="text-xs font-semibold text-forest-300 uppercase tracking-wider">
            {user?.country_code === 'NG' ? 'Nigeria Agronomic Hub' : 'Agronomy Intelligence'}
          </span>
          <h1 className="text-2xl font-bold mt-1">Welcome, {user?.full_name || 'Farmer'}</h1>
          <p className="text-xs text-forest-100 max-w-xl mt-1">
            Evaluate your field boundaries, review evidence-grounded crop suitability, and track your seasonal cultivation calendar.
          </p>
        </div>

        <div className="flex space-x-3">
          <Link
            href="/app/crop-planner"
            className="bg-forest-500 hover:bg-forest-400 text-forest-950 text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>Analyze a Farm</span>
          </Link>
          <Link
            href="/app/farms/new"
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-lg border border-white/20 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Farm Boundary</span>
          </Link>
        </div>
      </div>

      {/* Seasonal Planting Window Alert Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
        <Calendar className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <span className="font-bold">Next Seasonal Planting Window: </span>
          <span>
            Northern & Southern Guinea Savannah rainfed planting window approaches (May 15 – July 15).
            Check soil moisture accumulation before sowing cereal seeds.
          </span>
        </div>
      </div>

      {/* Grid: Farms Summary & Recent Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Registered Farms */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-forest-700" />
              <span>Registered Farm Plots</span>
            </h2>
            <Link href="/app/farms/new" className="text-xs font-semibold text-forest-700 hover:underline">
              + New Field
            </Link>
          </div>

          {farms.length === 0 && !loading ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">No Farm Boundaries Registered Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Add your field polygon or enter GPS coordinates to unlock satellite soil and climate suitability analysis.
              </p>
              <Link
                href="/app/farms/new"
                className="inline-flex items-center space-x-1.5 bg-forest-900 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Farm</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {farms.map((f) => (
                <div key={f.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 hover:border-forest-600 transition">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-gray-900">{f.name}</h3>
                    <span className="text-[10px] font-semibold bg-forest-50 text-forest-800 px-2 py-0.5 rounded">
                      {f.calculated_area_hectares} Ha
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {f.state || 'Kaduna'}, {f.country_code} • {f.farming_system}
                  </div>
                  <div className="text-[11px] font-medium text-forest-700">
                    Zone: {f.agroecological_zone || 'Guinea Savannah'}
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                    <Link href={`/app/crop-planner?farm_id=${f.id}`} className="font-semibold text-forest-800 hover:underline">
                      Run Assessment →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Assessments */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Sprout className="w-4 h-4 text-forest-700" />
              <span>Recent Assessments</span>
            </h2>
          </div>

          {assessments.length === 0 && !loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-xs text-gray-500 space-y-2">
              <p>No assessments generated yet.</p>
              <Link href="/app/crop-planner" className="text-forest-700 font-bold hover:underline block">
                Start Crop Planner →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  href={`/app/assessments/${a.id}`}
                  className="block bg-white p-3.5 rounded-xl border border-gray-200 hover:border-forest-600 shadow-sm transition space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-gray-900">{a.crop_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      a.suitability_score >= 80 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {a.overall_suitability_category}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Score: {a.suitability_score}% • Confidence: {a.confidence_category}
                  </div>
                  {a.yield_min && (
                    <div className="text-[11px] font-medium text-forest-800">
                      Est. Yield: {a.yield_min} - {a.yield_max} {a.yield_unit}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
