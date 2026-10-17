'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, MapPin, Compass, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-forest-900 flex items-center justify-center text-white font-bold">
              <Sprout className="w-4 h-4 text-forest-300" />
            </div>
            <span className="text-xl font-bold text-gray-900">Farm<span className="text-forest-600">Intelligence</span></span>
          </Link>
          <Link href="/login" className="text-xs font-semibold text-gray-700 hover:text-forest-900">Sign In</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950">How Farm Intelligence Operates</h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            A transparent walkthrough of our spatial evaluation, biophysical suitability calculation, and seasonal guidance.
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-forest-900 text-white flex items-center justify-center font-bold shrink-0">1</div>
            <div className="space-y-1 text-sm">
              <h3 className="font-bold text-gray-900">Field Geometry & Centroid Extraction</h3>
              <p className="text-gray-600">
                You demarcate your farm boundary using our touch-friendly map or enter GPS pins. The platform projects the polygon onto WGS84, validates topological integrity, computes acreage in hectares, and determines your exact Nigerian agroecological zone.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-forest-900 text-white flex items-center justify-center font-bold shrink-0">2</div>
            <div className="space-y-1 text-sm">
              <h3 className="font-bold text-gray-900">Agroclimatic & Soil Data Synthesis</h3>
              <p className="text-gray-600">
                The backend queries 30-year historical NASA POWER precipitation and temperature distributions alongside ISRIC SoilGrids topsoil properties (pH, organic carbon, texture) and Nigerian National Soil Health baselines.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-forest-900 text-white flex items-center justify-center font-bold shrink-0">3</div>
            <div className="space-y-1 text-sm">
              <h3 className="font-bold text-gray-900">Biophysical Rule-Based Suitability Scoring</h3>
              <p className="text-gray-600">
                Critical thermal and water thresholds are checked before computing a multi-factor score. We apply AfricaRice, IITA, and FAO Crop Calendar rules to highlight limiting factors and generate vector suitability zones.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-forest-900 text-white flex items-center justify-center font-bold shrink-0">4</div>
            <div className="space-y-1 text-sm">
              <h3 className="font-bold text-gray-900">11-Stage Crop Management Schedule</h3>
              <p className="text-gray-600">
                Based on your planting date, the system outputs an actionable timeline covering land preparation, certified seed sourcing, split nitrogen top-dressing, and harvest readiness with PICS hermetic storage standards.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-6">
          <Link
            href="/sign-up"
            className="inline-flex items-center space-x-2 bg-forest-900 hover:bg-forest-950 text-white font-semibold px-6 py-3 rounded-xl shadow-sm text-sm"
          >
            <span>Analyze Your Land Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
