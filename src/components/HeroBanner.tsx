import React from 'react';
import { 
  Search, 
  Flame,
  Plus,
  Compass,
  Users,
  TrendingUp,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  Swords,
  Radio
} from 'lucide-react';
import { DareCategory, DareItem, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface HeroBannerProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  targetFilter: 'all' | 'public' | 'direct';
  onSelectTarget: (target: 'all' | 'public' | 'direct') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onTriggerOracle?: () => void;
  onOpenLiveDuels?: () => void;
  dailyMission?: any;
  onStartMission?: (dare: DareItem) => void;
  onOpenCreateModal?: () => void;
  onOpenCreateStory?: () => void;
  hasUserStory?: boolean;
  onViewUserStory?: () => void;
  onOpenStory?: (user: UserProfile, index: number) => void;
  currentUser?: UserProfile;
  allUsers?: UserProfile[];
  dares?: DareItem[];
  stats?: {
    totalDares: number;
    totalCredPool: number;
    verifiedDares: number;
  };
}

const CATEGORY_TAGS = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'physical', label: 'Fitness' },
  { id: 'creative', label: 'Creative' },
  { id: 'tech', label: 'Skills' },
  { id: 'absurd', label: 'Wild' },
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
  onOpenLiveDuels,
  onOpenCreateModal,
  onOpenCreateStory,
  hasUserStory = false,
  onViewUserStory,
  onOpenStory,
  currentUser,
  allUsers = [],
  dares = [],
}) => {
  const scrollToContent = () => {
    setTimeout(() => {
      const el = document.getElementById('dares-feed-container') || document.querySelector('main');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // Derive real community challengers from active database users or dare creators who are friends
  const realCommunityUsers = React.useMemo(() => {
    const list: UserProfile[] = [];
    const seen = new Set<string>();

    if (currentUser?.id) {
      seen.add(currentUser.id);
    }

    const friendIds = currentUser?.squadFriends || [];

    // 1. Add other registered users who are friends
    for (const u of allUsers) {
      if (u.id && friendIds.includes(u.id) && !seen.has(u.id)) {
        seen.add(u.id);
        list.push(u);
      }
    }

    // 2. Add creators from active dares if they are friends
    for (const d of dares) {
      if (d.creator?.id && friendIds.includes(d.creator.id) && !seen.has(d.creator.id)) {
        seen.add(d.creator.id);
        const found = allUsers.find(u => u.id === d.creator.id);
        if (found) {
          list.push(found);
        } else {
          list.push({
            id: d.creator.id,
            name: d.creator.name || 'Challenger',
            handle: d.creator.handle || '',
            avatar: d.creator.avatar,
            cred: 0,
            xp: 0,
            level: 1,
            rank: 'New Recruit',
            completedDaresCount: 0,
            createdDaresCount: 0,
            streak: 0,
            lastActiveDate: new Date().toISOString(),
            badges: [],
            isPro: false,
            inventory: [],
            activeBoosters: [],
          });
        }
      }
    }

    return list.slice(0, 8);
  }, [allUsers, dares, currentUser]);

  return (
    <div id="hero-banner-section" className="relative bg-[#07090e] border-b border-slate-800/80 pt-4 pb-3">
      <div className="mx-auto max-w-5xl px-3 sm:px-6">
        
        {/* 1. Real Stories & Creator Row */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 mb-4">
          
          {/* Your Story item with Pink + icon */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer relative">
            <div className="relative">
              {/* Avatar circle: clicks view story if active story exists, or opens create story if none */}
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  if (hasUserStory && onViewUserStory) {
                    onViewUserStory();
                  } else if (onOpenCreateStory) {
                    onOpenCreateStory();
                  } else {
                    onOpenCreateModal?.();
                  }
                }}
                className={`w-14 h-14 rounded-full p-[2px] flex items-center justify-center transition-all group-hover:scale-105 cursor-pointer ${
                  hasUserStory
                    ? 'bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-500 shadow-md shadow-pink-500/30 ring-2 ring-pink-500/20'
                    : 'bg-gradient-to-tr from-pink-500/40 to-slate-700'
                }`}
                title={hasUserStory ? "View your story" : "Post a story (Say something, photo, or clip)"}
              >
                <div className="w-full h-full rounded-full p-[1.5px] bg-[#07090e] flex items-center justify-center overflow-hidden">
                  {currentUser?.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt="Your story" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-base">
                      {currentUser?.handle?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </button>

              {/* Pink + Badge: specifically opens Story creation flow (Text / Photo / Clip) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playSound('pop');
                  if (onOpenCreateStory) {
                    onOpenCreateStory();
                  } else {
                    onOpenCreateModal?.();
                  }
                }}
                className="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 flex items-center justify-center text-white text-[12px] font-black shadow-md border-2 border-[#07090e] transition-transform hover:scale-115 active:scale-95 cursor-pointer z-10"
                title="Add to your story (Say something, photo, or short clip)"
              >
                +
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => {
                playSound('pop');
                if (hasUserStory && onViewUserStory) {
                  onViewUserStory();
                } else if (onOpenCreateStory) {
                  onOpenCreateStory();
                } else {
                  onOpenCreateModal?.();
                }
              }}
              className="text-[11px] font-medium text-slate-300 group-hover:text-pink-300 transition-colors cursor-pointer"
            >
              Your story
            </button>
          </div>

          {/* Live Battle Streams Indicator Circle */}
          {onOpenLiveDuels && (
            <div className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer relative">
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  onOpenLiveDuels();
                }}
                className="w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shadow-md shadow-rose-500/25 flex items-center justify-center transition-all group-hover:scale-105 cursor-pointer relative"
                title="Watch Live Video Streams (Split-screen 1v1 challenges)"
              >
                <div className="w-full h-full rounded-full p-[1.5px] bg-[#07090e] flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-900 to-[#14121a] flex items-center justify-center text-rose-400">
                    <Radio className="h-5 w-5 text-rose-500 animate-pulse" />
                  </div>
                </div>

                {/* Sleek LIVE badge */}
                <span className="absolute -bottom-1 inset-x-auto px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm border border-[#07090e]">
                  LIVE
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  onOpenLiveDuels();
                }}
                className="text-[11px] font-medium text-slate-300 group-hover:text-rose-400 transition-colors cursor-pointer"
              >
                Live Streams
              </button>
            </div>
          )}

          {/* Real Community User Circles */}
          {realCommunityUsers.length === 0 ? (
            <div className="flex items-center gap-2 pl-2 text-slate-500 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-slate-600 animate-pulse"></span>
              <span>Add friends to see their stories here</span>
            </div>
          ) : (
            realCommunityUsers.map((user, idx) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  playSound('click');
                  if (onOpenStory) {
                    onOpenStory(user, idx);
                  } else {
                    onSearchChange(user.handle || user.name);
                    scrollToContent();
                  }
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-pink-500/80 via-rose-500/70 to-indigo-500/70 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full p-[1.5px] bg-[#07090e] flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-slate-200 text-sm">
                          {user.name.replace('@', '').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-slate-300 group-hover:text-pink-300 truncate max-w-[68px]">
                  {user.name}
                </span>
              </button>
            ))
          )}
        </div>

        {/* 2. Top Feed Filter Tabs (Clean Segmented Control) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'feed', label: 'For You' },
              { id: 'daily', label: 'Daily Dares' },
              { id: 'all', label: 'Trending' },
              { id: 'friends', label: 'Following' },
              { id: 'verified', label: 'Completed' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}-btn`}
                  type="button"
                  onClick={() => {
                    playSound('click');
                    onSelectTab(tab.id);
                    scrollToContent();
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Bar Input */}
          <div className="relative shrink-0 w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search challenges..."
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* 3. Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_TAGS.map((tag) => {
            const isSelected = activeCategory === tag.id;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  playSound('click');
                  onSelectCategory(tag.id);
                  scrollToContent();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-white/10 border-white/25 text-white font-semibold shadow-sm'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
