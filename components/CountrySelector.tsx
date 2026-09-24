
import React from 'react';
import { ASIA_COUNTRIES } from '../constants';
import { Country } from '../types';
import { MapPin, ArrowRight, ChevronLeft, Globe } from 'lucide-react';

interface Props {
  onSelectCountry: (countryName: string) => void;
  fullView?: boolean;
  onBack?: () => void;
}

const CountrySelector: React.FC<Props> = ({ onSelectCountry, fullView, onBack }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-8 duration-700">
      {fullView && (
        <div className="mb-16">
          <button 
            onClick={onBack} 
            className="mb-8 text-emerald-400 font-black flex items-center gap-2 group hover:text-white transition-colors uppercase tracking-widest text-xs"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-800 pb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-4 flex items-center gap-4">
                <Globe className="text-emerald-400" size={40} /> Regional Hubs
              </h2>
              <p className="text-gray-500 text-lg font-medium max-w-2xl">
                Explore 12 premier academic destinations across Asia, from technical powerhouses in the East to emerging research hubs in Central Asia.
              </p>
            </div>
            <div className="bg-[#1A1F26] px-6 py-4 rounded-3xl border border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Total Countries Tracked: <span className="text-emerald-400 ml-2">{ASIA_COUNTRIES.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ASIA_COUNTRIES.map((country) => (
          <button
            key={country.id}
            onClick={() => onSelectCountry(country.name)}
            className="group relative h-56 bg-[#1A1F26] rounded-[2.5rem] border border-gray-800 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden text-left shadow-xl"
          >
            <div className="p-8 h-full flex flex-col justify-between relative z-10">
              <div>
                <span className="text-5xl block mb-4 group-hover:scale-110 transition-transform origin-left">{country.flag}</span>
                <h3 className="text-2xl font-black group-hover:text-emerald-400 transition-colors leading-tight">{country.name}</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{country.difficultyLabel}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-emerald-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                Explore Institutions <ArrowRight size={14} />
              </div>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <MapPin size={100} />
            </div>
            {/* Background Gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default CountrySelector;
