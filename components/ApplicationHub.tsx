import { useLocale } from "../i18n/locale";
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ClipboardList, FileText, LogIn, Save, Trash2 } from 'lucide-react';
import { ASIA_COUNTRIES } from '../constants';
import type { ApplicationStatus, University, UniversityApplication, User } from '../types';
import { deleteApplication, loadApplications, updateApplication } from '../services/cloudData';

interface Props {
  currentUser: User | null;
  onOpenAuth: () => void;
  onSelectUniversity: (university: University) => void;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'researching', label: 'Researching' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'documents', label: 'Documents' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'interview', label: 'Interview' },
  { value: 'decision', label: 'Decision' },
];

const ApplicationHub: React.FC<Props> = ({ currentUser, onOpenAuth, onSelectUniversity }) => {
  const { t } = useLocale();
  const [applications, setApplications] = useState<UniversityApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const universities = useMemo(() => new Map(ASIA_COUNTRIES.flatMap(country => country.universities).map(uni => [uni.id, uni])), []);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setApplications([]);
      return;
    }
    setLoading(true);
    loadApplications(currentUser.id)
      .then(setApplications)
      .catch(() => setMessage('Could not load your applications.'))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  const changeStatus = async (application: UniversityApplication, status: ApplicationStatus) => {
    setApplications(items => items.map(item => item.id === application.id ? { ...item, status } : item));
    if (currentUser) await updateApplication(currentUser.id, application.id, { status }).catch(() => setMessage('Status update did not sync.'));
  };

  const saveNotes = async (application: UniversityApplication, notes: string) => {
    setApplications(items => items.map(item => item.id === application.id ? { ...item, notes } : item));
    if (currentUser) await updateApplication(currentUser.id, application.id, { notes }).catch(() => setMessage('Notes did not sync.'));
  };

  const remove = async (application: UniversityApplication) => {
    if (!currentUser) return;
    await deleteApplication(currentUser.id, application.id);
    setApplications(items => items.filter(item => item.id !== application.id));
  };

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="rounded-[3rem] border border-emerald-500/20 bg-[#161B22] p-12">
          <ClipboardList className="mx-auto mb-5 text-emerald-400" size={48} />
          <h1 className="text-3xl font-black">{t("Your Application Hub")}</h1>
          <p className="mt-3 text-sm text-gray-400">{t("Sign in to save universities and track every application stage across devices.")}</p>
          <button onClick={onOpenAuth} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-7 py-4 text-sm font-black text-black">
            <LogIn size={17} /> {t("Sign In")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400">{t("Personal workspace")}</span>
          <h1 className="mt-2 text-4xl font-black">{t("Application Hub")}</h1>
          <p className="mt-2 text-gray-400">{t("Move each university from research to final decision.")}</p>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-[#1A1F26] px-5 py-3 text-sm font-bold text-gray-300">
          {t('Active applications')} · {applications.length}
        </div>
      </div>

      {message && <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">{t(message)}</div>}
      {loading ? (
        <div className="rounded-[2rem] border border-gray-800 bg-[#1A1F26] p-10 text-center text-gray-400">{t("Loading your workspace…")}</div>
      ) : applications.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-gray-700 bg-[#161B22] p-12 text-center">
          <FileText className="mx-auto mb-4 text-gray-600" size={42} />
          <h2 className="text-xl font-black">{t("Your shortlist is empty")}</h2>
          <p className="mt-2 text-sm text-gray-500">{t("Open the university catalog and tap the heart on institutions you want to track.")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {applications.map(application => {
            const university = universities.get(application.universityId);
            if (!university) return null;
            return (
              <article key={application.id} className="overflow-hidden rounded-[2.5rem] border border-gray-800 bg-[#1A1F26] shadow-xl">
                <div className="flex gap-5 p-6">
                  <img src={university.image} alt="" loading="lazy" decoding="async" width="96" height="96" className="h-24 w-24 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black uppercase tracking-wider text-emerald-400">{t("Reference rank #")}{university.ranking}</div>
                    <h2 className="mt-1 text-xl font-black">{university.name}</h2>
                    <p className="mt-1 text-xs text-gray-500">{t(university.location)}</p>
                    <button onClick={() => onSelectUniversity(university)} className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-white">
                      {t("View requirements")} <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
                <div className="space-y-4 border-t border-gray-800 p-6">
                  <select
                    value={application.status}
                    onChange={event => changeStatus(application, event.target.value as ApplicationStatus)}
                    className="w-full rounded-2xl border border-gray-700 bg-[#0B0E14] px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500"
                  >
                    {STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                  </select>
                  <textarea
                    defaultValue={application.notes}
                    onBlur={event => saveNotes(application, event.target.value)}
                    placeholder={t("Application notes, missing documents, interview details…")}
                    className="min-h-24 w-full rounded-2xl border border-gray-700 bg-[#0B0E14] p-4 text-sm text-white outline-none focus:border-emerald-500"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><Save size={13} /> {t("Notes save automatically")}</span>
                    <button onClick={() => remove(application)} className="rounded-xl p-2 text-gray-600 hover:bg-red-500/10 hover:text-red-400" aria-label={t('Remove {name}', { name: university.name })}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicationHub;
