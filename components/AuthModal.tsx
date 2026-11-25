import LanguageSwitcher from './LanguageSwitcher';
import { useLocale } from "../i18n/locale";
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, Globe, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { completeAccountLink, register, requestAccountEmail, signIn } from '../services/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  linkHash?: string;
  initialTab?: 'signin' | 'register';
}

const TARGET_COUNTRIES = [
  'China',
  'South Korea',
  'Japan',
  'Singapore',
  'Kazakhstan',
  'UAE',
  'Malaysia',
  'Thailand',
  'Vietnam',
  'Philippines',
  'Indonesia',
  'India'
];

const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess, initialTab = 'signin', linkHash = '' }) => {
  const { t, locale } = useLocale();
  const [tab, setTab] = useState<'signin' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetCountry, setTargetCountry] = useState(TARGET_COUNTRIES[0]);
  const [emailAction, setEmailAction] = useState<'forgot' | 'resend' | null>(null);
  const [notice, setNotice] = useState('');
  const accountLink = /^#(verify|reset)=([a-zA-Z0-9_-]{43})$/.exec(linkHash);
  const linkAction = accountLink?.[1] as 'verify' | 'reset' | undefined;
  const action = linkAction || emailAction;
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab === 'register') setTab('register');
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  function clearLink() {
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  const actionLabel = action ? {
    forgot: 'Reset password', resend: 'Resend verification email',
    verify: 'Verify email', reset: 'Set a new password',
  }[action] : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (linkAction && accountLink) {
        await completeAccountLink(linkAction, accountLink[2], password);
        clearLink();
        setTab('signin');
        setPassword('');
        setNotice(linkAction === 'verify' ? 'Email verified. You can sign in now.' : 'Password updated. You can sign in now.');
      } else if (emailAction) {
        await requestAccountEmail(emailAction, email, locale);
        setEmailAction(null);
        setNotice('If eligible, an account link will be sent to that email.');
      } else if (tab === 'register') {
        await register(email, password, fullName, targetCountry, new URLSearchParams(linkHash.slice(1)).get('invite') || undefined, locale);
        if (linkHash.startsWith('#invite=')) clearLink();
        setTab('signin');
        setPassword('');
        setNotice('Check your inbox to verify your email.');
      } else {
        onLoginSuccess(await signIn(email, password));
        setNotice('');
        onClose();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not complete the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div role="dialog" aria-modal="true" aria-labelledby="auth-heading" className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-md bg-[#161B22] border border-gray-800 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 animate-in zoom-in-95 duration-300 text-white">
        <div className="absolute left-5 top-4"><LanguageSwitcher /></div>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={t("Close")}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mt-11 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck size={14} /> {t("Bagdar Asia Portal")}
          </div>
          <h2 id="auth-heading" className="text-3xl font-black">
            {action ? t(actionLabel) : tab === 'signin' ? t("Welcome Back") : t("Create Account")}
          </h2>
          {!action && <p className="text-gray-400 text-sm mt-2">
            {tab === 'signin' 
              ? t("Access admission tracking and saved strategies")
              : t("Register your target destination and scholarship profile")}
          </p>}
        </div>

        {/* Tab Switcher */}
        {!action && <div className="flex bg-[#0D1117] p-1.5 rounded-2xl border border-gray-800 mb-6">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              tab === 'signin' 
                ? 'bg-emerald-500 text-black shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t("Sign In")}
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              tab === 'register' 
                ? 'bg-emerald-500 text-black shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t("Register")}
          </button>
        </div>}

        {notice && <p role="status" className="mb-4 text-sm text-emerald-300">{t(notice)}</p>}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0" />
            <span>{t(error)}</span>
          </div>
        )}

        {action ? (
          <form onSubmit={submit} className="space-y-4">
            {emailAction && !linkAction && <label className="block text-sm">{t('Email Address')}
              <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)}
                className="mt-2 block w-full bg-[#0D1117] p-3 rounded-xl border border-gray-700" />
            </label>}
            {action === 'reset' && <label className="block text-sm">{t('Password')}
              <input type="password" autoComplete="new-password" minLength={8} maxLength={256} required value={password}
                onChange={event => setPassword(event.target.value)} className="mt-2 block w-full bg-[#0D1117] p-3 rounded-xl border border-gray-700" />
            </label>}
            <button type="submit" disabled={isSubmitting} className="w-full min-h-11 bg-emerald-500 text-black font-bold rounded-xl">{t(actionLabel)}</button>
            <button type="button" disabled={isSubmitting} onClick={() => { if (linkAction) clearLink(); setEmailAction(null); setPassword(''); setError(null); }}
              className="min-h-11 underline">{t('Back to sign in')}</button>
          </form>
        ) : tab === 'signin' ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t("Email Address")}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t("Password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              {isSubmitting ? t("Signing in…") : t("Sign In to Portal")} <ArrowRight size={18} />
            </button>
            <div className="flex flex-wrap gap-x-4 text-sm">
              <button type="button" className="min-h-11 underline" onClick={() => { setEmailAction('forgot'); setError(null); setNotice(''); }}>{t('Forgot password?')}</button>
              <button type="button" className="min-h-11 underline" onClick={() => { setEmailAction('resend'); setError(null); setNotice(''); }}>{t('Resend verification email')}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="auth-name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t("Full Name")}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t("e.g. Aigerim Saparova")}
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-email" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t("Email Address")}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-country" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t("Target Country")}
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <select
                  id="auth-country"
                  value={targetCountry}
                  onChange={e => setTargetCountry(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  {TARGET_COUNTRIES.map(c => (
                    <option key={c} value={c} className="bg-[#161B22] text-white">
                      {t(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t("Password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder={t("Create a strong password")}
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              {isSubmitting ? t("Creating account…") : t("Complete Registration")} <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
