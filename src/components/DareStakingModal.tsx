import React, { useState, useEffect } from 'react';
import { 
  X, 
  Flame, 
  TrendingUp, 
  Coins, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Zap, 
  Lock,
  Sparkles,
  Trophy
} from 'lucide-react';
import { DareItem, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface DareStakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dare: DareItem | null;
  currentUser: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
}

export const DareStakingModal: React.FC<DareStakingModalProps> = ({
  isOpen,
  onClose,
  dare,
  currentUser,
  onUserUpdate,
}) => {
  const [stakeAmount, setStakeAmount] = useState<number>(50);
  const [jackpotData, setJackpotData] = useState<{
    jackpotPool: number;
    activeWagersCount: number;
    recentBigWinners: { handle: string; amount: number; dare: string; timestamp: string }[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchJackpotStats();
    }
  }, [isOpen]);

  const fetchJackpotStats = async () => {
    try {
      const res = await fetch('/api/staking/jackpot');
      if (res.ok) {
        const data = await res.json();
        setJackpotData(data);
      }
    } catch (err) {
      console.error('Failed to fetch jackpot stats', err);
    }
  };

  if (!isOpen || !dare) return null;

  const multiplier = 1.5;
  const potentialPayout = Math.round(stakeAmount * multiplier);
  const profit = potentialPayout - stakeAmount;
  const canAfford = currentUser.cred >= stakeAmount && stakeAmount >= 25;

  const handlePlaceStake = async () => {
    if (!canAfford) {
      setFeedback(`Insufficient Cred balance (${currentUser.cred} CR) or below 25 CR minimum.`);
      playSound('error');
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/staking/wager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          dareId: dare.id,
          stakedCred: stakeAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || 'Failed to lock stake');
        playSound('error');
      } else {
        onUserUpdate(data.user);
        playSound('purchase');
        setFeedback(`🔥 Stake of ${stakeAmount} CR locked! Potential payout: ${potentialPayout} CR upon proof verification.`);
        setTimeout(() => {
          onClose();
        }, 2200);
      }
    } catch (err) {
      setFeedback('Network transmission failure');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/40 bg-slate-950 text-slate-100 shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 p-5 bg-gradient-to-r from-amber-950/50 via-slate-900 to-indigo-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">HIGH-ROLLER STAKING</h3>
              <p className="text-xs text-amber-300/80 font-medium">Wager Cred on Dare Execution</p>
            </div>
          </div>
          <button
            onClick={() => {
              playSound('pop');
              onClose();
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Target Dare Box */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Challenge</div>
            <h4 className="font-bold text-white text-sm mt-0.5">{dare.title}</h4>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-cyan-300 font-semibold uppercase text-[10px]">
                {dare.category}
              </span>
              <span>• Base Bounty: <strong className="text-white">{dare.rewardCred} CR</strong></span>
            </div>
          </div>

          {/* Stake Amount Selector */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-slate-300">Select Stake Wager</span>
              <span className="text-amber-400">Wallet: {currentUser.cred} CR</span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {[25, 50, 100, 250].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    setStakeAmount(amt);
                  }}
                  className={`rounded-xl py-2 text-xs font-bold transition-all border ${
                    stakeAmount === amt
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                      : 'bg-slate-900 text-slate-300 border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  {amt} CR
                </button>
              ))}
            </div>

            <div className="relative flex items-center">
              <input
                type="number"
                min="25"
                max={currentUser.cred}
                value={stakeAmount}
                onChange={e => setStakeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
              />
              <span className="absolute right-4 text-xs font-bold text-slate-400">CR</span>
            </div>
          </div>

          {/* Payout Calculation Card */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Stake Multiplier</span>
              <span className="font-bold text-amber-300">{multiplier}x Fixed Odds</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Estimated Net Profit</span>
              <span className="font-bold text-emerald-400">+{profit} CR</span>
            </div>
            <div className="pt-2 border-t border-amber-500/20 flex justify-between items-center">
              <span className="font-bold text-white text-sm">Potential Total Payout</span>
              <span className="text-lg font-black text-amber-300">{potentialPayout} CR</span>
            </div>
          </div>

          {/* Community Jackpot Ticker */}
          <div className="rounded-xl bg-slate-900/60 border border-white/5 p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-slate-400">Community Jackpot Pool:</span>
            </div>
            <span className="font-black text-amber-300">{(jackpotData?.jackpotPool ?? 0).toLocaleString()} CR</span>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-950/80 border border-amber-500/40 p-3 text-xs font-semibold text-amber-200">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Submit CTA */}
          <button
            disabled={submitting || !canAfford}
            onClick={handlePlaceStake}
            className={`w-full rounded-2xl py-3.5 text-sm font-black transition-all shadow-xl active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
              canAfford
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-900/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Flame className="h-4 w-4" />
            {canAfford ? `Lock In ${stakeAmount} CR Stake` : 'Insufficient Cred (Min 25 CR)'}
          </button>
        </div>

      </div>
    </div>
  );
};
