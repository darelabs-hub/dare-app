import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Award, 
  CheckCircle2, 
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
  bg: string;
  icon: string;
  unlocked: boolean;
}

export const getStreakTier = (streak: number) => {
  if (streak >= 30) {
    return {
      tier: 'Apex Champion',
      label: '30+ Days',
      color: 'text-purple-300',
      badgeBorder: 'border-purple-500/30',
      badgeBg: 'bg-purple-500/10',
      flameColor: 'text-purple-400',
      flameAnimation: '',
      ringColor: 'ring-purple-400/20',
      badgeName: 'Apex Paragon',
    };
  }
  if (streak >= 14) {
    return {
      tier: 'Fortnight Titan',
      label: '14+ Days',
      color: 'text-rose-300',
      badgeBorder: 'border-rose-500/30',
      badgeBg: 'bg-rose-500/10',
      flameColor: 'text-rose-400',
      flameAnimation: '',
      ringColor: 'ring-rose-400/20',
      badgeName: 'Titan Streak',
    };
  }
  if (streak >= 7) {
    return {
      tier: '7-Day Streak',
      label: '7+ Days',
      color: 'text-amber-300',
      badgeBorder: 'border-amber-500/30',
      badgeBg: 'bg-amber-500/10',
      flameColor: 'text-amber-400',
      flameAnimation: '',
      ringColor: 'ring-amber-400/20',
      badgeName: 'Infernal Streak',
    };
  }
  if (streak >= 5) {
    return {
      tier: '5-Day Streak',
      label: '5-Day Milestone',
      color: 'text-sky-300',
      badgeBorder: 'border-sky-500/30',
      badgeBg: 'bg-sky-500/10',
      flameColor: 'text-sky-400',
      flameAnimation: '',
      ringColor: 'ring-sky-400/20',
      badgeName: 'Pioneer Streak',
    };
  }
  if (streak >= 3) {
    return {
      tier: '3-Day Spark',
      label: '3-Day Spark',
      color: 'text-emerald-300',
      badgeBorder: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500/10',
      flameColor: 'text-emerald-400',
      flameAnimation: '',
      ringColor: 'ring-emerald-400/20',
      badgeName: 'Spark Pioneer',
    };
  }
  return {
    tier: 'Day 1',
    label: 'Getting Started',
    color: 'text-slate-300',
    badgeBorder: 'border-white/[0.08]',
    badgeBg: 'bg-white/[0.03]',
    flameColor: 'text-amber-400',
    flameAnimation: '',
    ringColor: 'ring-white/10',
    badgeName: 'Initiate',
  };
};

export const StreakIndicator: React.FC<StreakIndicatorProps> = ({
  currentUser,
  onParticipatePrompt,
}) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const streak = currentUser.streak ?? 1;
  const currentTier = getStreakTier(streak);

  // Milestone catalog
  const milestones: StreakMilestone[] = [
    {
      days: 3,
      badgeName: 'Spark Pioneer',
      title: 'Ignition',
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
      icon: '⚡',
      unlocked: streak >= 3,
    },
    {
      days: 5,
      badgeName: 'Pioneer Streak',
      title: '5-Day Habit',
      color: 'text-sky-400',
      border: 'border-sky-500/20',
      bg: 'bg-sky-500/10',
      icon: '💎',
      unlocked: streak >= 5,
    },
    {
      days: 7,
      badgeName: '7-Day Streak',
      title: 'Full Week',
      color: 'text-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/10',
      icon: '🔥',
      unlocked: streak >= 7,
    },
    {
      days: 14,
      badgeName: 'Dare Sovereign',
      title: 'Fortnight Titan',
      color: 'text-rose-400',
      border: 'border-rose-500/20',
      bg: 'bg-rose-500/10',
      icon: '👑',
      unlocked: streak >= 14,
    },
    {
      days: 30,
      badgeName: 'Apex Champion',
      title: 'Monthly Mastery',
      color: 'text-purple-400',
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/10',
      icon: '⚡',
      unlocked: streak >= 30,
    },
  ];

  // Calculate next target milestone
  const nextMilestone = milestones.find((m) => m.days > streak) || milestones[milestones.length - 1];
  const daysUntilNext = Math.max(0, nextMilestone.days - streak);

  return (
    <>
      {/* Header Compact Badge */}
      <button
        id="streak-header-indicator"
        type="button"
        onClick={() => {
          playSound('click');
          setModalOpen(true);
        }}
        title={`${streak} Day Streak (${currentTier.tier}) - Click to view rewards!`}
        className={`group relative flex items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 py-1 sm:px-3 sm:py-1.5 transition-all duration-200 hover:bg-white/[0.06] active:scale-95 ${currentTier.badgeBorder} ${currentTier.badgeBg}`}
      >
        {/* Flame Icon */}
        <div className="relative flex items-center justify-center">
          <Flame className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${currentTier.flameColor} transition-transform group-hover:scale-110`} />
        </div>

        {/* Streak Digit & Label */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 leading-none">
            <span className={`font-mono text-xs sm:text-sm font-bold tracking-tight ${currentTier.color}`}>
              {streak}
            </span>
            <span className="text-[10px] font-medium tracking-wide text-slate-400">
              {streak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 hidden md:block leading-none mt-0.5 truncate max-w-[90px]">
            {currentTier.tier}
          </span>
        </div>

        {/* Streak Shield Active Mini Badge */}
        {currentUser.streakShieldActive && (
          <div className="flex items-center gap-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300" title="Streak Shield Active">
            <ShieldCheck className="h-2.5 w-2.5 text-emerald-300" />
            <span>Shield</span>
          </div>
        )}
      </button>

      {/* Streak Details Modal */}
      {modalOpen && (
        <div 
          id="streak-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div 
            id="streak-modal-container"
            className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0A0D14] p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${currentTier.badgeBorder} ${currentTier.badgeBg}`}>
                  <Flame className={`h-6 w-6 ${currentTier.flameColor}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Daily Streak
                    </h3>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${currentTier.badgeBorder} ${currentTier.badgeBg} ${currentTier.color}`}>
                      {currentTier.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Participate daily in challenges to build your streak and unlock rewards.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Current Streak Stat Hero Box */}
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                    Active Streak
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-3xl font-extrabold text-white">
                      {streak}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Consecutive Days
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                    Next Milestone
                  </span>
                  <div className="mt-1 flex items-center justify-end gap-1.5 text-xs font-bold text-amber-300">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    {daysUntilNext === 0 ? 'Milestone Maxed!' : `in ${daysUntilNext} day${daysUntilNext > 1 ? 's' : ''}`}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {nextMilestone.badgeName}
                  </div>
                </div>
              </div>

              {/* Progress Bar towards Next Milestone */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Day {streak}</span>
                  <span className="text-slate-300">Goal: {nextMilestone.days} Days ({nextMilestone.title})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, Math.max(10, (streak / nextMilestone.days) * 100))}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Milestone Roadmap & Badges List */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>Streak Milestones</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Auto-equipped on profile
                </span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {milestones.map((ms) => {
                  return (
                    <div
                      key={ms.days}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                        ms.unlocked
                          ? `${ms.border} ${ms.bg}`
                          : 'border-white/[0.04] bg-white/[0.01] opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold ${
                          ms.unlocked
                            ? `${ms.border} bg-white/5 shadow-sm`
                            : 'border-white/[0.06] bg-white/[0.02] text-slate-600'
                        }`}>
                          {ms.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${ms.unlocked ? ms.color : 'text-slate-400'}`}>
                              {ms.badgeName}
                            </span>
                            {ms.unlocked ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                UNLOCKED
                              </span>
                            ) : (
                              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-400">
                                Requires {ms.days} Days
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
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

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Keep streak alive with 1 challenge daily</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  if (onParticipatePrompt) onParticipatePrompt();
                }}
                className="flex items-center gap-1 rounded-xl bg-white text-slate-950 px-3.5 py-2 text-xs font-bold hover:bg-slate-100 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
