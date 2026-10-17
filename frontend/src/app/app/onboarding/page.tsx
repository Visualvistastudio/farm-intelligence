'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sprout, Check, ArrowRight, MapPin, Compass } from 'lucide-react';
import { api } from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [purpose, setPurpose] = useState('commercial');
  const [farmingSystem, setFarmingSystem] = useState('rainfed');
  const [state, setState] = useState('Kaduna');
  const [farmName, setFarmName] = useState('My First Farm Plot');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.createFarm({
        name: farmName,
        country_code: 'NG',
        state,
        agroecological_zone: 'Northern Guinea Savannah',
        calculated_area_hectares: 2.5,
        farming_system: farmingSystem,
        boundary_geojson: JSON.stringify({
          type: "Polygon",
          coordinates: [[[7.410, 10.510], [7.425, 10.510], [7.428, 10.522], [7.412, 10.520], [7.410, 10.510]]]
        })
      });
      router.push('/app');
    } catch {
      router.push('/app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
        <span>Step {step} of 4</span>
        <span>{step === 1 ? 'Welcome' : step === 2 ? 'Profile' : step === 3 ? 'Location' : 'Ready'}</span>
      </div>
      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
        <div className="bg-forest-600 h-1.5 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        {step === 1 && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-forest-900 text-white flex items-center justify-center mx-auto shadow-md">
              <Sprout className="w-9 h-9 text-forest-300" />
            </div>
            <h1 className="text-2xl font-bold text-gray-950">Welcome to Farm Intelligence</h1>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
              Empowering farmers across Nigeria with satellite agroclimatology, field-level soil analysis, and validated crop calendars.
            </p>
            <button
              onClick={() => setStep(2)}
              className="bg-forest-900 hover:bg-forest-950 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-sm transition inline-flex items-center space-x-2 mt-4"
            >
              <span>Set Up My Farming Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">What is your primary farming objective?</h2>
            <div className="space-y-2">
              {[
                { id: 'commercial', title: 'Commercial Grain / Cash Crop Production', desc: 'Maximizing yield per hectare for market sales.' },
                { id: 'household', title: 'Household Food Security', desc: 'Producing staple food crops for family consumption.' },
                { id: 'extension', title: 'Extension / Agricultural Advisory', desc: 'Managing advisory for multiple smallholder outgrowers.' }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setPurpose(opt.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer text-xs transition ${
                    purpose === opt.id ? 'border-forest-600 bg-forest-50/70 ring-1 ring-forest-600' : 'border-gray-200'
                  }`}
                >
                  <div className="font-bold text-gray-900">{opt.title}</div>
                  <div className="text-gray-500 mt-0.5">{opt.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full bg-forest-900 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm flex items-center justify-center space-x-1 mt-4"
            >
              <span>Next: Location Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Where is your land located?</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase">State in Nigeria</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="Kaduna">Kaduna (Northern Guinea Savannah)</option>
                <option value="Kano">Kano (Sudan Savannah)</option>
                <option value="Benue">Benue (Southern Guinea Savannah)</option>
                <option value="Niger">Niger (Southern Guinea Savannah)</option>
                <option value="Oyo">Oyo (Derived Savannah)</option>
                <option value="Enugu">Enugu (Derived Savannah)</option>
                <option value="Ogun">Ogun (Humid Forest)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase">Water Supply System</label>
              <select
                value={farmingSystem}
                onChange={(e) => setFarmingSystem(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="rainfed">Rainfed (Seasonal Rainfall)</option>
                <option value="irrigated">Full Irrigation</option>
                <option value="mixed">Mixed System</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase">Farm Name</label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <button
              onClick={() => setStep(4)}
              className="w-full bg-forest-900 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm flex items-center justify-center space-x-1 mt-4"
            >
              <span>Review Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-950">You're All Set!</h2>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-left space-y-1.5 text-gray-700">
              <div>• Farm: <strong>{farmName}</strong></div>
              <div>• Region: <strong>{state}, Nigeria</strong></div>
              <div>• Farming System: <strong className="capitalize">{farmingSystem}</strong></div>
              <div>• Initial Acreage: <strong>2.5 Hectares</strong></div>
            </div>

            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full bg-forest-900 hover:bg-forest-950 text-white font-semibold text-xs py-3 rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Creating Farm...' : 'Go to Farmer Dashboard →'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
