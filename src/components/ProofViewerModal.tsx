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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="proof-viewer-modal-container"
        className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/40 bg-[#0d111a] p-6 shadow-2xl glow-cyan my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400 bg-cyan-950/40 glow-cyan">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-tech text-lg font-bold text-white tracking-wide">
                  EVIDENCE & <span className="text-cyan-400 text-glow-cyan">VERIFICATION MATRIX</span>
                </h2>
                {dare.status === 'verified' ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/70 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 glow-green">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/70 bg-purple-950/80 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 glow-purple">
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-400" />
                    </span>
                    Awaiting Verdict
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dare: <span className="text-slate-200">{dare.title}</span>
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
              title="Generate Holographic Share Card / Broadcast"
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-mono transition-all cursor-pointer ${
                copied
                  ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] glow-green'
                  : 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
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
            {proof.mediaUrl.toLowerCase().includes('mp4') || proof.mediaUrl.toLowerCase().includes('webm') ? (
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
              Submitted by {proof.submittedByHandle} {proof.mediaUrl.toLowerCase().includes('mp4') && '• 🎬 Video Clip'}
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

        {/* AI Oracle Evaluation Box */}
        {proof.aiJudgement && (
          <div className="mt-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/40 to-purple-950/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-cyan-400 animate-pulse" />
                <div>
                  <span className="font-tech font-bold text-sm tracking-wider text-cyan-300 block">
                    NEURAL ARBITER VERDICT
                  </span>
                  {proof.aiJudgement.refereeModel && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {proof.aiJudgement.refereeModel}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-md border px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wider ${
                  verdict === 'LEGENDARY'
                    ? 'border-pink-500 bg-pink-950/60 text-pink-300 glow-magenta'
                    : verdict === 'LEGIT'
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 glow-green'
                    : 'border-rose-500 bg-rose-950/60 text-rose-300'
                }`}>
                  {verdict === 'LEGENDARY' && '🔥 '}
                  {verdict}
                </span>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">
                  {proof.aiJudgement.confidence}% Confidence
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 italic font-mono leading-relaxed mt-2 bg-black/40 p-3 rounded-lg border border-slate-800/80">
              "{proof.aiJudgement.commentary}"
            </p>

            {/* Criteria Breakdown Grid */}
            {proof.aiJudgement.criteriaChecks && proof.aiJudgement.criteriaChecks.length > 0 && (
              <div className="mt-3 space-y-1.5">
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

            {/* Anti-Spoof, Visual Clarity & Badges row */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-lg bg-black/40 border border-slate-800 p-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Fingerprint className="h-4 w-4 text-emerald-400" />
                  <span className="text-[11px] font-mono text-slate-300">Anti-Spoof Authenticity:</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {proof.aiJudgement.antiSpoofScore ?? 98}% Verified
                </span>
              </div>

              {proof.aiJudgement.visualClarityScore && (
                <div className="rounded-lg bg-black/40 border border-slate-800 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span className="text-[11px] font-mono text-slate-300">Visual Clarity Score:</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {proof.aiJudgement.visualClarityScore}%
                  </span>
                </div>
              )}

              {proof.aiJudgement.badgesAwarded && proof.aiJudgement.badgesAwarded.length > 0 && (
                <div className="sm:col-span-2 rounded-lg bg-black/40 border border-slate-800 p-2 flex items-center gap-1.5 overflow-x-auto">
                  <Award className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  {proof.aiJudgement.badgesAwarded.map((b, idx) => (
                    <span key={idx} className="rounded bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono text-amber-300 whitespace-nowrap">
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Multimodal Detected Actions & Telemetry Objects */}
            {(proof.aiJudgement.detectedActions?.length || proof.aiJudgement.detectedObjects?.length) && (
              <div className="mt-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 p-2.5 space-y-1.5 text-xs font-mono">
                {proof.aiJudgement.detectedActions && proof.aiJudgement.detectedActions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-indigo-400 font-bold text-[10px] uppercase">Detected Actions:</span>
                    {proof.aiJudgement.detectedActions.map((act, idx) => (
                      <span key={idx} className="bg-indigo-900/40 text-indigo-200 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px]">
                        ✓ {act}
                      </span>
                    ))}
                  </div>
                )}
                {proof.aiJudgement.detectedObjects && proof.aiJudgement.detectedObjects.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-cyan-400 font-bold text-[10px] uppercase">Detected Environment/Props:</span>
                    {proof.aiJudgement.detectedObjects.map((obj, idx) => (
                      <span key={idx} className="bg-cyan-900/40 text-cyan-200 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px]">
                        • {obj}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Proof Telemetry Metadata if present */}
            {proof.telemetry && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
                {proof.telemetry.deviceType && (
                  <div>
                    <span className="text-slate-500">RIG: </span>
                    <span className="text-cyan-300">{proof.telemetry.deviceType}</span>
                  </div>
                )}
                {proof.telemetry.verifiedLocation && (
                  <div>
                    <span className="text-slate-500">COORDS: </span>
                    <span className="text-indigo-300">{proof.telemetry.verifiedLocation}</span>
                  </div>
                )}
                {proof.telemetry.hasAudioTrack && (
                  <div>
                    <span className="text-slate-500">AUDIO: </span>
                    <span className="text-emerald-300">Synchronized Track</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono">Cred Bounty Awarded:</span>
              <span className="font-mono font-bold text-amber-300 flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                +{dare.rewardCred} Base + {proof.aiJudgement.bonusCred} Bonus Cred
              </span>
            </div>
          </div>
        )}

        {/* Community Consensus Voting Matrix */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-[#07090e] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Community Consensus ({totalVotes} votes)
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
                Want to settle the score with <strong className="text-white">{proof.submittedByHandle}</strong>?
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
            className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
};
