
import React, { useEffect, useMemo, useState } from 'react';
import { ASIA_COUNTRIES } from '../constants';
import { University, User } from '../types';
import { MapPin, ArrowRight, Search, TrendingUp, Heart, Map } from 'lucide-react';
import { loadSavedUniversities, setUniversitySaved, upsertApplication } from '../services/cloudData';

interface Props {
  onSelectUniversity: (uni: University) => void;
  countryFilter?: string;
  initialSearch?: string;
  currentUser?: User | null;
  onOpenAuth?: () => void;
}

const UniversityList: React.FC<Props> = ({ onSelectUniversity, countryFilter, initialSearch = '', currentUser, onOpenAuth }) => {
  const [search, setSearch] = useState(initialSearch);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser) loadSavedUniversities(currentUser.id).then(setSavedIds).catch(() => undefined);
    else setSavedIds([]);
  }, [currentUser?.id]);

  const toggleSaved = async (universityId: string) => {
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    const willSave = !savedIds.includes(universityId);
    setSavedIds(previous => willSave ? [...previous, universityId] : previous.filter(id => id !== universityId));
    try {
      await setUniversitySaved(currentUser.id, universityId, willSave);
      if (willSave) await upsertApplication(currentUser.id, universityId, 'shortlisted');
    } catch {
      setSavedIds(previous => willSave ? previous.filter(id => id !== universityId) : [...previous, universityId]);
    }
  };

  const allUnis = useMemo(() => {
    let list = ASIA_COUNTRIES.flatMap(c => c.universities);
    if (countryFilter) {
      const country = ASIA_COUNTRIES.find(c => c.name === countryFilter);
      if (country) list = country.universities;
    }
    return list.sort((a, b) => a.ranking - b.ranking);
  }, [countryFilter]);

  const filtered = allUnis.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.location.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div>
          <h2 className="text-4xl font-black mb-2 flex items-center gap-3">
            <TrendingUp className="text-emerald-400" /> Academic Leaders
          </h2>
          <p className="text-gray-500 font-medium">Top 60 universities in Asia sorted by global ranking.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search all 60 universities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1A1F26] border border-gray-800 rounded-2xl py-4 pl-14 pr-6 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-white"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#1A1F26] rounded-[2.5rem] p-12 text-center border border-gray-800 my-8">
          <p className="text-xl font-bold text-gray-300 mb-2">No institutions found matching your criteria</p>
          <p className="text-gray-500 mb-6">
            {countryFilter 
              ? `Admissions for ${countryFilter} partner campuses will open in the upcoming intake cycle.` 
              : "Try adjusting your search keywords."}
          </p>
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="px-6 py-3 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all text-sm"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((uni) => (
            <div 
              key={uni.id} 
              className="group bg-[#1A1F26] rounded-[2.5rem] border border-gray-800 hover:border-emerald-500/50 transition-all duration-500 overflow-hidden shadow-xl"
            >
              <div className="relative h-48">
                <img src={uni.image} alt={uni.name} loading="lazy" decoding="async" width="640" height="384" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${uni.name} ${uni.location}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-black text-emerald-300 shadow-lg backdrop-blur-md transition-colors hover:bg-emerald-500 hover:text-black"
                  aria-label={`Open ${uni.name} location in Google Maps`}
                >
                  <Map size={11} /> Location Map
                </a>
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-xl text-[10px] font-black text-emerald-400 border border-emerald-500/20">
                  REFERENCE RANK #{uni.ranking}
                </div>
                <button
                  onClick={() => toggleSaved(uni.id)}
                  aria-label={savedIds.includes(uni.id) ? `Remove ${uni.name} from shortlist` : `Save ${uni.name} to shortlist`}
                  className={`absolute bottom-4 right-4 z-10 rounded-xl border p-2.5 backdrop-blur-md transition-all ${savedIds.includes(uni.id) ? 'border-rose-400/50 bg-rose-500 text-white' : 'border-white/20 bg-black/50 text-white hover:bg-white hover:text-black'}`}
                >
                  <Heart size={17} fill={savedIds.includes(uni.id) ? 'currentColor' : 'none'} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#1A1F26] to-transparent" />
              </div>
              <div className="p-8 -mt-6 relative">
                <h3 className="text-xl font-black mb-1 leading-tight group-hover:text-emerald-400 transition-colors">{uni.name}</h3>
                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-6">
                  <MapPin size={14} className="text-emerald-500" /> {uni.location}
                </div>
                <button
                  onClick={() => onSelectUniversity(uni)}
                  className="w-full py-4 bg-[#252C36] group-hover:bg-emerald-500 text-gray-300 group-hover:text-black font-black rounded-xl flex items-center justify-center gap-2 transition-all transform"
                >
                  Strategy & Requirements <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UniversityList;
