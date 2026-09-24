import React, { useState, useEffect } from 'react';
import { Search, MapPin, Globe, ExternalLink, Sparkles, Navigation, Loader2, BookOpen, AlertCircle, Compass, CheckCircle2, ChevronRight, Layers, RefreshCw } from 'lucide-react';
import { groundingService, UNIVERSITY_COORDINATES } from '../services/groundingService';
import { GroundingResult, University } from '../types';
import { ASIA_COUNTRIES } from '../constants';

interface Props {
  initialUniversity?: University;
  initialMode?: 'search' | 'maps';
  onSelectUniversity?: (uni: University) => void;
  compact?: boolean;
}

export const LiveGroundingIntel: React.FC<Props> = ({
  initialUniversity,
  initialMode = 'search',
  onSelectUniversity,
  compact = false
}) => {
  const [mode, setMode] = useState<'search' | 'maps'>(initialMode);
  const [selectedUni, setSelectedUni] = useState<University | undefined>(initialUniversity);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GroundingResult | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Flatten all 60 universities for quick selection
  const allUniversities = React.useMemo(() => {
    return ASIA_COUNTRIES.flatMap(c => c.universities);
  }, []);

  const searchPresetQueries = [
    { label: "2026/2027 Application Deadlines", prompt: "What are the exact undergraduate and graduate application deadlines for international students for the 2026/2027 academic year?" },
    { label: "Government & University Scholarships", prompt: "What full and partial scholarships are available for international applicants, including stipend amounts, eligibility criteria, and application cutoffs?" },
    { label: "Language & Test Requirements", prompt: "What are the latest minimum IELTS, TOEFL, SAT, or regional entrance test scores required for competitive admissions?" },
    { label: "Student Visa & Work Rights", prompt: "What are the current student visa requirements and post-study work visa policies for international graduates in this country?" }
  ];

  const mapsPresetQueries = [
    { label: "Campus Transit & Nearest Metro", prompt: "Where is the main campus located, what are the nearest subway/train stations, and how do students get there from the airport?" },
    { label: "Student Dorms & Rental Districts", prompt: "What on-campus dormitories exist and what are the most popular, affordable student rental neighborhoods near campus?" },
    { label: "Libraries & Study Facilities", prompt: "What are the primary campus libraries, innovation labs, and 24/7 study areas available to students?" },
    { label: "Food, Cafes & Supermarkets", prompt: "What are the best student cafeterias, international/halal dining options, grocery stores, and study cafes directly around campus?" }
  ];

  // Geolocation detector
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setLocating(false);
      },
      (err) => {
        console.warn("Could not get user location:", err.message);
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const executeGrounding = async (overridePrompt?: string) => {
    const activePrompt = overridePrompt || query || (mode === 'search' ? searchPresetQueries[0].prompt : mapsPresetQueries[0].prompt);
    setLoading(true);
    setResult(null);

    try {
      if (mode === 'search') {
        const res = await groundingService.fetchSearchGroundedData(activePrompt, {
          universityName: selectedUni?.name,
          location: selectedUni?.location
        });
        setResult(res);
      } else {
        const res = await groundingService.fetchMapsGroundedData(activePrompt, {
          universityId: selectedUni?.id,
          universityName: selectedUni?.name,
          location: selectedUni?.location,
          userCoordinates: userLocation || undefined
        });
        setResult(res);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Run on initial load or university change if university is specified
  useEffect(() => {
    if (initialUniversity) {
      setSelectedUni(initialUniversity);
      executeGrounding(mode === 'search' ? searchPresetQueries[0].prompt : mapsPresetQueries[0].prompt);
    }
  }, [initialUniversity?.id, mode]);

  return (
    <div className={`rounded-[2.5rem] bg-[#161B22] border border-gray-800 shadow-2xl overflow-hidden ${compact ? 'p-6' : 'p-8 md:p-10'}`}>
      {/* Top Header & Tool Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> Grounded AI Engine
            </span>
            <span className="text-xs text-gray-500 font-mono">gemini-3.5-flash</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-white mt-2 flex items-center gap-3">
            {mode === 'search' ? (
              <>
                <Globe className="text-blue-400" size={28} /> Google Search Grounding
              </>
            ) : (
              <>
                <MapPin className="text-emerald-400" size={28} /> Google Maps Grounding
              </>
            )}
          </h3>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl font-medium">
            {mode === 'search'
              ? 'Current admissions, deadlines, scholarships, and visa research with source links for independent verification.'
              : 'Pinpoint campus spatial geography, nearest transit hubs, student dorms, and neighborhood amenities backed by Google Maps.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="inline-flex p-1.5 bg-[#0D1117] rounded-2xl border border-gray-800 shrink-0">
          <button
            onClick={() => { setMode('search'); setResult(null); }}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              mode === 'search'
                ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe size={16} /> Google Search
          </button>
          <button
            onClick={() => { setMode('maps'); setResult(null); }}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              mode === 'maps'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MapPin size={16} /> Google Maps
          </button>
        </div>
      </div>

      {/* Target University Selector */}
      <div className="pt-8 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-2">
            Target University Focus
          </label>
          <select
            value={selectedUni?.id || ''}
            onChange={(e) => {
              const uni = allUniversities.find(u => u.id === e.target.value);
              setSelectedUni(uni);
              if (onSelectUniversity && uni) onSelectUniversity(uni);
            }}
            className="w-full bg-[#0D1117] border border-gray-800 text-white rounded-2xl px-5 py-3.5 text-sm font-semibold focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="">All Premier Asian Universities (General Inquiry)</option>
            {allUniversities.map((uni) => (
              <option key={uni.id} value={uni.id}>
                {uni.name} — {uni.location} (Rank #{uni.ranking})
              </option>
            ))}
          </select>
        </div>

        {mode === 'maps' ? (
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-2">
              User Coordinates
            </label>
            <button
              onClick={handleDetectLocation}
              disabled={locating}
              className={`w-full py-3.5 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                userLocation
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-[#0D1117] border-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              {locating ? (
                <>
                  <Loader2 size={16} className="animate-spin text-emerald-400" /> Detecting GPS...
                </>
              ) : userLocation ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-400" /> GPS Active ({userLocation.latitude.toFixed(2)}, {userLocation.longitude.toFixed(2)})
                </>
              ) : (
                <>
                  <Navigation size={16} /> Detect My Location
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-2">
              Academic Cycle
            </label>
            <div className="bg-[#0D1117] border border-gray-800 text-emerald-400 font-mono font-bold text-xs rounded-2xl px-5 py-3.5 flex items-center justify-between">
              <span>2026 / 2027 Admissions</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Preset Quick Chips */}
      <div className="mb-6">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2.5">
          Recommended Grounded Inquiries
        </div>
        <div className="flex flex-wrap gap-2">
          {(mode === 'search' ? searchPresetQueries : mapsPresetQueries).map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(preset.prompt);
                executeGrounding(preset.prompt);
              }}
              className="px-4 py-2 rounded-xl bg-[#0D1117] hover:bg-[#1E2530] text-gray-300 hover:text-white border border-gray-800 hover:border-emerald-500/30 text-xs font-semibold transition-all text-left flex items-center gap-1.5"
            >
              <ChevronRight size={13} className={mode === 'search' ? 'text-blue-400' : 'text-emerald-400'} />
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query Bar */}
      <div className="relative mb-8">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500">
          {mode === 'search' ? <Search size={20} className="text-blue-400" /> : <MapPin size={20} className="text-emerald-400" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && executeGrounding()}
          placeholder={
            mode === 'search'
              ? `Ask anything about admissions, deadlines, or scholarships at ${selectedUni?.name || 'Asian universities'}...`
              : `Ask about transit, dormitories, neighborhood, or facilities around ${selectedUni?.name || 'campus'}...`
          }
          className="w-full bg-[#0D1117] border border-gray-800 rounded-2xl py-4 pl-14 pr-36 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
        />
        <button
          onClick={() => executeGrounding()}
          disabled={loading}
          className={`absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black flex items-center gap-2 transition-all ${
            mode === 'search'
              ? 'bg-blue-400 hover:bg-blue-300 shadow-md shadow-blue-400/20'
              : 'bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-400/20'
          } disabled:opacity-50`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          <span>Scan Intel</span>
        </button>
      </div>

      {/* Grounding Results Display */}
      {loading && (
        <div className="p-16 text-center bg-[#0D1117] rounded-3xl border border-gray-800 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <p className="text-base font-bold text-white">
            {mode === 'search'
              ? 'Searching live web data & official university portals...'
              : 'Querying Google Maps spatial records & campus neighborhood...'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Applying Grounding via gemini-3.5-flash with {mode === 'search' ? 'googleSearch' : 'googleMaps'} tool
          </p>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Main Grounded Text Card */}
          <div className="p-6 md:p-8 bg-[#0D1117] rounded-3xl border border-gray-800 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800/80">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                {result.groundingType === 'search' ? (
                  <span className="text-blue-400 flex items-center gap-1.5"><Globe size={14} /> Web Grounded Analysis</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5"><MapPin size={14} /> Maps Grounded Analysis</span>
                )}
                <span>•</span>
                <span className="text-gray-500">{result.timestamp}</span>
              </div>
              <button
                onClick={() => executeGrounding()}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                title="Refresh Intel"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {/* Markdown Body */}
            <div className="prose prose-invert max-w-none text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-normal">
              {result.text}
            </div>

            {/* Search Queries executed (if search) */}
            {result.searchQueries && result.searchQueries.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-800/60 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Google Search Queries:</span>
                {result.searchQueries.map((q, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-gray-800/60 text-gray-400 text-xs font-mono">
                    "{q}"
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Extracted Sources & Direct Links */}
          <div className="p-6 bg-[#0D1117] rounded-3xl border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                {result.groundingType === 'search' ? (
                  <>
                    <Globe size={16} className="text-blue-400" /> Official Web Sources ({result.sources.length})
                  </>
                ) : (
                  <>
                    <MapPin size={16} className="text-emerald-400" /> Google Maps Direct Places ({result.sources.length})
                  </>
                )}
              </h4>
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                Direct External Links
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {result.sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group ${
                    src.type === 'maps'
                      ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-400 hover:bg-emerald-900/30'
                      : 'bg-blue-950/20 border-blue-500/20 hover:border-blue-400 hover:bg-blue-900/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {src.title}
                    </span>
                    <ExternalLink size={14} className="text-gray-400 group-hover:text-white shrink-0 mt-0.5" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono truncate">
                    {src.uri.replace(/^https?:\/\/(www\.)?/, '')}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State Prompt */}
      {!loading && !result && (
        <div className="p-12 text-center bg-[#0D1117] rounded-3xl border border-gray-800/80">
          <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-3 text-gray-400">
            {mode === 'search' ? <Globe size={24} className="text-blue-400" /> : <MapPin size={24} className="text-emerald-400" />}
          </div>
          <h4 className="text-base font-bold text-white">
            {mode === 'search' ? 'Scan Official Admissions & Deadlines' : 'Explore Campus Location & Transit'}
          </h4>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            Choose a recommended inquiry chip above or enter your custom question to run a grounded scan via gemini-3.5-flash.
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveGroundingIntel;
