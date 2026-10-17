'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sprout, MapPin, Calendar, BarChart3, ShieldCheck, ArrowRight, 
  CheckCircle2, Compass, Layers, AlertCircle, ChevronRight, Check
} from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 9.1 Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-lg bg-forest-900 flex items-center justify-center text-white font-bold shadow-sm">
              <Sprout className="w-5 h-5 text-forest-300" />
            </div>
            <span className="text-xl font-bold tracking-tight text-forest-950">
              Farm<span className="text-forest-600">Intelligence</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
            <Link href="#how-it-works" className="hover:text-forest-800 transition">How It Works</Link>
            <Link href="#features" className="hover:text-forest-800 transition">Features</Link>
            <Link href="#evidence" className="hover:text-forest-800 transition">Evidence & Data</Link>
            <Link href="#pricing" className="hover:text-forest-800 transition">Pricing</Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/admin/login" className="hidden sm:inline-flex text-xs font-semibold text-gray-500 hover:text-gray-900 px-2 py-1">
              Admin Portal
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-forest-900 px-3 py-2">
              Sign In
            </Link>
            <Link
              href="/app/crop-planner"
              className="bg-forest-900 hover:bg-forest-950 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-1.5"
            >
              <span>Analyze Your Farm</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 9.2 Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-forest-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-forest-100/80 border border-forest-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-forest-900">
                <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse" />
                <span>Nigeria’s Premier Field-Level Agronomy & Spatial Platform</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-950 tracking-tight leading-[1.15]">
                Make smarter farming decisions with <span className="text-forest-800">your land data.</span>
              </h1>

              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Understand crop suitability, plan your planting season, and explore your farm with AI-assisted agronomy and spatial intelligence grounded in validated agricultural science.
              </p>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                <Link
                  href="/sign-up"
                  className="bg-forest-900 hover:bg-forest-950 text-white text-base font-semibold px-7 py-3.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                >
                  <span>Start Free Field Assessment</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-base font-medium px-6 py-3.5 rounded-xl transition flex items-center justify-center"
                >
                  See How It Works
                </Link>
              </div>

              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-gray-100 text-left">
                <div>
                  <div className="text-2xl font-bold text-forest-900">9 Staples</div>
                  <div className="text-xs text-gray-500">Nigeria-tailored crops</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-forest-900">7 Zones</div>
                  <div className="text-xs text-gray-500">Agroecological mapping</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-forest-900">100% Traceable</div>
                  <div className="text-xs text-gray-500">Evidence before explanation</div>
                </div>
              </div>
            </div>

            {/* Visual Showcase: Map and Suitability Pill */}
            <div className="lg:col-span-5">
              <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between px-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-gray-700">Live Field Spatial Analysis</span>
                  </div>
                  <span className="text-[11px] font-mono bg-forest-50 text-forest-800 px-2 py-0.5 rounded font-semibold">
                    Zaria, Kaduna
                  </span>
                </div>
                <InteractiveMap height="320px" />
                
                {/* Result Pill */}
                <div className="bg-forest-50 border border-forest-200 rounded-xl p-3 flex items-start space-x-3">
                  <div className="p-2 bg-forest-900 text-white rounded-lg">
                    <Sprout className="w-5 h-5 text-forest-300" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-forest-950 uppercase tracking-wide">
                      Maize (SAMMAZ 15) • Highly Suitable (88.5%)
                    </div>
                    <div className="text-xs text-forest-800 mt-0.5">
                      Optimal planting window: June 1 – July 15. Expected yield: 3.8 – 4.6 t/ha.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9.3 Problem Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest-700">Real Agricultural Challenges</h2>
            <p className="text-3xl font-extrabold text-gray-950">
              Why farming without field-specific intelligence is risky
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Uncertain Planting Timing</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Erratic rainfall onset leads to premature planting or false starts, causing seed wastage and replanting costs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Mismatched Crop Choices</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Planting varieties unsuited to local soil acidity or dry spells severely diminishes yield potential.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Fragmented Advisory</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Generic regional tips fail to account for field boundaries, soil drainage variations, or realistic management inputs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9.4 How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest-700">Workflow</h2>
            <p className="text-3xl font-extrabold text-gray-950">
              Four steps from field coordinates to seasonal plan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-xl bg-forest-900 text-white flex items-center justify-center font-bold text-lg mx-auto md:mx-0 shadow-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900">Identify Field Boundary</h3>
              <p className="text-sm text-gray-600">
                Draw your farm plot on our mobile map or capture GPS boundary points. Area in hectares is calculated instantly.
              </p>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-xl bg-forest-900 text-white flex items-center justify-center font-bold text-lg mx-auto md:mx-0 shadow-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900">Select Crop & Conditions</h3>
              <p className="text-sm text-gray-600">
                Select your intended staple (Maize, Rice, Cassava, etc.) and specify rainfed or irrigated production system.
              </p>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-xl bg-forest-900 text-white flex items-center justify-center font-bold text-lg mx-auto md:mx-0 shadow-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900">Analyze Spatial Suitability</h3>
              <p className="text-sm text-gray-600">
                Our backend evaluates 30-year NASA agroclimatology, soil properties, and AfricaRice/FAO rules to map suitability zones.
              </p>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-xl bg-forest-900 text-white flex items-center justify-center font-bold text-lg mx-auto md:mx-0 shadow-sm">
                4
              </div>
              <h3 className="text-lg font-bold text-gray-900">Follow 11-Stage Plan</h3>
              <p className="text-sm text-gray-600">
                Track actionable tasks from land prep to harvest, with transparent yield estimation bounds and PDF report export.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9.6 Evidence & Trust Section */}
      <section id="evidence" className="py-16 bg-forest-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest-300">Scientific Foundation</h2>
            <p className="text-3xl font-extrabold text-white">
              Evidence Before Explanation
            </p>
            <p className="text-sm text-gray-300">
              We do not fabricate calculations or promise unrealistic harvests. Every insight is traceable to approved agronomic sources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-forest-900/60 p-6 rounded-xl border border-forest-800 space-y-2">
              <div className="text-forest-300 font-bold text-sm">NASA POWER Agroclimatology</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                30-year historical precipitation and temperature records inform growing-season length and thermal constraints.
              </p>
            </div>

            <div className="bg-forest-900/60 p-6 rounded-xl border border-forest-800 space-y-2">
              <div className="text-forest-300 font-bold text-sm">AfricaRice / RiceAdvice</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Calibrated crop management principles, variety suitability, and split nitrogen fertilizer timing.
              </p>
            </div>

            <div className="bg-forest-900/60 p-6 rounded-xl border border-forest-800 space-y-2">
              <div className="text-forest-300 font-bold text-sm">ISRIC SoilGrids & NFSHCS</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Gridded topsoil pH, texture, and organic matter calibrated with Nigerian soil health reference baselines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9.7 Pricing Preview */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest-700">Transparent Plans</h2>
            <p className="text-3xl font-extrabold text-gray-950">
              Affordable agronomic intelligence for every farm size
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Free Explore</h3>
                <p className="text-sm text-gray-600">Essential field mapping and basic crop suitability assessment.</p>
                <div className="text-4xl font-extrabold text-gray-950">₦0<span className="text-sm font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-2 text-sm text-gray-600 pt-4 border-t border-gray-100">
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>1 registered farm plot</span></li>
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>3 suitability assessments / mo</span></li>
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>Basic planting calendar</span></li>
                </ul>
              </div>
              <Link href="/sign-up" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 rounded-lg text-center text-sm transition">
                Start Free
              </Link>
            </div>

            {/* Farmer Plus */}
            <div className="bg-white p-8 rounded-2xl border-2 border-forest-600 shadow-lg space-y-6 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-forest-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Farmer Plus</h3>
                <p className="text-sm text-gray-600">Comprehensive crop planning and seasonal reminders for expanding farmers.</p>
                <div className="text-4xl font-extrabold text-forest-900">₦3,000<span className="text-sm font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-2 text-sm text-gray-600 pt-4 border-t border-gray-100">
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>Up to 5 registered farms</span></li>
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>25 assessments / month</span></li>
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>11-stage crop management plan</span></li>
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>Downloadable PDF farm reports</span></li>
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>Seasonal planting reminders</span></li>
                </ul>
              </div>
              <Link href="/sign-up" className="w-full bg-forest-900 hover:bg-forest-950 text-white font-semibold py-2.5 rounded-lg text-center text-sm transition shadow-sm">
                Get Started
              </Link>
            </div>

            {/* Professional */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Professional</h3>
                <p className="text-sm text-gray-600">For commercial farm managers, input providers, and agricultural consultants.</p>
                <div className="text-4xl font-extrabold text-gray-950">₦15,000<span className="text-sm font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-2 text-sm text-gray-600 pt-4 border-t border-gray-100">
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>Up to 25 registered farms</span></li>
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>150 assessments / month</span></li>
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>Calibrated yield estimation scenarios</span></li>
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>Advanced spatial reports & export</span></li>
                  <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-600" /><span>Priority agronomic support</span></li>
                </ul>
              </div>
              <Link href="/sign-up" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 rounded-lg text-center text-sm transition">
                Choose Professional
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-white">
            <Sprout className="w-5 h-5 text-forest-400" />
            <span className="font-bold">Farm Intelligence</span>
            <span className="text-xs text-gray-500">© 2026</span>
          </div>
          <div className="flex space-x-6 text-xs">
            <Link href="/privacy" className="hover:text-white transition">Privacy Notice</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/admin/login" className="hover:text-white transition">Admin Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
