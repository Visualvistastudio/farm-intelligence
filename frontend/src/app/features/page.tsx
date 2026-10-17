'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, MapPin, Compass, Calendar, BarChart3, ShieldCheck, ArrowRight } from 'lucide-react';

export default function FeaturesPage() {
  const features = [
    { title: "Mobile Field Boundary Demarcation", desc: "Touch-friendly polygon drawing with real-time geodesic area calculation in hectares.", icon: MapPin },
    { title: "7 Nigerian Agroecological Zones", desc: "Automated latitude/longitude zoning from Sahel to Mangrove Swamp.", icon: Compass },
    { title: "Evidence-Backed Suitability Scoring", desc: "Multi-factor evaluation (Climate 35%, Soil 35%, Water 20%, Terrain 10%) without fabricated answers.", icon: Sprout },
    { title: "Calibrated Yield Estimation Ranges", desc: "Lower and upper production ranges using AfricaRice & IITA models with transparent uncertainty.", icon: BarChart3 },
    { title: "11-Stage Cultivation Plan", desc: "Dynamic schedule with tasks from pre-planting composite soil testing to hermetic bag storage.", icon: Calendar },
    { title: "Paystack Nigerian Payment Gateway", desc: "Integrated local subscriptions with test/live mode and automated webhook activation.", icon: ShieldCheck },
  ];

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950">Platform Capabilities</h1>
          <p className="text-sm text-gray-600">
            A comprehensive overview of Farm Intelligence’s geospatial, agronomic, and operational features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-forest-900 text-white flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5 text-forest-300" />
                </div>
                <h3 className="font-bold text-base text-gray-900">{f.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-8">
          <Link
            href="/sign-up"
            className="inline-flex items-center space-x-2 bg-forest-900 hover:bg-forest-950 text-white font-semibold px-6 py-3 rounded-xl shadow-sm text-sm"
          >
            <span>Start Free Evaluation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
