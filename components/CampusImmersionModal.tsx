import React, { useState, useEffect, useRef } from 'react';
import { University } from '../types';
import { UNIVERSITY_COORDINATES } from '../services/groundingService';
import { campusAudio } from '../services/audioService';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sun,
  Moon,
  Compass,
  MapPin,
  ExternalLink,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  BookOpen,
  Home,
  Coffee,
  Building,
  Navigation,
  Info,
  Check
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  university: University;
}

interface CampusScene {
  id: string;
  name: string;
  tag: string;
  icon: any;
  panQuery: string;
  narrativeDay: string;
  narrativeNight: string;
  hotspots: {
    x: number; // percentage
    y: number; // percentage
    label: string;
    description: string;
    type: 'study' | 'dorm' | 'food' | 'transit';
  }[];
}

export const CampusImmersionModal: React.FC<Props> = ({ isOpen, onClose, university }) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [timeMode, setTimeMode] = useState<'day' | 'night'>('day');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isStreetViewMode, setIsStreetViewMode] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [audioTranscript, setAudioTranscript] = useState('');
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const coords = UNIVERSITY_COORDINATES[university.id] || {
    lat: 37.4563,
    lng: 126.9527,
    city: university.location
  };

  // Define 4 rich, thematic campus immersion zones
  const scenes: CampusScene[] = [
    {
      id: 'main-gate',
      name: `${university.name} Grand Entrance & Plaza`,
      tag: 'Campus Landmark',
      icon: Building,
      panQuery: 'main gate entrance plaza',
      narrativeDay: `Welcome to ${university.name} in ${university.location}! You are currently standing at the iconic campus grand gate. In front of you, wide pedestrian boulevards stretch toward the academic core. International students and researchers from across the globe gather here each morning, with campus shuttle buses and rapid metro stations just a 3-minute stroll away.`,
      narrativeNight: `As dusk settles over ${university.location}, the grand entrance of ${university.name} lights up with ambient architectural illumination. Students gather around the central fountain after evening seminars, heading to nearby lively student bistros and metro connections.`,
      hotspots: [
        { x: 28, y: 45, label: 'Central University Shuttle Stop', description: 'Free eco-friendly student shuttles looping across campus every 6 minutes.', type: 'transit' },
        { x: 50, y: 35, label: 'Honor Monument & Ceremonial Gate', description: 'Historic landmark where incoming freshmen take graduation and induction photos.', type: 'study' },
        { x: 74, y: 52, label: 'International Student Service Center', description: 'English-speaking office providing visa renewals, SIM cards, and student registration.', type: 'study' }
      ]
    },
    {
      id: 'library-commons',
      name: 'Central Research Library & Digital Commons',
      tag: 'Academic Core',
      icon: BookOpen,
      panQuery: 'central university library study commons',
      narrativeDay: `Step inside the heart of ${university.name}'s academic horsepower: the Central Research Library. Equipped with over five million physical volumes, gigabit research workstations, and silent glass study pods. You can hear the quiet concentration of ambitious minds working on patents, global economics, and cutting-edge publications.`,
      narrativeNight: `At 10:00 PM, the 24/7 designated study wings remain alive with focused energy. Warm desk lamps glow across multiple floors as study groups whiteboard ideas for international hackathons and upcoming midterm defense presentations.`,
      hotspots: [
        { x: 35, y: 40, label: '24/7 Global Study Pods', description: 'Ergonomic pods with noise cancellation and high-speed research intranet access.', type: 'study' },
        { x: 62, y: 32, label: 'Special Collections & Archives', description: 'Rare manuscripts and government research repositories.', type: 'study' },
        { x: 78, y: 65, label: 'Campus Roast Cafe & Commons', description: 'Specialty coffee bar with student discounts and pastry bar.', type: 'food' }
      ]
    },
    {
      id: 'student-hub',
      name: 'Global Village, Student Dining & Night Hub',
      tag: 'Student Life',
      icon: Coffee,
      panQuery: 'student union food court plaza',
      narrativeDay: `Here in the Student Union and Global Canteen, the aroma of fresh noodles, rice bowls, and artisan coffee fills the air. With halal-certified counters, vegetarian selections, and regional street foods priced at only 3 to 6 dollars, it is the social crossroads of campus.`,
      narrativeNight: `Night brings this district alive! Campus musical clubs rehearse on open lawns, language-exchange tables chat in multilingual harmony, and late-night convenience marts serve fresh snacks to students returning from the labs.`,
      hotspots: [
        { x: 25, y: 55, label: 'Halal & International Food Hall', description: 'Six dedicated counters offering verified Halal, Vegetarian, and pan-Asian dishes.', type: 'food' },
        { x: 52, y: 42, label: 'Student Union Amphitheatre', description: 'Host of annual cultural festivals, university TEDx talks, and robotics showcases.', type: 'study' },
        { x: 75, y: 58, label: 'Campus Convenience & Mart', description: 'Open 24 hours for essentials, instant ramyeon, and school stationery supplies.', type: 'transit' }
      ]
    },
    {
      id: 'residential-quad',
      name: 'International Dormitories & Residential Quad',
      tag: 'Residential Life',
      icon: Home,
      panQuery: 'international student dormitories residence hall',
      narrativeDay: `Welcome to the International Residence Quad. Modern twin and single suites feature private fiber-optic internet, floor kitchens, fitness centers, and panoramic mountain or skyline views. Living on campus places you only a 7-minute walk from any morning lecture.`,
      narrativeNight: `Inside the dorm common lounge, students from 40 different countries are cooking dinner together, studying collaborative problem sets, and planning weekend excursions around ${university.location}.`,
      hotspots: [
        { x: 30, y: 48, label: 'Global Resident Lounge & Kitchen', description: 'Fully equipped shared culinary hub for cultural dinners and social mixers.', type: 'dorm' },
        { x: 60, y: 38, label: 'Student Health & Wellness Studio', description: 'Free gym, yoga studio, and peer counseling rooms inside residence hall.', type: 'study' },
        { x: 72, y: 62, label: 'Bike Rental & Shuttle Bay', description: 'Pick up an electric campus bicycle to glide across campus in under 5 minutes.', type: 'transit' }
      ]
    }
  ];

  const activeScene = scenes[activeSceneIndex];
  const currentNarrative = timeMode === 'day' ? activeScene.narrativeDay : activeScene.narrativeNight;

  // Sync ambient sound when mode or scene changes
  useEffect(() => {
    if (isOpen && isPlayingAudio) {
      campusAudio.startAmbientAtmosphere(timeMode);
    }
  }, [timeMode, activeSceneIndex, isOpen, isPlayingAudio]);

  // Clean up audio on close
  useEffect(() => {
    if (!isOpen) {
      campusAudio.stopSpeaking();
      campusAudio.stopAmbientAtmosphere();
      setIsPlayingAudio(false);
      setActiveHotspot(null);
    }
  }, [isOpen]);

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      campusAudio.stopSpeaking();
      campusAudio.stopAmbientAtmosphere();
      setIsPlayingAudio(false);
      setAudioTranscript('');
    } else {
      setIsPlayingAudio(true);
      setAudioTranscript(currentNarrative);
      campusAudio.startAmbientAtmosphere(timeMode);
      campusAudio.speak(currentNarrative, {
        rate: speechRate,
        pitch: 1.0,
        onEnd: () => {
          setIsPlayingAudio(false);
          campusAudio.stopAmbientAtmosphere();
        },
        onError: () => {
          setIsPlayingAudio(false);
          campusAudio.stopAmbientAtmosphere();
        }
      });
    }
  };

  const handleSceneChange = (index: number) => {
    setActiveSceneIndex(index);
    setActiveHotspot(null);
    if (isPlayingAudio) {
      campusAudio.stopSpeaking();
      const newNarrative = timeMode === 'day' ? scenes[index].narrativeDay : scenes[index].narrativeNight;
      setAudioTranscript(newNarrative);
      campusAudio.speak(newNarrative, {
        rate: speechRate,
        onEnd: () => {
          setIsPlayingAudio(false);
          campusAudio.stopAmbientAtmosphere();
        }
      });
    }
  };

  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  // Google Maps interactive embed URI
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    `${university.name} ${activeScene.panQuery} ${university.location}`
  )}&t=${timeMode === 'night' ? 'k' : 'm'}&z=17&output=embed`;

  // External direct 360 link
  const googleEarthLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${university.name} ${activeScene.panQuery}`
  )}`;

  return (
    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-0 md:p-6 overflow-hidden animate-in fade-in duration-300">
      <div
        ref={modalContainerRef}
        className="w-full h-full max-w-7xl max-h-[96vh] bg-[#0B0E14] md:rounded-[3rem] border border-gray-800 flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Top Control Bar */}
        <div className="px-6 py-4 bg-[#161B22]/90 backdrop-blur-xl border-b border-gray-800 flex items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> AI Campus Immersion 360°
            </span>
            <div className="hidden sm:block text-xs font-bold text-gray-300 truncate max-w-xs md:max-w-md">
              {university.name} • {university.location}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Day / Night Switch */}
            <div className="bg-[#0D1117] p-1 rounded-2xl border border-gray-800 flex items-center">
              <button
                onClick={() => {
                  setTimeMode('day');
                  if (isPlayingAudio) {
                    campusAudio.stopSpeaking();
                    setIsPlayingAudio(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  timeMode === 'day'
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Daytime Campus Sunlight"
              >
                <Sun size={14} /> Day
              </button>
              <button
                onClick={() => {
                  setTimeMode('night');
                  if (isPlayingAudio) {
                    campusAudio.stopSpeaking();
                    setIsPlayingAudio(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  timeMode === 'night'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Night Student Life Lighting"
              >
                <Moon size={14} /> Night
              </button>
            </div>

            {/* Street View vs 360 Atmosphere Toggle */}
            <button
              onClick={() => setIsStreetViewMode(!isStreetViewMode)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all ${
                isStreetViewMode
                  ? 'bg-blue-500 text-black border-blue-400 shadow-md shadow-blue-500/20'
                  : 'bg-[#161B22] border-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <Layers size={14} /> {isStreetViewMode ? 'Maps Street View' : 'Campus 360 Visual'}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-2xl bg-[#161B22] border border-gray-800 text-gray-300 hover:text-white transition-colors hidden sm:flex items-center justify-center"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
              title="Exit Campus Immersion"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Stage View */}
        <div className="flex-1 relative overflow-hidden bg-black select-none">
          {/* View Option 1: Live Google Maps / Street View Embedded */}
          {isStreetViewMode ? (
            <div className="w-full h-full relative">
              <iframe
                title="Google Maps Street View"
                src={googleMapsEmbedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
              />
              <div className="absolute top-4 right-4 z-10">
                <a
                  href={googleEarthLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#0B0E14]/90 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-white/20 transition-all shadow-xl"
                >
                  Open in Google Maps <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ) : (
            /* View Option 2: High-Def Immersive Visual Stage with Hotspots & Day/Night Grading */
            <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
              {/* Campus Backdrop Image with Dynamic Day / Night Atmosphere Grading */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${
                  timeMode === 'night'
                    ? 'filter brightness-75 contrast-125 saturate-120 hue-rotate-15'
                    : 'filter brightness-105 contrast-100'
                }`}
                style={{
                  backgroundImage: `url(${university.image})`,
                  transform: 'scale(1.04)'
                }}
              />

              {/* Day / Night Atmospheric Vignette Overlays */}
              <div
                className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${
                  timeMode === 'night'
                    ? 'bg-gradient-to-t from-[#0B0E14] via-indigo-950/40 to-blue-900/20 opacity-90'
                    : 'bg-gradient-to-t from-[#0B0E14]/90 via-transparent to-black/30 opacity-70'
                }`}
              />

              {/* Interactive Hotspots across the Campus View */}
              {activeScene.hotspots.map((hotspot, idx) => (
                <div
                  key={idx}
                  className="absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                  onClick={() => setActiveHotspot(activeHotspot === idx ? null : idx)}
                >
                  <div className="relative">
                    {/* Pulsing ring animation */}
                    <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-60" />
                    <div className="relative w-8 h-8 rounded-full bg-emerald-500 text-black font-black flex items-center justify-center shadow-lg shadow-emerald-500/50 border-2 border-white text-xs group-hover:scale-110 transition-transform">
                      <MapPin size={14} />
                    </div>
                  </div>

                  {/* Hotspot Floating Label */}
                  <div className="mt-2 px-3 py-1 rounded-xl bg-[#0D1117]/90 backdrop-blur-md border border-gray-800 text-white text-[11px] font-black uppercase tracking-wider whitespace-nowrap shadow-xl flex items-center gap-1 group-hover:border-emerald-500/50 transition-colors">
                    {hotspot.label}
                  </div>

                  {/* Hotspot Detailed Popover Card */}
                  {activeHotspot === idx && (
                    <div
                      className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 p-4 rounded-2xl bg-[#161B22]/95 backdrop-blur-2xl border border-emerald-500/40 shadow-2xl text-left z-30 animate-in zoom-in-95 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                          {hotspot.type} Intel
                        </span>
                        <button
                          onClick={() => setActiveHotspot(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <h5 className="text-xs font-bold text-white mt-2">{hotspot.label}</h5>
                      <p className="text-[11px] text-gray-300 mt-1 leading-relaxed font-medium">
                        {hotspot.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Scene Info Chip (Bottom-Left) */}
              <div className="absolute bottom-6 left-6 z-10 max-w-sm">
                <div className="p-4 rounded-2xl bg-[#0B0E14]/85 backdrop-blur-xl border border-gray-800/80 shadow-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      {activeScene.tag}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {coords.city} • Lat {coords.lat.toFixed(2)}°
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white mt-1">{activeScene.name}</h4>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {timeMode === 'day' ? 'Bright daytime lighting' : 'Vibrant student night vibes'} • Tap pulsing pins for facility tips.
                  </p>
                </div>
              </div>

              {/* Audio Tour Controls Overlay (Bottom-Right) */}
              <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-3 max-w-md">
                {/* Audio Guide Player Pill */}
                <div className="p-4 rounded-3xl bg-[#161B22]/95 backdrop-blur-2xl border border-gray-800 shadow-2xl flex flex-col gap-3 w-full sm:w-80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isPlayingAudio ? 'bg-emerald-500 text-black animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                        <Volume2 size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-wider">AI Campus Audio Tour</div>
                        <div className="text-[10px] text-gray-400">Voice Narrative • Ambient Engine</div>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleAudio}
                      className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                        isPlayingAudio
                          ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                          : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <Pause size={14} /> Stop
                        </>
                      ) : (
                        <>
                          <Play size={14} /> Start Tour
                        </>
                      )}
                    </button>
                  </div>

                  {/* Equalizer Wave Bars */}
                  {isPlayingAudio && (
                    <div className="flex items-center justify-center gap-1.5 h-6 py-1 bg-black/40 rounded-xl px-4">
                      {[40, 75, 55, 90, 65, 80, 45, 95, 60, 85].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-emerald-400 rounded-full animate-bounce"
                          style={{
                            height: `${h}%`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '0.8s'
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Live Caption Bar */}
                  {isPlayingAudio && (
                    <div className="text-[11px] text-gray-200 bg-black/30 p-2.5 rounded-xl leading-relaxed italic max-h-24 overflow-y-auto border border-white/5">
                      "{currentNarrative}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Scene Carousel Navigation */}
        <div className="px-6 py-4 bg-[#161B22]/95 backdrop-blur-xl border-t border-gray-800 flex items-center justify-between gap-4 overflow-x-auto z-20">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest hidden md:inline">
              Campus Zones:
            </span>
            <div className="flex items-center gap-2">
              {scenes.map((scene, idx) => {
                const IconComponent = scene.icon;
                const isActive = activeSceneIndex === idx;
                return (
                  <button
                    key={scene.id}
                    onClick={() => handleSceneChange(idx)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                        : 'bg-[#0D1117] text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <IconComponent size={14} />
                    <span>{scene.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={googleEarthLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-emerald-400 font-bold flex items-center gap-1 transition-colors"
            >
              <span>Explore Street View Full Screen</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusImmersionModal;
