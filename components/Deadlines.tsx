
import React, { useState, useEffect } from 'react';
import { UPCOMING_DEADLINES } from '../constants';
import { Clock, Calendar, Bell, ExternalLink, Timer, AlertCircle, BellRing, CheckCircle2 } from 'lucide-react';
import type { User } from '../types';
import { loadDeadlineReminders, setDeadlineReminder } from '../services/cloudData';

interface Props { currentUser?: User | null }

const Deadlines: React.FC<Props> = ({ currentUser }) => {
  const [timeLeft, setTimeLeft] = useState<Record<string, { days: number, hours: number, mins: number, secs: number }>>({});
  const [reminders, setReminders] = useState<string[]>([]);
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadDeadlineReminders(currentUser.id).then(setReminders).catch(() => {
        const saved = localStorage.getItem('uni_reminders');
        if (saved) setReminders(JSON.parse(saved));
      });
    } else {
      const saved = localStorage.getItem('uni_reminders');
      if (saved) setReminders(JSON.parse(saved));
    }

    const timer = setInterval(() => {
      const newTimeLeft: Record<string, any> = {};
      UPCOMING_DEADLINES.forEach(deadline => {
        const difference = +new Date(deadline.date) - +new Date();
        if (difference > 0) {
          newTimeLeft[deadline.id] = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            mins: Math.floor((difference / 1000 / 60) % 60),
            secs: Math.floor((difference / 1000) % 60)
          };
        } else {
          newTimeLeft[deadline.id] = { days: 0, hours: 0, mins: 0, secs: 0 };
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser?.id]);

  const toggleReminder = async (id: string, name: string) => {
    let newReminders: string[];
    if (reminders.includes(id)) {
      newReminders = reminders.filter(r => r !== id);
    } else {
      newReminders = [...reminders, id];
      
      // Request browser notification permission
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification("Reminder Set!", {
            body: `We'll notify you before the ${name} deadline closes.`,
            icon: '/favicon.ico'
          });
        }
      }
      
      setShowToast(`Reminder active for ${name}`);
      setTimeout(() => setShowToast(null), 3000);
    }
    
    setReminders(newReminders);
    localStorage.setItem('uni_reminders', JSON.stringify(newReminders));
    if (currentUser) {
      await setDeadlineReminder(currentUser.id, id, newReminders.includes(id)).catch(() => {
        setShowToast('Reminder saved on this device; cloud sync failed.');
      });
    }
  };

  const nextDeadline = UPCOMING_DEADLINES.sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];
  const nextTime = timeLeft[nextDeadline?.id];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-700 relative">
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-black px-6 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 size={20} />
          {showToast}
        </div>
      )}

      {/* Hero Countdown */}
      {nextDeadline && nextTime && (
        <div className="bg-[#1A1F26] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-gray-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="md:w-1/2 space-y-6">
              <span className="bg-emerald-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Closest Deadline</span>
              <h2 className="text-4xl md:text-5xl font-black leading-tight">
                {nextDeadline.universityName} <span className="opacity-50 ml-2">{nextDeadline.countryFlag}</span>
              </h2>
              <p className="text-gray-400 text-lg font-medium">{nextDeadline.label} Closing Soon</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => toggleReminder(nextDeadline.id, nextDeadline.universityName)}
                  className={`px-8 py-4 rounded-2xl font-black shadow-xl transition-all flex items-center gap-2 ${
                    reminders.includes(nextDeadline.id) 
                    ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-emerald-400 text-black hover:bg-emerald-300'
                  }`}
                >
                  {reminders.includes(nextDeadline.id) ? (
                    <><BellRing size={18} className="animate-pulse" /> Reminder Active</>
                  ) : (
                    <><Bell size={18} /> Notify Me</>
                  )}
                </button>
                <a 
                  href={nextDeadline.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#252C36] text-white px-8 py-4 rounded-2xl font-black hover:bg-[#2D3540] transition-all flex items-center gap-2 border border-white/5"
                >
                   Visit Portal <ExternalLink size={18} />
                </a>
              </div>
            </div>
            
            <div className="md:w-1/2 flex justify-center">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { val: nextTime.days, label: 'Days' },
                  { val: nextTime.hours, label: 'Hrs' },
                  { val: nextTime.mins, label: 'Min' },
                  { val: nextTime.secs, label: 'Sec' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center bg-white/5 backdrop-blur-md rounded-3xl p-6 w-24 md:w-28 border border-white/10">
                    <span className="text-3xl md:text-4xl font-black text-emerald-400 tabular-nums">{item.val.toString().padStart(2, '0')}</span>
                    <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest mt-1">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deadlines List */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black flex items-center gap-3">
             <Calendar className="text-emerald-400" /> Master Deadline Schedule
          </h3>
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Tracking {UPCOMING_DEADLINES.length} Admissions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {UPCOMING_DEADLINES.map(deadline => {
            const time = timeLeft[deadline.id];
            const isUrgent = time && time.days < 30;
            const hasReminder = reminders.includes(deadline.id);
            
            return (
              <div key={deadline.id} className={`bg-[#1A1F26] rounded-[2.5rem] p-8 border transition-all duration-300 group ${
                hasReminder ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-gray-800 hover:border-gray-600'
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-black/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform border border-white/5">
                      {deadline.countryFlag}
                    </div>
                    <div>
                      <h4 className="font-black text-lg leading-tight mt-1">{deadline.universityName}</h4>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mt-2">{deadline.label}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isUrgent && (
                      <div className="flex items-center gap-1 bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-red-500/20">
                         <AlertCircle size={12} /> Urgent
                      </div>
                    )}
                    <button 
                      onClick={() => toggleReminder(deadline.id, deadline.universityName)}
                      className={`p-2 rounded-xl transition-all ${
                        hasReminder ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-black/20 text-gray-600 hover:text-emerald-400'
                      }`}
                    >
                      <Bell size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-5 bg-black/20 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-gray-500" />
                      <span className="text-sm font-bold text-gray-300">
                        {new Date(deadline.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {time && (
                      <div className="text-sm font-black text-emerald-400 flex items-center gap-2">
                         <Timer size={16} />
                         {time.days}d {time.hours}h {time.mins}m
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    {deadline.website && (
                      <a 
                        href={deadline.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-[#252C36] hover:bg-emerald-500 hover:text-black text-gray-300 font-black rounded-xl text-center text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5"
                      >
                        Official Portal <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Deadlines;
