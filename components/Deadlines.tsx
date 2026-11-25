import { useEffect, useState } from 'react';
import { Bell, Calendar, ExternalLink } from 'lucide-react';
import { UPCOMING_DEADLINES } from '../constants';
import { useLocale } from '../i18n/locale';
import { loadDeadlineReminders, setDeadlineReminder } from '../services/cloudData';
import type { Deadline, User } from '../types';

const utc = (date: number) => new Date(date).toISOString().replace(/[-:]|\.\d{3}/g, '');
function downloadCalendar(deadline: Deadline) {
  const closes = Date.parse(deadline.date);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bagdar Asia//Admissions//EN',
    'BEGIN:VEVENT', 'UID:' + deadline.id + '@bagdar-asia', 'DTSTAMP:' + utc(Date.now()),
    'DTSTART:' + utc(closes), 'SUMMARY:' + deadline.universityName + ' - ' + deadline.label,
    'URL:' + deadline.website, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY',
    'DESCRIPTION:Admission deadline in 24 hours', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR', '',
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = deadline.id + '.ics';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Deadlines({ currentUser }: { currentUser?: User | null }) {
  const { t, locale } = useLocale();
  const [now, setNow] = useState(Date.now);
  const [saved, setSaved] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const userId = currentUser?.id;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    setSaved([]);
    setMessage('');
    if (userId) loadDeadlineReminders(userId).then(ids => { if (active) setSaved(ids); })
      .catch(() => { if (active) setMessage('Could not load saved deadlines.'); });
    return () => { active = false; };
  }, [userId]);

  const deadlines = UPCOMING_DEADLINES.filter(item => Date.parse(item.date) > now)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Almaty',
  });

  const toggleSaved = async (deadlineId: string) => {
    if (!userId) return;
    const enabled = !saved.includes(deadlineId);
    setPending(true);
    setMessage('');
    try {
      await setDeadlineReminder(userId, deadlineId, enabled);
      setSaved(ids => enabled ? [...ids, deadlineId] : ids.filter(id => id !== deadlineId));
    } catch {
      setMessage('Could not update saved deadlines.');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto py-12 px-4 space-y-6">
      <h2 className="text-3xl font-black flex items-center gap-3"><Calendar className="text-emerald-400" />{t('Master Deadline Schedule')}</h2>
      <p className="text-gray-300">{t('Dates listed here come from university websites. All times are shown in Astana time (UTC+5).')}</p>
      <p className="text-gray-400 text-sm">{t('Import the calendar file to schedule a reminder 24 hours before the deadline. Make sure alerts are enabled in your calendar.')}</p>
      {message && <p role="status" className="text-red-300">{t(message)}</p>}
      {!deadlines.length && <p>{t('No upcoming verified deadlines are listed.')}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {deadlines.map(deadline => (
          <article key={deadline.id} className="bg-[#1A1F26] rounded-3xl p-6 border border-gray-800 space-y-3">
            <h3 className="font-bold text-xl">{deadline.universityName}</h3>
            <p className="text-gray-300">{t(deadline.label)}</p>
            <time dateTime={deadline.date} className="block text-emerald-300">{dateFormat.format(new Date(deadline.date))}</time>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href={deadline.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-h-11 underline"><ExternalLink size={16} />{t('Official Portal')}</a>
              <button type="button" onClick={() => downloadCalendar(deadline)} className="flex items-center gap-2 px-3 min-h-11 rounded-xl bg-emerald-500 text-black font-bold"><Bell size={16} />{t('Add to calendar')}</button>
              {userId && <button type="button" disabled={pending} aria-pressed={saved.includes(deadline.id)} onClick={() => toggleSaved(deadline.id)} className="min-h-11 px-3 rounded-xl border border-gray-600">{t(saved.includes(deadline.id) ? 'Saved deadline' : 'Save deadline')}</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
