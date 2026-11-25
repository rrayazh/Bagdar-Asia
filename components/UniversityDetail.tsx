import { OFFICIAL_ADMISSIONS_REQUIREMENTS } from '../constants';
import { essayFacts, localizeCost, monthlyLivingCost } from '../i18n/university';
import { useLocale } from "../i18n/locale";
import React, { useState } from 'react';
import { University, SkillScores } from '../types';
import { aiService } from '../services/aiService';
import { Sparkles, CheckCircle, GraduationCap, Loader2, Wallet, Users, MapPin, Languages, Plane, BookOpen, Target, ChevronLeft, Award, ExternalLink, HelpCircle, ChevronDown, ChevronUp, Layers, Globe, Compass, Gamepad2, Volume2, Eye } from 'lucide-react';
import LiveGroundingIntel from './LiveGroundingIntel';
import CampusImmersionModal from './CampusImmersionModal';
import StudentDaySimulator from './StudentDaySimulator';
import CampusInfrastructureRadar from './CampusInfrastructureRadar';

interface Props {
  university: University;
  onBack: () => void;
  userScores: SkillScores | null;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const UniversityDetail: React.FC<Props> = ({ university, onBack, userScores }) => {
  const { t, locale } = useLocale();
  const facts = essayFacts(university, locale);
  const requirementsUrl = OFFICIAL_ADMISSIONS_REQUIREMENTS[university.id];
  const [activeTab, setActiveTab] = useState<'requirements' | 'campus' | 'simulator' | 'radar' | 'financial' | 'intel' | 'essay'>('requirements');
  const [intelInitialMode, setIntelInitialMode] = useState<'search' | 'maps'>('search');
  const [showImmersionModal, setShowImmersionModal] = useState(false);
  const [userBio, setUserBio] = useState('');
  const [selectedFacts, setSelectedFacts] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [essayDraft, setEssayDraft] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>(['Admissions']);

  const toggleFact = (fact: number) => {
    setSelectedFacts(prev => prev.includes(fact) ? prev.filter(f => f !== fact) : [...prev, fact]);
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleGenerate = async () => {
    if (!userBio) return alert(t('Please tell us a bit about your goals!'));
    setIsGenerating(true);
    try {
      const draft = await aiService.generateEssayDraft(
        university.name, 
        selectedFacts.map(index => facts[index]),
        userBio, 
        userScores || { analytical: 50, creative: 50, leadership: 50, social: 50, resilience: 50, vision: 50 },
        locale
      );
      setEssayDraft(draft || '');
    } catch (e: any) { alert(t('Generation failed: {error}', { error: t(e.message) })); }
    finally { setIsGenerating(false); }
  };

  const rawFaqs: FAQItem[] = [
    {
      category: "Admissions",
      question: "What is the typical acceptance rate for international students?",
      answer: t('As a top-tier institution, {name} maintains a highly competitive selection process. While specific rates vary by major, successful international candidates typically present academic profiles in the top 5-10% of their graduating class.', { name: university.name })
    },
    {
      category: "Admissions",
      question: "Is an interview mandatory for the admission process?",
      answer: "Interviews are highly recommended and often mandatory for competitive programs. They are conducted via secure video platforms and focus on your alignment with the university's core values and research goals."
    },
    {
      category: "Campus Life",
      question: "Are there dedicated support services for international students?",
      answer: "Yes, the International Student Office provides comprehensive support including visa assistance, cultural orientation programs, and dedicated housing counselors to ensure a smooth transition to campus life."
    },
    {
      category: "Financial Aid",
      question: "Can I apply for multiple scholarships simultaneously?",
      answer: "Candidates are encouraged to apply for all eligible funding opportunities. Most institutional scholarships can be combined with external grants, though the total amount typically cannot exceed the full cost of attendance."
    },
    {
      category: "Financial Aid",
      question: "Are work-study programs available for international students?",
      answer: "Most campuses offer limited part-time employment opportunities for international students, usually capped at 20 hours per week during the semester. These roles range from library assistants to research aides."
    }
  ];

  const groupedFaqs = rawFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <button onClick={onBack} className="mb-10 text-emerald-400 font-black flex items-center gap-2 group hover:text-white transition-colors uppercase tracking-widest text-xs">
        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> {t("Back to Search Results")}
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[#1A1F26] p-8 rounded-[2.5rem] border border-gray-800 overflow-hidden shadow-2xl">
            <div className="relative -mx-8 -mt-8 mb-8 h-48">
               <img src={university.image} className="w-full h-full object-cover opacity-60" alt={university.name} width="1280" height="480" fetchPriority="high" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F26] to-transparent" />
               <div className="absolute bottom-4 left-6">
                  <span className="bg-emerald-500 text-black px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">{t("REFERENCE RANK #")}{university.ranking}</span>
                  <h1 className="text-2xl font-black mt-2 leading-tight text-white">{university.name}</h1>
               </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-gray-400 font-medium text-sm"><MapPin size={18} className="text-emerald-500"/> {t(university.location)}</div>
              <div className="flex items-center gap-4 text-gray-400 font-medium text-sm"><Languages size={18} className="text-emerald-500"/> {t(university.language)}</div>
              <div className="flex items-center gap-4 text-gray-400 font-medium text-sm"><BookOpen size={18} className="text-emerald-500"/> {t(university.majorFields[0])} {t("Core")}</div>
            </div>
            
            <div className="space-y-3 mt-8">
              <button 
                onClick={() => setShowImmersionModal(true)}
                className="w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2.5 hover:opacity-95 transition-all shadow-xl shadow-emerald-500/20 text-xs uppercase tracking-widest group"
              >
                <Sparkles size={16} className="group-hover:rotate-12 transition-transform" /> {t("Experience Campus in AI/VR")}
              </button>

              <a 
                href={university.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-[#21262D] text-gray-200 hover:text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2.5 hover:bg-[#30363D] transition-all text-xs uppercase tracking-wider border border-gray-700/60"
              >
                {t("Official Portal")} <ExternalLink size={14} />
              </a>
            </div>
          </div>
          
          <p className="text-sm leading-relaxed text-gray-400">{t('Catalog estimates and admissions benchmarks are for planning. Check the official portal for current requirements and costs.')}</p>
        </div>

        {/* Main Tabs Content */}
        <div className="lg:col-span-3 space-y-12">
          <div className="bg-[#1A1F26] rounded-[3rem] border border-gray-800 overflow-hidden shadow-2xl">
            <div className="flex bg-[#0B0E14] p-3 md:p-4 gap-2 overflow-x-auto">
              {[
                {id: 'requirements', label: 'Admission'},
                {id: 'campus', label: 'Campus & Location'},
                {id: 'simulator', label: '🎮 24H Simulator'},
                {id: 'radar', label: '📡 Maps Radar'},
                {id: 'financial', label: 'Cost'},
                {id: 'intel', label: 'Live Intel (Search & Maps)'},
                {id: 'essay', label: 'Admissions Strategy'}
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-[120px] py-3.5 px-3 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? tab.id === 'intel'
                        ? 'bg-gradient-to-r from-blue-600/30 to-emerald-600/30 text-white border border-emerald-500/40 shadow-lg'
                        : tab.id === 'simulator'
                        ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-white border border-emerald-500/40 shadow-lg'
                        : tab.id === 'radar'
                        ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-white border border-blue-500/40 shadow-lg'
                        : 'bg-[#1A1F26] text-emerald-400 border border-emerald-500/20 shadow-lg'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t(tab.label)}
                </button>
              ))}
            </div>

            <div className="p-8 md:p-12">
              {activeTab === 'requirements' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Google Search Grounding Banner */}
                  <div className="bg-gradient-to-r from-blue-950/40 via-[#1A1F26] to-[#1A1F26] p-8 rounded-[2.5rem] border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                    <div className="flex items-start gap-4">
                      <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 shrink-0">
                        <Globe size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2.5 py-0.5 rounded-full border border-blue-400/20">
                            {t("Search Grounding")}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">gemini-3.5-flash</span>
                        </div>
                        <h4 className="text-xl font-black text-white mt-1">{t("Source-Linked Admissions & Policy Research")}</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-xl font-medium">
                          {t("Cross-reference official application windows, IELTS/TOEFL requirements, and international scholarship quotas using live Google Search data.")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIntelInitialMode('search');
                        setActiveTab('intel');
                      }}
                      className="px-6 py-3.5 bg-blue-500 hover:bg-blue-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0"
                    >
                      <Globe size={16} /> {t("Scan Live Admissions")}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <h4 className="text-xl font-black flex items-center gap-3 text-white">
                        <Award className="text-emerald-500" /> {t(requirementsUrl ? "Official requirements" : "Planning benchmarks")}
                      </h4>
                      {requirementsUrl ? (
                        <a href={requirementsUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2 text-emerald-300 underline">
                          <ExternalLink size={16} /> {t("Read the university’s published admissions requirements")}
                        </a>
                      ) : <ul className="space-y-5">
                        <li className="flex justify-between items-center bg-black/20 p-5 rounded-2xl border border-white/5 shadow-sm"><span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{t("GPA (Min)")}</span><span className="font-black text-emerald-400 text-lg">{university.admissionRequirements.gpa}</span></li>
                        <li className="flex justify-between items-center bg-black/20 p-5 rounded-2xl border border-white/5 shadow-sm"><span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{t("SAT / Test")}</span><span className="font-black text-emerald-400 text-lg">{t(university.admissionRequirements.sat)}</span></li>
                        <li className="flex justify-between items-center bg-black/20 p-5 rounded-2xl border border-white/5 shadow-sm"><span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">IELTS / TOEFL</span><span className="font-black text-emerald-400 text-lg">{university.admissionRequirements.ielts}</span></li>
                      </ul>}
                    </div>
                    <div className="space-y-8">
                      <h4 className="text-xl font-black flex items-center gap-3 text-white">
                         <Sparkles className="text-emerald-500" /> {t("Valued Competitive DNA")}
                      </h4>
                      <div className="bg-black/20 p-8 rounded-[2rem] border border-emerald-500/10 italic text-gray-400 leading-relaxed font-medium relative">
                         <div className="absolute -top-4 -left-4 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-black font-black">"</div>
                         {t(university.admissionRequirements.valuedSkills)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {university.admissionRequirements.extracurriculars.map((e, i) => <span key={i} className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t(e)}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-500/5 to-transparent p-10 rounded-[2.5rem] border border-emerald-500/10">
                    <h4 className="font-black text-xl mb-8 flex items-center gap-3 text-white"><Users size={24} className="text-emerald-500"/> {t("Distinguished Network")}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {university.alumni.map((a, i) => <div key={i} className="bg-[#1A1F26] p-6 rounded-2xl border border-white/5 text-sm font-black text-gray-300 flex items-center gap-4 hover:border-emerald-500/30 transition-all"> <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10B981]" /> {t(a)}</div>)}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'campus' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                  {/* AI Campus Immersion & 360 Walkthrough Hero Banner */}
                  <div className="bg-gradient-to-r from-emerald-950/60 via-[#161B22] to-blue-950/60 p-8 md:p-10 rounded-[2.5rem] border border-emerald-500/40 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} /> {t("Interactive Campus Location")}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Eye size={13} /> {t("Street View Panorama")}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Volume2 size={13} /> {t("AI Audio Tour")}
                        </span>
                      </div>

                      <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                        {t("Campus Location Explorer & Student Experience")}
                      </h3>

                      <p className="text-sm text-gray-300 leading-relaxed font-medium">
                        {t("Walk through the main ceremonial gates, browse the central research library, and inspect the international residence quad in day or night mode with an interactive AI audio guide.")}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-4">
                        <button
                          onClick={() => setShowImmersionModal(true)}
                          className="px-8 py-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 hover:opacity-95 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-3 group"
                        >
                          <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                          {t("Experience Campus in AI/VR")}
                        </button>
                        <button
                          onClick={() => {
                            setIntelInitialMode('maps');
                            setActiveTab('intel');
                          }}
                          className="px-6 py-4 bg-[#21262D] hover:bg-[#30363D] text-gray-200 hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all border border-gray-700/60 flex items-center gap-2"
                        >
                          <MapPin size={16} className="text-emerald-400" />
                          {t("Google Maps Live Intel")}
                        </button>
                      </div>
                    </div>

                    {/* Preview Graphic Card */}
                    <div 
                      onClick={() => setShowImmersionModal(true)}
                      className="w-full lg:w-72 h-44 rounded-3xl overflow-hidden border border-emerald-500/30 relative cursor-pointer group shadow-2xl shrink-0"
                    >
                      <img 
                        src={university.image} 
                        alt={university.name}
                        loading="lazy"
                        decoding="async"
                        width="640"
                        height="352"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-90 group-hover:brightness-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/90 text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Eye size={22} />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-4 right-4 text-center">
                        <span className="text-[10px] font-black uppercase text-white tracking-widest bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
                          {t("Open Campus Explorer")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Campus Infrastructure Radar */}
                  <CampusInfrastructureRadar university={university} />

                  {/* Student Day Simulator */}
                  <StudentDaySimulator university={university} />

                  {/* Ecosystem & Pillars */}
                  <div className="bg-[#0B0E14] p-10 rounded-[3rem] border border-gray-800 flex flex-col md:flex-row items-center gap-10">
                    <div className="p-8 bg-emerald-500 rounded-[2rem] shrink-0 shadow-lg shadow-emerald-500/20"><MapPin size={40} className="text-black"/></div>
                    <div>
                      <h4 className="text-2xl font-black mb-2 uppercase tracking-tight text-white">{t("Institutional Ecosystem")}</h4>
                      <p className="text-gray-400 text-lg leading-relaxed font-medium">{t("Integrated urban environment in")} {t(university.location)}{t(", featuring high-density innovation labs and 24/7 global libraries.")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-10 border border-white/5 rounded-[2.5rem] bg-black/10">
                      <h4 className="font-black mb-8 uppercase tracking-widest text-[10px] text-gray-500">{t("Core Academic Pillars")}</h4>
                      <div className="grid grid-cols-1 gap-3">
                         {university.majorFields.map((m, i) => <div key={i} className="px-6 py-4 bg-[#1A1F26] border border-gray-800 rounded-2xl text-sm font-bold text-gray-300 flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500" /> {t(m)}</div>)}
                      </div>
                    </div>
                    <div className="p-10 border border-white/5 rounded-[2.5rem] bg-black/10">
                      <h4 className="font-black mb-8 uppercase tracking-widest text-[10px] text-gray-500">{t("Global Infrastructure")}</h4>
                      <p className="text-gray-400 leading-relaxed font-medium italic text-lg">{t("High-speed regional connectivity, secure global dormitories, and multi-cuisine hubs designed for massive international mobility.")}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'simulator' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <StudentDaySimulator university={university} />
                </div>
              )}

              {activeTab === 'radar' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <CampusInfrastructureRadar university={university} />
                </div>
              )}

              {activeTab === 'intel' && (
                <div className="animate-in fade-in duration-500">
                  <LiveGroundingIntel initialUniversity={university} initialMode={intelInitialMode} />
                </div>
              )}

              {activeTab === 'financial' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="bg-[#1A1F26] p-10 rounded-[2.5rem] border border-white/5 text-center group hover:border-emerald-500/30 transition-all shadow-xl">
                        <Wallet className="mx-auto mb-6 text-emerald-500" size={36}/>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t("Annual Tuition")}</div>
                        <div className="text-3xl font-black text-white">{localizeCost(university.costs.tuition, locale)}</div>
                      </div>
                      <div className="bg-[#1A1F26] p-10 rounded-[2.5rem] border border-white/5 text-center group hover:border-emerald-500/30 transition-all shadow-xl">
                        <Plane className="mx-auto mb-6 text-emerald-500" size={36}/>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t("Logistics")}</div>
                        <div className="text-3xl font-black text-white">{localizeCost(university.costs.accommodation, locale)}</div>
                      </div>
                      <div className="bg-[#1A1F26] p-10 rounded-[2.5rem] border border-white/5 text-center group hover:border-emerald-500/30 transition-all shadow-xl">
                        <Sparkles className="mx-auto mb-6 text-emerald-500" size={36}/>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t("Living Index")}</div>
                        <div className="text-3xl font-black text-white">{monthlyLivingCost(university.costs, locale)}</div>
                      </div>
                   </div>
                   <div className="p-12 bg-emerald-500 text-black rounded-[3rem] shadow-[0_30px_60px_rgba(16,185,129,0.2)]">
                      <h4 className="font-black text-2xl mb-8 flex items-center gap-4"><Sparkles size={32}/> {t("Scholarship & Admissions Strategy")}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {university.scholarships.map((s, i) => <div key={i} className="bg-black/10 p-6 rounded-2xl text-sm font-black border border-black/5 backdrop-blur-sm flex items-center gap-4 group"> <div className="w-8 h-8 bg-black/20 rounded-lg flex items-center justify-center"> {i+1} </div> {t(s)}</div>)}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'essay' && (
                <div className="animate-in fade-in duration-500 space-y-12">
                  <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-12 rounded-[3.5rem] border border-gray-800 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <h3 className="text-3xl font-black mb-10 flex items-center gap-4 text-emerald-400 relative z-10"><Sparkles size={40}/> {t("Strategic Essay Drafting")}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                      <div className="space-y-6">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t("Select Tactical Evidence to Integrate")}</p>
                        {facts.map((f, i) => (
                          <button key={i} onClick={() => toggleFact(i)} className={`w-full text-left p-6 rounded-[1.5rem] text-sm font-bold border transition-all duration-300 ${selectedFacts.includes(i) ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_15px_30px_rgba(74,222,128,0.2)]' : 'bg-[#1A1F26] border-gray-800 text-gray-500 hover:border-gray-600'}`}>{f}</button>
                        ))}
                      </div>
                      <div className="space-y-6">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t("Impact Definition & Goal")}</label>
                        <textarea value={userBio} onChange={e => setUserBio(e.target.value)} placeholder={t("Define your institutional impact area (e.g., Sustainable Tech, Policy Innovation)...")} className="w-full bg-black/40 border border-gray-800 rounded-[2rem] p-8 text-lg outline-none focus:ring-2 focus:ring-emerald-500 h-64 text-white transition-all placeholder:text-gray-800" />
                        <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-emerald-500 text-black font-black py-6 rounded-[2rem] hover:bg-emerald-400 flex justify-center items-center gap-4 disabled:opacity-50 shadow-2xl transition-all text-lg">
                          {isGenerating ? <Loader2 className="animate-spin"/> : <><Sparkles size={28}/> {t("Generate Application Hook")}</>}
                        </button>
                      </div>
                    </div>
                  </div>
                  {essayDraft && (
                    <div className="p-16 bg-[#1A1F26] border-2 border-emerald-500/40 rounded-[4rem] shadow-2xl animate-in slide-in-from-bottom-12 duration-700">
                      <h4 className="font-black text-gray-500 mb-10 uppercase tracking-[0.5em] text-[10px] flex items-center gap-5">
                         <Target size={20} className="text-emerald-500" /> {t("Optimized Admission Hook")}
                      </h4>
                      <div className="text-gray-200 leading-relaxed font-semibold italic whitespace-pre-wrap text-2xl md:text-3xl tracking-tight">
                        "{essayDraft}"
                      </div>
                      <div className="mt-16 pt-10 border-t border-white/5 flex justify-between items-center">
                         <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{t("Engine Mode:")} Groq</div>
                         <button onClick={() => {navigator.clipboard.writeText(essayDraft || ''); alert(t('Hook synced to clipboard!'));}} className="text-[10px] font-black text-emerald-400 hover:text-white tracking-[0.2em] uppercase transition-colors">{t("Copy Segment")}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grouped FAQ Section */}
          <div className="bg-[#1A1F26] rounded-[3rem] border border-gray-800 p-12 shadow-2xl space-y-12">
            <div>
              <h3 className="text-3xl font-black mb-2 flex items-center gap-4 text-white">
                <HelpCircle className="text-emerald-400" size={32} /> {t("Institutional Knowledge Base")}
              </h3>
              <p className="text-gray-500 font-medium text-sm">{t("Explore specific queries regarding your future at")} {university.name}.</p>
            </div>

            <div className="space-y-6">
              {Object.keys(groupedFaqs).map((category) => (
                <div key={category} className="space-y-4">
                  <button 
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-6 bg-[#0B0E14] border border-gray-800 rounded-2xl hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                        <Layers size={20} />
                      </div>
                      <h4 className="text-lg font-black tracking-tight text-white">{t(category)}</h4>
                    </div>
                    <div className={`transition-transform duration-300 ${openCategories.includes(category) ? 'rotate-180' : ''}`}>
                      <ChevronDown className="text-gray-600" size={20} />
                    </div>
                  </button>

                  <div className={`space-y-3 transition-all duration-500 ease-in-out ${openCategories.includes(category) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    {groupedFaqs[category].map((faq, idx) => {
                      const faqId = `${t(category)}-${idx}`;
                      const isItemOpen = openFaq === faqId;
                      
                      return (
                        <div key={faqId} className="ml-6 border border-gray-800/50 rounded-2xl overflow-hidden bg-black/10">
                          <button 
                            onClick={() => setOpenFaq(isItemOpen ? null : faqId)}
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                          >
                            <h5 className="text-sm font-bold text-gray-300 pr-8">{t(faq.question)}</h5>
                            <div className={`text-gray-600 transition-transform duration-300 ${isItemOpen ? 'rotate-180' : ''}`}>
                              <ChevronDown size={16} />
                            </div>
                          </button>
                          <div 
                            className={`transition-all duration-300 ease-in-out ${isItemOpen ? 'max-h-[500px] opacity-100 p-6 pt-0' : 'max-h-0 opacity-0 overflow-hidden'}`}
                          >
                            <p className="text-sm text-gray-500 leading-relaxed font-medium pl-2 border-l-2 border-emerald-500/20">
                              {t(faq.answer)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campus Virtual Immersion & 360 Audio Tour Modal */}
      <CampusImmersionModal 
        isOpen={showImmersionModal} 
        onClose={() => setShowImmersionModal(false)} 
        university={university} 
      />
    </div>
  );
};

export default UniversityDetail;
