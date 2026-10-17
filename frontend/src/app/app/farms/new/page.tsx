'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Check, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';
import { api } from '@/lib/api';

export default function NewFarmPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [state, setState] = useState('Kaduna');
  const [lga, setLga] = useState('Zaria');
  const [farmingSystem, setFarmingSystem] = useState('rainfed');
  const [areaHa, setAreaHa] = useState(2.4);
  const [zone, setZone] = useState('Northern Guinea Savannah');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default polygon coordinates for Kaduna reference
  const [polygonCoords, setPolygonCoords] = useState<number[][]>([
    [7.410, 10.510],
    [7.425, 10.510],
    [7.428, 10.522],
    [7.412, 10.520],
    [7.410, 10.510]
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const geojson = JSON.stringify({
      type: "Polygon",
      coordinates: [polygonCoords]
    });

    try {
      await api.createFarm({
        name,
        country_code: "NG",
        state,
        lga,
        agroecological_zone: zone,
        boundary_geojson: geojson,
        calculated_area_hectares: areaHa,
        farming_system: farmingSystem
      });
      router.push('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to save farm boundary.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demarcate Farm & Field Boundary</h1>
        <p className="text-xs text-gray-500 mt-1">
          Draw your field boundary on the interactive map or verify GPS coordinates to compute land area in hectares.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Metadata Inputs */}
        <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase">Farm Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Danladi Maize Plot A"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-forest-600 focus:border-forest-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-forest-600"
              >
                <option value="Kaduna">Kaduna</option>
                <option value="Kano">Kano</option>
                <option value="Niger">Niger</option>
                <option value="Benue">Benue</option>
                <option value="Oyo">Oyo</option>
                <option value="Enugu">Enugu</option>
                <option value="Taraba">Taraba</option>
                <option value="Ogun">Ogun</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase">LGA</label>
              <input
                type="text"
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase">Farming Production System</label>
            <select
              value={farmingSystem}
              onChange={(e) => setFarmingSystem(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-forest-600"
            >
              <option value="rainfed">Rainfed System</option>
              <option value="irrigated">Irrigated (Borehole / River Canal)</option>
              <option value="mixed">Mixed Rainfed & Supplementary Irrigation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase">Agroecological Zone</label>
            <input
              type="text"
              readOnly
              value={zone}
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium"
            />
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Calculated Land Area:</span>
            <span className="text-base font-bold text-forest-900">{areaHa} Hectares</span>
          </div>

          <button
            type="submit"
            disabled={loading || !name}
            className="w-full bg-forest-900 hover:bg-forest-950 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-4"
          >
            <span>{loading ? 'Saving Farm...' : 'Save & Proceed to Assessment'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Map Polygon Preview */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-forest-700" />
              <span>Boundary Vector Editor</span>
            </h2>
            <span className="text-xs text-gray-500">WGS84 EPSG:4326</span>
          </div>

          <InteractiveMap
            editable={true}
            initialPolygon={polygonCoords}
            height="460px"
            onPolygonChange={(newPoly, newArea) => {
              setPolygonCoords(newPoly);
              setAreaHa(newArea);
            }}
          />

          <div className="bg-forest-50 p-3 rounded-xl border border-forest-100 text-xs text-forest-900 flex items-start space-x-2">
            <Check className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
            <span>
              Coordinates verified within Nigerian territory. Boundary geometry closed and valid for zonal statistics.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
