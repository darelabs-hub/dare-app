import React, { useState } from 'react';
import { Bot, Sparkles, Zap, X, ShieldCheck, Flame, ChevronRight, RefreshCw } from 'lucide-react';
import { DareCategory, DareDifficulty, DareItem, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';
import { auth, getSafeIdToken } from '../lib/firebase';

interface AiDareLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onAcceptDare: (dare: DareItem) => void;
  onOpenCreateWithDare?: (dare: DareItem) => void;
}

export const AiDareLabModal: React.FC<AiDareLabModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAcceptDare,
  onOpenCreateWithDare,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DareCategory>('social');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DareDifficulty>('Level 2 - Moderate');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Fitness & Action']);
  const [locationContext, setLocationContext] = useState<string>('City / Outdoors');
  const [userStyle, setUserStyle] = useState<string>('Quick & Fun');
  const [generating, setGenerating] = useState(false);
  const [generatedDare, setGeneratedDare] = useState<DareItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleInterest = (tag: string) => {
    playSound('pop');
    setSelectedInterests(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      playSound('oracle');

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('Please sign in to generate personalized AI challenges.');
      }

      let idToken = await getSafeIdToken(firebaseUser);
      const idempotencyKey = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const executeRequest = async (token: string | null) => {
        return await fetch('/api/ai-dares/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            category: selectedCategory,
            difficulty: selectedDifficulty,
            interests: selectedInterests,
            locationContext,
            userStyle,
            idempotencyKey,
          }),
        });
      };

      let res = await executeRequest(idToken);

      // Handle token expiration: retry once after forcing a token refresh
      if (res.status === 401 && auth.currentUser) {
        idToken = await getSafeIdToken(auth.currentUser, true);
        res = await executeRequest(idToken);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate dare idea');
      }

      if (data.dare) {
        setGeneratedDare(data.dare);
        playSound('complete');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to generate challenge right now');
      playSound('error');
    } finally {
      setGenerating(false);
    }
  };

  const CATEGORY_LABELS: Record<string, string> = {
    social: '🎉 Social & Fun',
    physical: '⚡ Fitness & Action',
    creative: '🎨 Creative & Arts',
    tech: '🧠 Skills & Trivia',
    absurd: '🤪 Wild & Funny',
    digital: '💻 Digital & Code',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-fuchsia-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-fuchsia-950/30 p-6 shadow-[0_0_50px_rgba(217,70,239,0.2)] overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
              <Bot className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white font-tech flex items-center gap-2">
                AI DARE LAB <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30">Instant Generator</span>
              </h2>
              <p className="text-xs text-slate-300">
                Generate fresh, unexpected challenge ideas instantly powered by AI.
              </p>
            </div>
          </div>
          <button
            onClick={() => { playSound('click'); onClose(); }}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-5 space-y-5">
          {!generatedDare ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-fuchsia-300 mb-2">Choose Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['social', 'physical', 'creative', 'tech', 'absurd', 'digital'] as DareCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { playSound('click'); setSelectedCategory(cat); }}
                      className={`rounded-xl border p-2.5 text-xs font-medium transition-all cursor-pointer text-left sm:text-center ${
                        selectedCategory === cat
                          ? 'border-fuchsia-500 bg-fuchsia-950/60 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {CATEGORY_LABELS[cat] || cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-fuchsia-300 mb-2">Challenge Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Level 1 - Starter', 'Level 2 - Moderate', 'Level 3 - Intense', 'Level 4 - Elite'] as DareDifficulty[]).map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => { playSound('click'); setSelectedDifficulty(diff); }}
                      className={`rounded-xl border p-2.5 text-xs font-medium transition-all cursor-pointer ${
                        selectedDifficulty === diff
                          ? 'border-cyan-500 bg-cyan-950/60 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personalization: Interests & Context */}
              <div className="space-y-3 pt-1 border-t border-white/5">
                <div>
                  <label className="block text-[11px] font-mono text-fuchsia-300 mb-1.5">
                    Your Interests & Passions
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Fitness & Action',
                      'Street Art & Design',
                      'Coding & Logic',
                      'Social Pranks',
                      'Culinary & Coffee',
                      'Music & Rhythm',
                      'Outdoor Stunts',
                    ].map(interest => {
                      const isSelected = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition-all cursor-pointer ${
                            isSelected
                              ? 'border border-fuchsia-400 bg-fuchsia-950/80 text-fuchsia-200 shadow-[0_0_8px_rgba(217,70,239,0.3)]'
                              : 'border border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location Context & Pace */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Location Setting</label>
                    <select
                      value={locationContext}
                      onChange={(e) => setLocationContext(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="At Home">🏠 At Home</option>
                      <option value="City / Outdoors">🏙️ City / Outdoors</option>
                      <option value="Gym / Athletic Spot">🏋️ Gym / Athletic Spot</option>
                      <option value="Café / Public Space">☕ Café / Public Space</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Vibe & Style</label>
                    <select
                      value={userStyle}
                      onChange={(e) => setUserStyle(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Quick & Fun">⚡ Quick & Fun</option>
                      <option value="High Intensity">🔥 High Intensity</option>
                      <option value="Creative Flare">🎨 Creative Flare</option>
                      <option value="Mind Bender">🧠 Mind Bender</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200">
                  {error}
                </div>
              )}

              <button
                disabled={generating}
                onClick={handleGenerate}
                className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 hover:from-fuchsia-400 hover:to-cyan-400 py-3.5 px-6 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(217,70,239,0.4)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Creating your challenge...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate AI Challenge</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-fuchsia-500/50 bg-slate-900/90 p-4 relative overflow-hidden shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-fuchsia-300 bg-fuchsia-500/20 border border-fuchsia-500/40 px-2.5 py-0.5 rounded-md">
                    <Bot className="h-3 w-3 text-fuchsia-400" /> AI Challenge
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                    {generatedDare.category} • {generatedDare.difficulty}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {generatedDare.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {generatedDare.description}
                </p>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300 font-bold">Reward: +{generatedDare.rewardCred} Cred</span>
                  <span className="text-slate-400">Ready to Take</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    playSound('laser');
                    onAcceptDare(generatedDare);
                    onClose();
                  }}
                  className="min-h-[44px] rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 py-3 px-4 text-xs font-black text-slate-950 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <Zap className="h-4 w-4" />
                  <span>Accept This Dare</span>
                </button>

                <button
                  onClick={() => {
                    playSound('click');
                    setGeneratedDare(null);
                  }}
                  className="min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 py-3 px-4 text-xs font-bold text-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Generate Another</span>
                </button>
              </div>

              {onOpenCreateWithDare && (
                <button
                  onClick={() => {
                    playSound('click');
                    onOpenCreateWithDare(generatedDare);
                    onClose();
                  }}
                  className="w-full text-center text-xs font-mono text-fuchsia-300 hover:underline pt-1 cursor-pointer"
                >
                  Dare a Friend with this Challenge →
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
