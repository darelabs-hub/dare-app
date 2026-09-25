import React from 'react';
import { 
  Search, 
  Sparkles, 
  Terminal, 
  Radio, 
  Users, 
  CheckCircle2, 
  Activity,
  Flame,
  Code2,
  Dumbbell,
  MessageSquare,
  Palette,
  Skull,
  Swords,
  Target,
  Compass
} from 'lucide-react';
import { DareCategory, DareItem } from '../types';
import { playSound } from '../utils/soundEffects';
import { useLanguage } from '../context/LanguageContext';

interface HeroBannerProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  targetFilter: 'all' | 'public' | 'direct';
  onSelectTarget: (target: 'all' | 'public' | 'direct') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onTriggerOracle: () => void;
  onOpenLiveDuels?: () => void;
  onOpenDropZones?: () => void;
  dailyMission?: any;
  onStartMission: (dare: DareItem) => void;
}

const CATEGORIES: { id: DareCategory | 'all'; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'All Challenges', icon: <Terminal className="h-3.5 w-3.5" />, color: 'border-slate-700 text-slate-300' },
  { id: 'tech', label: 'Tech & Code', icon: <Code2 className="h-3.5 w-3.5" />, color: 'border-indigo-500/40 text-indigo-300' },
  { id: 'physical', label: 'Fitness & Outdoors', icon: <Dumbbell className="h-3.5 w-3.5" />, color: 'border-emerald-500/40 text-emerald-300' },
  { id: 'social', label: 'Social & Fun', icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'border-pink-500/40 text-pink-300' },
  { id: 'creative', label: 'Art & Creative', icon: <Palette className="h-3.5 w-3.5" />, color: 'border-purple-500/40 text-purple-300' },
  { id: 'absurd', label: 'Wild & Unusual', icon: <Skull className="h-3.5 w-3.5" />, color: 'border-rose-500/40 text-rose-300' },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  activeTab,
  onSelectTab,
  activeCategory,
  onSelectCategory,
  targetFilter,
  onSelectTarget,
  searchQuery,
  onSearchChange,
  onTriggerOracle,
  onOpenLiveDuels,
  onOpenDropZones,
  dailyMission,
  onStartMission,
}) => {
  const { t } = useLanguage();

  const categoriesList = [
    { id: 'all', label: t('allChallenges'), icon: <Terminal className="h-3.5 w-3.5" /> },
    { id: 'tech', label: t('techCode'), icon: <Code2 className="h-3.5 w-3.5" /> },
    { id: 'physical', label: t('fitnessOutdoors'), icon: <Dumbbell className="h-3.5 w-3.5" /> },
    { id: 'social', label: t('socialFun'), icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: 'creative', label: t('artCreative'), icon: <Palette className="h-3.5 w-3.5" /> },
    { id: 'absurd', label: t('wildUnusual'), icon: <Skull className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="relative overflow-hidden border-b border-indigo-500/10 bg-gradient-to-b from-[#0f172a] via-[#0f172a]/95 to-[#0b0f19] pt-6 pb-6 cyber-bg">
      {/* Decorative subtle ambient glows */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-indigo-500/5 blur-[100px]" />
      <div className="pointer-events-none absolute top-0 right-1/4 h-72 w-72 rounded-full bg-slate-500/5 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Tagline */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs font-mono text-indigo-300 mb-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span>{t('communityStatus')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              {t('heroTitle1')} <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-300">
                {t('heroTitle2')}
              </span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* Quick Action Triggers */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick Jump to Daily Missions */}
            <button
              id="hero-daily-missions-btn"
              onClick={() => {
                playSound('pop');
                const el = document.getElementById('daily-mission-widget');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  el.classList.add('ring-2', 'ring-cyan-400');
                  setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-400'), 2000);
                }
              }}
              className="group relative flex items-center gap-3 rounded-xl border border-cyan-500/40 bg-cyan-950/30 px-3.5 sm:px-4 py-3 text-sm font-semibold text-cyan-200 transition-all hover:border-cyan-400 hover:bg-cyan-950/60 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.2)] cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                <Target className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-xs text-cyan-400 font-mono tracking-wider uppercase flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                  {t('dailyOps')}
                </div>
                <div className="font-semibold text-sm text-white">{t('dailyMissions')}</div>
              </div>
            </button>

            {/* Geofenced Drop Zones & AR Beacons */}
            {onOpenDropZones && (
              <button
                id="hero-drop-zones-btn"
                onClick={() => {
                  playSound('laser');
                  onOpenDropZones();
                }}
                className="group relative flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3.5 sm:px-4 py-3 text-sm font-semibold text-emerald-200 transition-all hover:border-emerald-400 hover:bg-emerald-950/60 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Compass className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-emerald-400 font-mono tracking-wider uppercase flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    AR Radar
                  </div>
                  <div className="font-semibold text-sm text-white">{t('dropZones')}</div>
                </div>
              </button>
            )}

            {onOpenLiveDuels && (
              <button
                id="hero-live-duels-btn"
                onClick={() => {
                  playSound('laser');
                  onOpenLiveDuels();
                }}
                className="group relative flex items-center gap-3 rounded-xl border border-pink-500/40 bg-pink-950/30 px-3.5 sm:px-4 py-3 text-sm font-semibold text-pink-200 transition-all hover:border-pink-400 hover:bg-pink-950/60 active:scale-95 shadow-[0_0_20px_rgba(236,72,153,0.2)] cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400 group-hover:scale-110 transition-transform">
                  <Swords className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-pink-400 font-mono tracking-wider uppercase flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                    1v1 Arena
                  </div>
                  <div className="font-semibold text-sm text-white">{t('liveDuels')}</div>
                </div>
              </button>
            )}

            {/* Quick AI Oracle Surprise Trigger */}
            <button
              id="ai-oracle-surge-btn"
              onClick={() => {
                playSound('oracle');
                onTriggerOracle();
              }}
              className="group relative flex items-center gap-3 rounded-xl border border-slate-850 bg-[#1e293b]/50 px-3.5 sm:px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-indigo-400 hover:bg-[#1e293b]/80 active:scale-95 shadow-sm cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-xs text-indigo-400 font-mono tracking-wider uppercase">AI Oracle</div>
                <div className="font-semibold text-sm text-white">{t('askAiOracle')}</div>
              </div>
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="mt-8 space-y-4">
          
          {/* Target Filter Tabs & Search Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Target Type Selector */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/60 p-1 text-xs font-mono">
              <button
                id="target-all-btn"
                onClick={() => {
                  onSelectTarget('all');
                  playSound('click');
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  targetFilter === 'all'
                    ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="h-3.5 w-3.5" />
                <span>{t('filterAll')}</span>
              </button>
              
              <button
                id="target-public-btn"
                onClick={() => {
                  onSelectTarget('public');
                  playSound('click');
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  targetFilter === 'public'
                    ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>{t('filterPublic')}</span>
              </button>

              <button
                id="target-direct-btn"
                onClick={() => {
                  onSelectTarget('direct');
                  playSound('click');
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  targetFilter === 'direct'
                    ? 'bg-pink-600/25 text-pink-200 border border-pink-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-pink-400" />
                <span>{t('filterDirect')}</span>
              </button>
            </div>

            {/* Status Pills */}
            <div className="flex items-center overflow-x-auto gap-1.5 py-1 text-xs">
              {[
                { id: 'all', label: t('tabFeed'), dot: null },
                { id: 'friends', label: t('squadWars'), dot: 'bg-indigo-400' },
                { id: 'open', label: t('tabBounties'), dot: 'bg-cyan-400' },
                { id: 'review', label: t('tabReview'), dot: 'bg-purple-400' },
                { id: 'verified', label: t('tabVerified'), dot: 'bg-emerald-400' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}-btn`}
                  onClick={() => {
                    onSelectTab(tab.id);
                    playSound('click');
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  {tab.dot && (
                    <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} />
                  )}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="dare-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-xl border border-slate-800 bg-[#0c1017] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              )}
            </div>

          </div>

          {/* Sector / Category Filter Chips */}
          <div className="flex items-center overflow-x-auto gap-2 pt-1 pb-1">
            {categoriesList.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`category-${cat.id}-btn`}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    playSound('click');
                  }}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all whitespace-nowrap ${
                    isActive
                      ? `border-indigo-500 bg-indigo-500/15 text-indigo-300 font-semibold shadow-sm`
                      : 'border-slate-800/80 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
