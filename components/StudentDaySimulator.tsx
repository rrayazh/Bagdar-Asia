import { useLocale } from "../i18n/locale";
import React, { useState } from 'react';
import { University } from '../types';
import {
  Gamepad2,
  Clock,
  Sparkles,
  Coffee,
  BookOpen,
  Users,
  Compass,
  Award,
  ChevronRight,
  RotateCcw,
  Zap,
  MapPin,
  Heart,
  Share2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { aiService } from '../services/aiService';

interface Props {
  university: University;
}

interface ChoiceOption {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
  impact: {
    academic: number;
    social: number;
    energy: number;
  };
}

export const StudentDaySimulator: React.FC<Props> = ({ university }) => {
  const { t, locale } = useLocale();
  const timeLabel = (time: string) => {
    if (locale === 'en') return time;
    const [hours, minutes, period] = time.split(/[: ]/);
    return String(Number(hours) % 12 + (period === 'PM' ? 12 : 0)).padStart(2, '0') + ':' + minutes;
  };
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedMajor, setSelectedMajor] = useState<string>(university.majorFields[0] || 'Computer Science & Engineering');
  const [choices, setChoices] = useState<Record<number, string>>({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    timeline: { time: string; activity: string; location: string; note: string }[];
    summary: string;
    badge: string;
    scores: { academic: number; social: number; energy: number; culture: number };
  } | null>(null);

  // Time slots & choices tailored to this university's ecosystem
  const stages = [
    {
      stage: 'Morning (08:00 - 11:30)',
      question: 'How do you kick off your morning on campus?',
      options: [
        {
          id: 'morning_library',
          time: '08:30 AM',
          title: locale === 'en' ? `Deep Sprint at ${university.name} Central Library` : t('Deep Sprint at {name} Central Library', { name: university.name }),
          location: 'Central Library Silent Commons',
          description: 'Grab an iced americano and secure a 5th-floor glass cubicle to tackle calculus and algorithm problem sets before lectures.',
          impact: { academic: +25, social: +5, energy: -15 }
        },
        {
          id: 'morning_canteen',
          time: '08:45 AM',
          title: 'Campus Canteen Breakfast & Study Group',
          location: 'Global Student Dining Hall',
          description: 'Meet exchange coursemates for hot steamed buns and milk tea while reviewing group presentation slides.',
          impact: { academic: +15, social: +25, energy: +10 }
        },
        {
          id: 'morning_run',
          time: '08:00 AM',
          title: 'Jogging the University Boulevard & Athletics Track',
          location: 'Campus Botanical Oval',
          description: 'A brisk 4km morning run past academic monuments and cherry blossoms / palms before showering at the dorm gym.',
          impact: { academic: +10, social: +10, energy: +25 }
        }
      ]
    },
    {
      stage: 'Afternoon (12:30 - 16:00)',
      question: 'Where do you focus your core afternoon momentum?',
      options: [
        {
          id: 'afternoon_lecture',
          time: '01:30 PM',
          title: 'Advanced Seminar with Leading Faculty',
          location: 'Science & Engineering Lecture Theater',
          description: 'Engage in a live lecture on emerging artificial intelligence and quantum computing with faculty-directed lab exercises.',
          impact: { academic: +30, social: +10, energy: -20 }
        },
        {
          id: 'afternoon_incubator',
          time: '02:00 PM',
          title: 'University Venture Studio & Startup Hub',
          location: 'Student Innovation Incubator',
          description: 'Collaborate with fellow international students to prototype a regional logistics SaaS app on high-performance workstations.',
          impact: { academic: +25, social: +25, energy: -10 }
        },
        {
          id: 'afternoon_cultural',
          time: '01:00 PM',
          title: 'Language Exchange & Cultural Union Workshop',
          location: 'International Affairs Building',
          description: 'Practice the local language with domestic buddy mentors over matcha and street snacks while sharing your home traditions.',
          impact: { academic: +10, social: +30, energy: +10 }
        }
      ]
    },
    {
      stage: 'Evening (17:00 - 20:30)',
      question: 'How do you spend your campus evening?',
      options: [
        {
          id: 'evening_lab',
          time: '05:30 PM',
          title: 'Research Laboratory Cohort Session',
          location: 'Advanced Materials & Tech Center',
          description: 'Conduct simulations on university computing clusters with graduate research mentors and PhD candidates.',
          impact: { academic: +25, social: +10, energy: -15 }
        },
        {
          id: 'evening_bistro',
          time: '06:00 PM',
          title: 'Student District Street Food & Boba Crawl',
          location: 'University Metro Station Plaza',
          description: 'Head off-campus with your dorm floor to affordable student barbecue, ramen, or halal noodle bistros right outside the station.',
          impact: { academic: +5, social: +35, energy: +20 }
        },
        {
          id: 'evening_sports',
          time: '05:15 PM',
          title: 'Intramural Sports Tournament',
          location: 'University Sports Complex',
          description: 'Play badminton or football under stadium floodlights with classmates representing 12 Asian countries.',
          impact: { academic: +5, social: +25, energy: +15 }
        }
      ]
    },
    {
      stage: 'Night (21:00 - 01:00)',
      question: 'How do you wrap up your 24 hours at the university?',
      options: [
        {
          id: 'night_library',
          time: '10:00 PM',
          title: '24/7 Library Night-Owl Study Session',
          location: 'Undergraduate Commons (24-Hour Wing)',
          description: 'Immerse in the focused hum of late-night scholars, taking quick 2:00 AM convenience store breaks for energy drinks.',
          impact: { academic: +30, social: +5, energy: -25 }
        },
        {
          id: 'night_lounge',
          time: '09:30 PM',
          title: 'Dorm Rooftop Stargazing & Acoustic Jam',
          location: 'International Residence Hall Rooftop',
          description: 'Share stories, guitar music, and regional snacks while watching the city skyline glow in the cool night breeze.',
          impact: { academic: +5, social: +30, energy: +15 }
        },
        {
          id: 'night_market',
          time: '09:45 PM',
          title: 'Late Night Market Excursion',
          location: 'Adjacent Student Night Bazaar',
          description: 'Explore the vibrant street market stalls selling local sweets, bubble tea, and vintage thrift finds.',
          impact: { academic: +5, social: +35, energy: +10 }
        }
      ]
    }
  ];

  const handleSelectOption = (optionId: string) => {
    setChoices(prev => ({ ...prev, [currentStep]: optionId }));
    if (currentStep < stages.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      generateSimulatorReport({ ...choices, [currentStep]: optionId });
    }
  };

  const generateSimulatorReport = async (finalChoices: Record<number, string>) => {
    setIsSimulating(true);

    // Calculate baseline scores
    let academic = 50;
    let social = 50;
    let energy = 50;
    let culture = 65;

    const timeline: { time: string; activity: string; location: string; note: string }[] = [];

    stages.forEach((stage, idx) => {
      const chosenId = finalChoices[idx];
      const opt = stage.options.find(o => o.id === chosenId) || stage.options[0];
      academic += opt.impact.academic;
      social += opt.impact.social;
      energy += opt.impact.energy;
      culture += 8;

      timeline.push({
        time: opt.time,
        activity: opt.title,
        location: opt.location,
        note: opt.description
      });
    });

    academic = Math.min(100, Math.max(20, academic));
    social = Math.min(100, Math.max(20, social));
    energy = Math.min(100, Math.max(20, energy));
    culture = Math.min(100, Math.max(20, culture));

    // Dynamic Badge based on dominant trait
    let badge = t('{name} Pioneer Scholar', { name: university.name });
    if (academic > 80) badge = t('{name} Academic Elite', { name: university.name });
    else if (social > 80) badge = t('{name} Global Ambassador', { name: university.name });
    else if (energy > 75) badge = t('{name} High-Octane Trailblazer', { name: university.name });

    try {
      const schedule = timeline.map(item => `${item.time}: ${item.activity} (${item.location})`).join('\n');
      const prompt = `Summarize a fictional student day at ${university.name} in ${university.location}.
Major: ${t(selectedMajor)}.
Simulation choices:
${schedule}
Write up to three short paragraphs about the student's study habits, social balance, and practical takeaways.`;
      const summary = await aiService.summarizeCampusDay(prompt, locale);
      setSimulationResult({ timeline, summary, badge, scores: { academic, social, energy, culture } });
      setIsSimulating(false);
      return;
    } catch {
      // Guests and unavailable providers use the local simulation summary.
    }

    // High quality resilient narrative fallback
    const fallbackSummary = locale === 'en' ? `Your simulated 24 hours at ${university.name} demonstrates a superb balance of scholarly rigor and vibrant international community engagement. Starting your morning at ${timeline[0]?.location} establishes disciplined focus, while your afternoon collaboration in ${timeline[1]?.location} mirrors how top students translate coursework into real-world impact.

By evening, winding down with peers across ${timeline[2]?.location} and ${timeline[3]?.location} showcases the true essence of university life in ${university.location}: lifelong friendships, multicultural dialogue, and late-night intellectual curiosity.

With an Academic Rigor rating of ${academic}% and Social Integration index of ${social}%, you are well-positioned to stand out as a competitive international applicant at ${university.name}.` : [
      t('Morning: {first}. Afternoon: {second}.', { first: t(timeline[0].activity), second: t(timeline[1].activity) }),
      t('Evening: {third}. Night: {fourth}.', { third: t(timeline[2].activity), fourth: t(timeline[3].activity) }),
      t('Your academic score was {academic}% and your social score was {social}%.', { academic, social }),
    ].join('\n\n');

    setSimulationResult({
      timeline,
      summary: fallbackSummary,
      badge,
      scores: { academic, social, energy, culture }
    });
    setIsSimulating(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setChoices({});
    setSimulationResult(null);
  };

  return (
    <div className="bg-[#161B22] rounded-[3rem] border border-gray-800 p-8 md:p-12 shadow-2xl overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Gamepad2 size={15} /> {t("Student Life Simulator")}
            </span>
            <span className="text-xs text-gray-500 font-mono">{t("Interactive Micro-Engine")}</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-white mt-2 flex items-center gap-3">
            {t("Simulate 24 Hours at")} {university.name}
          </h3>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl font-medium">
            {t("Walk in the shoes of an international student. Make instinctive day-to-day choices across libraries, cafeterias, and research labs grounded in real campus geography.")}
          </p>
        </div>

        {/* Selected Track Pill */}
        <div className="shrink-0 bg-[#0D1117] p-2 rounded-2xl border border-gray-800">
          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block px-2 mb-1">
            {t("Focus Discipline")}
          </label>
          <select
            value={t(selectedMajor)}
            onChange={(e) => setSelectedMajor(e.target.value)}
            disabled={simulationResult !== null}
            className="bg-transparent text-white font-bold text-xs px-2 py-1 focus:outline-none cursor-pointer"
          >
            {university.majorFields.map((f, i) => (
              <option key={i} value={t(f)} className="bg-[#161B22] text-white">
                {t(f)} {t("Track")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulator Engine Main Area */}
      {!simulationResult && !isSimulating && (
        <div className="py-8 animate-in fade-in duration-300">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 max-w-xl mx-auto">
            {stages.map((stg, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                    currentStep === i
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 scale-110'
                      : currentStep > i
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {currentStep > i ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                {i < stages.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-1 rounded-full ${
                      currentStep > i ? 'bg-emerald-500' : 'bg-gray-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Current Question */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              {t(stages[currentStep].stage)}
            </span>
            <h4 className="text-xl md:text-2xl font-black text-white mt-1">
              {t(stages[currentStep].question)}
            </h4>
          </div>

          {/* 3 Choices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {stages[currentStep].options.map((option) => (
              <div
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                className="bg-[#0D1117] hover:bg-[#1E2530] border border-gray-800 hover:border-emerald-500/50 p-6 md:p-8 rounded-[2.5rem] cursor-pointer transition-all duration-300 flex flex-col justify-between group hover:scale-[1.02] shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
                      <Clock size={13} /> {timeLabel(option.time)}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1">
                      <MapPin size={11} className="text-gray-400" /> {t(option.location)}
                    </span>
                  </div>

                  <h5 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors leading-snug">
                    {t(option.title)}
                  </h5>

                  <p className="text-xs text-gray-400 mt-3 leading-relaxed font-medium">
                    {t(option.description)}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 font-mono">
                    <span className="text-emerald-400">+{option.impact.academic} {t("Acad")}</span>
                    <span className="text-blue-400">+{option.impact.social} {t("Soc")}</span>
                  </div>
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Simulation Calculation State */}
      {isSimulating && (
        <div className="py-20 text-center animate-pulse">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Loader2 size={32} className="animate-spin" />
          </div>
          <h4 className="text-2xl font-black text-white">{t("Synthesizing Your 24-Hour Campus Schedule...")}</h4>
          <p className="text-sm text-gray-400 mt-2">
            {t("Evaluating facility transit, study stamina, and student community synergy at")} {university.name}.
          </p>
        </div>
      )}

      {/* Simulation Result Presentation */}
      {simulationResult && (
        <div className="py-8 space-y-8 animate-in fade-in duration-500">
          {/* Badge & Metric Cards */}
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-blue-950/30 via-[#0D1117] to-emerald-950/30 border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 text-left">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
                <Award size={36} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  {t("Unlocked Campus Persona")}
                </span>
                <h4 className="text-2xl font-black text-white mt-0.5">{simulationResult.badge}</h4>
                <p className="text-xs text-gray-400 mt-1">
                  {t("24-Hour Student Simulation •")} {university.name} • {t(selectedMajor)} {t("Track")}
                </p>
              </div>
            </div>

            {/* Score Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
              <div className="bg-[#161B22] p-4 rounded-2xl border border-gray-800 text-center min-w-[90px]">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{t("Academic")}</div>
                <div className="text-xl font-black text-emerald-400 mt-1">{simulationResult.scores.academic}%</div>
              </div>
              <div className="bg-[#161B22] p-4 rounded-2xl border border-gray-800 text-center min-w-[90px]">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{t("Social")}</div>
                <div className="text-xl font-black text-blue-400 mt-1">{simulationResult.scores.social}%</div>
              </div>
              <div className="bg-[#161B22] p-4 rounded-2xl border border-gray-800 text-center min-w-[90px]">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{t("Energy")}</div>
                <div className="text-xl font-black text-amber-400 mt-1">{simulationResult.scores.energy}%</div>
              </div>
              <div className="bg-[#161B22] p-4 rounded-2xl border border-gray-800 text-center min-w-[90px]">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{t("Culture")}</div>
                <div className="text-xl font-black text-purple-400 mt-1">{simulationResult.scores.culture}%</div>
              </div>
            </div>
          </div>

          {/* Generated Daily Timeline */}
          <div className="bg-[#0D1117] p-8 rounded-[2.5rem] border border-gray-800 shadow-xl">
            <h4 className="text-lg font-black text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-emerald-400" /> {t("Simulated Daily Schedule & Campus Coordinates")}
            </h4>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-gray-800">
              {simulationResult.timeline.map((item, idx) => (
                <div key={idx} className="relative flex items-start gap-6 pl-2 group">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center shrink-0 z-10 shadow-md shadow-emerald-500/20">
                    {idx + 1}
                  </div>
                  <div className="flex-1 bg-[#161B22] p-6 rounded-2xl border border-gray-800 group-hover:border-emerald-500/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">{timeLabel(item.time)}</span>
                      <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                        <MapPin size={12} className="text-emerald-400" /> {t(item.location)}
                      </span>
                    </div>
                    <h5 className="text-base font-black text-white">{t(item.activity)}</h5>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed font-medium">{t(item.note)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Narrative Evaluation */}
          <div className="p-8 rounded-[2.5rem] bg-[#0D1117] border border-gray-800">
            <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase text-emerald-400 tracking-wider">
              <Sparkles size={16} /> {t("Campus Life Synthesis")}
            </div>
            <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed font-normal whitespace-pre-wrap">
              {simulationResult.summary}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={handleReset}
              className="px-6 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2"
            >
              <RotateCcw size={15} /> {t("Simulate Another Day")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDaySimulator;
