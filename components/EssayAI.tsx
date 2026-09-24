import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Plus, 
  BookOpen, 
  Check, 
  GraduationCap, 
  AlertTriangle 
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { EssayFeedback, University } from '../types';
import { ASIA_COUNTRIES } from '../constants';

// Common English words for lexical legitimacy verification
const COMMON_ENGLISH_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'university', 'college', 
  'study', 'academic', 'research', 'career', 'passion', 'student', 'experience', 'goal', 'education', 
  'program', 'institution', 'future', 'project', 'science', 'engineering', 'leadership', 'skills',
  'field', 'degree', 'apply', 'admission', 'faculty', 'campus', 'scholarship', 'growth', 'impact',
  'aim', 'strive', 'interest', 'course', 'opportunity', 'develop', 'knowledge', 'society', 'technology'
]);

/**
 * Validates whether a text draft represents meaningful English academic writing
 * or random gibberish / keyboard mash (e.g. "asdfgh jkl").
 */
const validateDraftLegitimacy = (text: string): { isValid: boolean; reason?: string } => {
  const clean = text.trim();
  
  // Rule 1: Minimum character count
  if (clean.length < 50) {
    return { isValid: false, reason: "Draft is too brief (minimum 50 characters required for academic assessment)." };
  }

  // Extract alphabetical words
  const words = clean.toLowerCase().match(/[a-z]+/g) || [];
  
  // Rule 2: Minimum word count
  if (words.length < 15) {
    return { isValid: false, reason: "Draft contains fewer than 15 words." };
  }

  // Rule 3: Keyboard mash detection (e.g. "asdfgh", "qwerty", "zxcvbn")
  const mashPattern = /(asdf|hjkl|qwerty|zxcv|dfgh|fghj|jkl;|qwer|tyui|uiop|zxcvb)/i;
  let mashCount = 0;
  for (const w of words) {
    if (mashPattern.test(w) || w.length > 22) {
      mashCount++;
    }
  }
  if (mashCount > 0 && mashCount / words.length > 0.15) {
    return { isValid: false, reason: "Detected non-lexical keyboard sequences or repetitive strings." };
  }

  // Rule 4: Excessive consonant clusters (e.g. "sdfghjk")
  const excessiveConsonants = /[bcdfghjklmnpqrstvwxyz]{6,}/i;
  const consonantFlagged = words.filter(w => excessiveConsonants.test(w)).length;
  if (consonantFlagged > 0 && consonantFlagged / words.length > 0.1) {
    return { isValid: false, reason: "Detected unpronounceable consonant clusters without valid vowels." };
  }

  // Rule 5: Repeated characters (e.g. "aaaaa", "xxxx")
  if (/(.)\1{4,}/.test(clean)) {
    return { isValid: false, reason: "Detected repetitive character patterns." };
  }

  // Rule 6: Lexical validity - Ratio of recognized standard English words
  let recognizedCount = 0;
  for (const w of words) {
    if (COMMON_ENGLISH_WORDS.has(w)) {
      recognizedCount++;
    }
  }

  const lexicalRatio = recognizedCount / words.length;
  if (lexicalRatio < 0.25) {
    return { 
      isValid: false, 
      reason: "Draft lacks sufficient recognizable English academic vocabulary." 
    };
  }

  return { isValid: true };
};

const EssayAI: React.FC = () => {
  const [essay, setEssay] = useState('');
  const [targetUniName, setTargetUniName] = useState('');
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [insertedFactIndex, setInsertedFactIndex] = useState<number | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Flatten all 60 universities for selection
  const allUniversities: University[] = useMemo(() => {
    return ASIA_COUNTRIES.flatMap(c => c.universities).sort((a, b) => a.ranking - b.ranking);
  }, []);

  // Find currently selected university object
  const selectedUni = useMemo(() => {
    if (!targetUniName) return null;
    return allUniversities.find(u => u.name.toLowerCase() === targetUniName.toLowerCase()) || null;
  }, [allUniversities, targetUniName]);

  // Insert a university institutional fact into the draft
  const handleInsertFact = (fact: string, index: number) => {
    setEssay(prev => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return fact;
      }
      return `${trimmed}\n\n${fact}`;
    });

    setInsertedFactIndex(index);
    setTimeout(() => setInsertedFactIndex(null), 2000);
  };

  const checkEssay = async () => {
    if (!essay.trim() || !targetUniName.trim()) {
      alert("Please specify a target university and paste your essay draft.");
      return;
    }

    setLoading(true);
    setValidationWarning(null);

    // Perform strict text legitimacy validation
    const validity = validateDraftLegitimacy(essay);

    if (!validity.isValid) {
      // Strictly return 0% score with a clear warning: "Invalid text draft."
      setFeedback({
        score: 0,
        narrative: "The submitted draft was flagged as invalid or unreadable text. Academic evaluation cannot be performed on arbitrary keystrokes, repetitive sequences, or non-substantive text.",
        grammar: "Grammar and syntactic analysis are unavailable for non-lexical text inputs.",
        strategicFit: "Unable to evaluate alignment with target institution on an invalid draft.",
        suggestions: [
          "Please write or paste a genuine admission essay draft in English.",
          "Articulate your academic goals, extracurricular achievements, and career vision.",
          "Use the Institutional Facts panel on the left to embed specific university milestones into your text."
        ]
      });
      setValidationWarning("Invalid text draft.");
      setLoading(false);
      return;
    }

    // Increment scans counter in localStorage
    try {
      const currentScans = parseInt(localStorage.getItem('bagdar_essay_scans') || '0', 10);
      localStorage.setItem('bagdar_essay_scans', (currentScans + 1).toString());
    } catch (e) {
      console.error(e);
    }

    try {
      const result = await aiService.getEssayFeedback(essay, targetUniName);
      setFeedback(result);
    } catch (e: any) {
      alert(`Essay analysis error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-4">
          <Sparkles size={14} /> Strict Admissions Assessment Engine
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-white">
          Bagdar Asia Essay AI Reviewer
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
          Evaluate admissions motivation statements against rigorous criteria for top Asian universities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Target University, Facts & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#1A1F26] p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl">
            {/* Target Institution Selection */}
            <div className="mb-6">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <GraduationCap size={16} className="text-emerald-400" /> Target Institution
              </label>
              
              <div className="relative">
                <select
                  value={targetUniName}
                  onChange={e => setTargetUniName(e.target.value)}
                  className="w-full bg-[#0E1217] border border-gray-800 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none text-sm font-semibold"
                >
                  <option value="">-- Choose from 60 Curated Asian Universities --</option>
                  {allUniversities.map(u => (
                    <option key={u.id} value={u.name}>
                      #{u.ranking} {u.name} ({u.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Or manual entry */}
              <input 
                type="text" 
                placeholder="Or type custom institution name..."
                value={targetUniName}
                onChange={e => setTargetUniName(e.target.value)}
                className="w-full mt-2 bg-black/20 border border-gray-800 rounded-xl p-3 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Dynamic Institutional Facts Panel */}
            {selectedUni && selectedUni.essayFacts && selectedUni.essayFacts.length > 0 && (
              <div className="mb-6 p-5 bg-[#0E1217] rounded-2xl border border-emerald-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={14} /> Institutional Facts for {selectedUni.name}
                  </h3>
                  <span className="text-[10px] text-gray-500 font-bold">1-Click Insert</span>
                </div>
                
                <div className="space-y-2.5">
                  {selectedUni.essayFacts.map((fact, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-start justify-between gap-3 text-xs text-gray-300"
                    >
                      <span className="leading-relaxed flex-1">{fact}</span>
                      <button
                        type="button"
                        onClick={() => handleInsertFact(fact, idx)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all flex items-center gap-1 ${
                          insertedFactIndex === idx 
                            ? 'bg-emerald-500 text-black' 
                            : 'bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {insertedFactIndex === idx ? (
                          <>
                            <Check size={12} /> Inserted!
                          </>
                        ) : (
                          <>
                            <Plus size={12} /> Insert Fact
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Essay Content Editor */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={16} className="text-blue-400" /> Motivational Statement / Essay Draft
                </label>
                <span className="text-xs text-gray-500 font-medium">
                  {essay.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <textarea 
                value={essay}
                onChange={e => {
                  setEssay(e.target.value);
                  if (validationWarning) setValidationWarning(null);
                }}
                placeholder="Paste your essay draft here... Include academic background, institutional interest, and career objectives."
                className="w-full bg-[#0E1217] border border-gray-800 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-emerald-500 h-80 transition-all text-sm leading-relaxed"
              />
            </div>

            <button 
              onClick={checkEssay}
              disabled={loading}
              className="w-full mt-6 bg-emerald-500 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/10 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Performing Admissions Validation...
                </>
              ) : (
                <>
                  <Send size={18} /> Run Essay Assessment
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Assessment Results (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {validationWarning && (
            <div className="p-6 bg-red-500/15 border-2 border-red-500/40 rounded-[2rem] text-red-300 animate-in shake duration-300">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle size={24} className="text-red-400 shrink-0" />
                <h4 className="text-lg font-black text-white">{validationWarning}</h4>
              </div>
              <p className="text-xs text-red-200/90 leading-relaxed font-medium">
                The evaluation algorithm requires structured, meaningful academic writing. Meaningless characters or random keyboard sequences automatically receive a 0% score.
              </p>
            </div>
          )}

          {feedback ? (
            <div className="bg-[#1A1F26] p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl text-white animate-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-800">
                <div>
                  <h3 className="text-2xl font-black">AI Assessment</h3>
                  <p className="text-xs text-gray-500 mt-1">Institutional Fit & Structure</p>
                </div>
                
                {/* Score Pill */}
                <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center ${
                  feedback.score === 0 
                    ? 'border-red-500/40 bg-red-500/10' 
                    : feedback.score >= 80 
                    ? 'border-emerald-500/40 bg-emerald-500/10' 
                    : 'border-amber-500/40 bg-amber-500/10'
                }`}>
                  <span className={`text-2xl font-black ${
                    feedback.score === 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {feedback.score}%
                  </span>
                  <span className="text-[9px] uppercase font-bold text-gray-400">Score</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-[#0E1217] rounded-2xl border border-white/5">
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CheckCircle size={14} /> Narrative Strength
                  </h4>
                  <p className="text-gray-300 text-xs leading-relaxed">{feedback.narrative}</p>
                </div>

                <div className="p-5 bg-[#0E1217] rounded-2xl border border-white/5">
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FileText size={14} /> Grammar & Syntactic Flow
                  </h4>
                  <p className="text-gray-300 text-xs leading-relaxed">{feedback.grammar}</p>
                </div>

                <div className="p-5 bg-[#0E1217] rounded-2xl border border-white/5">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertCircle size={14} /> Strategic Institutional Fit
                  </h4>
                  <p className="text-gray-300 text-xs leading-relaxed">{feedback.strategicFit}</p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    Actionable Improvements
                  </h4>
                  {feedback.suggestions.map((s, i) => (
                    <div key={i} className="flex gap-3 items-start text-xs text-gray-300">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[340px] bg-[#1A1F26]/40 border-2 border-dashed border-gray-800 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                <Sparkles size={32} />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Awaiting Draft Submission</h4>
              <p className="text-gray-500 text-xs max-w-xs leading-relaxed">
                Select one of the 60 universities, write or insert institutional facts, and run review to receive structural and narrative scores.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EssayAI;
