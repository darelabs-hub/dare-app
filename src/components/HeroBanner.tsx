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
  onOpenCreateModal?: () => void;
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
    <div id="dare-feed-section" className="relative overflow-hidden border-b border-pink-500/10 bg-[#07090e] pt-6 pb-4">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Filter Navigation Bar */}
        <div className="space-y-4">
          
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
