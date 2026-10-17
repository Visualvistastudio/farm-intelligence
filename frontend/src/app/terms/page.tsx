'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-forest-900 flex items-center justify-center text-white font-bold">
              <Sprout className="w-4 h-4 text-forest-300" />
            </div>
            <span className="text-xl font-bold text-gray-900">Farm<span className="text-forest-600">Intelligence</span></span>
          </Link>
          <Link href="/" className="text-xs text-gray-600 hover:text-gray-900">Return Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-xs text-gray-700 leading-relaxed">
        <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
        <p className="font-semibold text-forest-800">
          Core Product Disclaimer (PRD Part A Section 1):
        </p>
        <p>
          Farm Intelligence is a decision-support platform designed to assist farmers, agronomists, and extension agents with spatial analysis, agroclimatic insights, and management planning. It does not guarantee harvest volumes, replace certified laboratory soil chemical analyses, or provide legally binding agronomic certification.
        </p>
        <h2 className="text-sm font-bold text-gray-900">1. Evidence & Uncertainty</h2>
        <p>
          All biophysical evaluations and yield estimates represent probabilistic models based on historical NASA POWER weather baselines, AfricaRice research, and ISRIC SoilGrids gridded soil estimations. Farmers should verify critical fertilizer inputs with localized field observations and laboratory testing.
        </p>
        <h2 className="text-sm font-bold text-gray-900">2. Subscription & Payments</h2>
        <p>
          Payments in Nigeria are securely processed through Paystack. Paid plans confer assessment and export quotas. Cancellations take effect at the conclusion of the active billing cycle.
        </p>
      </main>
    </div>
  );
}
