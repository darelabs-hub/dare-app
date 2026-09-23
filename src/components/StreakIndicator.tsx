import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Zap, 
  Calendar,
  ChevronRight,
  TrendingUp,
  X,
  ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface StreakIndicatorProps {
  currentUser: UserProfile;
  onOpenLeaderboard?: () => void;
  onParticipatePrompt?: () => void;
}

export interface StreakMilestone {
  days: number;
  badgeName: string;
  title: string;
  color: string;
  border: string;
  glow: string;
  bg: string;
  icon: string;
  unlocked: boolean;
}

export const getStreakTier = (streak: number) => {
  if (streak >= 30) {
    return {
      tier: 'Mythic Cyber God',
      label: '30+ Days',
      color: 'text-purple-300',
      badgeBorder: 'border-purple-500/70',
      badgeGlow: 'glow-purple shadow-[0_0_20px_rgba(168,85,247,0.4)]',
      badgeBg: 'bg-purple-950/60',
      flameColor: 'text-purple-400',
      flameAnimation: 'animate-bounce',
      ringColor: 'ring-purple-400/50',
      iconEmoji: '⚡',
      badgeName: '⚡ Overclock Paragon',
    };
  }
  if (streak >= 14) {
    return {
      tier: 'Quantum Striker',
      label: '14+ Days',
      color: 'text-rose-300',
      badgeBorder: 'border-rose-500/70',
      badgeGlow: 'glow-magenta shadow-[0_0_18px_rgba(244,63,94,0.35)]',
      badgeBg: 'bg-rose-950/60',
      flameColor: 'text-rose-400',
      flameAnimation: 'animate-pulse',
      ringColor: 'ring-rose-400/50',
      iconEmoji: '👑',
      badgeName: '👑 Neural Kingpin',
    };
  }
  if (streak >= 7) {
    return {
      tier: 'High-Voltage Agent',
      label: '7+ Days',
      color: 'text-amber-300',
      badgeBorder: 'border-amber-500/60',
      badgeGlow: 'glow-amber shadow-[0_0_16px_rgba(245,158,11,0.3)]',
      badgeBg: 'bg-amber-950/50',
      flameColor: 'text-amber-400',
      flameAnimation: 'animate-pulse',
      ringColor: 'ring-amber-400/40',
      iconEmoji: '🔥',
      badgeName: '🔥 7-Day Infernal',
    };
  }
  if (streak >= 5) {
    return {
      tier: 'Hardwired Pioneer',
      label: '5-Day Milestone',
      color: 'text-cyan-300',
      badgeBorder: 'border-cyan-400/60',
      badgeGlow: 'glow-cyan shadow-[0_0_15px_rgba(6,182,212,0.35)]',
      badgeBg: 'bg-cyan-950/50',
      flameColor: 'text-cyan-400',
      flameAnimation: 'animate-pulse',
      ringColor: 'ring-cyan-400/40',
      iconEmoji: '💎',
      badgeName: '💎 Circuit Breaker (5-Day)',
    };
  }
  if (streak >= 3) {
    return {
      tier: 'Ignited Netrunner',
      label: '3-Day Spark',
      color: 'text-emerald-300',
      badgeBorder: 'border-emerald-500/50',
      badgeGlow: 'glow-green shadow-[0_0_12px_rgba(16,185,129,0.25)]',
      badgeBg: 'bg-emerald-950/40',
      flameColor: 'text-emerald-400',
      flameAnimation: '',
      ringColor: 'ring-emerald-400/30',
      iconEmoji: '⚡',
      badgeName: '⚡ Spark Netrunner',
    };
  }
  return {
    tier: 'Initiate Cadet',
    label: 'Warm Up',
    color: 'text-slate-300',
    badgeBorder: 'border-slate-700/60',
    badgeGlow: '',
    badgeBg: 'bg-slate-900/60',
    flameColor: 'text-amber-500/80',
    flameAnimation: '',
    ringColor: 'ring-slate-700/40',
    iconEmoji: '🎯',
    badgeName: '🎯 Grid Initiate',
  };
};

export const StreakIndicator: React.FC<StreakIndicatorProps> = ({
  currentUser,
  onOpenLeaderboard,
  onParticipatePrompt,
}) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const streak = currentUser.streak ?? 1;
  const currentTier = getStreakTier(streak);

  // Milestone catalog
  const milestones: StreakMilestone[] = [
    {
      days: 3,
      badgeName: '⚡ Spark Netrunner',
      title: 'Ignition Pulse',
      color: 'text-emerald-400',
      border: 'border-emerald-500/40',
      glow: 'glow-green',
      bg: 'bg-emerald-950/30',
      icon: '⚡',
      unlocked: streak >= 3,
    },
    {
      days: 5,
      badgeName: '💎 Circuit Breaker (5-Day)',
      title: 'Hardwired Pioneer',
      color: 'text-cyan-400',
      border: 'border-cyan-500/50',
      glow: 'glow-cyan',
      bg: 'bg-cyan-950/40',
      icon: '💎',
      unlocked: streak >= 5,
    },
    {
      days: 7,
      badgeName: '🔥 7-Day Infernal',
      title: 'Infernal Streak',
      color: 'text-amber-400',
      border: 'border-amber-500/50',
      glow: 'glow-amber',
      bg: 'bg-amber-950/40',
      icon: '🔥',
      unlocked: streak >= 7,
    },
    {
      days: 14,
      badgeName: '👑 Neural Kingpin',
      title: 'Fortnight Titan',
      color: 'text-rose-400',
      border: 'border-rose-500/60',
      glow: 'glow-magenta',
      bg: 'bg-rose-950/40',
      icon: '👑',
      unlocked: streak >= 14,
    },
    {
      days: 30,
      badgeName: '⚡ Overclock Paragon',
      title: 'Cyber God Status',
      color: 'text-purple-400',
      border: 'border-purple-500/70',
      glow: 'glow-purple',
      bg: 'bg-purple-950/40',
      icon: '⚡',
      unlocked: streak >= 30,
    },
  ];

  // Calculate next target milestone
  const nextMilestone = milestones.find((m) => m.days > streak) || milestones[milestones.length - 1];
  const daysUntilNext = Math.max(0, nextMilestone.days - streak);

  return (
    <>
      {/* Header Compact Badge & Interactive Trigger */}
      <button
        id="streak-header-indicator"
        type="button"
        onClick={() => {
          playSound('click');
          setModalOpen(true);
        }}
        title={`${streak} Day Streak (${currentTier.tier}) - Click to view rewards roadmap!`}
        className={`group relative flex items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 py-1 sm:px-3 sm:py-1.5 transition-all duration-300 hover:scale-105 active:scale-95 ${currentTier.badgeBorder} ${currentTier.badgeBg} ${currentTier.badgeGlow}`}
      >
        {/* Animated Flame Icon */}
        <div className="relative flex items-center justify-center">
          <Flame className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${currentTier.flameColor} ${currentTier.flameAnimation} transition-transform group-hover:scale-110`} />
          {streak >= 5 && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
          )}
        </div>

        {/* Streak Digit & Label */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 leading-none">
            <span className={`font-mono text-xs sm:text-sm font-black tracking-tight ${currentTier.color}`}>
              {streak}
            </span>
            <span className="font-tech text-[10px] font-bold tracking-wider text-slate-300 uppercase">
              {streak === 1 ? 'DAY' : 'DAYS'}
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 hidden md:block leading-none mt-0.5 truncate max-w-[90px]">
            {currentTier.tier}
          </span>
        </div>

        {/* Milestone Upgrade Chip for 5+ Days */}
        {streak >= 5 && (
          <div className="hidden lg:flex items-center gap-0.5 rounded-full border border-cyan-400/40 bg-cyan-950/70 px-1.5 py-0.2 text-[9px] font-mono font-bold text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
            <Sparkles className="h-2.5 w-2.5 text-cyan-300" />
            <span>M5+</span>
          </div>
        )}

        {/* Streak Shield Active Mini Badge */}
        {currentUser.streakShieldActive && (
          <div className="flex items-center gap-0.5 rounded-full border border-emerald-400/40 bg-emerald-950/70 px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" title="Active 24H Streak Shield Engaged!">
            <ShieldCheck className="h-2.5 w-2.5 text-emerald-300" />
            <span>SHIELDED</span>
          </div>
        )}
      </button>

      {/* Comprehensive Streak & Milestone Rewards Modal */}
      {modalOpen && (
        <div 
          id="streak-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div 
            id="streak-modal-container"
            className="relative w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#0c101a] p-6 shadow-2xl glow-cyan animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${currentTier.badgeBorder} ${currentTier.badgeBg} ${currentTier.badgeGlow}`}>
                  <Flame className={`h-7 w-7 ${currentTier.flameColor} ${currentTier.flameAnimation}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-tech text-xl font-bold uppercase tracking-wider text-white">
                      Daily Streak Telemetry
                    </h3>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${currentTier.badgeBorder} ${currentTier.badgeBg} ${currentTier.color}`}>
                      {currentTier.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Participate daily in challenges (deploying, accepting, or submitting) to level up rewards.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Streak Stat Hero Box */}
            <div className="mt-5 rounded-2xl border border-slate-800 bg-[#07090e]/90 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Current Active Streak
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-4xl font-extrabold text-white text-glow-cyan">
                      {streak}
                    </span>
                    <span className="font-tech text-sm font-bold uppercase tracking-widest text-cyan-400">
                      Consecutive Days
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Next Milestone Reward
                  </span>
                  <div className="mt-1 flex items-center justify-end gap-1.5 text-xs font-mono font-bold text-amber-300">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    {daysUntilNext === 0 ? 'Milestone Maxed!' : `in ${daysUntilNext} day${daysUntilNext > 1 ? 's' : ''}`}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {nextMilestone.badgeName}
                  </div>
                </div>
              </div>

              {/* Progress Bar towards Next Milestone */}
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                  <span>Day {streak}</span>
                  <span className="text-cyan-300">Goal: {nextMilestone.days} Days ({nextMilestone.title})</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400 rounded-full transition-all duration-500 glow-cyan"
                    style={{ 
                      width: `${Math.min(100, Math.max(15, (streak / nextMilestone.days) * 100))}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Milestone Roadmap & Badges List */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>Streak Badge Rewards Roadmap</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Auto-equipped on profile
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {milestones.map((ms) => {
                  return (
                    <div
                      key={ms.days}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                        ms.unlocked
                          ? `${ms.border} ${ms.bg} ${ms.glow}`
                          : 'border-slate-800/80 bg-slate-900/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base font-bold ${
                          ms.unlocked
                            ? `${ms.border} bg-slate-900/80 shadow-sm`
                            : 'border-slate-800 bg-slate-950 text-slate-600'
                        }`}>
                          {ms.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-xs font-bold ${ms.unlocked ? ms.color : 'text-slate-400'}`}>
                              {ms.badgeName}
                            </span>
                            {ms.unlocked ? (
                              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/40">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                UNLOCKED
                              </span>
                            ) : (
                              <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-mono text-slate-400">
                                Requires {ms.days} Days
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {ms.title} • {ms.days}-day daily participation streak
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-slate-300">
                          {ms.days}d
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Call to action & footer */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <span>Reset rule: Keep streak alive with 1 dare daily</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  if (onParticipatePrompt) onParticipatePrompt();
                }}
                className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-3.5 py-2 text-xs font-mono font-bold text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-md glow-cyan"
              >
                <span>Keep Streak Active</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
