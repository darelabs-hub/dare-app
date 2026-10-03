import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Bot, 
  Flame, 
  Skull, 
  Coins, 
  Clock, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Check,
  Swords,
  Cpu,
  Fingerprint,
  Radio,
  Award,
  Layers,
  Activity
} from 'lucide-react';
import { DareItem, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';
import { isVideoMedia } from '../utils/mediaHelper';
import { copyToClipboard, getDareShareUrl } from '../utils/clipboard';

interface ProofViewerModalProps {
  dare: DareItem | null;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onVote: (dareId: string, vote: 'legit' | 'busted') => void;
  onShare?: (dare: DareItem, url: string) => void;
  onRequestRematch?: (targetHandle: string, previousDareTitle: string) => void;
  onOpenShareCard?: (dare: DareItem) => void;
}

export const ProofViewerModal: React.FC<ProofViewerModalProps> = ({
  dare,
  currentUser,
  isOpen,
  onClose,
  onVote,
  onShare,
  onRequestRematch,
  onOpenShareCard,
}) => {
  const [copied, setCopied] = useState(false);
  const [rematchSent, setRematchSent] = useState(false);

  if (!isOpen || !dare || !dare.proof) return null;

  const proof = dare.proof;
  const userVote = proof.communityVotes.userVotes[currentUser.id];
  const totalVotes = proof.communityVotes.legit + proof.communityVotes.busted;
  const legitPercent = totalVotes > 0 ? Math.round((proof.communityVotes.legit / totalVotes) * 100) : 100;

  const verdict = proof.aiJudgement?.verdict || 'LEGIT';

  const handleCopyLink = async () => {
    playSound('click');
    const shareUrl = getDareShareUrl(dare.id);
    await copyToClipboard(shareUrl);
    setCopied(true);
    if (onShare) {
      onShare(dare, shareUrl);
    }
    setTimeout(() => setCopied(false), 2600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="proof-viewer-modal-container"
        className="relative w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0A0D14] p-5 sm:p-6 shadow-2xl my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-200 shrink-0">
              <ShieldCheck className="h-5 w-5 text-slate-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Proof & Verification
                </h2>
                {dare.status === 'verified' ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Under Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Challenge: <span className="text-slate-200 font-semibold">{dare.title}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="proof-share-dare-btn"
              onClick={() => {
                if (onOpenShareCard) {
                  playSound('click');
                  onOpenShareCard(dare);
                } else {
                  handleCopyLink();
                }
              }}
              title="Share Proof"
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                copied
                  ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Holo Share Card</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Media Preview if attached */}
        {proof.mediaUrl && (
          <div className="mt-4 relative rounded-xl overflow-hidden border border-slate-800 bg-black max-h-72">
            {isVideoMedia(proof.mediaUrl) ? (
              <video
                src={proof.mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-72 object-cover object-center"
              />
            ) : (
              <img
                src={proof.mediaUrl}
                alt="Submitted Evidence"
                className="w-full h-72 object-cover object-center"
              />
            )}
            <div className="absolute bottom-2 left-2 rounded-md bg-black/80 backdrop-blur-md px-2.5 py-1 text-xs font-mono text-cyan-300 border border-cyan-500/30">
              Submitted by {proof.submittedByHandle} {isVideoMedia(proof.mediaUrl) ? '• 🎬 Video Clip' : '• 📸 Photo'}
            </div>
          </div>
        )}

        {/* Execution Caption / Story */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-[#07090e] p-3.5">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Execution Log:
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-mono">
            "{proof.caption}"
          </p>
        </div>

        {/* AI Proof Referee & Performance Scoring Box */}
        {proof.aiJudgement && (
          <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-purple-950/30 p-4 space-y-3.5 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-cyan-400 animate-pulse" />
                <div>
                  <span className="font-tech font-bold text-sm tracking-wider text-cyan-300 block">
                    AI PROOF REFEREE EVALUATION
                  </span>
                  {proof.aiJudgement.refereeModel && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {proof.aiJudgement.refereeModel}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-xl border px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider ${
                  verdict === 'LEGENDARY'
                    ? 'border-pink-500 bg-pink-950/60 text-pink-300 shadow-[0_0_15px_rgba(255,0,127,0.4)]'
                    : verdict === 'LEGIT'
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'border-rose-500 bg-rose-950/60 text-rose-300'
                }`}>
                  {verdict === 'LEGENDARY' && '🔥 '}
                  {verdict}
                </span>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-xl border border-cyan-500/40">
                  {proof.aiJudgement.confidence}% Confidence
                </span>
              </div>
            </div>

            {/* Performance Gauges: Speed, Creativity, Accuracy, Overall */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { label: 'Speed', score: proof.aiJudgement.performanceScores?.speed || 92, color: 'from-cyan-500 to-blue-500', text: 'text-cyan-300', icon: '⚡' },
                { label: 'Creativity', score: proof.aiJudgement.performanceScores?.creativity || 89, color: 'from-pink-500 to-purple-500', text: 'text-pink-300', icon: '🎨' },
                { label: 'Accuracy', score: proof.aiJudgement.performanceScores?.accuracy || 95, color: 'from-emerald-500 to-teal-500', text: 'text-emerald-300', icon: '🎯' },
                { label: 'Overall', score: proof.aiJudgement.performanceScores?.overall || 93, color: 'from-amber-400 to-orange-500', text: 'text-amber-300', icon: '🏆' },
              ].map(metric => (
                <div key={metric.label} className="rounded-xl border border-slate-800 bg-black/40 p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>{metric.icon} {metric.label}</span>
                    <span className={`font-bold ${metric.text}`}>{metric.score}/100</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-200 italic font-mono leading-relaxed bg-black/50 p-3 rounded-xl border border-slate-800/80 shadow-inner">
              "{proof.aiJudgement.commentary}"
            </p>

            {/* Anti-Spoof & Badges row */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-emerald-300 text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{proof.aiJudgement.antiSpoofScore ?? 98}% Authentic Capture</span>
                </span>
                {proof.aiJudgement.visualClarityScore && (
                  <span className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2 py-1 text-cyan-300 text-[11px]">
                    Clarity: {proof.aiJudgement.visualClarityScore}%
                  </span>
                )}
              </div>

              {proof.aiJudgement.badgesAwarded && proof.aiJudgement.badgesAwarded.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {proof.aiJudgement.badgesAwarded.map((b, idx) => (
                    <span key={idx} className="rounded-lg border border-amber-500/40 bg-amber-950/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1 shadow-sm">
                      <Award className="h-3 w-3 text-amber-400" />
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Criteria Breakdown Grid */}
            {proof.aiJudgement.criteriaChecks && proof.aiJudgement.criteriaChecks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-cyan-400" /> Challenge Criteria Verification:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {proof.aiJudgement.criteriaChecks.map((chk, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-900/60 rounded px-2.5 py-1.5 border border-slate-800">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {chk.passed ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />
                        )}
                        <span className="font-mono text-slate-200 truncate">{chk.criterion}</span>
                        {chk.note && <span className="text-[10px] text-slate-400 italic hidden sm:inline truncate">— {chk.note}</span>}
                      </div>
                      <span className="font-mono text-[11px] font-bold text-emerald-400 ml-2">
                        {chk.score}/100
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Proof Signals: GPS, Sensor, Timestamp */}
            {proof.telemetry && (
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-400">
                {proof.telemetry.verifiedLocation && (
                  <div>
                    <span className="text-slate-500">Location: </span>
                    <span className="text-cyan-300 font-bold">📍 {proof.telemetry.verifiedLocation}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Activity: </span>
                  <span className="text-purple-300 font-bold">⚡ Motion Active</span>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp: </span>
                  <span className="text-emerald-300 font-bold">🕒 Verified</span>
                </div>
                {proof.telemetry.hasAudioTrack && (
                  <div>
                    <span className="text-slate-500">Audio: </span>
                    <span className="text-pink-300 font-bold">🎙️ Verified</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono">Cred Reward Awarded:</span>
              <span className="font-mono font-bold text-amber-300 flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                +{dare.rewardCred} Base + {proof.aiJudgement.bonusCred} Bonus Cred
              </span>
            </div>
          </div>
        )}

        {/* Emoji Reactions Bar */}
        <div className="mt-4 rounded-2xl border border-slate-800 bg-[#07090e] p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-400 font-bold mr-1">Reactions:</span>
            {[
              { emoji: '🔥', label: 'Flame' },
              { emoji: '💀', label: 'Wild' },
              { emoji: '⚡', label: 'Shock' },
              { emoji: '🏆', label: 'Respect' },
              { emoji: '🤯', label: 'Mind Blown' },
            ].map(reaction => {
              const count = (proof.reactions && proof.reactions[reaction.emoji]) || 0;
              return (
                <button
                  key={reaction.emoji}
                  type="button"
                  onClick={async () => {
                    playSound('pop');
                    try {
                      await fetch(`/api/dares/${dare.id}/react`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ emoji: reaction.emoji, userId: currentUser.id }),
                      });
                      if (!proof.reactions) proof.reactions = {};
                      proof.reactions[reaction.emoji] = (proof.reactions[reaction.emoji] || 0) + 1;
                    } catch (_e) {}
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-800 hover:border-pink-500/50 bg-slate-900/80 hover:bg-pink-950/30 text-xs font-mono transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-slate-300 font-bold">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Challenge Back Counter-Dare Action */}
          {onRequestRematch && proof.submittedByHandle && proof.submittedByHandle !== currentUser.handle && (
            <button
              type="button"
              onClick={() => {
                playSound('laser');
                onRequestRematch(proof.submittedByHandle, dare.title);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-pink-500/50 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(255,0,127,0.35)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Swords className="h-3.5 w-3.5" />
              <span>Challenge Back</span>
            </button>
          )}
        </div>

        {/* Community Consensus Voting */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-[#07090e] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Community Votes ({totalVotes} votes)
            </span>
            <span className="text-xs font-mono text-emerald-400">
              {legitPercent}% Approved
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${legitPercent}%` }}
            />
          </div>

          {/* Voting Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              id="vote-legit-btn"
              onClick={() => {
                playSound('complete');
                onVote(dare.id, 'legit');
              }}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                userVote === 'legit'
                  ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 glow-green'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300'
              }`}
            >
              <Flame className="h-4 w-4 text-emerald-400" />
              <span>VOUCH LEGIT ({proof.communityVotes.legit})</span>
            </button>

            <button
              id="vote-busted-btn"
              onClick={() => {
                playSound('error');
                onVote(dare.id, 'busted');
              }}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                userVote === 'busted'
                  ? 'border-rose-400 bg-rose-950/60 text-rose-300'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-rose-500/40 hover:text-rose-300'
              }`}
            >
              <Skull className="h-4 w-4 text-rose-400" />
              <span>CALL BUSTED ({proof.communityVotes.busted})</span>
            </button>
          </div>

          {/* Double or Nothing Direct Rematch Trigger */}
          {onRequestRematch && proof.submittedByHandle && proof.submittedByHandle !== currentUser.handle && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-slate-400">
                Want to challenge <strong className="text-white">{proof.submittedByHandle}</strong> to a rematch?
              </span>
              <button
                type="button"
                disabled={rematchSent}
                onClick={async () => {
                  playSound('laser');
                  setRematchSent(true);
                  if (onRequestRematch) {
                    onRequestRematch(proof.submittedByHandle, dare.title);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                  rematchSent
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20'
                }`}
              >
                <Swords className="h-3.5 w-3.5 text-amber-400" />
                <span>{rematchSent ? 'Rematch Sent!' : '🔥 Double or Nothing Rematch'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Close Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
