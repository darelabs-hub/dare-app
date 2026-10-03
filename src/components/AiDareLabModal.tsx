import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  X, 
  RefreshCw, 
  Users, 
  Activity, 
  Palette, 
  Cpu, 
  Terminal, 
  Check, 
  MapPin, 
  Flame,
  ArrowRight,
  ShieldCheck,
  Coins
} from 'lucide-react';
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

const CATEGORIES: { id: DareCategory; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'social', label: 'Social & Fun', desc: 'Community & interaction', icon: Users },
  { id: 'physical', label: 'Fitness & Action', desc: 'Movement & endurance', icon: Activity },
  { id: 'creative', label: 'Creative & Arts', desc: 'Design & expression', icon: Palette },
  { id: 'tech', label: 'Skills & Logic', desc: 'Mind & technical feats', icon: Cpu },
  { id: 'absurd', label: 'Wild & Spontaneous', desc: 'Unconventional challenges', icon: Sparkles },
  { id: 'digital', label: 'Digital & Code', desc: 'Software & online builds', icon: Terminal },
];

const DIFFICULTIES: { id: DareDifficulty; label: string; sub: string }[] = [
  { id: 'Level 1 - Starter', label: 'Starter', sub: 'Low barrier' },
  { id: 'Level 2 - Moderate', label: 'Moderate', sub: 'Standard' },
  { id: 'Level 3 - Intense', label: 'Intense', sub: 'Demanding' },
  { id: 'Level 4 - Elite', label: 'Elite', sub: 'Mastery' },
];

const POPULAR_INTERESTS = [
  'Fitness & Athletics',
  'Street Art & Design',
  'Coding & Web',
  'Social & Public',
  'Culinary & Coffee',
  'Music & Rhythm',
  'Outdoor & Nature',
  'Mindfulness & Focus',
];

export const AiDareLabModal: React.FC<AiDareLabModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAcceptDare,
  onOpenCreateWithDare,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DareCategory>('social');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DareDifficulty>('Level 2 - Moderate');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Fitness & Athletics']);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.1] bg-[#0A0D14] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08] bg-[#0C1018] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                AI Challenge Generator
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                · DARE Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate structured, verifiable challenges tailored to your preferences.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { playSound('click'); onClose(); }}
            className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain">
          {!generatedDare ? (
            <div className="space-y-6">
              
              {/* Category Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  1. Select Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { playSound('click'); setSelectedCategory(cat.id); }}
                        className={`rounded-xl border p-3 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'border-white bg-white text-slate-950 shadow-sm'
                            : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-slate-950' : 'text-slate-400'}`} />
                          {isSelected && <Check className="h-3.5 w-3.5 text-slate-950" />}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${isSelected ? 'text-slate-950' : 'text-white'}`}>
                            {cat.label}
                          </p>
                          <p className={`text-[10px] mt-0.5 leading-tight ${isSelected ? 'text-slate-700' : 'text-slate-500'}`}>
                            {cat.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Challenge Difficulty Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  2. Difficulty Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DIFFICULTIES.map(diff => {
                    const isSelected = selectedDifficulty === diff.id;
                    return (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => { playSound('click'); setSelectedDifficulty(diff.id); }}
                        className={`rounded-xl border px-3 py-2.5 text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-white bg-white text-slate-950 font-semibold shadow-sm'
                            : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                        }`}
                      >
                        <p className={`text-xs font-semibold ${isSelected ? 'text-slate-950' : 'text-white'}`}>
                          {diff.label}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-700' : 'text-slate-500'}`}>
                          {diff.sub}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personalization: Interests & Context */}
              <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    3. Focus Tags (Optional)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_INTERESTS.map(interest => {
                      const isSelected = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer border ${
                            isSelected
                              ? 'border-white/30 bg-white/10 text-white font-semibold shadow-sm'
                              : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location Context & Pace */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>Location Setting</span>
                    </label>
                    <select
                      value={locationContext}
                      onChange={(e) => setLocationContext(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    >
                      <option value="At Home" className="bg-[#0A0D14] text-white">At Home / Indoors</option>
                      <option value="City / Outdoors" className="bg-[#0A0D14] text-white">City / Outdoors</option>
                      <option value="Gym / Athletic Spot" className="bg-[#0A0D14] text-white">Gym / Sports Track</option>
                      <option value="Café / Public Space" className="bg-[#0A0D14] text-white">Café / Public Space</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-slate-400" />
                      <span>Vibe & Format</span>
                    </label>
                    <select
                      value={userStyle}
                      onChange={(e) => setUserStyle(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    >
                      <option value="Quick & Fun" className="bg-[#0A0D14] text-white">Quick & Fun (&lt; 10 min)</option>
                      <option value="High Intensity" className="bg-[#0A0D14] text-white">High Intensity / Stunt</option>
                      <option value="Creative Flare" className="bg-[#0A0D14] text-white">Creative & Visual</option>
                      <option value="Mind Bender" className="bg-[#0A0D14] text-white">Focus & Mental Grit</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerate}
                className="w-full rounded-xl bg-white hover:bg-slate-100 text-slate-950 py-3.5 px-6 text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Generating Custom Challenge...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-slate-950" />
                    <span>Generate AI Challenge</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Result State: Generated Challenge Presentation */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-5 space-y-4">
                
                {/* Metadata Row */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white capitalize">{generatedDare.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{generatedDare.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-mono font-semibold">
                    <Coins className="h-3.5 w-3.5" />
                    <span>+{generatedDare.rewardCred} Cred</span>
                  </div>
                </div>

                {/* Challenge Title & Description */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {generatedDare.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    {generatedDare.description}
                  </p>
                </div>

                {/* Proof Requirement */}
                {generatedDare.proofRequirement && (
                  <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3.5 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Proof Requirement</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {generatedDare.proofRequirement}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playSound('laser');
                    onAcceptDare(generatedDare);
                    onClose();
                  }}
                  className="rounded-xl bg-white hover:bg-slate-100 py-3 px-4 text-xs font-bold text-slate-950 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Zap className="h-4 w-4 text-slate-950" />
                  <span>Accept This Challenge</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setGeneratedDare(null);
                  }}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] py-3 px-4 text-xs font-semibold text-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                  <span>Configure Another</span>
                </button>
              </div>

              {onOpenCreateWithDare && (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    onOpenCreateWithDare(generatedDare);
                    onClose();
                  }}
                  className="w-full text-center text-xs font-medium text-slate-400 hover:text-white transition-colors pt-2 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Dare a friend with this challenge</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
