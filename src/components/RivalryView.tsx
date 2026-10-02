import React, { useState, useMemo } from 'react';
import { UserProfile, DareItem } from '../types';
import { 
  Swords, 
  Trophy, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  TrendingUp, 
  Users, 
  PlusCircle,
  Shield,
  Coins
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';

interface RivalryViewProps {
  user: UserProfile;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  dares: DareItem[];
  onChallengeRival?: (targetHandle: string) => void;
  onOpenProofModal?: (dare: DareItem) => void;
  onRequestRematch?: (targetHandle: string, previousDareTitle: string) => void;
}

interface RivalStats {
  rival: UserProfile;
  sharedDares: DareItem[];
  winsUser: number;
  winsRival: number;
  ties: number;
  totalResolved: number;
  winLossRatio: string;
  winPercentage: number;
  votesUser: number;
  votesRival: number;
  votePercentageUser: number;
}

export const RivalryView: React.FC<RivalryViewProps> = ({
  user,
  currentUser,
  allUsers,
  dares,
  onChallengeRival,
  onOpenProofModal,
  onRequestRematch,
}) => {
  const isOwnProfile = user.id === currentUser.id;
  const [rematchSentDareId, setRematchSentDareId] = useState<string | null>(null);

  // Potential rivals: Squad friends, peers with direct dares, or other users
  const candidateRivals = useMemo(() => {
    const list: UserProfile[] = [];
    const seen = new Set<string>();

    // If viewing own profile, exclude self. If viewing someone else, include currentUser first!
    if (!isOwnProfile) {
      list.push(currentUser);
      seen.add(currentUser.id);
    }

    // Add squad friends of the profile user
    const squadIds = user.squadFriends || [];
    for (const sId of squadIds) {
      if (sId !== user.id && !seen.has(sId)) {
        const u = allUsers.find(x => x.id === sId);
        if (u) {
          list.push(u);
          seen.add(u.id);
        }
      }
    }

    // Add users who have participated in direct dares with this user
    const userHandleLower = user.handle.toLowerCase();
    for (const d of dares) {
      if (d.targetType === 'direct') {
        const creatorH = d.creator.handle.toLowerCase();
        const targetH = (d.targetUserHandle || '').toLowerCase();
        const acceptedH = (d.acceptedBy?.handle || '').toLowerCase();
        const submitterH = (d.proof?.submittedByHandle || '').toLowerCase();

        let otherHandle = '';
        if (creatorH === userHandleLower) {
          otherHandle = targetH || acceptedH || submitterH;
        } else if (targetH === userHandleLower || acceptedH === userHandleLower || submitterH === userHandleLower) {
          otherHandle = creatorH;
        }

        if (otherHandle) {
          const match = allUsers.find(x => x.handle.toLowerCase() === otherHandle && x.id !== user.id);
          if (match && !seen.has(match.id)) {
            list.push(match);
            seen.add(match.id);
          }
        }
      }
    }

    // Add remaining users if list is still small
    for (const u of allUsers) {
      if (u.id !== user.id && !seen.has(u.id)) {
        list.push(u);
        seen.add(u.id);
      }
    }

    return list;
  }, [user, currentUser, allUsers, dares, isOwnProfile]);

  // Initial selected rival
  const [selectedRivalId, setSelectedRivalId] = useState<string>(() => {
    if (!isOwnProfile) return currentUser.id;
    return candidateRivals[0]?.id || '';
  });

  // Keep selectedRival valid
  const activeRival = useMemo(() => {
    return candidateRivals.find(r => r.id === selectedRivalId) || candidateRivals[0] || null;
  }, [candidateRivals, selectedRivalId]);

  // Helper to calculate head-to-head stats between user and any candidate rival
  const computeStats = (rival: UserProfile): RivalStats => {
    const handleA = user.handle.toLowerCase();
    const handleB = rival.handle.toLowerCase();

    // Find all shared direct challenges between userA and rival
    const shared = dares.filter(d => {
      if (d.targetType !== 'direct') return false;
      const c = d.creator.handle.toLowerCase();
      const t = (d.targetUserHandle || '').toLowerCase();
      const a = (d.acceptedBy?.handle || '').toLowerCase();
      const p = (d.proof?.submittedByHandle || '').toLowerCase();

      const aInvolved = c === handleA || t === handleA || a === handleA || p === handleA;
      const bInvolved = c === handleB || t === handleB || a === handleB || p === handleB;

      return aInvolved && bInvolved;
    });

    let winsUser = 0;
    let winsRival = 0;
    let ties = 0;
    let votesUser = 0;
    let votesRival = 0;

    shared.forEach(d => {
      const creatorH = d.creator.handle.toLowerCase();
      const targetH = (d.targetUserHandle || '').toLowerCase();
      const performerH = (d.proof?.submittedByHandle || d.acceptedBy?.handle || targetH).toLowerCase();
      const challengerH = creatorH === performerH 
        ? (performerH === handleA ? handleB : handleA) 
        : creatorH;

      const legit = d.proof?.communityVotes?.legit ?? 0;
      const busted = d.proof?.communityVotes?.busted ?? 0;
      const hasVotedProof = (d.proof && (legit > 0 || busted > 0)) || d.status === 'verified' || d.status === 'rejected';

      if (hasVotedProof) {
        if (legit > busted || (d.status === 'verified' && legit >= busted)) {
          // Performer won the community vote!
          if (performerH === handleA) {
            winsUser += 1;
            votesUser += legit;
            votesRival += busted;
          } else {
            winsRival += 1;
            votesRival += legit;
            votesUser += busted;
          }
        } else if (busted > legit || (d.status === 'rejected' && busted >= legit)) {
          // Performer was busted by community votes -> Challenger won!
          if (challengerH === handleA) {
            winsUser += 1;
            votesUser += busted;
            votesRival += legit;
          } else {
            winsRival += 1;
            votesRival += busted;
            votesUser += legit;
          }
        } else {
          ties += 1;
          votesUser += legit;
          votesRival += busted;
        }
      }
    });

    const totalResolved = winsUser + winsRival + ties;

    // Head-to-head win/loss ratio
    let winLossRatio = '0.00';
    if (winsRival === 0) {
      winLossRatio = winsUser > 0 ? `${winsUser}.00` : '0.00';
    } else {
      winLossRatio = (winsUser / winsRival).toFixed(2);
    }

    const winPercentage = totalResolved > 0 ? Math.round((winsUser / totalResolved) * 100) : 0;
    const totalVotes = votesUser + votesRival;
    const votePercentageUser = totalVotes > 0 ? Math.round((votesUser / totalVotes) * 100) : 50;

    return {
      rival,
      sharedDares: shared,
      winsUser,
      winsRival,
      ties,
      totalResolved,
      winLossRatio,
      winPercentage,
      votesUser,
      votesRival,
      votePercentageUser,
    };
  };

  // Pre-calculate stats for all candidate rivals so we can display quick badges in selector
  const allStatsMap = useMemo(() => {
    const map = new Map<string, RivalStats>();
    for (const r of candidateRivals) {
      map.set(r.id, computeStats(r));
    }
    return map;
  }, [candidateRivals, user, dares]);

  const activeStats = activeRival ? allStatsMap.get(activeRival.id) || computeStats(activeRival) : null;

  // Filter for battle log
  const [battleFilter, setBattleFilter] = useState<'all' | 'won_user' | 'won_rival' | 'pending'>('all');

  const filteredBattles = useMemo(() => {
    if (!activeStats) return [];
    const handleA = user.handle.toLowerCase();
    const handleB = activeStats.rival.handle.toLowerCase();

    return activeStats.sharedDares.filter(d => {
      const creatorH = d.creator.handle.toLowerCase();
      const targetH = (d.targetUserHandle || '').toLowerCase();
      const performerH = (d.proof?.submittedByHandle || d.acceptedBy?.handle || targetH).toLowerCase();
      const challengerH = creatorH === performerH 
        ? (performerH === handleA ? handleB : handleA) 
        : creatorH;

      const legit = d.proof?.communityVotes?.legit ?? 0;
      const busted = d.proof?.communityVotes?.busted ?? 0;
      const hasVoted = (d.proof && (legit > 0 || busted > 0)) || d.status === 'verified' || d.status === 'rejected';

      if (!hasVoted) {
        return battleFilter === 'all' || battleFilter === 'pending';
      }

      let winner = '';
      if (legit > busted || (d.status === 'verified' && legit >= busted)) {
        winner = performerH;
      } else if (busted > legit || (d.status === 'rejected' && busted >= legit)) {
        winner = challengerH;
      }

      if (battleFilter === 'won_user') return winner === handleA;
      if (battleFilter === 'won_rival') return winner === handleB;
      if (battleFilter === 'pending') return !hasVoted;
      return true;
    });
  }, [activeStats, user, battleFilter]);

  if (!activeRival || !activeStats) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Users className="h-8 w-8 mx-auto mb-2 text-slate-600" />
        <p className="text-xs font-mono">No friends or rival peers found in the network.</p>
      </div>
    );
  }

  const { winsUser, winsRival, ties, totalResolved, winLossRatio, winPercentage, votesUser, votesRival, votePercentageUser } = activeStats;

  // Rivalry verdict determination
  const getRivalryVerdict = () => {
    if (totalResolved === 0) {
      return {
        label: 'NO DIRECT DUELS YET',
        sub: 'Throw down a challenge to ignite this rivalry',
        color: 'text-slate-400',
        bg: 'bg-slate-900/60 border-slate-800',
        badge: 'UNCONTESTED',
      };
    }
    if (winsUser > winsRival) {
      const edge = winsUser - winsRival;
      return {
        label: `${user.name.toUpperCase()} LEADS (+${edge})`,
        sub: `${winPercentage}% Win Rate with ${winLossRatio} W/L ratio`,
        color: 'text-emerald-300',
        bg: 'bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        badge: winsRival === 0 ? 'UNDEFEATED REIGN' : 'DOMINANT EDGE',
      };
    }
    if (winsRival > winsUser) {
      const edge = winsRival - winsUser;
      return {
        label: `${activeRival.name.toUpperCase()} LEADS (+${edge})`,
        sub: `${100 - winPercentage}% Win Rate for ${activeRival.handle}`,
        color: 'text-rose-300',
        bg: 'bg-rose-950/40 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
        badge: 'RIVAL HAS THE UPPER HAND',
      };
    }
    return {
      label: 'DEADLOCK STANDOFF',
      sub: `Tied at ${winsUser} - ${winsRival} with equal vote honors`,
      color: 'text-cyan-300',
      bg: 'bg-cyan-950/40 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      badge: 'EVEN MATRIX',
    };
  };

  const verdict = getRivalryVerdict();

  return (
    <div id="rivalry-view-section" className="space-y-4">
      {/* 1. Friend / Rival Selector Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Swords className="h-3.5 w-3.5 text-indigo-400" />
            <span>Select Friend to Compare Rivalry:</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {candidateRivals.length} Peers in Range
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 scrollbar-thin">
          {candidateRivals.map((r) => {
            const isSelected = r.id === activeRival.id;
            const rStats = allStatsMap.get(r.id);
            const w = rStats?.winsUser || 0;
            const l = rStats?.winsRival || 0;
            const isSquad = user.squadFriends?.includes(r.id) || currentUser.squadFriends?.includes(r.id);

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  playSound('click');
                  setSelectedRivalId(r.id);
                }}
                className={`group shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/50 shadow-[0_0_12px_rgba(99,102,241,0.25)] text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <img
                    src={r.avatar}
                    alt={r.name}
                    className={`h-7 w-7 rounded-full object-cover ring-1 ${
                      isSelected ? 'ring-indigo-400' : 'ring-slate-700'
                    }`}
                  />
                  {isSquad && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-[#0a0f1d]" title="Squad Friend" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold truncate max-w-[90px]">{r.name}</span>
                    {r.id === currentUser.id && (
                      <span className="text-[8px] font-mono px-1 rounded bg-indigo-500/30 text-indigo-300">YOU</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <span className={isSelected ? 'text-indigo-300' : 'text-slate-500'}>
                      {r.handle}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className={`font-bold ${
                      w > l ? 'text-emerald-400' : l > w ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {w}W-{l}L
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Head-to-Head Versus Hero Showdown Card */}
      <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 via-[#0a0f1d] to-slate-950 p-4 sm:p-5 overflow-hidden shadow-xl">
        {/* Ambient glow highlights */}
        <div className="absolute top-0 left-0 w-1/3 h-full bg-indigo-500/5 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-rose-500/5 blur-2xl pointer-events-none" />

        {/* Top Header: Verdict Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${verdict.bg} ${verdict.color}`}>
              {verdict.badge}
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {verdict.label}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {verdict.sub}
          </span>
        </div>

        {/* The Duel Matchup: Left User vs Right Rival */}
        <div className="grid grid-cols-11 items-center py-4 gap-2">
          {/* Left: Current Profile User */}
          <div className="col-span-5 flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
              />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-mono font-bold text-white border-2 border-[#0a0f1d]">
                {winsUser}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-white truncate">{user.name}</span>
                {isOwnProfile && (
                  <span className="px-1.5 py-0.2 text-[8px] font-mono bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                    YOU
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-indigo-400 block truncate">{user.handle}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg sm:text-2xl font-mono font-black text-emerald-400 leading-none">
                  {winsUser}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {winsUser === 1 ? 'Win' : 'Wins'}
                </span>
              </div>
            </div>
          </div>

          {/* Center: VS Badge */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center shadow-lg">
              <Swords className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-400" />
            </div>
            <span className="text-[9px] font-mono font-black tracking-widest text-slate-500 mt-1 uppercase">
              VS
            </span>
          </div>

          {/* Right: Selected Rival Friend */}
          <div className="col-span-5 flex items-center justify-end gap-3 text-right">
            <div className="min-w-0">
              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                {activeRival.id === currentUser.id && (
                  <span className="px-1.5 py-0.2 text-[8px] font-mono bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                    YOU
                  </span>
                )}
                <span className="text-sm sm:text-base font-bold text-white truncate">{activeRival.name}</span>
              </div>
              <span className="text-xs font-mono text-rose-400 block truncate">{activeRival.handle}</span>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {winsRival === 1 ? 'Win' : 'Wins'}
                </span>
                <span className="text-lg sm:text-2xl font-mono font-black text-rose-400 leading-none">
                  {winsRival}
                </span>
              </div>
            </div>
            <div className="relative shrink-0">
              <img
                src={activeRival.avatar}
                alt={activeRival.name}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.25)]"
              />
              <span className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-mono font-bold text-white border-2 border-[#0a0f1d]">
                {winsRival}
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics: Win/Loss Ratio, Win Rate, Vote Dominance */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-800/80">
          {/* Metric 1: Head-to-Head Ratio */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Win / Loss Ratio
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-mono font-black text-indigo-300">
                {winLossRatio}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                W/L
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              {winsUser} Won : {winsRival} Lost
            </span>
          </div>

          {/* Metric 2: Win Rate */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Win Rate
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-mono font-black text-emerald-400">
                {winPercentage}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              {totalResolved} Resolved {totalResolved === 1 ? 'Duel' : 'Duels'}
            </span>
          </div>

          {/* Metric 3: Community Votes Won */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Community Votes
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-mono font-black text-amber-300">
                {votesUser}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                vs {votesRival}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              {votePercentageUser}% Vote Share
            </span>
          </div>

          {/* Metric 4: Direct Duels Total */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Total Shared Dares
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-mono font-black text-cyan-300">
                {activeStats.sharedDares.length}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Dares
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              {activeStats.sharedDares.length - totalResolved} In Progress
            </span>
          </div>
        </div>

        {/* Split Vote Dominance Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-indigo-400 font-bold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              {user.handle} ({votesUser} Votes • {votePercentageUser}%)
            </span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              {activeRival.handle} ({votesRival} Votes • {100 - votePercentageUser}%)
              <span className="h-2 w-2 rounded-full bg-rose-500" />
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex ring-1 ring-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500"
              style={{ width: `${votePercentageUser}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-500"
              style={{ width: `${100 - votePercentageUser}%` }}
            />
          </div>
        </div>

        {/* Action CTA: Challenge Rival Directly */}
        {onChallengeRival && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-slate-400 font-mono">
              Ready to challenge <strong className="text-white">{activeRival.handle}</strong> in the next round?
            </span>
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onChallengeRival(activeRival.handle);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono text-xs font-bold tracking-wider shadow-lg shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Swords className="h-4 w-4" />
              <span>ISSUE DIRECT DARE TO {activeRival.handle.toUpperCase()}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Battle Log / Shared Direct Challenges History */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>Direct Challenge Battle Log ({filteredBattles.length}):</span>
          </h4>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 p-0.5 rounded-lg text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setBattleFilter('all')}
              className={`px-2 py-1 rounded transition-colors ${
                battleFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({activeStats.sharedDares.length})
            </button>
            <button
              type="button"
              onClick={() => setBattleFilter('won_user')}
              className={`px-2 py-1 rounded transition-colors ${
                battleFilter === 'won_user' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Won by {user.name.split(' ')[0]} ({winsUser})
            </button>
            <button
              type="button"
              onClick={() => setBattleFilter('won_rival')}
              className={`px-2 py-1 rounded transition-colors ${
                battleFilter === 'won_rival' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Won by {activeRival.name.split(' ')[0]} ({winsRival})
            </button>
          </div>
        </div>

        {filteredBattles.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 text-center space-y-2">
            <Swords className="h-8 w-8 mx-auto text-slate-600" />
            <p className="text-xs font-mono text-slate-400">
              No matching direct challenges found between {user.handle} and {activeRival.handle}.
            </p>
            {onChallengeRival && (
              <button
                type="button"
                onClick={() => onChallengeRival(activeRival.handle)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Throw Down First Challenge</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredBattles.map((dare) => {
              const handleA = user.handle.toLowerCase();
              const handleB = activeRival.handle.toLowerCase();

              const creatorH = dare.creator.handle.toLowerCase();
              const targetH = (dare.targetUserHandle || '').toLowerCase();
              const performerH = (dare.proof?.submittedByHandle || dare.acceptedBy?.handle || targetH).toLowerCase();
              const challengerH = creatorH === performerH 
                ? (performerH === handleA ? handleB : handleA) 
                : creatorH;

              const legit = dare.proof?.communityVotes?.legit ?? 0;
              const busted = dare.proof?.communityVotes?.busted ?? 0;
              const hasVoted = (dare.proof && (legit > 0 || busted > 0)) || dare.status === 'verified' || dare.status === 'rejected';

              let winnerHandle = '';
              let outcomeBadge = {
                text: 'IN PROGRESS',
                border: 'border-amber-500/40',
                bg: 'bg-amber-950/30',
                color: 'text-amber-300',
              };

              if (hasVoted) {
                if (legit > busted || (dare.status === 'verified' && legit >= busted)) {
                  winnerHandle = performerH;
                  const wonByUser = winnerHandle === handleA;
                  outcomeBadge = {
                    text: wonByUser ? `${user.name.toUpperCase()} WON (${legit}-${busted} VOTES)` : `${activeRival.name.toUpperCase()} WON (${legit}-${busted} VOTES)`,
                    border: wonByUser ? 'border-emerald-500/50' : 'border-rose-500/50',
                    bg: wonByUser ? 'bg-emerald-950/40' : 'bg-rose-950/40',
                    color: wonByUser ? 'text-emerald-300' : 'text-rose-300',
                  };
                } else if (busted > legit || (dare.status === 'rejected' && busted >= legit)) {
                  winnerHandle = challengerH;
                  const wonByUser = winnerHandle === handleA;
                  outcomeBadge = {
                    text: wonByUser ? `${user.name.toUpperCase()} WON (BUSTED BY ${busted}-${legit})` : `${activeRival.name.toUpperCase()} WON (BUSTED BY ${busted}-${legit})`,
                    border: wonByUser ? 'border-emerald-500/50' : 'border-rose-500/50',
                    bg: wonByUser ? 'bg-emerald-950/40' : 'bg-rose-950/40',
                    color: wonByUser ? 'text-emerald-300' : 'text-rose-300',
                  };
                } else {
                  outcomeBadge = {
                    text: `TIED VOTE (${legit}-${busted})`,
                    border: 'border-cyan-500/40',
                    bg: 'bg-cyan-950/30',
                    color: 'text-cyan-300',
                  };
                }
              }

              return (
                <div
                  key={dare.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border ${outcomeBadge.bg} ${outcomeBadge.border} ${outcomeBadge.color}`}>
                          {outcomeBadge.text}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {dare.category.toUpperCase()} • {dare.difficulty}
                        </span>
                      </div>
                      <h5 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                        {dare.title}
                      </h5>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 font-mono text-xs font-bold text-amber-300">
                      <Coins className="h-3.5 w-3.5 text-amber-400" />
                      <span>{dare.rewardCred}</span>
                    </div>
                  </div>

                  {/* Subtitle: Who challenged whom & who performed */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60 flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-indigo-300">{dare.creator.handle}</span>
                      <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
                      <span className="text-rose-300">{dare.targetUserHandle || dare.acceptedBy?.handle || 'Peer'}</span>
                    </div>

                    {dare.proof ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          👍 {legit} Legit
                        </span>
                        <span className="text-[10px] font-mono text-rose-400 font-bold">
                          👎 {busted} Busted
                        </span>
                        {onOpenProofModal && (
                          <button
                            type="button"
                            onClick={() => {
                              playSound('click');
                              onOpenProofModal(dare);
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer ml-1"
                          >
                            View Proof
                          </button>
                        )}
                        {onRequestRematch && hasVoted && (
                          <button
                            type="button"
                            disabled={rematchSentDareId === dare.id}
                            onClick={() => {
                              playSound('laser');
                              setRematchSentDareId(dare.id);
                              onRequestRematch(activeRival.handle, dare.title);
                            }}
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                              rematchSentDareId === dare.id
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400'
                            }`}
                            title="Send Double or Nothing Rematch Challenge"
                          >
                            {rematchSentDareId === dare.id ? '✓ Rematch Sent' : '🔥 Rematch'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        Awaiting Execution & Proof
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
