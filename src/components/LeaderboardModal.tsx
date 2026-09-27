import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Trophy, 
  Medal, 
  Crown, 
  Coins, 
  Flame, 
  CheckCircle2, 
  PlusCircle,
  Zap,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { UserProfile } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUserId: string;
  onOpenProfile?: (user: UserProfile) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  onOpenProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'cred' | 'streak' | 'completed'>('cred');
  const [tierFilter, setTierFilter] = useState<'all' | 'pro'>('all');
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly' | 'all'>('all');

  // Filter and sort the user list dynamically based on active filter choices
  const filteredUsers = useMemo(() => {
    return users
      .map(user => ({
        ...user,
        calculatedStats: {
          cred: user.cred || 0,
          completed: user.completedDaresCount || 0,
          created: user.createdDaresCount || 0,
        }
      }))
      .filter(user => {
        const matchesSearch = 
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.handle.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesTier = tierFilter === 'all' || (tierFilter === 'pro' && user.isPro);
        
        return matchesSearch && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === 'streak') {
          return (b.streak || 0) - (a.streak || 0);
        }
        if (sortBy === 'completed') {
          return b.calculatedStats.completed - a.calculatedStats.completed;
        }
        return b.calculatedStats.cred - a.calculatedStats.cred;
      });
  }, [users, searchQuery, sortBy, tierFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="leaderboard-modal-container"
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-[#0f172a] p-4 sm:p-6 shadow-2xl my-auto overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 shrink-0">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                CHALLENGE <span className="text-amber-400">LEADERBOARD</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Top community contenders by Cred & completed dares
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white shrink-0 ml-2 cursor-pointer transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters Controls Section */}
        <div className="mt-3 space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or @handle..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-800 bg-[#070b13] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Sort By & Member Tier Filters Row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs">
            {/* Sort options */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-mono uppercase tracking-wider text-[9px] sm:text-[10px]">Sort:</span>
              <button
                type="button"
                onClick={() => setSortBy('cred')}
                className={`px-2.5 py-1 rounded-lg border font-mono font-bold transition-all text-[11px] cursor-pointer ${
                  sortBy === 'cred'
                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                💰 Cred
              </button>
              <button
                type="button"
                onClick={() => setSortBy('streak')}
                className={`px-2.5 py-1 rounded-lg border font-mono font-bold transition-all text-[11px] cursor-pointer ${
                  sortBy === 'streak'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                🔥 Streak
              </button>
              <button
                type="button"
                onClick={() => setSortBy('completed')}
                className={`px-2.5 py-1 rounded-lg border font-mono font-bold transition-all text-[11px] cursor-pointer ${
                  sortBy === 'completed'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                🏆 Wins
              </button>
            </div>

            {/* Tier filters */}
            <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-start">
              <span className="text-slate-500 font-mono uppercase tracking-wider text-[9px] sm:text-[10px]">Tier:</span>
              <div className="flex rounded-lg border border-slate-800 bg-slate-950/50 p-0.5">
                <button
                  type="button"
                  onClick={() => setTierFilter('all')}
                  className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase transition-all cursor-pointer ${
                    tierFilter === 'all'
                      ? 'bg-slate-800 text-slate-200'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('pro')}
                  className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase transition-all cursor-pointer ${
                    tierFilter === 'pro'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  PRO
                </button>
              </div>
            </div>
          </div>

          {/* Timeframe Segment Toggle */}
          <div className="flex items-center justify-between border-t border-slate-800/40 pt-2.5">
            <span className="text-slate-500 font-mono uppercase tracking-wider text-[9px] sm:text-[10px]">Timeframe:</span>
            <div className="flex rounded-lg border border-slate-800 bg-slate-950/50 p-0.5">
              {(['weekly', 'monthly', 'all'] as const).map((range) => {
                const label = range === 'weekly' ? 'Weekly' : range === 'monthly' ? 'Monthly' : 'All-Time';
                const isActive = timeRange === range;
                return (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`relative px-3 py-1 rounded-md font-mono font-bold text-[10px] uppercase transition-colors cursor-pointer ${
                      isActive
                        ? 'text-indigo-200'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTimeframePill"
                        className="absolute inset-0 rounded-md bg-indigo-500/20 border border-indigo-500/40"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leaderboard List (Clean scrolling container with fluid motion transitions) */}
        <div className="mt-3 sm:mt-4 overflow-y-auto pr-1 flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${timeRange}-${sortBy}-${tierFilter}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-2"
            >
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Search className="h-8 w-8 text-slate-600 mb-2.5 animate-pulse" />
                  <p className="font-mono text-xs font-bold text-slate-400">NO CONTENDERS FOUND</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    We couldn&apos;t find anyone matching your search or filters. Try adjusting your inputs!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSortBy('cred');
                      setTierFilter('all');
                    }}
                    className="mt-3.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-mono font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isMe = user.id === currentUserId;
                  const rankMedal =
                    idx === 0 ? (
                      <Crown className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-400" />
                    ) : idx === 1 ? (
                      <Medal className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-300" />
                    ) : idx === 2 ? (
                      <Medal className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-600" />
                    ) : (
                      <span className="font-mono text-xs sm:text-sm font-bold text-slate-500">#{idx + 1}</span>
                    );

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: Math.min(idx * 0.025, 0.2) }}
                      onClick={() => {
                        if (onOpenProfile) {
                          onOpenProfile(user);
                          onClose();
                        }
                      }}
                      className={`flex items-center justify-between rounded-xl border p-2.5 sm:p-3.5 transition-all cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-950/20 group gap-2 ${
                        isMe
                          ? 'border-indigo-500/50 bg-indigo-500/10'
                          : idx === 0
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-slate-800 bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center shrink-0">
                          {rankMedal}
                        </div>
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs sm:text-sm text-white truncate max-w-[120px] sm:max-w-[180px]">
                              {user.handle}
                            </span>
                            {user.isPro && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 border border-amber-500/30 bg-amber-500/10 text-[8px] font-bold font-mono tracking-wider text-amber-400 shrink-0">
                                <Crown className="h-2 w-2 text-amber-400" />
                                <span>PRO</span>
                              </span>
                            )}
                            {isMe && (
                              <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[8px] sm:text-[9px] font-mono text-indigo-300 uppercase shrink-0">
                                YOU
                              </span>
                            )}
                            {user.streak && user.streak > 0 && (
                              <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[8px] sm:text-[9px] font-mono font-bold shrink-0 ${
                                user.streak >= 5 
                                  ? 'bg-amber-950/60 border border-amber-500/50 text-amber-300' 
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                <Flame className={`h-2.5 w-2.5 ${user.streak >= 5 ? 'text-amber-400' : 'text-slate-400'}`} />
                                <span>{user.streak}d</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate mt-0.5">
                            {user.rank} • {user.calculatedStats.completed} Won • {user.calculatedStats.created} Set
                          </div>
                          {user.badges && user.badges.length > 0 && (
                            <div className="mt-1 flex gap-1 flex-wrap max-h-5 overflow-hidden">
                              {user.badges.slice(0, 3).map((b, i) => (
                                <span
                                  key={i}
                                  className="rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.2 text-[8px] sm:text-[9px] text-slate-300 font-mono truncate max-w-[90px]"
                                >
                                  {b}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-1">
                        <div className="flex items-center justify-end gap-1 font-mono font-bold text-amber-300 text-xs sm:text-sm">
                          <Coins className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          <span>{user.calculatedStats.cred.toLocaleString()}</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">CRED</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-between items-center border-t border-slate-800 pt-3 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            {filteredUsers.length} Competitors Registered
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
