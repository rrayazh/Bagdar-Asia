import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Globe, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { mapAuthUser } from '../services/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
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

export const getRegisteredUsers = (): User[] => {
  // Kept temporarily for the legacy dashboard. User administration must be
  // performed by a protected server endpoint, never from browser storage.
  return [];
};

const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess, initialTab = 'signin' }) => {
  const [tab, setTab] = useState<'signin' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetCountry, setTargetCountry] = useState(TARGET_COUNTRIES[0]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setIsSubmitting(false);
    if (authError || !data.user) {
      setError(authError?.message || 'Unable to sign in.');
      return;
    }
    onLoginSuccess(mapAuthUser(data.user));
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanName = fullName.trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      setError("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPass,
      options: { data: { full_name: cleanName, target_country: targetCountry } },
    });
    setIsSubmitting(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (data.session && data.user) {
      onLoginSuccess(mapAuthUser(data.user));
      onClose();
      return;
    }
    setSuccess('Account created. Check your email to confirm registration.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#161B22] border border-gray-800 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 animate-in zoom-in-95 duration-300 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck size={14} /> Bagdar Asia Portal
          </div>
          <h2 className="text-3xl font-black">
            {tab === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            {tab === 'signin' 
              ? 'Access admission tracking and saved strategies' 
              : 'Register your target destination and scholarship profile'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0D1117] p-1.5 rounded-2xl border border-gray-800 mb-6">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              tab === 'signin' 
                ? 'bg-emerald-500 text-black shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
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
            Register
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {tab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
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
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
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
              {isSubmitting ? 'Signing in…' : 'Sign In to Portal'} <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Aigerim Saparova"
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
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
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Target Country
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <select
                  value={targetCountry}
                  onChange={e => setTargetCountry(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  {TARGET_COUNTRIES.map(c => (
                    <option key={c} value={c} className="bg-[#161B22] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Creating account…' : 'Complete Registration'} <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
