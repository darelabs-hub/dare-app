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
  Compass,
  Coins
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
  onOpenCreateModal?: () => void;
  stats?: {
    totalDares: number;
    totalCredPool: number;
    verifiedDares: number;
  };
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
  onOpenCreateModal,
  stats,
}) => {
  const { t } = useLanguage();

  const scrollToContent = () => {
    setTimeout(() => {
      const el = document.getElementById('dares-feed-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  const categoriesList = [
    { id: 'all', label: t('allChallenges'), icon: <Terminal className="h-3.5 w-3.5" /> },
    { id: 'tech', label: t('techCode'), icon: <Code2 className="h-3.5 w-3.5" /> },
    { id: 'physical', label: t('fitnessOutdoors'), icon: <Dumbbell className="h-3.5 w-3.5" /> },
    { id: 'social', label: t('socialFun'), icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: 'creative', label: t('artCreative'), icon: <Palette className="h-3.5 w-3.5" /> },
    { id: 'absurd', label: t('wildUnusual'), icon: <Skull className="h-3.5 w-3.5" /> },
  ];

  return (
    <div id="hero-banner-section" className="relative overflow-hidden border-b border-pink-500/10 bg-[#07090e] pt-5 pb-4">
      <div className="relative mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
        
        {/* Command & Filter Bar */}
        <div className="space-y-3.5">
          
          {/* Row 1: Target Scope Selector & Search Bar (+ Optional Live Stats) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Target Type Selector */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/60 p-1 text-xs font-mono shrink-0 self-start md:self-auto">
              <button
                id="target-all-btn"
                onClick={() => {
                  onSelectTarget('all');
                  playSound('click');
                  scrollToContent();
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  targetFilter === 'all'
                    ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">{t('filterAll')}</span>
              </button>
              
              <button
                id="target-public-btn"
                onClick={() => {
                  onSelectTarget('public');
                  playSound('click');
                  scrollToContent();
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  targetFilter === 'public'
                    ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">{t('filterPublic')}</span>
              </button>

              <button
                id="target-direct-btn"
                onClick={() => {
                  onSelectTarget('direct');
                  playSound('click');
                  scrollToContent();
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  targetFilter === 'direct'
                    ? 'bg-pink-600/25 text-pink-200 border border-pink-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-pink-400" />
                <span className="whitespace-nowrap">{t('filterDirect')}</span>
              </button>
            </div>

            {/* Optional Live Stats Pill (Center desktop) */}
            {stats && (
              <div className="hidden xl:flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-900/50 border border-slate-800/80 rounded-full px-4 py-1.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-amber-300 font-bold">{stats.totalCredPool} Cred</span>
                </div>
                <span className="text-slate-700">·</span>
                <div className="flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-indigo-300 font-bold">{stats.totalDares} Active</span>
                </div>
                <span className="text-slate-700">·</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">{stats.verifiedDares} Verified</span>
                </div>
              </div>
            )}

            {/* Responsive Search Input */}
            <div className="relative w-full md:w-72 lg:w-80 shrink-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="dare-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    scrollToContent();
                  }
                }}
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-xl border border-slate-800 bg-[#0c1017] pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

          </div>

          {/* Row 2: Status / Feed Activity Tabs (Never truncating or overflowing) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth">
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
                  scrollToContent();
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 sm:px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                {tab.dot && (
                  <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} />
                )}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Row 3: Sector / Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap no-scrollbar pt-0.5 pb-1">
            {categoriesList.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`category-${cat.id}-btn`}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    playSound('click');
                    scrollToContent();
                  }}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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
