import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Swords, 
  Flame, 
  Coins, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  Zap,
  Radio,
  Trophy,
  Camera,
  Upload,
  Send,
  Heart,
  Crown,
  Play,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { LiveDuel, LiveDuelParticipant, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface LiveDuelsArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserCredUpdated?: (newCred: number) => void;
}

const CHEER_EMOJIS = [
  { emoji: '🔥', label: 'HYPE', sound: 'laser' },
  { emoji: '⚡', label: 'OVERCLOCK', sound: 'levelUp' },
  { emoji: '💥', label: 'GLITCH', sound: 'click' },
  { emoji: '🛡️', label: 'SHIELD', sound: 'complete' },
  { emoji: '👑', label: 'APEX', sound: 'oracle' },
];

export const LiveDuelsArenaModal: React.FC<LiveDuelsArenaModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserCredUpdated,
}) => {
  const [duels, setDuels] = useState<LiveDuel[]>([]);
  const [activeDuel, setActiveDuel] = useState<LiveDuel | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'lobby' | 'arena' | 'create'>('lobby');

  // Wager & Cheer state
  const [wagerSide, setWagerSide] = useState<'challenger' | 'opponent'>('challenger');
  const [wagerAmount, setWagerAmount] = useState<number>(50);
  const [wagerSuccessMsg, setWagerSuccessMsg] = useState<string | null>(null);
  const [submittingWager, setSubmittingWager] = useState(false);

  // Floating particles
  const [floatingCheers, setFloatingCheers] = useState<
    { id: string; emoji: string; label: string; x: number; y: number }[]
  >([]);

  // Proof submission
  const [proofNote, setProofNote] = useState('');
  const [proofMediaUrl, setProofMediaUrl] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // New Duel form
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState<'tech' | 'fitness' | 'social' | 'creative' | 'wild'>('tech');
  const [createDuration, setCreateDuration] = useState<number>(180);
  const [createStakes, setCreateStakes] = useState<number>(100);
  const [createBrief, setCreateBrief] = useState('');
  const [createVsMode, setCreateVsMode] = useState<'ai' | 'public'>('ai');

  // Timer reference
  const [timeLeft, setTimeLeft] = useState<number>(180);

  // Fetch duels
  const fetchDuels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/duels');
      if (res.ok) {
        const data = await res.json();
        setDuels(data);
        if (!activeDuel && data.length > 0) {
          setActiveDuel(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch live duels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDuels();
      setWagerSuccessMsg(null);
    }
  }, [isOpen]);

  // Live Timer Countdown for active duel
  useEffect(() => {
    if (!activeDuel || activeDuel.status !== 'in_progress' || !activeDuel.endsAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, (activeDuel.endsAt || 0) - now);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      setTimeLeft(remainingSeconds);

      // Low time sound cue
      if (remainingSeconds === 10 || remainingSeconds === 5 || remainingSeconds === 3) {
        playSound('click');
      }

      if (remainingSeconds <= 0 && activeDuel.status === 'in_progress') {
        // Resolve duel on timeout
        handleTimeExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeDuel]);


  const handleTimeExpired = async () => {
    if (!activeDuel) return;
    try {
      const res = await fetch(`/api/duels/${activeDuel.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'time_expired' }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveDuel(data.duel);
        setDuels((prev) => prev.map((d) => (d.id === data.duel.id ? data.duel : d)));
        playSound('error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendCheer = async (emoji: string, label: string, sound: any) => {
    if (!activeDuel) return;
    playSound(sound || 'laser');

    // Add floating particle
    const newCheer = {
      id: Math.random().toString(),
      emoji,
      label,
      x: Math.random() * 60 + 20, // 20% to 80%
      y: 80,
    };
    setFloatingCheers((prev) => [...prev, newCheer]);

    setTimeout(() => {
      setFloatingCheers((prev) => prev.filter((c) => c.id !== newCheer.id));
    }, 2000);

    try {
      const res = await fetch(`/api/duels/${activeDuel.id}/cheer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userHandle: currentUser.handle,
          targetParticipantId: wagerSide === 'challenger' ? activeDuel.challenger.id : activeDuel.opponent.id,
          emoji,
          label,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveDuel(data.duel);
        setDuels((prev) => prev.map((d) => (d.id === data.duel.id ? data.duel : d)));
      }
    } catch (err) {
      console.error('Error sending cheer:', err);
    }
  };

  const handlePlaceWager = async () => {
    if (!activeDuel) return;
    if (currentUser.cred < wagerAmount) {
      playSound('error');
      alert(`Insufficient Cred balance (${currentUser.cred} CR). Need ${wagerAmount} CR.`);
      return;
    }

    try {
      setSubmittingWager(true);
      playSound('laser');
      const targetParticipantId = wagerSide === 'challenger' ? activeDuel.challenger.id : activeDuel.opponent.id;

      const res = await fetch(`/api/duels/${activeDuel.id}/wager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userHandle: currentUser.handle,
          targetParticipantId,
          amountCred: wagerAmount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        playSound('complete');
        setWagerSuccessMsg(`Locked in ${wagerAmount} CR wager on ${wagerSide === 'challenger' ? activeDuel.challenger.handle : activeDuel.opponent.handle}!`);
        setActiveDuel(data.duel);
        setDuels((prev) => prev.map((d) => (d.id === data.duel.id ? data.duel : d)));
        if (onUserCredUpdated && data.userCred !== undefined) {
          onUserCredUpdated(data.userCred);
        }
      } else {
        const err = await res.json();
        playSound('error');
        alert(err.error || 'Failed to lock in wager');
      }
    } catch (e) {
      console.error(e);
      playSound('error');
    } finally {
      setSubmittingWager(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!activeDuel) return;
    try {
      setIsSubmittingProof(true);
      playSound('laser');

      const mediaUrl = proofMediaUrl.trim();
      const note = proofNote.trim();

      const res = await fetch(`/api/duels/${activeDuel.id}/submit-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          proofMediaUrl: mediaUrl,
          proofNote: note,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        playSound('complete');
        setActiveDuel(data.duel);
        setDuels((prev) => prev.map((d) => (d.id === data.duel.id ? data.duel : d)));
        if (onUserCredUpdated && data.userCred !== undefined) {
          onUserCredUpdated(data.userCred);
        }
      } else {
        const err = await res.json();
        playSound('error');
        alert(err.error || 'Failed to submit proof');
      }
    } catch (e) {
      console.error(e);
      playSound('error');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const handleCreateNewDuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      alert('Please provide a challenge title');
      return;
    }
    if (currentUser.cred < createStakes) {
      playSound('error');
      alert(`Insufficient Cred (${currentUser.cred} CR) to stake ${createStakes} CR.`);
      return;
    }

    try {
      playSound('laser');
      const res = await fetch('/api/duels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle,
          category: createCategory,
          durationSeconds: createDuration,
          entryFeeCred: createStakes,
          challengeBrief: createBrief || `Complete the rapid ${createTitle} dare before your opponent submits verified proof.`,
          proofCriteria: 'Clear timestamped proof photo or screencast showing completed requirements.',
          isAiOpponent: createVsMode === 'ai',
          creator: currentUser,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        playSound('levelUp');
        setDuels((prev) => [data.duel, ...prev]);
        setActiveDuel(data.duel);
        setViewMode('arena');
        if (onUserCredUpdated && data.userCred !== undefined) {
          onUserCredUpdated(data.userCred);
        }
      }
    } catch (e) {
      console.error(e);
      playSound('error');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="live-duels-arena-container"
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-pink-500/40 bg-[#070b14] shadow-[0_0_60px_rgba(0,0,0,0.95),0_0_35px_rgba(236,72,153,0.3)] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Floating Cheer Particles */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {floatingCheers.map((c) => (
            <div
              key={c.id}
              className="absolute text-2xl font-bold text-amber-300 animate-bounce transition-all duration-1000 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.5)]"
              style={{
                left: `${c.x}%`,
                bottom: `${c.y}%`,
                transform: 'translate(-50%, 0)',
              }}
            >
              <span>{c.emoji}</span>
              <span className="text-xs font-mono text-white">{c.label}</span>
            </div>
          ))}
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-pink-500/20 px-5 py-4 bg-gradient-to-r from-pink-950/70 via-[#0b1022] to-indigo-950/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-pink-500/50 bg-pink-500/20 text-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.4)] shrink-0">
              <Swords className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-tech text-white tracking-wide truncate">
                  LIVE HEAD-TO-HEAD <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-indigo-400">DUEL ARENA</span>
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                  <Radio className="h-3 w-3 text-rose-400" />
                  REAL-TIME BLITZ
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Simultaneous speed challenges, live telemetry gauges, and spectator crowd-wager mechanics.
              </p>
            </div>
          </div>

          {/* Navigation Mode Pill */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center rounded-xl bg-slate-900/90 border border-slate-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('lobby')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'lobby' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Duels Lobby
              </button>
              <button
                type="button"
                onClick={() => setViewMode('arena')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'arena' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Combat Cockpit
              </button>
              <button
                type="button"
                onClick={() => setViewMode('create')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'create' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                + Deploy Duel
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white shrink-0 ml-2 cursor-pointer transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 bg-[#070b14]">
          
          {/* VIEW: LOBBY LIST */}
          {viewMode === 'lobby' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live & Pending Duels</h3>
                  <p className="text-xs text-slate-400">Join an ongoing duel as a combatant or back a fighter as a spectator.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('create')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white text-xs font-bold hover:brightness-110 transition-all shadow-md cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Deploy 1v1 Challenge
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs font-mono text-slate-400">
                  Synchronizing quantum duel streams...
                </div>
              ) : duels.length === 0 ? (
                <div className="py-16 text-center text-xs font-mono text-slate-400 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col items-center justify-center space-y-2">
                  <Swords className="h-8 w-8 text-pink-500/50 mb-1" />
                  <p className="font-bold text-sm text-slate-300">NO ACTIVE DUELS IN ARENA</p>
                  <p className="text-[11px] text-slate-500 max-w-sm">Deploy a 1v1 challenge above to invite rival operatives into the arena.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {duels.map((d) => {
                    const isLive = d.status === 'in_progress';
                    const isConcluded = d.status === 'concluded';
                    return (
                      <div
                        key={d.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-pink-500/50 hover:bg-slate-900/90 transition-all shadow-lg flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                              isLive
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                : isConcluded
                                ? 'bg-slate-800 text-slate-400 border-slate-700'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {isLive ? '🔴 LIVE IN PROGRESS' : d.status.toUpperCase()}
                            </span>

                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                              <Coins className="h-4 w-4" />
                              <span>{d.potCred} CR Pot</span>
                            </div>
                          </div>

                          <h4 className="text-sm font-bold text-white mb-2">{d.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2 mb-4">{d.challengeBrief}</p>

                          {/* Fighter Faceoff Strip */}
                          <div className="flex items-center justify-between rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5 mb-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={d.challenger.avatar}
                                alt={d.challenger.name}
                                className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-500"
                              />
                              <div>
                                <div className="text-xs font-bold text-indigo-300">{d.challenger.handle}</div>
                                <div className="text-[10px] font-mono text-slate-400">{d.challenger.wagerOdds}x Odds</div>
                              </div>
                            </div>

                            <div className="text-xs font-black text-rose-400 font-mono px-2">VS</div>

                            <div className="flex items-center gap-2 text-right">
                              <div>
                                <div className="text-xs font-bold text-pink-300">{d.opponent.handle}</div>
                                <div className="text-[10px] font-mono text-slate-400">{d.opponent.wagerOdds}x Odds</div>
                              </div>
                              <img
                                src={d.opponent.avatar}
                                alt={d.opponent.name}
                                className="h-8 w-8 rounded-full object-cover ring-2 ring-pink-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                            <Clock className="h-3.5 w-3.5 text-cyan-400" />
                            <span>{d.durationSeconds}s Blitz</span>
                            <span>•</span>
                            <span>{d.spectatorWagers.length} Wagers</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveDuel(d);
                              setViewMode('arena');
                              playSound('laser');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            <span>Enter Arena</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: ACTIVE ARENA COCKPIT */}
          {viewMode === 'arena' && activeDuel && (
            <div className="space-y-5">
              
              {/* Challenge Banner & Live Clock */}
              <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-br from-[#0c1224] via-[#070b14] to-[#120a1d] p-5 shadow-[0_0_30px_rgba(236,72,153,0.15)] relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/30">
                        {activeDuel.category.toUpperCase()} SECTOR
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
                        {activeDuel.potCred} CR BOUNTY POT
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-bold text-white">{activeDuel.title}</h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">{activeDuel.challengeBrief}</p>
                  </div>

                  {/* High-Tech Countdown Clock */}
                  <div className="flex items-center justify-center shrink-0">
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-black/80 border-2 border-pink-500/60 px-5 py-3 shadow-[0_0_25px_rgba(236,72,153,0.4)]">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Arena Clock
                      </div>
                      <div className={`text-2xl sm:text-3xl font-mono font-black tracking-wider ${
                        timeLeft <= 30 ? 'text-rose-400 animate-pulse' : 'text-white'
                      }`}>
                        {activeDuel.status === 'in_progress' ? formatTimer(timeLeft) : activeDuel.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SPLIT-SCREEN COMBATANTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* FIGHTER 1: CHALLENGER */}
                <div className={`rounded-3xl border p-5 transition-all relative overflow-hidden ${
                  activeDuel.winnerId === activeDuel.challenger.id
                    ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.4)]'
                    : 'border-indigo-500/40 bg-indigo-950/20'
                }`}>
                  {activeDuel.winnerId === activeDuel.challenger.id && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono font-black shadow-lg animate-bounce">
                      <Crown className="h-3 w-3" />
                      VICTOR
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={activeDuel.challenger.avatar}
                      alt={activeDuel.challenger.name}
                      className="h-14 w-14 rounded-2xl object-cover ring-2 ring-indigo-400 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{activeDuel.challenger.name}</span>
                        <span className="text-xs font-mono text-indigo-300 font-bold">{activeDuel.challenger.handle}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-amber-400 font-bold">{activeDuel.challenger.wagerOdds}x Payout</span>
                        <span>•</span>
                        <span className="text-pink-400">{activeDuel.challenger.cheerCount} Cheers</span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Gauge */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Telemetry Status:</span>
                      <span className="text-indigo-300 font-bold">{activeDuel.challenger.progressPercent}% Synchronized</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                        style={{ width: `${activeDuel.challenger.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Status & Live action note */}
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs font-mono text-slate-300">
                    <div className="text-[10px] text-slate-500 uppercase">Live Activity Feed:</div>
                    <div className="text-indigo-300 font-semibold mt-0.5">
                      {activeDuel.challenger.recentAction || 'Awaiting challenge start...'}
                    </div>
                  </div>
                </div>

                {/* FIGHTER 2: OPPONENT */}
                <div className={`rounded-3xl border p-5 transition-all relative overflow-hidden ${
                  activeDuel.winnerId === activeDuel.opponent.id
                    ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.4)]'
                    : 'border-pink-500/40 bg-pink-950/20'
                }`}>
                  {activeDuel.winnerId === activeDuel.opponent.id && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono font-black shadow-lg animate-bounce">
                      <Crown className="h-3 w-3" />
                      VICTOR
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={activeDuel.opponent.avatar}
                      alt={activeDuel.opponent.name}
                      className="h-14 w-14 rounded-2xl object-cover ring-2 ring-pink-400 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{activeDuel.opponent.name}</span>
                        <span className="text-xs font-mono text-pink-300 font-bold">{activeDuel.opponent.handle}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-amber-400 font-bold">{activeDuel.opponent.wagerOdds}x Payout</span>
                        <span>•</span>
                        <span className="text-pink-400">{activeDuel.opponent.cheerCount} Cheers</span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Gauge */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Telemetry Status:</span>
                      <span className="text-pink-300 font-bold">{activeDuel.opponent.progressPercent}% Synchronized</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(236,72,153,0.6)]"
                        style={{ width: `${activeDuel.opponent.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Status & Live action note */}
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs font-mono text-slate-300">
                    <div className="text-[10px] text-slate-500 uppercase">Live Activity Feed:</div>
                    <div className="text-pink-300 font-semibold mt-0.5">
                      {activeDuel.opponent.recentAction || 'Awaiting challenge start...'}
                    </div>
                  </div>
                </div>

              </div>

              {/* ACTION COCKPIT: IF CURRENT USER IS A PARTICIPANT OR SPECTATOR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* SUBMIT PROOF TERMINAL (FOR PARTICIPANTS) */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                      <Camera className="h-4 w-4 text-cyan-400" />
                      <span>Direct Proof Submission Terminal</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">1-Click Victory Lock-in</span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Submit verified proof photo or terminal screencast. First verified entry claims the full {activeDuel.potCred} CR pot!
                  </p>

                  <div className="space-y-2">
                    <input
                      type="url"
                      value={proofMediaUrl}
                      onChange={(e) => setProofMediaUrl(e.target.value)}
                      placeholder="Proof media URL (or leave blank for auto-snap)..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />

                    <input
                      type="text"
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      placeholder="Add completion note / timestamp..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSubmittingProof || activeDuel.status !== 'in_progress'}
                    onClick={handleSubmitProof}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 text-slate-950 font-black text-xs hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{isSubmittingProof ? 'Verifying & Transmitting Proof...' : 'Transmit & Claim Victory Pot'}</span>
                  </button>
                </div>

                {/* SPECTATOR WAGERS & CHEER CANNON */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                      <Coins className="h-4 w-4 text-amber-400" />
                      <span>Spectator Crowd Wager</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">Your Balance: {currentUser.cred} CR</span>
                  </div>

                  {wagerSuccessMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 font-mono">
                      ✓ {wagerSuccessMsg}
                    </div>
                  )}

                  {/* Pick Side */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWagerSide('challenger')}
                      className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        wagerSide === 'challenger'
                          ? 'border-indigo-400 bg-indigo-950/70 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate">{activeDuel.challenger.handle}</div>
                      <div className="text-[10px] font-mono text-indigo-400 font-normal">{activeDuel.challenger.wagerOdds}x Payout</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWagerSide('opponent')}
                      className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        wagerSide === 'opponent'
                          ? 'border-pink-400 bg-pink-950/70 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate">{activeDuel.opponent.handle}</div>
                      <div className="text-[10px] font-mono text-pink-400 font-normal">{activeDuel.opponent.wagerOdds}x Payout</div>
                    </button>
                  </div>

                  {/* Wager Amount Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Stake:</span>
                      <span className="text-amber-400 font-bold">{wagerAmount} CR</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={Math.max(50, Math.min(currentUser.cred, 500))}
                      step={10}
                      value={wagerAmount}
                      onChange={(e) => setWagerAmount(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={submittingWager || currentUser.cred < wagerAmount}
                    onClick={handlePlaceWager}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {submittingWager ? 'Locking in Stake...' : `Lock in ${wagerAmount} CR Stake`}
                  </button>

                  {/* CHEER CANNON BUTTONS */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-pink-400" />
                      <span>Live Cheer Cannon (Tap to Blast Reaction):</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {CHEER_EMOJIS.map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          onClick={() => handleSendCheer(c.emoji, c.label, c.sound)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 hover:bg-pink-950/40 text-xs font-mono font-bold text-white transition-all active:scale-90 cursor-pointer shrink-0"
                        >
                          <span>{c.emoji}</span>
                          <span className="text-[10px] text-slate-300">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* VIEW: CREATE DUEL */}
          {viewMode === 'create' && (
            <form onSubmit={handleCreateNewDuel} className="max-w-2xl mx-auto space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Deploy Custom 1-on-1 Head-to-Head Duel</h3>
                <p className="text-xs text-slate-400">Challenge an AI Neural Sentinel or open a challenge bounty for any peer to accept.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Challenge Title *</label>
                  <input
                    type="text"
                    required
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="e.g. 100 Squats Speed Run or Regex Master Blitz"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Sector Category</label>
                    <select
                      value={createCategory}
                      onChange={(e) => setCreateCategory(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="tech">Tech & Code</option>
                      <option value="fitness">Fitness & Kinetics</option>
                      <option value="social">Social & Stealth</option>
                      <option value="creative">Art & Creative</option>
                      <option value="wild">Wild & Unusual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Opponent Type</label>
                    <select
                      value={createVsMode}
                      onChange={(e) => setCreateVsMode(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="ai">🤖 AI Neural Sentinel (Instant Match)</option>
                      <option value="public">🌐 Open Public Lobby</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Blitz Duration</label>
                    <select
                      value={createDuration}
                      onChange={(e) => setCreateDuration(Number(e.target.value))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value={60}>60 Seconds (Ultra-Blitz)</option>
                      <option value={180}>3 Minutes (Standard)</option>
                      <option value={300}>5 Minutes (Tactical)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Your Staked Cred ({currentUser.cred} Available)</label>
                    <input
                      type="number"
                      min={25}
                      max={currentUser.cred}
                      value={createStakes}
                      onChange={(e) => setCreateStakes(Number(e.target.value))}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Challenge Brief & Rules</label>
                  <textarea
                    rows={3}
                    value={createBrief}
                    onChange={(e) => setCreateBrief(e.target.value)}
                    placeholder="Describe exact criteria, camera angle requirements, or code parameters..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('lobby')}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold text-xs hover:brightness-110 transition-all shadow-lg cursor-pointer"
                >
                  Stake {createStakes} CR & Launch Arena
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
