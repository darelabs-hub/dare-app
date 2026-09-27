import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Crown, 
  Sparkles, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Zap, 
  Shield, 
  Flame, 
  Gift, 
  ArrowRight,
  Clock,
  ChevronRight,
  Star
} from 'lucide-react';
import { BattlePassTier, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface SeasonPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
  onOpenArmory?: () => void;
}

export const SeasonPassModal: React.FC<SeasonPassModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onOpenArmory,
}) => {
  const [passData, setPassData] = useState<{
    seasonName: string;
    seasonEndsInDays: number;
    tiers: BattlePassTier[];
    userLevel: number;
    userXp: number;
    hasElitePass: boolean;
    claimedFree: number[];
    claimedElite: number[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [claimingTier, setClaimingTier] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSeasonPassData();
    }
  }, [isOpen, currentUser.id]);

  const fetchSeasonPassData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/season-pass?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setPassData(data);
      }
    } catch (err) {
      console.error('Failed to load season pass', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleClaimReward = async (level: number, track: 'free' | 'elite') => {
    try {
      setClaimingTier(`${level}_${track}`);
      const res = await fetch('/api/season-pass/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          level,
          track,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || 'Failed to claim reward');
        playSound('error');
      } else {
        onUserUpdate(data.user);
        playSound('levelUp');
        setFeedback(`Claimed Tier ${level} ${track.toUpperCase()} reward!`);
        if (passData) {
          setPassData({
            ...passData,
            claimedFree: data.claimedFree,
            claimedElite: data.claimedElite,
          });
        }
      }
    } catch (err) {
      setFeedback('Network uplink error');
    } finally {
      setClaimingTier(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleUpgradeElite = async () => {
    if (currentUser.cred < 2000 && !currentUser.isPro) {
      setFeedback('Insufficient Cred (2,000 CR needed) to unlock Cyber Elite Pass.');
      playSound('error');
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    try {
      setUpgrading(true);
      const res = await fetch('/api/season-pass/upgrade-elite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || 'Upgrade failed');
        playSound('error');
      } else {
        onUserUpdate(data.user);
        playSound('purchase');
        setFeedback('👑 Cyber Elite Battle Pass Unlocked! Claim your elite track rewards.');
        if (passData) {
          setPassData({ ...passData, hasElitePass: true });
        }
      }
    } catch (err) {
      setFeedback('Failed to upgrade pass');
    } finally {
      setUpgrading(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const userLevel = currentUser.seasonPassLevel || passData?.userLevel || 1;
  const userXp = currentUser.seasonPassXp || passData?.userXp || 0;
  const hasElite = currentUser.hasElitePass || currentUser.isPro || passData?.hasElitePass || false;
  const tiers = passData?.tiers || [];

  const currentTierObj = tiers.find(t => t.level === userLevel);
  const nextTierObj = tiers.find(t => t.level === userLevel + 1);
  const currentReqXp = currentTierObj ? currentTierObj.requiredXp : 0;
  const nextReqXp = nextTierObj ? nextTierObj.requiredXp : (currentReqXp + 1000);
  const xpInTier = Math.max(0, userXp - currentReqXp);
  const xpNeeded = Math.max(1, nextReqXp - currentReqXp);
  const progressPercent = Math.min(100, Math.round((xpInTier / xpNeeded) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-amber-500/30 bg-slate-950/95 text-slate-100 shadow-[0_0_60px_rgba(245,158,11,0.15)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 p-5 sm:p-6 bg-gradient-to-r from-amber-950/40 via-slate-900 to-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  SEASON 1: NEON INSURGENCY
                </h2>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  Battle Pass
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" /> Season ends in 42 days • Complete dares to advance tiers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSound('pop');
                onClose();
              }}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Level Progression & Elite Pass Banner */}
        <div className="p-6 border-b border-white/10 bg-slate-900/60 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Level Card */}
            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-900 p-4 flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 font-black text-slate-950 text-xl shadow-lg">
                    {userLevel}
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Current Pass Tier</div>
                    <h3 className="font-black text-white text-base">Tier {userLevel} Operative</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-300">{userXp} Season XP</div>
                  <div className="text-[10px] text-slate-500">Next Tier at {nextReqXp} XP</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>Progress to Tier {userLevel + 1}</span>
                  <span className="text-amber-300 font-bold">{progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden p-0.5 border border-white/5">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Elite Track Card / Upgrade CTA */}
            <div className={`rounded-2xl border p-4 flex flex-col justify-between ${
              hasElite 
                ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/30 to-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'border-purple-500/30 bg-gradient-to-br from-purple-950/30 to-slate-900'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${
                    hasElite ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  }`}>
                    {hasElite ? <Crown className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {hasElite ? 'CYBER ELITE UNLOCKED' : 'ELITE PASS LOCKED'}
                  </span>
                  <h4 className="font-bold text-white text-sm mt-1">
                    {hasElite ? 'Double Rewards Active' : 'Unlock 10+ Elite Rewards'}
                  </h4>
                </div>
              </div>

              <div className="mt-3">
                {hasElite ? (
                  <div className="text-xs text-amber-200/80 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    You are eligible for all elite cosmetics & titles!
                  </div>
                ) : (
                  <button
                    disabled={upgrading}
                    onClick={handleUpgradeElite}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-2 text-xs shadow-lg shadow-amber-900/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    Unlock Elite Track (2,000 CR)
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-amber-950/80 border border-amber-500/40 px-4 py-2.5 text-xs font-semibold text-amber-200 animate-in fade-in">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tiers List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {tiers.map(tier => {
              const isUnlocked = userLevel >= tier.level;
              const isFreeClaimed = (currentUser.seasonPassClaimedFree || passData?.claimedFree || []).includes(tier.level);
              const isEliteClaimed = (currentUser.seasonPassClaimedElite || passData?.claimedElite || []).includes(tier.level);

              return (
                <div
                  key={tier.level}
                  className={`rounded-2xl border p-4 transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
                    isUnlocked
                      ? 'border-white/20 bg-slate-900/90 shadow-md'
                      : 'border-white/5 bg-slate-950/50 opacity-75'
                  }`}
                >
                  {/* Tier Indicator */}
                  <div className="flex items-center gap-3 w-full md:w-36">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm border ${
                      isUnlocked 
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {tier.level}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">Tier {tier.level}</div>
                      <div className="text-[10px] text-slate-400">{tier.requiredXp} Season XP</div>
                    </div>
                  </div>

                  {/* Free Track Box */}
                  <div className="flex-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 text-lg border border-cyan-500/20">
                        {tier.freeReward.icon}
                      </div>
                      <div>
                        <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">Free Track</div>
                        <div className="font-bold text-white text-xs">{tier.freeReward.name}</div>
                        <div className="text-[10px] text-slate-400">{tier.freeReward.description}</div>
                      </div>
                    </div>

                    <div>
                      {isFreeClaimed ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Claimed
                        </span>
                      ) : isUnlocked ? (
                        <button
                          disabled={claimingTier === `${tier.level}_free`}
                          onClick={() => handleClaimReward(tier.level, 'free')}
                          className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          Claim
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Lock className="h-3.5 w-3.5" /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Elite Track Box */}
                  <div className="flex-1 w-full rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 text-lg border border-amber-500/30 shadow-inner">
                        {tier.eliteReward.icon}
                      </div>
                      <div>
                        <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Crown className="h-2.5 w-2.5" /> Elite Exclusive
                        </div>
                        <div className="font-bold text-amber-200 text-xs">{tier.eliteReward.name}</div>
                        <div className="text-[10px] text-slate-400">{tier.eliteReward.description}</div>
                      </div>
                    </div>

                    <div>
                      {isEliteClaimed ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Claimed
                        </span>
                      ) : isUnlocked && hasElite ? (
                        <button
                          disabled={claimingTier === `${tier.level}_elite`}
                          onClick={() => handleClaimReward(tier.level, 'elite')}
                          className="rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-black text-slate-950 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          Claim Elite
                        </button>
                      ) : isUnlocked && !hasElite ? (
                        <button
                          onClick={handleUpgradeElite}
                          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20"
                        >
                          Unlock Elite
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Lock className="h-3.5 w-3.5" /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 p-4 bg-slate-950 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Earn Season XP automatically by completing, creating, and validating dares</span>
          </div>
          <button
            onClick={() => {
              playSound('pop');
              onClose();
            }}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-bold text-white transition-colors"
          >
            Close Pass Hub
          </button>
        </div>

      </div>
    </div>
  );
};
