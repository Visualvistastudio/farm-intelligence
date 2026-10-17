'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Sprout, MapPin, Calendar, CheckCircle2, AlertTriangle, Printer, 
  Layers, ArrowLeft, BarChart2, ShieldAlert, Check, RefreshCw, Clock
} from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';
import { api } from '@/lib/api';

export default function AssessmentDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [assessment, setAssessment] = useState<any>(null);
  const [cropPlan, setCropPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAssessment() {
      try {
        const data = await api.getAssessment(id);
        setAssessment(data);

        // Load corresponding crop plan
        try {
          const planData = await api.getCropPlan(id);
          setCropPlan(planData);
        } catch {}
      } catch (err: any) {
        setError(err.message || 'Failed to load assessment.');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadAssessment();
  }, [id]);

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await api.toggleTask(taskId);
      if (cropPlan) {
        const updatedTasks = cropPlan.tasks.map((t: any) => 
          t.id === taskId ? { ...t, completion_status: res.completion_status } : t
        );
        setCropPlan({ ...cropPlan, tasks: updatedTasks });
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <RefreshCw className="w-8 h-8 text-forest-700 animate-spin" />
        <p className="text-sm text-gray-500">Loading agronomic assessment report...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-700 text-center space-y-2">
        <p className="font-bold">Assessment not found</p>
        <Link href="/app" className="text-xs text-red-900 underline">Return to dashboard</Link>
      </div>
    );
  }

  const results = assessment.results || {};
  const breakdown = results.breakdown || {};
  const yieldDetails = results.yield_details || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <Link href="/app" className="inline-flex items-center text-xs text-gray-500 hover:text-forest-900 mb-1">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-950 flex items-center space-x-2">
            <span>{assessment.crop_name} Suitability Assessment</span>
          </h1>
          <p className="text-xs text-gray-500">
            Assessment ID: {assessment.id.slice(0, 8)} • Model Version: {assessment.assessment_version}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center space-x-1.5 transition no-print"
        >
          <Printer className="w-4 h-4 text-gray-500" />
          <span>Print / Export PDF Report</span>
        </button>
      </div>

      {/* Main Status & Score Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 pr-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Classification</span>
          <div className="flex items-center space-x-3 mt-1">
            <span className={`text-2xl font-extrabold ${
              assessment.suitability_score >= 80 ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {assessment.overall_suitability_category}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-800">
              {assessment.suitability_score}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            {results.confidence_reason || 'Evidence grounded in agroecological climate & soil models.'}
          </p>
        </div>

        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confidence Level</span>
          <div className="text-lg font-bold text-gray-900 mt-1 flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-forest-600" />
            <span>{assessment.confidence_category}</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Satellite & Gridded Topsoil Data
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expected Yield Range</span>
          <div className="text-lg font-bold text-forest-900 mt-1">
            {assessment.yield_min ? `${assessment.yield_min} – ${assessment.yield_max} ${assessment.yield_unit}` : 'Pending Calibration'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {yieldDetails.total_production_min_tons ? `Total: ${yieldDetails.total_production_min_tons} – ${yieldDetails.total_production_max_tons} Tons` : 'Transparent Uncertainty'}
          </div>
        </div>
      </div>

      {/* Grid: Map on Left, Scores & Factors on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Spatial Suitability Map */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-forest-700" />
              <span>Field Suitability Zones</span>
            </h2>
            <span className="text-[11px] text-gray-500 font-mono">EPSG:4326</span>
          </div>

          <InteractiveMap
            suitabilityZones={assessment.layers}
            height="360px"
          />

          <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <strong>Spatial Safeguard:</strong> Coarse gridded soil layers (ISRIC 250m) represent field-level tendencies rather than sub-meter lab measurements.
          </div>
        </div>

        {/* Right: Biophysical Breakdown & Favorable / Limiting Factors */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Biophysical Breakdown
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Climate & Temperature Match</span>
                  <span>{breakdown.climate_score || 85}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-forest-700 h-2 rounded-full" style={{ width: `${breakdown.climate_score || 85}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Soil pH & Texture Affinity</span>
                  <span>{breakdown.soil_score || 80}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-forest-600 h-2 rounded-full" style={{ width: `${breakdown.soil_score || 80}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Water Supply & Moisture Balance</span>
                  <span>{breakdown.water_score || 80}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-forest-500 h-2 rounded-full" style={{ width: `${breakdown.water_score || 80}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Terrain & Drainage Slope</span>
                  <span>{breakdown.terrain_score || 95}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-forest-800 h-2 rounded-full" style={{ width: `${breakdown.terrain_score || 95}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Favorable vs Limiting Conditions */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Supporting Agronomic Factors</span>
            </h3>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
              {results.favorable_factors?.map((fav: string, i: number) => (
                <li key={i}>{fav}</li>
              ))}
            </ul>

            {results.limiting_factors?.length > 0 && (
              <>
                <hr className="border-gray-100 my-2" />
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Limiting Conditions & Constraints</span>
                </h3>
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
                  {results.limiting_factors?.map((lim: string, i: number) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Limitations & Recommendations Warning (PRD Principle 3.7) */}
      {assessment.limitations?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs text-amber-900">
          <div className="font-bold flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Limitations & Recommended Next Steps</span>
          </div>
          <ul className="list-disc pl-4 space-y-1">
            {assessment.limitations.map((msg: string, idx: number) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 11-Stage Cultivation Plan (PRD Section 22) */}
      {cropPlan && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-forest-700" />
                <span>11-Stage Crop Management Schedule</span>
              </h2>
              <p className="text-xs text-gray-500">
                Actionable seasonal timeline derived from AfricaRice & FAO Crop Calendar protocols.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {cropPlan.tasks?.map((t: any) => (
              <div
                key={t.id}
                className={`p-3.5 rounded-xl border flex items-start space-x-3 transition ${
                  t.completion_status === 'completed' ? 'bg-forest-50/50 border-forest-200 opacity-80' : 'bg-white border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={t.completion_status === 'completed'}
                  onChange={() => handleToggleTask(t.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-forest-600 focus:ring-forest-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className={`font-bold text-sm ${
                      t.completion_status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {t.title}
                    </span>
                    <span className="text-[11px] font-semibold text-forest-800 bg-forest-50 px-2 py-0.5 rounded">
                      {t.stage}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1 leading-relaxed">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
