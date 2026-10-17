'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, Check, ArrowRight } from 'lucide-react';

export default function PricingPage() {
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950">
            Transparent Agronomic Intelligence Plans
          </h1>
          <p className="text-sm text-gray-600">
            Field-specific suitability, planting calendars, and spatial intelligence calibrated for Nigerian agriculture and scalable internationally.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Free */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-gray-900">Free Explore</h3>
              <p className="text-xs text-gray-500">Essential boundary mapping & basic crop suitability.</p>
              <div className="text-3xl font-extrabold text-gray-900">₦0<span className="text-xs font-normal text-gray-500">/mo</span></div>
              <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t">
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>1 farm plot</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>3 assessments/month</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Basic planting calendar</span></li>
              </ul>
            </div>
            <Link href="/sign-up" className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold text-center block">
              Get Started
            </Link>
          </div>

          {/* Farmer Plus */}
          <div className="bg-white p-6 rounded-2xl border-2 border-forest-600 shadow-md space-y-4 flex flex-col justify-between relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-forest-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase">
              Most Popular
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-gray-900">Farmer Plus</h3>
              <p className="text-xs text-gray-500">For commercial smallholders & expanding growers.</p>
              <div className="text-3xl font-extrabold text-forest-900">₦3,000<span className="text-xs font-normal text-gray-500">/mo</span></div>
              <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t">
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Up to 5 farm plots</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>25 assessments/month</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>11-stage cultivation plan</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>PDF report exports</span></li>
              </ul>
            </div>
            <Link href="/sign-up" className="w-full py-2 bg-forest-900 hover:bg-forest-950 text-white rounded-lg text-xs font-bold text-center block shadow-sm">
              Subscribe with Paystack
            </Link>
          </div>

          {/* Professional */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-gray-900">Professional</h3>
              <p className="text-xs text-gray-500">Commercial managers & agricultural consultants.</p>
              <div className="text-3xl font-extrabold text-gray-900">₦15,000<span className="text-xs font-normal text-gray-500">/mo</span></div>
              <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t">
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Up to 25 farm plots</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>150 assessments/month</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Yield estimation scenarios</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Priority agronomy review</span></li>
              </ul>
            </div>
            <Link href="/sign-up" className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold text-center block">
              Choose Professional
            </Link>
          </div>

          {/* Organization */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-gray-900">Organization</h3>
              <p className="text-xs text-gray-500">Cooperatives, input providers & extension bodies.</p>
              <div className="text-3xl font-extrabold text-gray-900">Custom</div>
              <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t">
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Unlimited farmer profiles</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Bulk geospatial batching</span></li>
                <li className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-600" /><span>Dedicated account manager</span></li>
              </ul>
            </div>
            <Link href="/sign-up" className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold text-center block">
              Contact Sales
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
