import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
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
  Target
} from 'lucide-react';
import { SquadTournament, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface SquadTournamentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserCredUpdated?: (newCred: number) => void;
  onOpenCreateDare?: (prefillTitle?: string) => void;
  onOpenLiveDuels?: () => void;
}

export const SquadTournamentsModal: React.FC<SquadTournamentsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserCredUpdated,
  onOpenCreateDare,
  onOpenLiveDuels,
}) => {
  const [tournaments, setTournaments] = useState<SquadTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<SquadTournament | null>(null);
  const [wagerSide, setWagerSide] = useState<'A' | 'B'>('A');
  const [wagerAmount, setWagerAmount] = useState<number>(100);
  const [submittingWager, setSubmittingWager] = useState(false);
  const [wagerSuccessMsg, setWagerSuccessMsg] = useState<string | null>(null);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
        if (data.length > 0 && !selectedTournament) {
          setSelectedTournament(data[0]);
          setWagerAmount(data[0].entryFeeCred || 75);
        }
      }
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTournaments();
      setWagerSuccessMsg(null);
    }
  }, [isOpen]);

  const handleSelectTournament = (t: SquadTournament) => {
    playSound('click');
    setSelectedTournament(t);
    setWagerAmount(t.entryFeeCred || 75);
    setWagerSuccessMsg(null);
  };

  const handlePlaceWager = async () => {
    if (!selectedTournament) return;
    const squadTag = wagerSide === 'A' ? selectedTournament.squadA.tag : selectedTournament.squadB.tag;

    if (currentUser.cred < wagerAmount) {
      playSound('error');
      alert(`Insufficient Cred balance (${currentUser.cred} CR). Complete more challenges first!`);
      return;
    }

    try {
      setSubmittingWager(true);
      playSound('laser');

      const res = await fetch(`/api/tournaments/${selectedTournament.id}/wager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          squadTag,
          amountCred: wagerAmount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        playSound('complete');
        setWagerSuccessMsg(`Locked in ${wagerAmount} CR stake on squad [${squadTag}]!`);
        setSelectedTournament(data.tournament);
        setTournaments(prev => prev.map(t => t.id === data.tournament.id ? data.tournament : t));
        if (onUserCredUpdated) {
          onUserCredUpdated(data.userCred);
        }
      } else {
        const err = await res.json();
        playSound('error');
        alert(err.error || 'Failed to place wager');
      }
    } catch (err) {
      console.error(err);
      playSound('error');
    } finally {
      setSubmittingWager(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="squad-tournaments-modal-container"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-indigo-500/40 bg-[#080d1a] shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(99,102,241,0.25)] my-auto overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-500/20 px-5 py-4 bg-gradient-to-r from-indigo-950/60 via-[#0b1226] to-slate-900/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-500/40 bg-pink-500/10 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] shrink-0">
              <Swords className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-tech text-white tracking-wide truncate">
                  SQUAD VS. SQUAD <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400">TOURNAMENT ARENA</span>
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Flame className="h-3 w-3 text-amber-400" />
                  Wager Warfare
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Join syndicates, pool collective Cred, and submit verified challenge proofs to conquer the arena pot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLiveDuels && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLiveDuels();
                  playSound('laser');
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-bold shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer animate-pulse"
              >
                <Swords className="h-3.5 w-3.5" />
                <span>Switch to 1v1 Live Duels</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white shrink-0 ml-2 cursor-pointer transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* Left Column: Tournament List / Selector */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                Active & Upcoming Wars
              </span>
              <span className="text-[10px] font-mono text-indigo-400">
                {tournaments.length} Tournaments Available
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs font-mono text-slate-400">
                Synchronizing battle brackets...
              </div>
            ) : (
              <div className="space-y-2.5">
                {tournaments.map((t) => {
                  const isSelected = selectedTournament?.id === t.id;
                  const isActive = t.status === 'active';
                  const isConcluded = t.status === 'concluded';

                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTournament(t)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/40 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400/50'
                          : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          isActive 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : isConcluded 
                            ? 'bg-slate-800 text-slate-400 border-slate-700' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {t.status}
                        </span>

                        <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                          <Coins className="h-3.5 w-3.5 text-amber-400" />
                          {t.potCred} CR Pot
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
                        {t.title}
                      </h4>

                      {/* Squad preview vs */}
                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="font-bold text-indigo-300">[{t.squadA.tag}] {t.squadA.name}</span>
                        <span className="text-rose-400 font-bold px-1.5">VS</span>
                        <span className="font-bold text-pink-300">[{t.squadB.tag}] {t.squadB.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Tournament Detail & Live Battle Matrix */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {selectedTournament ? (
              <div className="space-y-4">
                
                {/* Tournament Overview Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {selectedTournament.badge}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white mt-1.5">
                        {selectedTournament.title}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base sm:text-lg font-mono font-black text-amber-300 flex items-center gap-1 justify-end">
                        <Coins className="h-4 w-4 text-amber-400" />
                        <span>{selectedTournament.potCred}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Total Prize Pool</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {selectedTournament.description}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <Target className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="text-slate-500">Target Bounty:</span>
                    <span className="text-cyan-300 font-bold truncate">{selectedTournament.targetBountyTitle}</span>
                  </div>
                </div>

                {/* Squad Confrontation Matrix */}
                <div className="rounded-2xl border border-slate-800 bg-[#060a14] p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">Live Proof Scoreboard</span>
                    <span className="text-indigo-400 font-bold">1 Verified Proof = 1 Point</span>
                  </div>

                  {/* Battle Cards Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    
                    {/* Squad A */}
                    <div className={`p-3.5 rounded-xl border transition-all ${
                      wagerSide === 'A' 
                        ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-400/50' 
                        : 'border-slate-800 bg-slate-900/40'
                    }`}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <img 
                          src={selectedTournament.squadA.avatar} 
                          alt={selectedTournament.squadA.name} 
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-indigo-500/60"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {selectedTournament.squadA.name}
                          </h4>
                          <span className="text-[10px] font-mono text-indigo-400">
                            [{selectedTournament.squadA.tag}]
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between pt-2 border-t border-slate-800/60">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block">Proofs</span>
                          <span className="text-lg font-mono font-black text-indigo-300">
                            {selectedTournament.squadA.score}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-500 block">Wager Pool</span>
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {selectedTournament.squadA.wageredCred} CR
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] font-mono text-slate-400 truncate">
                        Members: {selectedTournament.squadA.members.join(', ')}
                      </div>
                    </div>

                    {/* Squad B */}
                    <div className={`p-3.5 rounded-xl border transition-all ${
                      wagerSide === 'B' 
                        ? 'border-pink-500 bg-pink-950/30 ring-1 ring-pink-400/50' 
                        : 'border-slate-800 bg-slate-900/40'
                    }`}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <img 
                          src={selectedTournament.squadB.avatar} 
                          alt={selectedTournament.squadB.name} 
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-pink-500/60"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {selectedTournament.squadB.name}
                          </h4>
                          <span className="text-[10px] font-mono text-pink-400">
                            [{selectedTournament.squadB.tag}]
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between pt-2 border-t border-slate-800/60">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block">Proofs</span>
                          <span className="text-lg font-mono font-black text-pink-300">
                            {selectedTournament.squadB.score}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-500 block">Wager Pool</span>
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {selectedTournament.squadB.wageredCred} CR
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] font-mono text-slate-400 truncate">
                        Members: {selectedTournament.squadB.members.join(', ')}
                      </div>
                    </div>

                  </div>

                  {/* Scoreboard Tug-of-War Bar */}
                  {selectedTournament.squadA.score + selectedTournament.squadB.score > 0 && (
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500"
                          style={{
                            width: `${(selectedTournament.squadA.score / (selectedTournament.squadA.score + selectedTournament.squadB.score)) * 100}%`
                          }}
                        />
                        <div 
                          className="h-full bg-pink-500 transition-all duration-500"
                          style={{
                            width: `${(selectedTournament.squadB.score / (selectedTournament.squadA.score + selectedTournament.squadB.score)) * 100}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>[{selectedTournament.squadA.tag}] {selectedTournament.squadA.score} PTS</span>
                        <span>[{selectedTournament.squadB.tag}] {selectedTournament.squadB.score} PTS</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wager / Support Controller Section */}
                {selectedTournament.status === 'active' ? (
                  <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-amber-400" />
                        <span>Stake Wager on a Syndicate</span>
                      </h4>
                      <span className="text-xs font-mono text-slate-400">
                        Balance: <strong className="text-amber-300">{currentUser.cred} CR</strong>
                      </span>
                    </div>

                    {wagerSuccessMsg && (
                      <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{wagerSuccessMsg}</span>
                      </div>
                    )}

                    {/* Choose Squad to Back */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setWagerSide('A');
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                          wagerSide === 'A'
                            ? 'border-indigo-400 bg-indigo-600/30 text-indigo-200'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Back [{selectedTournament.squadA.tag}] {selectedTournament.squadA.name}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setWagerSide('B');
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                          wagerSide === 'B'
                            ? 'border-pink-400 bg-pink-600/30 text-pink-200'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Back [{selectedTournament.squadB.tag}] {selectedTournament.squadB.name}
                      </button>
                    </div>

                    {/* Wager Amount Selector Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-mono text-slate-400">Wager Amount:</span>
                      <div className="flex items-center gap-1.5">
                        {[50, 100, 250, 500].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => {
                              playSound('click');
                              setWagerAmount(amt);
                            }}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                              wagerAmount === amt
                                ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                            }`}
                          >
                            {amt} CR
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Wager Button */}
                    <button
                      type="button"
                      disabled={submittingWager}
                      onClick={handlePlaceWager}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer disabled:opacity-50"
                    >
                      <Coins className="h-4 w-4" />
                      <span>{submittingWager ? 'Transmitting Wager...' : `Confirm ${wagerAmount} Cred Wager`}</span>
                    </button>
                  </div>
                ) : selectedTournament.status === 'concluded' ? (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center space-y-1">
                    <Trophy className="h-6 w-6 text-amber-400 mx-auto" />
                    <h4 className="text-xs font-mono font-bold text-white">Tournament Concluded</h4>
                    <p className="text-[11px] text-slate-400">
                      Winner Squad: <span className="text-emerald-400 font-bold">[{selectedTournament.winnerSquadTag}]</span>. All prize Cred distributed to backers.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center space-y-1">
                    <Clock className="h-6 w-6 text-indigo-400 mx-auto" />
                    <h4 className="text-xs font-mono font-bold text-white">Upcoming Tournament</h4>
                    <p className="text-[11px] text-slate-400">
                      Starts in 24 hours. Form your squad and prepare your proof cameras!
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 font-mono text-xs">
                Select a tournament to view live bracket standings
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800/80 px-5 py-3 bg-[#060a14] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Sparkles className="h-4 w-4 text-pink-400" />
            <span>Squad wins boost your global leaderboards and syndicate rank.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-mono font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close Arena
          </button>
        </div>

      </div>
    </div>
  );
};
