'use client';

import React, { useState } from 'react';
import { Layers, MapPin, Maximize2, ZoomIn, ZoomOut, Check, RefreshCw } from 'lucide-react';

interface InteractiveMapProps {
  initialPolygon?: number[][]; // [[lon, lat], ...]
  suitabilityZones?: any;     // GeoJSON FeatureCollection
  onPolygonChange?: (polygon: number[][], areaHa: number) => void;
  editable?: boolean;
  height?: string;
}

export default function InteractiveMap({
  initialPolygon = [],
  suitabilityZones,
  onPolygonChange,
  editable = false,
  height = '350px'
}: InteractiveMapProps) {
  // Default coordinates around central Nigeria (Kaduna / Abuja)
  const defaultCenter = [7.43, 9.08];
  
  const [points, setPoints] = useState<number[][]>(
    initialPolygon.length > 0 ? initialPolygon : [
      [7.410, 10.510],
      [7.425, 10.510],
      [7.428, 10.522],
      [7.412, 10.520],
      [7.410, 10.510]
    ]
  );
  
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'suitability' | 'satellite' | 'terrain'>('suitability');

  // Simple approximation calculation
  const calculateApproxAreaHa = (pts: number[][]) => {
    if (pts.length < 3) return 0;
    // rough approximation for Nigeria latitudes
    let area = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      area += (pts[i + 1][0] - pts[i][0]) * (pts[i + 1][1] + pts[i][1]);
    }
    const ha = Math.abs(area) * 0.5 * 111 * 111 * 100 * Math.cos(9.0 * Math.PI / 180);
    return Math.max(0.5, Math.round(ha * 10) / 10);
  };

  const currentArea = calculateApproxAreaHa(points);

  const resetToFarm = () => {
    if (initialPolygon.length > 0) {
      setPoints(initialPolygon);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-earth-50 shadow-inner flex flex-col" style={{ height }}>
      {/* Top Map Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 text-xs">
        <span className="font-semibold text-forest-900 flex items-center">
          <MapPin className="w-3.5 h-3.5 text-forest-600 mr-1" />
          Field Area:
        </span>
        <span className="font-bold text-gray-800">{currentArea} Hectares</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-600">Kaduna / NGS</span>
      </div>

      <div className="absolute top-3 right-3 z-10 flex space-x-1 bg-white/95 backdrop-blur p-1 rounded-lg shadow-sm border border-gray-200">
        <button 
          onClick={() => setActiveLayer(activeLayer === 'suitability' ? 'satellite' : 'suitability')}
          className={`px-2 py-1 text-xs font-medium rounded flex items-center space-x-1 ${
            activeLayer === 'suitability' ? 'bg-forest-900 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>{activeLayer === 'suitability' ? 'Suitability Zones' : 'Satellite Basemap'}</span>
        </button>
      </div>

      {/* SVG Interactive Map Canvas */}
      <div className="w-full flex-1 relative bg-gradient-to-b from-[#E2E8F0] to-[#CBD5E1] flex items-center justify-center overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#1B4332_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Render Field Polygon & Suitability Zones */}
        <svg viewBox="0 0 400 300" className="w-full h-full max-w-lg p-6">
          <defs>
            <linearGradient id="primeZone" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#1B4332" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="constraintZone" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#52B788" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#40916C" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Farm Boundary Polygon */}
          <polygon
            points="60,60 320,50 340,240 80,230"
            fill="url(#primeZone)"
            stroke="#1B4332"
            strokeWidth="3"
            strokeDasharray={editable ? "4 4" : "none"}
            className="transition-all duration-300 drop-shadow-md"
          />

          {/* Sub-zone Overlay: Sector B (Constraint Zone) */}
          <polygon
            points="180,55 320,50 340,240 220,235"
            fill="url(#constraintZone)"
            stroke="#2D6A4F"
            strokeWidth="1.5"
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setSelectedZone("Sector B (Suitable with Drainage Constraints)")}
          />

          {/* Boundary Pins */}
          <circle cx="60" cy="60" r="5" fill="#FFFFFF" stroke="#1B4332" strokeWidth="2.5" />
          <circle cx="320" cy="50" r="5" fill="#FFFFFF" stroke="#1B4332" strokeWidth="2.5" />
          <circle cx="340" cy="240" r="5" fill="#FFFFFF" stroke="#1B4332" strokeWidth="2.5" />
          <circle cx="80" cy="230" r="5" fill="#FFFFFF" stroke="#1B4332" strokeWidth="2.5" />

          {/* Field Label */}
          <text x="140" y="145" fill="#FFFFFF" fontSize="13" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.5))">
            Sector A (Prime)
          </text>
          <text x="140" y="162" fill="#D8F3DC" fontSize="10" textAnchor="middle">
            Score: 88.5% • Highly Suitable
          </text>

          <text x="270" y="145" fill="#FFFFFF" fontSize="13" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.5))">
            Sector B
          </text>
          <text x="270" y="162" fill="#D8F3DC" fontSize="10" textAnchor="middle">
            Score: 74.0% • Constraints
          </text>
        </svg>

        {/* Selected Zone Toast */}
        {selectedZone && (
          <div className="absolute bottom-12 left-4 right-4 bg-white/95 backdrop-blur border border-forest-600 px-3 py-2 rounded-lg shadow-md text-xs flex justify-between items-center">
            <span className="font-medium text-forest-900">{selectedZone}</span>
            <button onClick={() => setSelectedZone(null)} className="text-gray-400 hover:text-gray-600 font-bold ml-2">×</button>
          </div>
        )}
      </div>

      {/* Map Legend Footer */}
      <div className="bg-white border-t border-gray-200 px-3 py-2 flex flex-wrap items-center justify-between text-[11px] text-gray-600">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B4332]" />
            <span>Highly Suitable (80-100%)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#52B788]" />
            <span>Suitable with Constraints (60-79%)</span>
          </span>
        </div>
        <div className="flex items-center space-x-1 text-gray-500 font-mono text-[10px]">
          <span>EPSG:4326 (WGS84)</span>
        </div>
      </div>
    </div>
  );
}
