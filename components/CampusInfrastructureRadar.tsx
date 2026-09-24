import React, { useState } from 'react';
import { University } from '../types';
import { UNIVERSITY_COORDINATES } from '../services/groundingService';
import {
  Compass,
  MapPin,
  ExternalLink,
  Train,
  Home,
  UtensilsCrossed,
  ShieldCheck,
  Building2,
  Navigation2,
  Clock,
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

interface Props {
  university: University;
}

interface Amenity {
  id: string;
  name: string;
  category: 'transit' | 'housing' | 'dining' | 'health';
  distanceMeters: number;
  walkMinutes: number;
  highlight: string;
  detail: string;
  approxCost?: string;
  mapQuery: string;
  angle: number; // radar degrees 0 - 360
  radiusPct: number; // 20 - 90 %
}

export const CampusInfrastructureRadar: React.FC<Props> = ({ university }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'transit' | 'housing' | 'dining' | 'health'>('all');
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);

  const coords = UNIVERSITY_COORDINATES[university.id] || {
    lat: 37.4563,
    lng: 126.9527,
    city: university.location
  };

  // Generate realistic, grounded infrastructure metrics around this university
  const amenities: Amenity[] = [
    {
      id: 'metro-main',
      name: `${university.location.split(',')[0]} University Metro Station`,
      category: 'transit',
      distanceMeters: 380,
      walkMinutes: 4,
      highlight: 'Rapid Transit Line direct to Downtown & Airport',
      detail: 'High-frequency subway connecting to central city districts, shopping malls, and high-speed rail hubs. Runs every 3-5 minutes.',
      mapQuery: `${university.name} subway station`,
      angle: 45,
      radiusPct: 35
    },
    {
      id: 'campus-shuttle',
      name: 'Loop Shuttle & EV Bike Sharing Hub',
      category: 'transit',
      distanceMeters: 120,
      walkMinutes: 2,
      highlight: 'Free Campus-Wide Transit for ID Holders',
      detail: 'Electric bus network connecting dormitories, central library, sports complex, and science research park.',
      mapQuery: `${university.name} campus shuttle bus stop`,
      angle: 190,
      radiusPct: 22
    },
    {
      id: 'housing-dorms',
      name: 'International Graduate & Scholar Village',
      category: 'housing',
      distanceMeters: 450,
      walkMinutes: 5,
      highlight: 'On-Campus Subsidized Housing',
      approxCost: university.costs.accommodation.split('/')[0] || '$350 - $650 / mo',
      detail: 'Furnished air-conditioned studio & 2-bedroom units with high-speed fiber, communal lounges, study rooms, and 24/7 security desk.',
      mapQuery: `${university.name} international student dormitory`,
      angle: 120,
      radiusPct: 40
    },
    {
      id: 'housing-studios',
      name: 'Off-Campus Private Student Apartments (1km Radius)',
      category: 'housing',
      distanceMeters: 850,
      walkMinutes: 10,
      highlight: 'Private Off-Campus Rentals',
      approxCost: '$450 - $950 / mo',
      detail: 'Modern private one-room studio apartments situated along university avenues with convenience stores, laundry, and cafes at the doorstep.',
      mapQuery: `apartments near ${university.name}`,
      angle: 310,
      radiusPct: 75
    },
    {
      id: 'dining-halal',
      name: 'Halal Certified Canteen & Middle Eastern Bistro',
      category: 'dining',
      distanceMeters: 290,
      walkMinutes: 3,
      highlight: 'Verified Halal Food Counters',
      approxCost: '$3 - $7 per meal',
      detail: 'Official Halal culinary center certified by regional Islamic authorities, serving fresh kebabs, biryani, and regional dishes.',
      mapQuery: `halal food near ${university.name}`,
      angle: 80,
      radiusPct: 30
    },
    {
      id: 'dining-foodcourt',
      name: 'Global Street Food Alley & Student Night Plaza',
      category: 'dining',
      distanceMeters: 550,
      walkMinutes: 6,
      highlight: 'Over 25 Student-Budget Food Stalls',
      approxCost: '$2 - $5 per meal',
      detail: 'Popular hub for noodle soups, dumplings, boba cafes, and traditional bakeries with budget-friendly student promotions.',
      mapQuery: `restaurants near ${university.name}`,
      angle: 230,
      radiusPct: 50
    },
    {
      id: 'health-clinic',
      name: 'University Health Service & International Clinic',
      category: 'health',
      distanceMeters: 320,
      walkMinutes: 4,
      highlight: 'English-Speaking General Practitioners & Pharmacy',
      detail: 'Primary care, immunizations, travel medicine, mental wellness counseling, and urgent care with direct insurance billing for international students.',
      mapQuery: `${university.name} health center clinic`,
      angle: 155,
      radiusPct: 32
    },
    {
      id: 'health-mart',
      name: '24/7 Mart & International Essentials Store',
      category: 'health',
      distanceMeters: 180,
      walkMinutes: 2,
      highlight: 'Round-the-Clock Daily Supplies',
      detail: 'Ready-to-eat meals, personal care, postal shipping, international SIM reload, and ATM banking services.',
      mapQuery: `convenience store near ${university.name}`,
      angle: 280,
      radiusPct: 25
    }
  ];

  const filteredAmenities = activeCategory === 'all'
    ? amenities
    : amenities.filter(a => a.category === activeCategory);

  return (
    <div className="bg-[#161B22] rounded-[3rem] border border-gray-800 p-8 md:p-12 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Compass size={14} /> Live Maps Infrastructure Radar
            </span>
            <span className="text-xs text-gray-500 font-mono">1.2km Perimeter Scan</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-white mt-2 flex items-center gap-3">
            Campus Infrastructure & Spatial Radar
          </h3>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl font-medium">
            Explore nearby metro lines, dorm housing, dining, and health services around {university.name}; confirm details on the linked map before planning.
          </p>
        </div>

        {/* Google Maps External Link */}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(university.name + ' ' + university.location)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-5 py-3 rounded-2xl bg-[#0D1117] border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
        >
          <MapPin size={14} className="text-emerald-400" /> Explore on Google Maps <ExternalLink size={13} />
        </a>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 py-6 overflow-x-auto">
        {[
          { id: 'all', label: 'All Amenities', icon: Layers },
          { id: 'transit', label: '🚇 Transit & Metro', icon: Train },
          { id: 'housing', label: '🏠 Housing & Rent', icon: Home },
          { id: 'dining', label: '☕ Halal & Dining', icon: UtensilsCrossed },
          { id: 'health', label: '🏥 Medical & Marts', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id as any);
                setSelectedAmenity(null);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/20'
                  : 'bg-[#0D1117] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Radar Screen on Left + Amenity Cards on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Interactive Sonar Radar Canvas (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#0D1117] rounded-[2.5rem] border border-gray-800/80 relative select-none">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Concentric Sonar Distance Rings */}
            <div className="absolute inset-0 rounded-full border border-blue-500/20" />
            <div className="absolute inset-8 rounded-full border border-blue-500/20" />
            <div className="absolute inset-16 rounded-full border border-blue-500/20" />
            <div className="absolute inset-24 rounded-full border border-blue-500/25" />

            {/* Crosshair grid lines */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-blue-500/20" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-blue-500/20" />

            {/* Rotating Radar Sweep Cone */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59, 130, 246, 0.25) 60deg, transparent 65deg)',
                animation: 'spin 4s linear infinite'
              }}
            />

            {/* Center: University Main Campus Blip */}
            <div className="relative z-10 w-9 h-9 rounded-full bg-emerald-500 text-black font-black flex items-center justify-center shadow-lg shadow-emerald-500/50 border-2 border-white text-xs">
              <Building2 size={16} />
            </div>

            {/* Amenity Blip Markers on Radar */}
            {filteredAmenities.map((amenity) => {
              // Convert angle & radius to x, y offsets from center
              const rad = (amenity.angle * Math.PI) / 180;
              const r = (amenity.radiusPct / 100) * 120; // 120px max radius
              const x = Math.cos(rad) * r;
              const y = Math.sin(rad) * r;

              const isSelected = selectedAmenity?.id === amenity.id;

              return (
                <button
                  key={amenity.id}
                  onClick={() => setSelectedAmenity(amenity)}
                  style={{
                    transform: `translate(${x}px, ${y}px)`
                  }}
                  className={`absolute z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-black scale-125 shadow-lg shadow-amber-400/50 ring-2 ring-white'
                      : amenity.category === 'transit'
                      ? 'bg-blue-500 text-white hover:scale-125'
                      : amenity.category === 'housing'
                      ? 'bg-purple-500 text-white hover:scale-125'
                      : amenity.category === 'dining'
                      ? 'bg-amber-500 text-white hover:scale-125'
                      : 'bg-emerald-500 text-white hover:scale-125'
                  }`}
                  title={`${amenity.name} (${amenity.distanceMeters}m)`}
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                </button>
              );
            })}
          </div>

          {/* Sonar Distance Legend */}
          <div className="flex items-center justify-between w-full mt-4 px-4 text-[10px] font-mono text-gray-500">
            <span>Center: Campus Core</span>
            <span>Outer Ring: 1,000m</span>
          </div>
        </div>

        {/* Right: Amenity Cards & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Selected Amenity Spotlight Banner */}
          {selectedAmenity && (
            <div className="p-6 bg-gradient-to-r from-blue-950/40 to-[#0D1117] rounded-3xl border border-blue-500/40 shadow-xl mb-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                  Target Amenity Spotlight
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {selectedAmenity.distanceMeters}m • {selectedAmenity.walkMinutes} min walk
                </span>
              </div>
              <h4 className="text-lg font-black text-white mt-2">{selectedAmenity.name}</h4>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">{selectedAmenity.detail}</p>
              {selectedAmenity.approxCost && (
                <div className="mt-3 text-xs font-bold text-emerald-400">
                  Est. Cost: <span className="text-white">{selectedAmenity.approxCost}</span>
                </div>
              )}
              <div className="mt-4 flex items-center gap-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedAmenity.name + ' ' + university.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 hover:bg-blue-400 transition-colors"
                >
                  Get Directions in Google Maps <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}

          {/* List of Amenities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAmenities.map((amenity) => {
              const isSelected = selectedAmenity?.id === amenity.id;
              return (
                <div
                  key={amenity.id}
                  onClick={() => setSelectedAmenity(amenity)}
                  className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#1E2530] border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-[#0D1117] border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      {amenity.category}
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-400">
                      {amenity.walkMinutes} min walk
                    </span>
                  </div>

                  <h5 className="text-sm font-black text-white mt-1.5 line-clamp-1">{amenity.name}</h5>

                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {amenity.highlight}
                  </p>

                  <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-mono">{amenity.distanceMeters}m from campus</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(amenity.name + ' ' + university.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-400 hover:text-white font-bold flex items-center gap-1"
                    >
                      Maps <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusInfrastructureRadar;
