import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Lightbulb, 
  Clock, 
  Camera, 
  CheckSquare, 
  Square, 
  X, 
  Flame, 
  Volume2, 
  VolumeX, 
  RotateCw,
  Copy,
  Check,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { DareItem, UserProfile, DareCoachAdvice } from '../types';
import { playSound } from '../utils/soundEffects';

interface DareCoachModalProps {
  isOpen: boolean;
  dare: DareItem | null;
  currentUser: UserProfile;
  onClose: () => void;
  onAccept?: (dare: DareItem) => void;
  onSubmitProof?: (dare: DareItem) => void;
}

export const DareCoachModal: React.FC<DareCoachModalProps> = ({
  isOpen,
  dare,
  currentUser,
  onClose,
  onAccept,
  onSubmitProof,
}) => {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<DareCoachAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedPrep, setCheckedPrep] = useState<Record<number, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && dare) {
      fetchCoachAdvice();
      setCheckedPrep({});
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  }, [isOpen, dare?.id]);

  const fetchCoachAdvice = async () => {
    if (!dare) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/dare-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dare.title,
          description: dare.description,
          category: dare.category,
          proofRequirement: dare.proofRequirement,
          difficulty: dare.difficulty,
          rewardCred: dare.rewardCred,
          userHandle: currentUser.handle,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate coaching strategy');
      const data = await res.json();
      setAdvice(data);
      playSound('laser');
    } catch (err: any) {
      console.error('Error getting AI advice:', err);
      setError('Unable to load strategy advice. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const togglePrep = (index: number) => {
    playSound('click');
    setCheckedPrep(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCopyTips = () => {
    if (!advice || !dare) return;
    const text = `STRATEGY BRIEFING: ${dare.title}\n\n` +
      `Strategy: ${advice.summary}\n\n` +
      `Preparation Steps:\n${advice.preparation.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n` +
      `Execution Tips:\n${advice.stepByStepTips.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n` +
      `Safety Guidance:\n${advice.safetyGuidance.map(s => `• ${s}`).join('\n')}\n\n` +
      `Proof Advice: ${advice.proofAdvice}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    playSound('click');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!advice || !dare) return;

    const speechText = `Strategy briefing for ${dare.title}. ${advice.summary}. Strategy tips: ${advice.stepByStepTips.join('. ')}. Safety precaution: ${advice.safetyGuidance.join('. ')}.`;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (!isOpen || !dare) return null;

  const isAcceptedByMe = dare.acceptedBy?.handle === currentUser.handle;
  const prepCompletedCount = Object.values(checkedPrep).filter(Boolean).length;
  const totalPrepCount = advice?.preparation?.length || 0;

  return (
    <div 
      id="ai-dare-coach-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div 
        id="ai-dare-coach-modal-container"
        className="relative w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0A0D14] text-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0C1018] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Strategy & Tips
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  · Coach
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tactical execution, prep checklist, and verification guide
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {'speechSynthesis' in window && (
              <button
                id="coach-tts-btn"
                type="button"
                onClick={toggleSpeech}
                title={isSpeaking ? "Mute audio" : "Listen to briefing"}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  isSpeaking 
                    ? 'border-white/30 bg-white/10 text-white' 
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            )}

            <button 
              id="coach-close-btn"
              type="button"
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                onClose();
              }} 
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Challenge Summary Banner */}
        <div className="px-6 py-3.5 bg-white/[0.02] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex-1 min-w-[200px]">
            <span className="text-slate-400 text-[11px] font-medium">Target Challenge</span>
            <p className="font-semibold text-white text-sm line-clamp-1 mt-0.5">{dare.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono font-semibold flex items-center gap-1 text-xs">
              <Coins className="h-3.5 w-3.5" />
              +{dare.rewardCred} Cred
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300 text-xs">
              {dare.difficulty || 'Moderate'}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 overscroll-contain">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                <Bot className="h-5 w-5 text-slate-300 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Analyzing Challenge...</p>
                <p className="text-xs text-slate-400 mt-1">Formulating step-by-step tactics, pacing, and proof guidelines</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-center space-y-3">
              <p className="text-xs text-rose-300">{error}</p>
              <button
                type="button"
                onClick={fetchCoachAdvice}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RotateCw className="h-3.5 w-3.5 text-slate-950" />
                <span>Retry Analysis</span>
              </button>
            </div>
          ) : advice ? (
            <>
              {/* Coach Strategy Summary */}
              <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                    <span>Strategy Briefing</span>
                  </div>
                  {advice.estimatedTimeMinutes && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>~{advice.estimatedTimeMinutes} min duration</span>
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                  "{advice.summary}"
                </p>
                {advice.difficultyAssessment && (
                  <p className="text-xs text-slate-400 pt-2 border-t border-white/[0.06] leading-relaxed">
                    <strong className="text-slate-300 font-medium">Overview:</strong> {advice.difficultyAssessment}
                  </p>
                )}
              </div>

              {/* Step 1: Pre-Challenge Readiness Checklist */}
              {advice.preparation && advice.preparation.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Preparation Checklist ({prepCompletedCount}/{totalPrepCount})</span>
                    </h3>
                    <span className="text-[11px] text-slate-500">Tap to mark complete</span>
                  </div>
                  <div className="space-y-1.5">
                    {advice.preparation.map((step, idx) => {
                      const isChecked = !!checkedPrep[idx];
                      return (
                        <div
                          key={idx}
                          id={`coach-prep-item-${idx}`}
                          onClick={() => togglePrep(idx)}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                            isChecked
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                              : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                          <span className={`leading-relaxed ${isChecked ? 'line-through text-emerald-300/80' : ''}`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Step-by-Step Tactical Execution Tips */}
              {advice.stepByStepTips && advice.stepByStepTips.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    <span>Execution Tips</span>
                  </h3>
                  <div className="space-y-2">
                    {advice.stepByStepTips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs text-slate-200"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-slate-300 font-mono text-[11px] font-semibold">
                          {idx + 1}
                        </div>
                        <p className="leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Safety Protocols */}
              {advice.safetyGuidance && advice.safetyGuidance.length > 0 && (
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                    <span>Safety Protocols</span>
                  </div>
                  <ul className="space-y-1.5">
                    {advice.safetyGuidance.map((safety, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{safety}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step 4: Proof Capture Advice */}
              {advice.proofAdvice && (
                <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Camera className="h-3.5 w-3.5 text-slate-400" />
                    <span>Proof & Verification Guidance</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {advice.proofAdvice}
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0C1018] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            id="coach-copy-tips-btn"
            type="button"
            onClick={handleCopyTips}
            disabled={!advice || loading}
            className="px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Strategy'}</span>
          </button>

          <div className="flex items-center gap-2">
            {dare.status === 'open' && onAccept && (
              <button
                id="coach-accept-dare-btn"
                type="button"
                onClick={() => {
                  playSound('accept');
                  onAccept(dare);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
              >
                <Flame className="h-3.5 w-3.5 text-slate-950" />
                <span>Accept Challenge</span>
              </button>
            )}

            {dare.status === 'accepted' && isAcceptedByMe && onSubmitProof && (
              <button
                id="coach-submit-proof-btn"
                type="button"
                onClick={() => {
                  playSound('laser');
                  onSubmitProof(dare);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs transition-all shadow-sm active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Submit Proof</span>
              </button>
            )}

            <button
              id="coach-done-btn"
              type="button"
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
