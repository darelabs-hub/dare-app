import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Zap, 
  CheckCircle2, 
  Gift, 
  Flame, 
  ChevronRight,
  ShieldCheck,
  Bot,
  Mail,
  Award,
  Sparkles,
  Trophy,
  Check,
  Compass
} from 'lucide-react';
import { DailyOpsState, DareItem, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface DailyMissionWidgetProps {
  currentUser: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
  mission?: DareItem | null;
  onStartMission?: (dare: DareItem) => void;
  onNavigateAction?: (action: 'feed_vote' | 'create_dare' | 'browse_dares') => void;
  onOpenAiDareLab?: () => void;
}

const DEFAULT_OPS_STATE: DailyOpsState = {
  date: new Date().toISOString().split('T')[0],
  contracts: [
    {
      id: 'contract_1',
      title: 'Cast 2 Proof Votes',
      description: 'Review submissions in the Feed or Proof Gallery and cast 2 verification votes.',
      tier: 'Community',
      targetCount: 2,
      currentCount: 0,
      rewardCred: 75,
      rewardXp: 120,
      icon: 'check',
      completed: false,
    },
    {
      id: 'contract_2',
      title: 'Complete a Challenge',
      description: 'Accept any Fitness, Creative, or Social challenge and submit your proof.',
      tier: 'Challenge',
      targetCount: 1,
      currentCount: 0,
      rewardCred: 150,
      rewardXp: 250,
      icon: 'zap',
      completed: false,
    },
    {
      id: 'contract_3',
      title: 'Publish a Challenge',
      description: 'Create a new public dare or send a direct challenge to a friend.',
      tier: 'Creator',
      targetCount: 1,
      currentCount: 0,
      rewardCred: 200,
      rewardXp: 350,
      icon: 'flame',
      completed: false,
    },
  ],
  trifectaClaimed: false,
  trifectaRewardCred: 500,
  trifectaRewardXp: 600,
  resetTimeRemainingMs: 86400000 - (Date.now() % 86400000),
};

export const DailyMissionWidget: React.FC<DailyMissionWidgetProps> = ({
  currentUser,
  onUserUpdate,
  mission,
  onStartMission,
  onNavigateAction,
  onOpenAiDareLab,
}) => {
  const [missionMode, setMissionMode] = useState<'daily' | 'weekly'>('daily');
  const [dailyOps, setDailyOps] = useState<DailyOpsState>(DEFAULT_OPS_STATE);
  const [platformDailyDares, setPlatformDailyDares] = useState<DareItem[]>([]);
  const [selectedDailyIndex, setSelectedDailyIndex] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchDailyContracts();
    fetchPlatformDailyDares();
  }, [currentUser.id]);

  const fetchPlatformDailyDares = async () => {
    try {
      const res = await fetch('/api/daily-dares');
      if (res.ok) {
        const data = await res.json();
        if (data.dailyDares && Array.isArray(data.dailyDares)) {
          setPlatformDailyDares(data.dailyDares);
        }
      }
    } catch (_err) {
      console.error('Failed to load platform daily dares');
    }
  };

  const fetchDailyContracts = async () => {
    try {
      const res = await fetch(`/api/daily-contracts?userId=${currentUser.id}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.contracts) {
            setDailyOps(data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load daily goals', err);
    }
  };

  const handleClaimTrifecta = async () => {
    try {
      setClaiming(true);
      const res = await fetch('/api/daily-contracts/claim-trifecta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        setClaimFeedback(data.error || 'Failed to claim reward');
        playSound('error');
      } else {
        onUserUpdate(data.user);
        playSound('purchase');
        setClaimFeedback('🏆 Daily Bonus Claimed! +500 Cred added to your balance!');
        if (data.state) setDailyOps(data.state);
      }
    } catch (err) {
      setClaimFeedback('Unable to claim daily reward');
    } finally {
      setClaiming(false);
      setTimeout(() => setClaimFeedback(null), 5000);
    }
  };

  const contracts = dailyOps?.contracts || DEFAULT_OPS_STATE.contracts;
  const allCompleted = contracts.length > 0 && contracts.every(c => c.completed);
  const completedCount = contracts.filter(c => c.completed).length;

  // Clean social tier label helper
  const getSocialTierLabel = (tier: string) => {
    const lower = tier.toLowerCase();
    if (lower === 'recon' || lower === 'community') return 'Community';
    if (lower === 'assault' || lower === 'challenge') return 'Challenge';
    if (lower === 'overclock' || lower === 'creator') return 'Creator';
    return tier;
  };

  // Clean vector icon helper instead of raw emojis
  const renderGoalIcon = (contractId: string) => {
    if (contractId === 'contract_1') {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      );
    }
    if (contractId === 'contract_2') {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm">
          <Zap className="h-5 w-5" />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 shadow-sm">
        <Flame className="h-5 w-5" />
      </div>
    );
  };

  return (
    <div 
      id="daily-mission-widget" 
      className="rounded-3xl border border-slate-800 bg-[#0c1017] p-4.5 sm:p-6 mb-8 shadow-sm relative overflow-hidden scroll-mt-24"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700/60 text-white shadow-sm shrink-0">
            <Target className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Daily Goals & Highlights
              </h2>
              <span className="text-[11px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full font-mono">
                {completedCount} of 3 completed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete daily activities to grow your community presence and earn bonus Cred.
            </p>
          </div>
        </div>

        {/* Tab Switcher: Apple/Linear Segmented Control */}
        <div className="flex items-center p-1 rounded-xl border border-white/[0.08] bg-white/[0.04] shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setMissionMode('daily');
              playSound('click');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              missionMode === 'daily'
                ? 'bg-white text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Today's Goals
          </button>
          <button
            type="button"
            onClick={() => {
              setMissionMode('weekly');
              playSound('click');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              missionMode === 'weekly'
                ? 'bg-white text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Weekly Highlights
          </button>
        </div>
      </div>

      {/* WEEKLY HIGHLIGHTS & SPONSOR PROGRAM */}
      {missionMode === 'weekly' && (
        <div className="mt-5 space-y-4 animate-fade-in">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Weekly Creator Tournament</h4>
                <p className="text-xs text-slate-400">10,000 Cred Prize Pool · Resets Sunday at midnight</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/40 px-3 py-1 rounded-full shrink-0">
              Active This Week
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'wq_1',
                title: '5K Verified Run',
                desc: 'Complete an outdoor 5KM run and verify with workout screenshot or photo proof.',
                reward: 450,
                tag: 'Fitness',
              },
              {
                id: 'wq_2',
                title: 'Community Reviewer (5 Votes)',
                desc: 'Vote on 5 community proof submissions with verification checks.',
                reward: 350,
                tag: 'Community',
              },
              {
                id: 'wq_3',
                title: 'Top Challenge Creator',
                desc: 'Publish a dare that receives at least 3 community acceptances.',
                reward: 600,
                tag: 'Creator',
              },
            ].map(quest => (
              <div key={quest.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                      {quest.tag}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">+{quest.reward} Cred</span>
                  </div>
                  <h5 className="text-xs font-bold text-white mb-1">{quest.title}</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{quest.desc}</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Weekly Goal</span>
                  <span className="text-cyan-400">Available</span>
                </div>
              </div>
            ))}
          </div>

          {/* Clean Sponsor Information */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 sm:p-5 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-pink-400" />
                  <span>Brand &amp; Event Partnerships</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Partner with DARE to sponsor challenge prize pools, fitness goals, and community events.
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-auto">
                Inquiries Open
              </span>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
              <span>Interested in sponsoring a tournament prize pool or community challenge?</span>
              <a
                href="mailto:support@dare.me.uk?subject=Sponsorship%20Inquiry"
                className="text-pink-400 hover:text-pink-300 font-semibold transition-colors flex items-center gap-1 shrink-0"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Contact support@dare.me.uk →</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* DAILY GOALS TAB CONTENT */}
      {missionMode === 'daily' && (
        <div className="animate-fade-in mt-4 space-y-4">
          
          {/* Platform Generated Daily Dares Showcase */}
          {((platformDailyDares.length > 0) || mission) && (() => {
            const activeDare = platformDailyDares[selectedDailyIndex] || mission;
            if (!activeDare) return null;
            const isCompletedByUser = activeDare.completedUserIds?.includes(currentUser.id);
            const isAcceptedByUser = activeDare.acceptedUserIds?.includes(currentUser.id) || activeDare.acceptedBy?.id === currentUser.id;

            return (
              <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-[#121626] via-[#0d111c] to-[#0a0d14] p-4 sm:p-5 shadow-sm space-y-3.5">
                {/* Daily Dare Selector Tabs if multiple */}
                {platformDailyDares.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span>Today's Dares:</span>
                    </span>
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                      {platformDailyDares.map((pd, idx) => {
                        const pdCompleted = pd.completedUserIds?.includes(currentUser.id);
                        return (
                          <button
                            key={pd.id}
                            type="button"
                            onClick={() => {
                              playSound('click');
                              setSelectedDailyIndex(idx);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                              selectedDailyIndex === idx
                                ? 'bg-white text-slate-950 font-semibold shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                          >
                            <span className="capitalize">{pd.category}</span>
                            <span className={`text-[10px] font-mono ${selectedDailyIndex === idx ? 'text-slate-700' : 'text-amber-400/90'}`}>
                              +{pd.rewardCred} CR
                            </span>
                            {pdCompleted && <span className="text-emerald-400 font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <Flame className="h-3 w-3 text-amber-400" />
                        <span>Platform Daily Dare</span>
                      </span>
                      <span className="text-[10px] font-medium text-slate-300 capitalize px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {activeDare.category} · {activeDare.difficulty}
                      </span>
                      {isCompletedByUser && (
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>Completed (+{activeDare.rewardCred} Cred Claimed)</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {activeDare.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {activeDare.description}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        Reward: +{activeDare.rewardCred} Cred
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Official DARE Challenge
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      id="engage-featured-daily-mission-btn"
                      onClick={() => {
                        playSound('pop');
                        if (onStartMission) onStartMission(activeDare);
                      }}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer ${
                        isCompletedByUser
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : 'bg-white hover:bg-slate-200 text-slate-950'
                      }`}
                    >
                      <span>
                        {isCompletedByUser 
                          ? 'View Evidence' 
                          : isAcceptedByUser 
                          ? 'Submit Proof' 
                          : 'Accept Challenge'}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* AI Challenge Inspiration Card: Sleek, Subtle & Modern */}
          <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-r from-[#121622] via-[#0d1017] to-[#0a0d14] p-4 sm:p-4.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                      Looking for a creative challenge?
                    </h3>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-purple-950/60 border border-purple-800/40 text-purple-300">
                      AI Studio
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    Generate tailored fitness, creative, or social challenges in seconds.
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    if (onOpenAiDareLab) onOpenAiDareLab();
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white px-3.5 py-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                  <span>Generate Prompt</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {claimFeedback && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3 text-xs font-semibold text-emerald-200 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{claimFeedback}</span>
            </div>
          )}

          {/* 3 Daily Goals Grid: Refined Social Activity Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {contracts.map(contract => {
              const progressPercent = Math.min(100, Math.round((contract.currentCount / contract.targetCount) * 100));
              const tierLabel = getSocialTierLabel(contract.tier);

              return (
                <div
                  key={contract.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                    contract.completed
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : 'border-slate-800/90 bg-slate-900/40 hover:border-slate-700/80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      {renderGoalIcon(contract.id)}
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                        contract.completed
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {tierLabel}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-xs mt-3 line-clamp-1">
                      {contract.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {contract.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-medium text-slate-300">
                        {contract.currentCount} of {contract.targetCount} completed
                      </span>
                      <span className="font-bold text-amber-400 font-mono">
                        +{contract.rewardCred} Cred
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          contract.completed ? 'bg-emerald-400' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {contract.completed ? (
                      <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-400 pt-1">
                        <Check className="h-3.5 w-3.5" /> Completed
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          playSound('pop');
                          if (contract.id === 'contract_1' && onNavigateAction) onNavigateAction('feed_vote');
                          else if (contract.id === 'contract_2' && mission && onStartMission) onStartMission(mission);
                          else if (contract.id === 'contract_3' && onNavigateAction) onNavigateAction('create_dare');
                          else if (onNavigateAction) onNavigateAction('browse_dares');
                        }}
                        className="w-full min-h-[38px] flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 py-1.5 px-3 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer active:scale-95"
                      >
                        <span>Start Goal</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily Goal Reward Banner */}
          <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
            allCompleted && !dailyOps?.trifectaClaimed
              ? 'border-amber-400/50 bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/30 shadow-md'
              : 'border-slate-800 bg-slate-900/30'
          }`}>
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg border ${
                allCompleted 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}>
                {dailyOps?.trifectaClaimed ? '🏆' : allCompleted ? '🎁' : <Trophy className="h-5 w-5 text-slate-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Daily Bonus Reward
                  </h4>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">
                    +500 Cred
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  {dailyOps?.trifectaClaimed
                    ? 'Daily bonus claimed for today. Come back tomorrow for new goals!'
                    : allCompleted
                    ? 'All 3 daily goals completed! Claim your +500 Cred bonus now.'
                    : 'Complete all 3 daily goals to unlock your +500 Cred bonus reward.'}
                </p>
              </div>
            </div>

            <div>
              {dailyOps?.trifectaClaimed ? (
                <span className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Bonus Claimed
                </span>
              ) : allCompleted ? (
                <button
                  disabled={claiming}
                  onClick={handleClaimTrifecta}
                  className="rounded-xl bg-amber-400 hover:bg-amber-300 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Gift className="h-4 w-4" />
                  <span>Claim +500 Cred</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-medium px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-1.5">
                  <span>Locked ({completedCount}/3)</span>
                </span>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
