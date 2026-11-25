import { useLocale } from "./i18n/locale";
import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { University, SkillScores, User } from './types';
import CountrySelector from './components/CountrySelector';
import UniversityList from './components/UniversityList';
import LanguageSwitcher from './components/LanguageSwitcher';
import AuthModal from './components/AuthModal';
const UniversityDetail = lazy(() => import('./components/UniversityDetail'));
const EssayAI = lazy(() => import('./components/EssayAI'));
const Profile = lazy(() => import('./components/Profile'));
const StrategyPlanner = lazy(() => import('./components/StrategyPlanner'));
const Deadlines = lazy(() => import('./components/Deadlines'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const LiveGroundingIntel = lazy(() => import('./components/LiveGroundingIntel'));
const ApplicationHub = lazy(() => import('./components/ApplicationHub'));
import { ASIA_COUNTRIES } from './constants';
import { formatDeadline, upcomingDeadlines } from './services/deadlines';
import { currentUser as loadSession, signOut } from './services/auth';
import { 
  GraduationCap, 
  UserCircle, 
  Map as MapIcon, 
  ClipboardList, 
  Clock, 
  Search, 
  TrendingUp, 
  MapPin, 
  Sparkles,
  Home,
  ShieldCheck,
  LogIn,
  LogOut,
  ChevronRight,
  Globe,
  Compass,
  PanelsTopLeft
} from 'lucide-react';

type ViewState = 
  | 'home' 
  | 'universities' 
  | 'university-detail' 
  | 'planner' 
  | 'essay-ai' 
  | 'deadlines' 
  | 'profile' 
  | 'countries' 
  | 'grounding-intel'
  | 'applications'
  | 'admin';

const App: React.FC = () => {
  const { t, locale } = useLocale();
  const [view, setView] = useState<ViewState>('home');
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | undefined>();
  const [userScores, setUserScores] = useState<SkillScores | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(() => /^#(?:invite|verify|reset|google)=/.test(window.location.hash));
  const sessionChanged = useRef(false);
  const [inviteHash, setInviteHash] = useState(() => window.location.hash);

  useEffect(() => {
    const openInvitation = () => {
      const hash = window.location.hash;
      setInviteHash(hash);
      if (/^#(?:invite|verify|reset|google)=/.test(hash)) setAuthModalOpen(true);
    };
    window.addEventListener('hashchange', openInvitation);
    return () => window.removeEventListener('hashchange', openInvitation);
  }, []);
  const [heroSearch, setHeroSearch] = useState('');
  const handlingHistory = useRef(false);

  const applyPath = (pathname: string) => {
    const universityMatch = pathname.match(/^\/universities\/([^/]+)$/);
    if (universityMatch) {
      const university = ASIA_COUNTRIES.flatMap(country => country.universities)
        .find(item => item.id === decodeURIComponent(universityMatch[1]));
      if (university) {
        setSelectedUniversity(university);
        setView('university-detail');
        return;
      }
    }
    const routeMap: Record<string, ViewState> = {
      '/': 'home',
      '/universities': 'universities',
      '/countries': 'countries',
      '/live-intel': 'grounding-intel',
      '/strategy': 'planner',
      '/essay-ai': 'essay-ai',
      '/deadlines': 'deadlines',
      '/profile': 'profile',
      '/applications': 'applications',
      '/admin': 'admin',
    };
    setView(routeMap[pathname] || 'home');
  };

  useEffect(() => {
    handlingHistory.current = true;
    applyPath(window.location.pathname);
    const onPopState = () => {
      handlingHistory.current = true;
      applyPath(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const pathMap: Record<ViewState, string> = {
      home: '/',
      universities: '/universities',
      'university-detail': selectedUniversity ? `/universities/${encodeURIComponent(selectedUniversity.id)}` : '/universities',
      countries: '/countries',
      'grounding-intel': '/live-intel',
      planner: '/strategy',
      'essay-ai': '/essay-ai',
      deadlines: '/deadlines',
      profile: '/profile',
      applications: '/applications',
      admin: '/admin',
    };
    const target = pathMap[view];
    if (handlingHistory.current) {
      handlingHistory.current = false;
    } else if (window.location.pathname !== target) {
      window.history.pushState({}, '', target + (/^#(?:invite|verify|reset|google)=/.test(window.location.hash) ? window.location.hash : ''));
    }
  }, [view, selectedUniversity]);

  const [now, setNow] = useState(Date.now);
  const nextDeadline = upcomingDeadlines(now)[0];

  useEffect(() => {
    let active = true;
    loadSession().then(user => {
      if (active && !sessionChanged.current) setCurrentUser(user);
    }).catch(console.error);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (view !== 'home') return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, [view]);

  // Reset scroll position to top whenever the view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, selectedUniversity]);

  useEffect(() => {
    const titles: Record<ViewState, string> = {
      home: t('Admissions Portal'),
      universities: t('60 Universities'),
      'university-detail': t('Admissions at {name}', { name: selectedUniversity?.name || 'Bagdar Asia' }),
      countries: t('Explore by Country'),
      'grounding-intel': t('Live Intel'),
      planner: t('Strategy Planner'),
      'essay-ai': t('Essay AI'),
      deadlines: t('Live Deadlines'),
      profile: t('Applicant Profile'),
      applications: t('Application Hub'),
      admin: t('Admin Dashboard'),
    };
    document.title = titles[view] + ' | Bagdar Asia';
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = `https://bagdar-asia.vercel.app${window.location.pathname}`;
  }, [view, selectedUniversity, locale]);

  const handleLogout = async () => {
    try { await signOut(); } catch (error) {
      window.alert(t(error instanceof Error ? error.message : 'Could not sign out'));
      return;
    }
    setCurrentUser(null);
    if (view === 'admin') {
      setView('home');
    }
  };

  const navigateToUniversity = (uni: University) => {
    setSelectedUniversity(uni);
    setView('university-detail');
  };

  const navigateToCountry = (countryName: string) => {
    setCountryFilter(countryName);
    setView('universities');
  };

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      setView('universities');
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white font-['Plus_Jakarta_Sans']">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-[#0B0E14]/80 backdrop-blur-xl border-b border-gray-800/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div 
            onClick={() => setView('home')} 
            className="flex min-w-0 items-center gap-2 sm:gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-black font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap size={22} className="text-black" />
            </div>
            <div>
              <div className="text-base sm:text-xl font-black tracking-tight leading-none text-white group-hover:text-emerald-400 transition-colors">
                Bagdar Asia
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase font-extrabold sm:tracking-widest text-emerald-400/90 mt-0.5">
                {t("Admissions Portal")}
              </div>
            </div>
          </div>

          {/* Quick Header Nav Links (Desktop) */}
          <nav className="hidden xl:flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-400">
            <button 
              onClick={() => { setCountryFilter(undefined); setView('universities'); }}
              className={`hover:text-white transition-colors ${view === 'universities' ? 'text-emerald-400' : ''}`}
            >
              {t("60 Universities")}
            </button>
            <button 
              onClick={() => setView('countries')}
              className={`hover:text-white transition-colors ${view === 'countries' ? 'text-emerald-400' : ''}`}
            >
              {t("12 Countries")}
            </button>
            <button 
              onClick={() => setView('grounding-intel')}
              className={`hover:text-white transition-colors flex items-center gap-1.5 ${view === 'grounding-intel' ? 'text-emerald-400' : ''}`}
            >
              <Sparkles size={13} className="text-emerald-400" />
              {t("Live Intel")}
            </button>
            <button 
              onClick={() => setView('planner')}
              className={`hover:text-white transition-colors ${view === 'planner' ? 'text-emerald-400' : ''}`}
            >
              {t("Strategy")}
            </button>
            <button 
              onClick={() => setView('essay-ai')}
              className={`hover:text-white transition-colors ${view === 'essay-ai' ? 'text-emerald-400' : ''}`}
            >
              {t("Essay AI")}
            </button>
            <button 
              onClick={() => setView('deadlines')}
              className={`hover:text-white transition-colors ${view === 'deadlines' ? 'text-emerald-400' : ''}`}
            >
              {t("Deadlines")}
            </button>
            <button
              onClick={() => setView('applications')}
              className={`hover:text-white transition-colors ${view === 'applications' ? 'text-emerald-400' : ''}`}
            >
              {t("My Applications")}
            </button>
          </nav>

          {/* User Auth Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-3">
                {/* Admin Console Shortcut */}
                {isAdmin && (
                  <button
                    onClick={() => setView('admin')}
                    aria-label={t('Admin Dashboard')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      view === 'admin' 
                        ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' 
                        : 'bg-amber-400/10 text-amber-300 border border-amber-400/30 hover:bg-amber-400 hover:text-black'
                    }`}
                  >
                    <ShieldCheck size={14} /> <span className="hidden sm:inline">{t("Admin")}</span>
                  </button>
                )}

                {/* Profile Badge */}
                <button type="button"
                  onClick={() => setView('profile')}
                  aria-label={t('Applicant Profile')}
                  className="flex items-center gap-2.5 bg-[#161B22] border border-gray-800 hover:border-emerald-500/40 rounded-2xl p-1.5 sm:pl-2.5 sm:pr-4 cursor-pointer transition-all"
                >
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-white leading-none truncate max-w-[110px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium leading-none mt-1">
                      {t(currentUser.targetCountry)}
                    </div>
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title={t("Sign Out")}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                aria-label={t("Sign In / Register")}
                className="min-h-11 px-3 sm:px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2"
              >
                <LogIn size={15} /> <span className="hidden sm:inline">{t("Sign In / Register")}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Dynamic Header & Hero Section */}
      {view === 'home' && (
        <div className="pt-20 pb-12 px-4 text-center animate-in fade-in duration-1000">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-6">
            <Globe size={14} /> {t("Premier Asian Higher Education Gateway")}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-white">
            Bagdar Asia
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-medium mb-12 max-w-3xl mx-auto">
            {t("Your Gateway to 60 Premier Asian Universities across 12 Countries")}
          </p>

          {/* Quick Search */}
          <form onSubmit={handleHeroSearchSubmit} className="max-w-3xl mx-auto relative mb-16">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400" size={24} />
            <input 
              type="text" 
              value={heroSearch}
              onChange={e => setHeroSearch(e.target.value)}
              placeholder={t("Search by major, institution (e.g. SNU, NUS), or scholarship...")}
              className="w-full bg-[#1A1F26] border border-gray-800 rounded-3xl py-6 pl-16 pr-8 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-white placeholder-gray-500 shadow-2xl"
            />
          </form>

          {/* Three Stat Cards */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {/* Stat Card 1: 60 Universities */}
            <div 
              className="card-dark p-8 md:p-10 rounded-[2.5rem] flex flex-col items-center gap-4 cursor-pointer hover:scale-105 transition-all border border-gray-800 hover:border-emerald-500/40"
              onClick={() => { setCountryFilter(undefined); setView('universities'); }}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp size={28} />
              </div>
              <div>
                <span className="text-2xl font-black text-white block">{t("60 Universities")}</span>
                <span className="text-xs text-gray-500 font-semibold mt-1 block">{t("Curated University Directory")}</span>
              </div>
            </div>

            {/* Stat Card 2: 12 Asian Countries */}
            <div 
              className="card-dark p-8 md:p-10 rounded-[2.5rem] flex flex-col items-center gap-4 cursor-pointer hover:scale-105 transition-all border border-gray-800 hover:border-amber-500/40"
              onClick={() => setView('countries')}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <MapPin size={28} />
              </div>
              <div>
                <span className="text-2xl font-black text-white block">{t("12 Asian Countries")}</span>
                <span className="text-xs text-gray-500 font-semibold mt-1 block">{t("Regional Academic Hubs")}</span>
              </div>
            </div>

            {/* Stat Card 3: Next verified deadline */}
            <div 
              className="card-dark p-8 md:p-10 rounded-[2.5rem] flex flex-col items-center gap-4 cursor-pointer hover:scale-105 transition-all border border-gray-800 hover:border-blue-500/40"
              onClick={() => setView('deadlines')}
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Clock size={28} />
              </div>
              <div>
                <span className="text-2xl font-black text-white block">{t("Live Deadlines")}</span>
                {nextDeadline ? (
                  <span className="text-xs text-emerald-400 font-semibold mt-1 block">
                    {t("Next:")} {formatDeadline(nextDeadline, locale)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 font-semibold mt-1 block">{t("No upcoming verified deadlines are listed.")}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Live Grounding Intel Highlight Banner */}
          <div className="max-w-5xl mx-auto mb-16 p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-r from-blue-950/30 via-[#161B22] to-emerald-950/30 border border-emerald-500/20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                    {t("Google Search Data")}
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                    {t("Google Maps Data")}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white mt-2">
                  {t("Live Grounded Admissions & Campus Geography")}
                </h3>
                <p className="text-sm text-gray-400 mt-1 max-w-xl font-medium">
                  {t("Research current admissions, scholarships, campus transit, and student housing with source links and location context.")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setView('grounding-intel')}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-400 hover:to-emerald-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-2 shrink-0 transition-all hover:scale-105"
            >
              <Compass size={16} /> {t("Launch Live Intel")}
            </button>
          </div>
          
          <h2 className="text-3xl font-bold mb-12 text-white">{t("Explore by Country")}</h2>
        </div>
      )}

      {/* Main Content Area with Mandatory pb-32 to prevent bottom navigation bar overlap */}
      <main className="flex-1 pb-40 sm:pb-32">
        <Suspense fallback={<div className="py-24 text-center text-sm font-bold text-gray-400">{t("Loading your workspace…")}</div>}>
        {view === 'home' && <CountrySelector onSelectCountry={navigateToCountry} />}
        {view === 'countries' && (
          <CountrySelector 
            onSelectCountry={navigateToCountry} 
            fullView 
            onBack={() => setView('home')} 
          />
        )}
        {view === 'universities' && (
          <UniversityList 
            onSelectUniversity={navigateToUniversity} 
            countryFilter={countryFilter} 
            initialSearch={heroSearch}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}
        {view === 'university-detail' && selectedUniversity && (
          <UniversityDetail 
            university={selectedUniversity} 
            onBack={() => setView('universities')} 
            userScores={userScores} 
          />
        )}
        {view === 'grounding-intel' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6 animate-in fade-in duration-500">
            <LiveGroundingIntel
              initialUniversity={selectedUniversity || undefined}
              onSelectUniversity={(uni) => setSelectedUniversity(uni)}
            />
          </div>
        )}
        {view === 'essay-ai' && <EssayAI />}
        {view === 'planner' && <StrategyPlanner currentUser={currentUser} />}
        {view === 'profile' && (
          <Profile 
            currentUser={currentUser} 
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigate={(v) => setView(v as any)}
            onScoresUpdate={setUserScores} 
            existingScores={userScores} 
          />
        )}
        {view === 'deadlines' && <Deadlines currentUser={currentUser} />}
        {view === 'applications' && (
          <ApplicationHub
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSelectUniversity={navigateToUniversity}
          />
        )}
        {view === 'admin' && (
          <AdminDashboard 
            currentUser={currentUser} 
            onOpenAuth={() => setAuthModalOpen(true)} 
            onNavigateHome={() => setView('home')} 
          />
        )}
        </Suspense>
      </main>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-3xl">
        <div className="glass-nav rounded-[2.5rem] px-3 sm:px-5 py-3 grid grid-cols-5 justify-items-center sm:flex sm:items-center sm:justify-between shadow-2xl border border-white/10 bg-[#161B22]/90 backdrop-blur-xl">
          <button 
            onClick={() => setView('home')} 
            className={`p-3 rounded-2xl transition-all ${view === 'home' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
            title={t("Home")}
          >
            <Home size={20} />
          </button>
          
          <button 
            onClick={() => { setCountryFilter(undefined); setView('universities'); }} 
            className={`p-3 rounded-2xl transition-all ${view === 'universities' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
            title={t("60 Universities")}
          >
            <GraduationCap size={20} />
          </button>

          <button 
            onClick={() => setView('grounding-intel')} 
            className={`p-3 rounded-2xl transition-all ${view === 'grounding-intel' ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}
            title={t("Live Intel (Search & Maps)")}
          >
            <Compass size={20} />
          </button>
          
          <button 
            onClick={() => setView('planner')} 
            className={`p-3 rounded-2xl transition-all ${view === 'planner' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
            title={t("Strategy Planner")}
          >
            <ClipboardList size={20} />
          </button>

          <button
            onClick={() => setView('applications')}
            className={`p-3 rounded-2xl transition-all ${view === 'applications' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
            title={t("Application Hub")}
          >
            <PanelsTopLeft size={20} />
          </button>
          
          <button 
            onClick={() => setView('essay-ai')} 
            className={`p-3 rounded-2xl transition-all ${view === 'essay-ai' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
            title={t("Essay AI")}
          >
            <Sparkles size={20} />
          </button>
          
          <button 
            onClick={() => setView('deadlines')} 
            className={`p-3 rounded-2xl transition-all ${view === 'deadlines' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
            title={t("Live Deadlines")}
          >
            <Clock size={20} />
          </button>
          
          <button 
            onClick={() => setView('profile')} 
            className={`p-3 rounded-2xl transition-all ${view === 'profile' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
            title={t("Applicant Profile")}
          >
            <UserCircle size={20} />
          </button>

          {/* Admin Dashboard button on Dock if admin */}
          {isAdmin && (
            <button 
              onClick={() => setView('admin')} 
              className={`p-3 rounded-2xl transition-all ${view === 'admin' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-amber-400/80 hover:text-amber-300'}`}
              title={t("Admin Dashboard")}
            >
              <ShieldCheck size={20} />
            </button>
          )}

          {/* Sign In button on Dock if not logged in */}
          {!currentUser && (
            <button 
              onClick={() => setAuthModalOpen(true)} 
              className="p-3 rounded-2xl text-emerald-400 hover:text-white hover:bg-emerald-500/10 transition-all"
              title={t("Sign In / Register")}
            >
              <LogIn size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Authentication & Registration Modal */}
      <AuthModal
        linkHash={inviteHash}
        initialTab={inviteHash.startsWith('#invite=') ? 'register' : 'signin'}
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          sessionChanged.current = true;
          setInviteHash(window.location.hash);
          setCurrentUser(user);
          if (user.role === 'admin') {
            setView('admin');
          }
        }}
      />
    </div>
  );
};

export default App;
