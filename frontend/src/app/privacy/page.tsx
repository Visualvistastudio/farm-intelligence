'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Location Privacy Notice</h1>
        <div className="bg-forest-50 p-4 rounded-xl border border-forest-200 text-forest-950 font-medium">
          Farm boundaries and field coordinates are treated as commercially sensitive data (PRD Section 45).
        </div>
        <h2 className="text-sm font-bold text-gray-900">1. Private by Default</h2>
        <p>
          Your farm boundaries, field polygons, soil test uploads, and crop plans are strictly private to your authenticated account. No public or unauthenticated URL can view your farm coordinates.
        </p>
        <h2 className="text-sm font-bold text-gray-900">2. Satellite & Sensor Queries</h2>
        <p>
          When you request an assessment, coordinates are used strictly to retrieve agroclimatic time-series (NASA POWER) and soil properties (ISRIC / NFSHCS). Your boundaries are never shared with external third-party advertisers.
        </p>
        <h2 className="text-sm font-bold text-gray-900">3. Data Deletion Rights</h2>
        <p>
          You may archive your farms or request complete account erasure at any time via your account settings.
        </p>
      </main>
    </div>
  );
}
