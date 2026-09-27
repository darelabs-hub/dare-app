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
  Tag,
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

      if (!res.ok) throw new Error('Failed to generate AI Oracle advice');
      const data = await res.json();
      setAdvice(data);
      playSound('laser');
    } catch (err: any) {
      console.error('Error getting AI Oracle advice:', err);
      setError('Unable to summon AI Oracle. Please retry.');
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
    if (!advice) return;
    const text = `🎯 AI ORACLE PROTOCOL: ${dare?.title}\n\n` +
      `💡 Strategy: ${advice.summary}\n\n` +
      `📋 Prep Steps:\n${advice.preparation.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n` +
      `⚡ Execution Tips:\n${advice.stepByStepTips.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n` +
      `🛡️ Safety Guidance:\n${advice.safetyGuidance.map(s => `• ${s}`).join('\n')}\n\n` +
      `📸 Proof Advice: ${advice.proofAdvice}`;

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

    if (!advice) return;

    const speechText = `Here is your AI Oracle briefing for ${dare?.title}. ${advice.summary}. Strategy tips: ${advice.stepByStepTips.join('. ')}. Key safety precaution: ${advice.safetyGuidance.join('. ')}. Good luck challenger!`;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (!isOpen || !dare) return null;

  const isAcceptedByMe = dare.acceptedBy?.handle === currentUser.handle;
  const isCompleted = dare.status === 'verified';
  const prepCompletedCount = Object.values(checkedPrep).filter(Boolean).length;
  const totalPrepCount = advice?.preparation?.length || 0;

  return (
    <div 
      id="ai-dare-coach-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        id="ai-dare-coach-modal-container"
        className="relative w-full max-w-2xl rounded-2xl border border-indigo-500/40 bg-[#090d18] text-slate-100 shadow-[0_0_50px_rgba(99,102,241,0.2)] flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-purple-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-tech text-white tracking-wide flex items-center gap-1.5">
                  AI ORACLE <span className="text-indigo-400 font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30">TACTICAL ADVISOR</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono">Personalized challenge blueprint & safety telemetry</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {'speechSynthesis' in window && (
              <button
                id="coach-tts-btn"
                onClick={toggleSpeech}
                title={isSpeaking ? "Mute Oracle Audio" : "Listen to Oracle Briefing"}
                className={`p-2 rounded-lg border transition-colors ${
                  isSpeaking 
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 animate-pulse' 
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white'
                }`}
              >
                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            )}

            <button 
              id="coach-close-btn"
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                onClose();
              }} 
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Challenge Summary Banner */}
        <div className="px-6 py-3 bg-slate-900/40 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-[200px]">
            <span className="text-slate-400 font-mono uppercase text-[10px]">Target Challenge</span>
            <p className="font-bold text-white text-sm line-clamp-1">{dare.title}</p>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="px-2 py-1 rounded-md bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 font-bold flex items-center gap-1">
              <Tag className="h-3 w-3" />
              +{dare.rewardCred} Cred
            </span>
            <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
              {dare.difficulty || 'Moderate'}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-14 text-center space-y-4">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Bot className="h-8 w-8 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-tech tracking-wider text-indigo-300 uppercase">Analyzing Challenge Telemetry...</p>
                <p className="text-xs font-mono text-slate-500 mt-1">Formulating biomechanics, psychological pacing, and safety boundaries with Gemini 3.8 Flash</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 text-center space-y-3">
              <p className="text-sm text-rose-300 font-mono">{error}</p>
              <button
                onClick={fetchCoachAdvice}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold font-mono hover:bg-rose-500 transition-colors inline-flex items-center gap-2"
              >
                <RotateCw className="h-4 w-4" /> Retry Oracle Analysis
              </button>
            </div>
          ) : advice ? (
            <>
              {/* Oracle Persona & Motivational Strategy */}
              <div className="relative p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-[#0d1222] to-slate-900/60 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span>Oracle Tactical Briefing</span>
                  </div>
                  {advice.estimatedTimeMinutes && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                      <Clock className="h-3 w-3 text-cyan-400" />
                      <span>~{advice.estimatedTimeMinutes} min session</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans italic">
                  "{advice.summary}"
                </p>
                {advice.difficultyAssessment && (
                  <p className="text-xs text-indigo-300/80 font-mono mt-2 pt-2 border-t border-slate-800/80">
                    <span className="font-bold text-indigo-300">Curve Analysis:</span> {advice.difficultyAssessment}
                  </p>
                )}
              </div>

              {/* Step 1: Pre-Challenge Readiness Checklist */}
              {advice.preparation && advice.preparation.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Pre-Challenge Readiness ({prepCompletedCount}/{totalPrepCount})</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">Tap to check off</span>
                  </div>
                  <div className="space-y-1.5">
                    {advice.preparation.map((step, idx) => {
                      const isChecked = !!checkedPrep[idx];
                      return (
                        <div
                          key={idx}
                          id={`coach-prep-item-${idx}`}
                          onClick={() => togglePrep(idx)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${
                            isChecked
                              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                              : 'border-slate-800/80 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0 text-slate-400">
                            {isChecked ? (
                              <CheckSquare className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                          <span className={`leading-relaxed ${isChecked ? 'line-through opacity-80' : ''}`}>
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
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    <span>Execution Tips & Performance Strategy</span>
                  </h3>
                  <div className="grid gap-2">
                    {advice.stepByStepTips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-200"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] border border-amber-500/30">
                          {idx + 1}
                        </div>
                        <p className="leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Safety Boundaries & Precautions (Crucial Directive) */}
              {advice.safetyGuidance && advice.safetyGuidance.length > 0 && (
                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-300 uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    <span>Safety Protocols & Harm Prevention</span>
                  </div>
                  <ul className="space-y-1.5">
                    {advice.safetyGuidance.map((safety, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-rose-200/90 leading-relaxed font-sans">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{safety}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step 4: Proof Capture Telemetry */}
              {advice.proofAdvice && (
                <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    <Camera className="h-4 w-4 text-cyan-400" />
                    <span>Verification & Proof Capture Advice</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {advice.proofAdvice}
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <button
            id="coach-copy-tips-btn"
            onClick={handleCopyTips}
            disabled={!advice || loading}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Tips Copied!' : 'Copy Protocol'}</span>
          </button>

          <div className="flex items-center gap-2">
            {dare.status === 'open' && onAccept && (
              <button
                id="coach-accept-dare-btn"
                onClick={() => {
                  playSound('accept');
                  onAccept(dare);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-tech font-bold text-xs uppercase tracking-wider hover:from-cyan-400 hover:to-teal-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5 active:scale-95"
              >
                <Flame className="h-4 w-4" />
                <span>Accept Challenge Now</span>
              </button>
            )}

            {dare.status === 'accepted' && isAcceptedByMe && onSubmitProof && (
              <button
                id="coach-submit-proof-btn"
                onClick={() => {
                  playSound('laser');
                  onSubmitProof(dare);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-tech font-bold text-xs uppercase tracking-wider hover:from-pink-400 hover:to-rose-400 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Ready to Submit Proof</span>
              </button>
            )}

            <button
              id="coach-done-btn"
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-mono font-bold text-white transition-colors"
            >
              Got It, Let's Go!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
