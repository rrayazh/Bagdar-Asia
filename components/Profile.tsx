import React, { useState, useEffect } from 'react';
import { 
  UserCircle, 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Award, 
  MapPin, 
  Globe, 
  Calendar, 
  Clock, 
  FileText, 
  Save, 
  ArrowRight, 
  LogIn, 
  ShieldCheck, 
  Compass, 
  Cpu, 
  Languages 
} from 'lucide-react';
import { User, SkillScores } from '../types';
import { ASIA_COUNTRIES } from '../constants';
import { loadApplicantProfile, saveApplicantProfile, type ApplicantProfileData } from '../services/cloudData';

interface Props {
  currentUser?: User | null;
  onOpenAuth?: () => void;
  onNavigate?: (view: string) => void;
  onScoresUpdate?: (scores: SkillScores) => void;
  existingScores?: SkillScores | null;
}

type ApplicantData = ApplicantProfileData;

const DEFAULT_APPLICANT_DATA: ApplicantData = {
  gpa: '3.85',
  sat: '1480',
  ielts: '7.5',
  major: 'Computer Science & AI',
  targetIntake: 'Fall 2026',
  targetCountries: ['Singapore', 'South Korea', 'Japan'],
  checklist: {
    transcripts: true,
    ielts: true,
    recommendations: true,
    sop: false,
    extracurriculars: true,
    financials: false
  }
};

const CHECKLIST_ITEMS = [
  { id: 'transcripts', label: 'Official Academic Transcripts (GPA 3.8+)', desc: 'Translated and notarized school report cards' },
  { id: 'ielts', label: 'Standardized English Exam (IELTS 7.0+ / TOEFL 95+)', desc: 'Verified score report sent from testing agency' },
  { id: 'recommendations', label: 'Two Letters of Recommendation (LoRs)', desc: 'From academic mentors or research supervisors' },
  { id: 'sop', label: 'Personal Statement / Statement of Purpose', desc: 'Refined and reviewed through Bagdar Essay AI' },
  { id: 'extracurriculars', label: 'Extracurricular Activities & Honors Portfolio', desc: 'Olympiads, hackathons, leadership and research' },
  { id: 'financials', label: 'Financial Guarantee & Scholarship Applications', desc: 'Government or university tuition grant filings' }
];

const Profile: React.FC<Props> = ({ 
  currentUser, 
  onOpenAuth, 
  onNavigate, 
  onScoresUpdate 
}) => {
  const [applicantData, setApplicantData] = useState<ApplicantData>(() => {
    try {
      const saved = localStorage.getItem('bagdar_applicant_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_APPLICANT_DATA;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    loadApplicantProfile(currentUser.id)
      .then(profile => {
        if (profile && (profile.gpa || profile.major || profile.targetCountries.length)) {
          setApplicantData({ ...DEFAULT_APPLICANT_DATA, ...profile, checklist: { ...DEFAULT_APPLICANT_DATA.checklist, ...profile.checklist } });
        }
      })
      .catch(() => setSaveError('Cloud profile is unavailable. Local data remains on this device.'));
  }, [currentUser?.id]);

  const persistProfile = async (profile: ApplicantData) => {
    localStorage.setItem('bagdar_applicant_profile', JSON.stringify(profile));
    if (currentUser) await saveApplicantProfile(currentUser.id, profile);
  };

  // Synchronize base competencies so university match calculations work cleanly
  useEffect(() => {
    if (onScoresUpdate) {
      const gpaNum = parseFloat(applicantData.gpa) || 3.5;
      const baseScore = Math.min(96, Math.max(70, Math.round((gpaNum / 4.0) * 90)));
      onScoresUpdate({
        analytical: Math.min(95, baseScore + 4),
        creative: Math.min(92, baseScore - 2),
        leadership: Math.min(94, baseScore + 1),
        social: Math.min(90, baseScore - 3),
        resilience: Math.min(95, baseScore + 3),
        vision: Math.min(96, baseScore + 5)
      });
    }
  }, [applicantData.gpa]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    try {
      await persistProfile(applicantData);
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSaveError('Could not save to the cloud. Please try again.');
    }
  };

  const toggleChecklistItem = (id: string) => {
    setApplicantData(prev => {
      const updated = {
        ...prev,
        checklist: {
          ...prev.checklist,
          [id]: !prev.checklist[id]
        }
      };
      void persistProfile(updated).catch(() => setSaveError('Checklist was saved locally, but cloud sync failed.'));
      return updated;
    });
  };

  const toggleCountry = (country: string) => {
    setApplicantData(prev => {
      const exists = prev.targetCountries.includes(country);
      const updatedCountries = exists 
        ? prev.targetCountries.filter(c => c !== country)
        : [...prev.targetCountries, country];
      const updated = { ...prev, targetCountries: updatedCountries };
      void persistProfile(updated).catch(() => setSaveError('Countries were saved locally, but cloud sync failed.'));
      return updated;
    });
  };

  const completedCount = Object.values(applicantData.checklist).filter(Boolean).length;
  const readinessPercentage = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="bg-[#1A1F26] rounded-[2.5rem] border border-gray-800 p-8 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-black shadow-xl shadow-emerald-500/20 shrink-0">
              <UserCircle size={44} className="text-black" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {currentUser ? currentUser.name : 'Asian Admissions Applicant'}
                </h1>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={12} />
                  {currentUser ? 'Verified Applicant' : 'Guest Profile'}
                </span>
              </div>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {currentUser ? currentUser.email : 'Complete your profile to customize university matching and essay strategy.'}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Calendar size={13} className="text-emerald-500" /> Intake: {applicantData.targetIntake}
                </span>
                <span className="flex items-center gap-1.5 text-gray-400">
                  <BookOpen size={13} className="text-emerald-500" /> Focus: {applicantData.major}
                </span>
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Globe size={13} className="text-emerald-500" /> Region: 12 Asian Countries
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {!currentUser && onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 flex-1 md:flex-initial"
              >
                <LogIn size={15} /> Sign In / Register
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-5 py-3 rounded-2xl bg-[#21262D] hover:bg-[#30363D] text-gray-200 hover:text-white font-black text-xs uppercase tracking-wider transition-all border border-gray-700/60 flex items-center justify-center gap-2 flex-1 md:flex-initial"
            >
              {isEditing ? 'Cancel Editing' : 'Edit Academic Metrics'}
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} /> Academic profile updated and saved to your applicant workspace.
          </div>
        )}
        {saveError && (
          <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold">
            {saveError}
          </div>
        )}
      </div>

      {/* Editing Drawer Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-[#161B22] rounded-[2.5rem] border border-emerald-500/40 p-8 shadow-2xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <GraduationCap className="text-emerald-400" size={20} /> Edit Academic Benchmarks
            </h3>
            <span className="text-xs text-gray-400 font-medium">Used to benchmark 60 Asian University requirements</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Cumulative GPA (out of 4.0)
              </label>
              <input 
                type="text"
                value={applicantData.gpa}
                onChange={e => setApplicantData(prev => ({ ...prev, gpa: e.target.value }))}
                placeholder="e.g. 3.85"
                className="w-full bg-[#0B0E14] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                SAT / ACT Equivalent Score
              </label>
              <input 
                type="text"
                value={applicantData.sat}
                onChange={e => setApplicantData(prev => ({ ...prev, sat: e.target.value }))}
                placeholder="e.g. 1480 or ACT 33"
                className="w-full bg-[#0B0E14] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                English Exam (IELTS / TOEFL)
              </label>
              <input 
                type="text"
                value={applicantData.ielts}
                onChange={e => setApplicantData(prev => ({ ...prev, ielts: e.target.value }))}
                placeholder="e.g. IELTS 7.5 or TOEFL 105"
                className="w-full bg-[#0B0E14] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Target Major / Degree
              </label>
              <input 
                type="text"
                value={applicantData.major}
                onChange={e => setApplicantData(prev => ({ ...prev, major: e.target.value }))}
                placeholder="e.g. Computer Science"
                className="w-full bg-[#0B0E14] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 rounded-xl bg-gray-800 text-gray-300 hover:text-white font-bold text-xs uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Save size={14} /> Save Profile
            </button>
          </div>
        </form>
      )}

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Academic Portfolio & Target Countries */}
        <div className="lg:col-span-7 space-y-8">
          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-[#1A1F26] p-6 rounded-3xl border border-gray-800/80 shadow-lg">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Applicant GPA</div>
              <div className="text-3xl font-black text-emerald-400">{applicantData.gpa} <span className="text-xs text-gray-500 font-normal">/ 4.0</span></div>
              <div className="text-[11px] text-gray-400 font-medium mt-1">Competitive for Tier-1 Asian Unis</div>
            </div>

            <div className="bg-[#1A1F26] p-6 rounded-3xl border border-gray-800/80 shadow-lg">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Testing Benchmark</div>
              <div className="text-3xl font-black text-white">{applicantData.sat}</div>
              <div className="text-[11px] text-gray-400 font-medium mt-1">SAT / ACT Profile</div>
            </div>

            <div className="bg-[#1A1F26] p-6 rounded-3xl border border-gray-800/80 shadow-lg">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Language Score</div>
              <div className="text-3xl font-black text-emerald-400">{applicantData.ielts}</div>
              <div className="text-[11px] text-gray-400 font-medium mt-1">IELTS / TOEFL Ready</div>
            </div>
          </div>

          {/* Target Countries Selector */}
          <div className="bg-[#1A1F26] rounded-[2.5rem] border border-gray-800 p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                  <Globe className="text-emerald-400" size={22} /> Target Asian Destinations
                </h3>
                <p className="text-xs text-gray-400 mt-1">Select the countries you are actively targeting for admissions</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {applicantData.targetCountries.length} Selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {ASIA_COUNTRIES.map(country => {
                const isSelected = applicantData.targetCountries.includes(country.name);
                return (
                  <button
                    key={country.id}
                    onClick={() => toggleCountry(country.name)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-black/20 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-[#1A1F26] to-[#1A1F26] p-8 rounded-[2.5rem] border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/20">
                Admissions Strategy
              </span>
              <h4 className="text-lg font-black text-white mt-1">Ready to Draft Your Statement of Purpose?</h4>
              <p className="text-xs text-gray-400 font-medium">
                Benchmark your essay against real successful international applicant essays with Bagdar Essay AI.
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('essay-ai')}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 shrink-0"
              >
                Launch Essay AI <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Application Milestone Checklist */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-[#1A1F26] rounded-[2.5rem] border border-gray-800 p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                  <FileText className="text-emerald-400" size={22} /> Admissions Dossier
                </h3>
                <p className="text-xs text-gray-400 mt-1">Checklist for 2026/2027 intake portals</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-400">{readinessPercentage}%</div>
                <div className="text-[9px] font-black uppercase tracking-wider text-gray-500">Readiness</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 shadow-[0_0_10px_#10B981]"
                style={{ width: `${readinessPercentage}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="space-y-3 pt-2">
              {CHECKLIST_ITEMS.map(item => {
                const isChecked = !!applicantData.checklist[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      isChecked
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-black/20 border-gray-800/80 hover:border-gray-700'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckCircle2 size={18} className="text-emerald-400" />
                      ) : (
                        <Circle size={18} className="text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-xs font-bold ${isChecked ? 'text-gray-200 line-through opacity-80' : 'text-gray-300'}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Intelligence Status */}
          <div className="bg-[#161B22] rounded-[2.5rem] border border-gray-800/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu size={18} className="text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">AI Engine Infrastructure</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Connected to source-linked admissions research and Google Maps location tools for campus planning and application support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
