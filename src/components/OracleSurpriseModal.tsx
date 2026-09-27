import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  Coins, 
  Flame, 
  CheckCircle2, 
  Target, 
  Loader2,
  Lock,
  Unlock
} from 'lucide-react';
import { DareCategory, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface OracleSurpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onDeployGeneratedDare: (dareData: any) => void;
  onOpenProUpgrade?: () => void;
}

export const OracleSurpriseModal: React.FC<OracleSurpriseModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onDeployGeneratedDare,
  onOpenProUpgrade,
}) => {
  const [loading, setLoading] = useState(false);
  const [generatedDare, setGeneratedDare] = useState<{
    title: string;
    description: string;
    proofRequirement: string;
    recommendedDifficulty: string;
    recommendedCred: number;
    category: string;
  } | null>(null);
  const [category, setCategory] = useState<DareCategory>('cyber');
  const [targetType, setTargetType] = useState<'public' | 'direct'>('public');
  const [targetHandle, setTargetHandle] = useState('');
  const [customVibe, setCustomVibe] = useState('');

  const fetchSurge = async (cat = category, useVibe = customVibe) => {
    setLoading(true);
    playSound('oracle');
    try {
      const vibePayload = currentUser.isPro && useVibe.trim() 
        ? useVibe.trim() 
        : 'creative, engaging, fun, modern & safe social dare';

      const res = await fetch('/api/ai/generate-dare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: cat,
          difficulty: 'Tier 3 - Overclocked',
          vibe: vibePayload,
          targetType,
          targetUserHandle: targetHandle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedDare(data);
        playSound('complete');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !generatedDare) {
      fetchSurge();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeploy = async () => {
    if (!generatedDare) return;
    playSound('laser');
    try {
      const res = await fetch('/api/dares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedDare.title,
          description: generatedDare.description,
          proofRequirement: generatedDare.proofRequirement,
          category: generatedDare.category || category,
          difficulty: generatedDare.recommendedDifficulty || 'Tier 3 - Overclocked',
          rewardCred: generatedDare.recommendedCred || 80,
          targetType,
          targetUserHandle: targetType === 'direct' ? targetHandle : undefined,
          creatorId: currentUser.id,
          isHolographic: currentUser.isPro, // PRO users can automatically deploy holographic dares!
        }),
      });
      if (res.ok) {
        const deployed = await res.json();
        onDeployGeneratedDare(deployed);
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="oracle-surprise-modal"
        className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10">
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                AI Challenge <span className="text-indigo-400">Oracle</span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate creative customized challenges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PRO Custom Prompting Feature */}
        <div className="mt-4 border border-slate-800/80 bg-slate-900/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span>Custom Oracle Instructions</span>
            </span>
            {currentUser.isPro ? (
              <span className="rounded bg-indigo-500/20 border border-indigo-500/50 px-1 py-0.2 text-[8px] font-bold text-indigo-300 uppercase tracking-wide scale-90">
                PRO ACTIVE
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenProUpgrade) onOpenProUpgrade();
                }}
                className="rounded bg-slate-800 border border-slate-700 hover:border-indigo-500/50 px-1.5 py-0.5 text-[8px] font-bold text-slate-400 hover:text-indigo-300 uppercase tracking-wider transition-colors flex items-center gap-0.5 scale-90"
              >
                <Lock className="h-2.5 w-2.5 text-indigo-500" />
                <span>Unlock with PRO</span>
              </button>
            )}
          </div>

          {currentUser.isPro ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Specify target theme/vibe (e.g. coffee shop speedrun, fitness routine, art sketch)"
                value={customVibe}
                onChange={(e) => setCustomVibe(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchSurge(category, customVibe);
                  }
                }}
              />
              <button
                onClick={() => fetchSurge(category, customVibe)}
                disabled={loading}
                className="rounded-lg bg-indigo-650 hover:bg-indigo-550 px-3 py-1.5 text-xs font-semibold text-white transition-colors shrink-0 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          ) : (
            <div 
              onClick={() => {
                onClose();
                if (onOpenProUpgrade) onOpenProUpgrade();
              }}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-500 cursor-pointer hover:border-indigo-500/30 hover:bg-slate-950 transition-all select-none font-mono"
            >
              <span className="text-[10px] text-slate-400">Unlock custom AI prompting with a PRO upgrade...</span>
              <Lock className="h-3.5 w-3.5 text-slate-600 animate-pulse" />
            </div>
          )}
        </div>

        {/* Category Picker for AI Oracle */}
        <div className="mt-4 flex items-center justify-between gap-2 overflow-x-auto text-xs pb-1">
          {[
            { id: 'cyber', label: 'Tech & Code' },
            { id: 'social', label: 'Social & Fun' },
            { id: 'physical', label: 'Fitness' },
            { id: 'absurd', label: 'Wild Cards' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategory(c.id as DareCategory);
                fetchSurge(c.id as DareCategory);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                category === c.id
                  ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-semibold shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="mt-4 relative min-h-[200px] rounded-xl border border-slate-800 bg-slate-950/40 p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <Loader2 className="h-8 w-8 text-indigo-450 animate-spin" />
              <div className="text-xs text-indigo-300 animate-pulse">
                Consulting Challenge Oracle...
              </div>
            </div>
          ) : generatedDare ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-indigo-950/40 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-300 uppercase">
                  {generatedDare.recommendedDifficulty}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-300">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  {generatedDare.recommendedCred} Cred Bounty
                </span>
              </div>

              <h3 className="text-base font-bold text-white mt-1">
                {generatedDare.title}
              </h3>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                {generatedDare.description}
              </p>

              <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-[11px] text-slate-400">
                <span className="text-indigo-400 font-bold block mb-0.5">Proof Verification:</span>
                {generatedDare.proofRequirement}
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            disabled={loading}
            onClick={() => fetchSurge()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-300 hover:border-indigo-500/45 hover:text-indigo-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-roll Challenge</span>
          </button>

          <button
            type="button"
            disabled={loading || !generatedDare}
            onClick={handleDeploy}
            className="flex items-center gap-2 rounded-xl bg-indigo-650 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-550 transition-all active:scale-95 disabled:opacity-50"
          >
            <Flame className="h-4 w-4" />
            <span>Post Challenge</span>
          </button>
        </div>

      </div>
    </div>
  );
};
