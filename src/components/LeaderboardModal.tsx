import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trophy, 
  Medal, 
  Coins, 
  Flame, 
  Search, 
  CheckCircle2,
  Crown,
  User,
  ArrowUpRight
} from 'lucide-react';
import { UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUserId: string;
  onOpenProfile?: (user: UserProfile) => void;
}

type Timeframe = 'weekly' | 'monthly' | 'all';
type MetricSort = 'cred' | 'completed' | 'streak';

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  onOpenProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MetricSort>('cred');
  const [tierFilter, setTierFilter] = useState<'all' | 'pro'>('all');
  const [timeRange, setTimeRange] = useState<Timeframe>('all');

  // Compute stats and sort rankings
  const rankedUsers = useMemo(() => {
    return users
      .map(user => ({
        ...user,
        calculatedStats: {
          cred: user.cred || 0,
          completed: user.completedDaresCount || 0,
          created: user.createdDaresCount || 0,
          streak: user.streak || 0,
        }
      }))
      .filter(user => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = 
          !query ||
          user.name.toLowerCase().includes(query) ||
          user.handle.toLowerCase().includes(query);
        
        const matchesTier = tierFilter === 'all' || (tierFilter === 'pro' && user.isPro);
        
        return matchesSearch && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === 'streak') {
          return b.calculatedStats.streak - a.calculatedStats.streak;
        }
        if (sortBy === 'completed') {
          return b.calculatedStats.completed - a.calculatedStats.completed;
        }
        return b.calculatedStats.cred - a.calculatedStats.cred;
      });
  }, [users, searchQuery, sortBy, tierFilter]);

  // Current user rank in the current sorted list
  const currentUserIndex = useMemo(() => {
    return rankedUsers.findIndex(u => u.id === currentUserId);
  }, [rankedUsers, currentUserId]);

  const currentUserData = useMemo(() => {
    return users.find(u => u.id === currentUserId);
  }, [users, currentUserId]);

  if (!isOpen) return null;

  const top3 = !searchQuery && rankedUsers.length >= 3 ? [rankedUsers[1], rankedUsers[0], rankedUsers[2]] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* Clean Modern Container */}
      <div 
        id="leaderboard-modal-container"
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-[#0E1117] shadow-2xl my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6 pb-4 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Leaderboard</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Community rankings based on completed challenges and Cred.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter & Controls Toolbar */}
        <div className="p-4 sm:p-6 pb-3 border-b border-white/5 space-y-3 shrink-0 bg-[#121620]">
          
          {/* Top row: Search & Timeframe */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member or handle..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-white/10 bg-[#090C12] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Timeframe Segmented Control */}
            <div className="flex rounded-lg border border-white/10 bg-[#090C12] p-1 shrink-0">
              {[
                { id: 'weekly' as Timeframe, label: 'Week' },
                { id: 'monthly' as Timeframe, label: 'Month' },
                { id: 'all' as Timeframe, label: 'All-Time' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setTimeRange(tab.id);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    timeRange === tab.id
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom row: Sort Metric & Tier Filter */}
          <div className="flex items-center justify-between gap-2 text-xs flex-wrap pt-1">
            {/* Sort Metric Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-xs mr-1">Sort by:</span>
              {[
                { id: 'cred' as MetricSort, label: 'Cred', icon: <Coins className="h-3.5 w-3.5 text-amber-400" /> },
                { id: 'completed' as MetricSort, label: 'Challenges', icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> },
                { id: 'streak' as MetricSort, label: 'Streak', icon: <Flame className="h-3.5 w-3.5 text-rose-400" /> },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setSortBy(m.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    sortBy === m.id
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Pro Only Toggle */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setTierFilter(prev => prev === 'all' ? 'pro' : 'all');
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  tierFilter === 'pro'
                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Crown className="h-3 w-3 text-amber-400" />
                <span>Pro Only</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top 3 Podium Cards (Rendered when no search query and at least 3 users) */}
        {!searchQuery && rankedUsers.length >= 3 && (
          <div className="p-4 sm:p-6 pb-2 border-b border-white/5 shrink-0 bg-[#0B0E14]">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end max-w-lg mx-auto">
              
              {/* #2 Rank (Silver) */}
              {rankedUsers[1] && (
                <div 
                  onClick={() => {
                    onOpenProfile?.(rankedUsers[1]);
                    onClose();
                  }}
                  className="flex flex-col items-center p-3 rounded-xl border border-white/10 bg-[#141822] hover:border-white/20 transition-all cursor-pointer text-center relative group"
                >
                  <div className="relative mb-2">
                    <img 
                      src={rankedUsers[1].avatar} 
                      alt={rankedUsers[1].name} 
                      className="h-12 w-12 rounded-full object-cover border border-slate-300/40 shadow-sm"
                    />
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-slate-300 text-slate-950 font-bold text-[11px] flex items-center justify-center shadow-md">
                      2
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white truncate max-w-[90px] block">
                    {rankedUsers[1].name}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[90px] block">
                    {rankedUsers[1].handle}
                  </span>
                  <div className="mt-2 text-xs font-bold text-slate-200">
                    {sortBy === 'completed' 
                      ? `${rankedUsers[1].calculatedStats.completed} completed`
                      : sortBy === 'streak'
                      ? `${rankedUsers[1].calculatedStats.streak}d streak`
                      : `${rankedUsers[1].calculatedStats.cred.toLocaleString()} CR`}
                  </div>
                </div>
              )}

              {/* #1 Rank (Gold - Center, elevated) */}
              {rankedUsers[0] && (
                <div 
                  onClick={() => {
                    onOpenProfile?.(rankedUsers[0]);
                    onClose();
                  }}
                  className="flex flex-col items-center p-3.5 sm:p-4 rounded-xl border border-amber-400/30 bg-amber-400/5 hover:border-amber-400/50 transition-all cursor-pointer text-center relative group shadow-sm -mt-2"
                >
                  <div className="relative mb-2">
                    <img 
                      src={rankedUsers[0].avatar} 
                      alt={rankedUsers[0].name} 
                      className="h-14 w-14 rounded-full object-cover border-2 border-amber-400 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 h-5.5 w-5.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center shadow-md">
                      1
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[100px] block">
                    {rankedUsers[0].name}
                  </span>
                  <span className="text-[11px] text-amber-300/80 truncate max-w-[100px] block">
                    {rankedUsers[0].handle}
                  </span>
                  <div className="mt-2 text-xs sm:text-sm font-extrabold text-amber-300">
                    {sortBy === 'completed' 
                      ? `${rankedUsers[0].calculatedStats.completed} completed`
                      : sortBy === 'streak'
                      ? `${rankedUsers[0].calculatedStats.streak}d streak`
                      : `${rankedUsers[0].calculatedStats.cred.toLocaleString()} CR`}
                  </div>
                </div>
              )}

              {/* #3 Rank (Bronze) */}
              {rankedUsers[2] && (
                <div 
                  onClick={() => {
                    onOpenProfile?.(rankedUsers[2]);
                    onClose();
                  }}
                  className="flex flex-col items-center p-3 rounded-xl border border-white/10 bg-[#141822] hover:border-white/20 transition-all cursor-pointer text-center relative group"
                >
                  <div className="relative mb-2">
                    <img 
                      src={rankedUsers[2].avatar} 
                      alt={rankedUsers[2].name} 
                      className="h-12 w-12 rounded-full object-cover border border-amber-700/50 shadow-sm"
                    />
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center shadow-md">
                      3
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white truncate max-w-[90px] block">
                    {rankedUsers[2].name}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[90px] block">
                    {rankedUsers[2].handle}
                  </span>
                  <div className="mt-2 text-xs font-bold text-slate-200">
                    {sortBy === 'completed' 
                      ? `${rankedUsers[2].calculatedStats.completed} completed`
                      : sortBy === 'streak'
                      ? `${rankedUsers[2].calculatedStats.streak}d streak`
                      : `${rankedUsers[2].calculatedStats.cred.toLocaleString()} CR`}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Table Column Headers (Desktop) */}
        <div className="hidden sm:grid grid-cols-12 px-6 py-2.5 text-[11px] font-semibold text-slate-400 border-b border-white/5 bg-[#090C12] shrink-0">
          <div className="col-span-1">#</div>
          <div className="col-span-6">Member</div>
          <div className="col-span-2 text-center">Completed</div>
          <div className="col-span-1 text-center">Streak</div>
          <div className="col-span-2 text-right">Cred</div>
        </div>

        {/* Scrollable Members List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 min-h-[220px]">
          {rankedUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Search className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">No members match your filter</p>
              <p className="text-xs text-slate-500">Try clearing the search or switching filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTierFilter('all');
                }}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            rankedUsers.map((user, idx) => {
              const rank = idx + 1;
              const isCurrentUser = user.id === currentUserId;

              return (
                <div
                  key={user.id}
                  onClick={() => {
                    onOpenProfile?.(user);
                    onClose();
                  }}
                  className={`grid grid-cols-12 items-center px-4 sm:px-6 py-3 transition-colors cursor-pointer text-xs ${
                    isCurrentUser
                      ? 'bg-indigo-500/10 hover:bg-indigo-500/15'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Rank Column */}
                  <div className="col-span-2 sm:col-span-1 flex items-center font-semibold text-slate-400">
                    {rank === 1 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-bold text-xs">
                        1
                      </span>
                    ) : rank === 2 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-slate-950 font-bold text-xs">
                        2
                      </span>
                    ) : rank === 3 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-white font-bold text-xs">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-400 pl-1">{rank}</span>
                    )}
                  </div>

                  {/* Member Column */}
                  <div className="col-span-6 sm:col-span-6 flex items-center gap-3 min-w-0 pr-2">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="h-9 w-9 rounded-full object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-semibold truncate ${isCurrentUser ? 'text-indigo-300' : 'text-white'}`}>
                          {user.name}
                        </span>
                        {user.isPro && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            PRO
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 truncate block">
                        {user.handle}
                      </span>
                    </div>
                  </div>

                  {/* Completed Column */}
                  <div className="hidden sm:block col-span-2 text-center text-slate-300 font-medium">
                    {user.calculatedStats.completed}
                  </div>

                  {/* Streak Column */}
                  <div className="hidden sm:block col-span-1 text-center">
                    {user.calculatedStats.streak > 0 ? (
                      <span className="inline-flex items-center gap-1 text-slate-300 text-xs">
                        <Flame className="h-3 w-3 text-rose-400" />
                        <span>{user.calculatedStats.streak}d</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </div>

                  {/* Cred Column */}
                  <div className="col-span-4 sm:col-span-2 text-right">
                    <span className="font-bold text-amber-400 text-sm">
                      {user.calculatedStats.cred.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block sm:hidden">
                      {user.calculatedStats.completed} dares · {user.calculatedStats.streak}d
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Current User Standing */}
        <div className="border-t border-white/10 p-3.5 sm:p-4 bg-[#090C12] flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            {currentUserIndex !== -1 ? (
              <>
                <span className="text-white font-medium">
                  Your Standing: <span className="text-indigo-400 font-bold">#{currentUserIndex + 1}</span>
                </span>
                <span className="text-slate-600">·</span>
                <span>{currentUserData?.cred || 0} Cred</span>
              </>
            ) : (
              <span>{rankedUsers.length} community members ranked</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 hover:bg-white/15 px-4 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
