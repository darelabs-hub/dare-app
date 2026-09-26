import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Unlock, 
  Sparkles, 
  Gift, 
  Radio, 
  Flame, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { DailyContract, DailyOpsState, DareItem, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface DailyMissionWidgetProps {
  currentUser: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
  mission?: DareItem | null;
  onStartMission?: (dare: DareItem) => void;
  onNavigateAction?: (action: 'feed_vote' | 'create_dare' | 'browse_dares') => void;
}

const DEFAULT_OPS_STATE: DailyOpsState = {
  date: new Date().toISOString().split('T')[0],
  contracts: [
    {
      id: 'contract_1',
      title: 'Engage the Grid: Cast 2 Proof Votes',
      description: 'Review peer evidence in the Feed or Proof Gallery and cast 2 legitimate or busted votes.',
      tier: 'recon',
      targetCount: 2,
      currentCount: 0,
      rewardCred: 75,
      rewardXp: 120,
      icon: '🗳️',
      completed: false,
    },
    {
      id: 'contract_2',
      title: 'Physical or Cyber Breakthrough',
      description: 'Accept and submit verified evidence for any Fitness, Tech, or Cyber category dare.',
      tier: 'assault',
      targetCount: 1,
      currentCount: 0,
      rewardCred: 150,
      rewardXp: 250,
      icon: '⚡',
      completed: false,
    },
    {
      id: 'contract_3',
      title: 'Grid Instigator: Create a Dare or Stake Cred',
      description: 'Publish a new challenge or place a high-roller Cred stake on an accepted dare.',
      tier: 'overclock',
      targetCount: 1,
      currentCount: 0,
      rewardCred: 200,
      rewardXp: 350,
      icon: '🔥',
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
}) => {
  const [dailyOps, setDailyOps] = useState<DailyOpsState>(DEFAULT_OPS_STATE);
  const [claiming, setClaiming] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchDailyContracts();
  }, [currentUser.id]);

  const fetchDailyContracts = async () => {
    try {
      const res = await fetch(`/api/daily-contracts?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.contracts) {
          setDailyOps(data);
        }
      }
    } catch (err) {
      console.error('Failed to load daily contracts', err);
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
        setClaimFeedback(data.error || 'Failed to claim safe');
        playSound('error');
      } else {
        onUserUpdate(data.user);
        playSound('purchase');
        setClaimFeedback('🏆 Trifecta Safe Cracked! Claimed +500 CR, +600 XP & 2x Overclock Chip!');
        if (data.state) setDailyOps(data.state);
      }
    } catch (err) {
      setClaimFeedback('Network transmission failed');
    } finally {
      setClaiming(false);
      setTimeout(() => setClaimFeedback(null), 5000);
    }
  };

  const contracts = dailyOps?.contracts || DEFAULT_OPS_STATE.contracts;
  const allCompleted = contracts.length > 0 && contracts.every(c => c.completed);
  const completedCount = contracts.filter(c => c.completed).length;

  return (
    <div 
      id="daily-mission-widget" 
      className="rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/30 p-5 sm:p-6 mb-8 shadow-[0_0_35px_rgba(6,182,212,0.15)] relative overflow-hidden scroll-mt-24"
    >
      
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 h-48 w-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] shrink-0">
            <Target className="h-6 w-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight text-white sm:text-xl font-tech">
                DAILY MISSIONS & OPERATIONS
              </h2>
              <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                {completedCount}/3 OBJECTIVES SECURED
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Execute daily neural objectives to earn Cred, XP, and unlock the Daily Trifecta Cyber Safe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 font-mono self-start sm:self-auto bg-slate-900/90 px-3.5 py-2 rounded-xl border border-cyan-500/20 shadow-inner">
          <Clock className="h-4 w-4 text-cyan-400 animate-spin-slow" />
          <span>Resets Daily at 00:00 UTC</span>
        </div>
      </div>

      {/* Featured Daily Mission Challenge Spotlight Card */}
      {mission && (
        <div className="mt-5 rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-purple-950/40 p-4 sm:p-5 relative overflow-hidden shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-md">
                  <Sparkles className="h-3 w-3 text-amber-400" /> Featured Dare of the Day
                </span>
                <span className="text-[10px] font-mono text-indigo-300 uppercase px-2 py-0.5 rounded bg-indigo-900/50 border border-indigo-500/30">
                  {mission.category} • {mission.difficulty}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {mission.title}
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2">
                {mission.description}
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                <span className="text-cyan-300 font-bold">
                  Bounty: +{mission.rewardCred} Cred
                </span>
                <span className="text-purple-300 font-bold">
                  +{mission.rewardCred * 2} XP
                </span>
                {mission.creator?.handle && (
                  <span className="text-slate-400 text-[11px]">
                    Created by {mission.creator.handle}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                id="engage-featured-daily-mission-btn"
                onClick={() => {
                  playSound('laser');
                  if (onStartMission) onStartMission(mission);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 px-5 py-3 text-xs font-black text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95 transition-all cursor-pointer"
              >
                <Zap className="h-4 w-4 fill-current text-slate-950" />
                <span>{mission.status === 'open' ? 'Accept & Engage Mission' : 'View Mission Challenge'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Feedback Banner */}
      {claimFeedback && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 p-3 text-xs font-bold text-cyan-200 animate-in fade-in">
          <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>{claimFeedback}</span>
        </div>
      )}

      {/* 3 Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-5">
        {contracts.map(contract => {
          const progressPercent = Math.min(100, Math.round((contract.currentCount / contract.targetCount) * 100));

          return (
            <div
              key={contract.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                contract.completed
                  ? 'border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'border-white/10 bg-slate-900/70 hover:border-cyan-500/30'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl">{contract.icon}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                    contract.completed
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                      : 'bg-slate-800 text-slate-400 border-white/5'
                  }`}>
                    {contract.tier} Op
                  </span>
                </div>

                <h3 className="font-bold text-white text-xs mt-2.5 line-clamp-1">
                  {contract.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {contract.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-300">
                    Progress: {contract.currentCount}/{contract.targetCount}
                  </span>
                  <span className="font-bold text-cyan-300">
                    +{contract.rewardCred} CR • +{contract.rewardXp} XP
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      contract.completed ? 'bg-cyan-400' : 'bg-cyan-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {contract.completed ? (
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-cyan-400 pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Objective Secured
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      playSound('pop');
                      if (contract.id === 'contract_1' && onNavigateAction) onNavigateAction('feed_vote');
                      else if (contract.id === 'contract_2' && mission && onStartMission) onStartMission(mission);
                      else if (contract.id === 'contract_3' && onNavigateAction) onNavigateAction('create_dare');
                    }}
                    className="w-full min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 px-3 text-xs font-bold text-slate-200 transition-colors cursor-pointer active:scale-95"
                  >
                    <span>Engage Target</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trifecta Safe Unlock Banner */}
      <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
        allCompleted && !dailyOps?.trifectaClaimed
          ? 'border-amber-400 bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] animate-pulse'
          : 'border-white/10 bg-slate-950/60'
      }`}>
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl border ${
            allCompleted 
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-800 text-slate-500 border-white/5'
          }`}>
            {dailyOps?.trifectaClaimed ? '🏆' : allCompleted ? '🔓' : '🔒'}
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h4 className="font-black text-white text-sm">
                TRIFECTA CYBER SAFE
              </h4>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                +500 CR & 2x Overclock Chip
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {dailyOps?.trifectaClaimed
                ? 'Daily Trifecta rewards secured for today. Excellent work operative!'
                : allCompleted
                ? 'All 3 contracts resolved! Crack open the encrypted safe now.'
                : 'Complete all 3 operations today to decrypt the high-value safe.'}
            </p>
          </div>
        </div>

        <div>
          {dailyOps?.trifectaClaimed ? (
            <span className="flex items-center gap-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 px-4 py-2 text-xs font-bold text-cyan-300">
              <ShieldCheck className="h-4 w-4" /> Vault Decrypted
            </span>
          ) : allCompleted ? (
            <button
              disabled={claiming}
              onClick={handleClaimTrifecta}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 px-5 py-2.5 text-xs font-black text-slate-950 transition-all shadow-lg shadow-amber-900/40 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Gift className="h-4 w-4" />
              Crack Safe & Claim
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-semibold px-4 py-2 rounded-xl bg-slate-900 border border-white/5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Locked ({completedCount}/3)
            </span>
          )}
        </div>
      </div>

    </div>
  );
};
