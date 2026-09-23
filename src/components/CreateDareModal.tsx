import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Target, 
  Users, 
  Flame, 
  Coins, 
  ShieldAlert, 
  Zap, 
  Loader2,
  Code2,
  Dumbbell,
  MessageSquare,
  Palette,
  Skull,
  Timer,
  Mic,
  MicOff,
  Play,
  Pause,
  Trash2,
  Volume2
} from 'lucide-react';
import { DareCategory, DareDifficulty, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface CreateDareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onDareCreated: (newDareData: any) => void;
  onOpenSafetyModal?: () => void;
  initialTargetType?: 'public' | 'direct';
  initialTargetUserHandle?: string;
}

export const CreateDareModal: React.FC<CreateDareModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onDareCreated,
  onOpenSafetyModal,
  initialTargetType,
  initialTargetUserHandle,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proofRequirement, setProofRequirement] = useState('');
  const [category, setCategory] = useState<DareCategory>('cyber');
  const [difficulty, setDifficulty] = useState<DareDifficulty>('Level 2 - Moderate');
  const [rewardCred, setRewardCred] = useState(50);
  const [expiresInHours, setExpiresInHours] = useState(48);
  const [targetType, setTargetType] = useState<'public' | 'direct'>('public');
  const [targetUserHandle, setTargetUserHandle] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (initialTargetUserHandle) {
        setTargetType('direct');
        setTargetUserHandle(initialTargetUserHandle);
      } else if (initialTargetType) {
        setTargetType(initialTargetType);
      }
    }
  }, [isOpen, initialTargetType, initialTargetUserHandle]);

  // Audio Recording State for Microphone API
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    setRecordingError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        
        setDescription((prev) => {
          const clean = prev.replace(/\s*\[Audio Directive Attached 🔊\]/g, '');
          return clean ? `${clean} [Audio Directive Attached 🔊]` : '[Audio Directive Attached 🔊]';
        });

        // Turn off microphone tracks to respect user privacy and clear active hardware indicators
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      playSound('click');

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      let message = 'Microphone access denied or unavailable.';
      if (err?.name === 'NotAllowedError' || err?.message?.toLowerCase().includes('permission') || err?.message?.toLowerCase().includes('dismiss')) {
        message = 'Microphone permission was dismissed or blocked. Please allow microphone access in your browser settings or click the "Open in new tab" icon to bypass iframe sandboxing!';
      }
      setRecordingError(message);
      playSound('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      playSound('complete');
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const playRecordedAudio = () => {
    if (!audioUrl) return;
    
    if (isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
    } else {
      playSound('laser');
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    if (isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
    }
    audioPlayerRef.current = null;
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordDuration(0);
    setDescription((prev) => prev.replace(/\s*\[Audio Directive Attached 🔊\]/g, ''));
    playSound('click');
  };

  if (!isOpen) return null;

  const handleDifficultyChange = (diff: DareDifficulty) => {
    setDifficulty(diff);
    switch (diff) {
      case 'Level 1 - Starter':
        setRewardCred(25);
        break;
      case 'Level 2 - Moderate':
        setRewardCred(50);
        break;
      case 'Level 3 - Intense':
        setRewardCred(100);
        break;
      case 'Level 4 - Elite':
        setRewardCred(160);
        break;
    }
  };

  const handleAIGenerate = async () => {
    setIsGeneratingAI(true);
    setErrorMsg('');
    playSound('oracle');
    try {
      const res = await fetch('/api/ai/generate-dare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          difficulty,
          targetType,
          targetUserHandle,
        }),
      });

      if (!res.ok) throw new Error('AI Oracle offline');
      const data = await res.json();

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.proofRequirement) setProofRequirement(data.proofRequirement);
      if (data.recommendedDifficulty) setDifficulty(data.recommendedDifficulty);
      if (data.recommendedCred) setRewardCred(data.recommendedCred);
      playSound('complete');
    } catch (err) {
      console.error(err);
      setErrorMsg('Cyber Oracle telemetry blip. Try again or enter manually.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Title and description are required.');
      playSound('error');
      return;
    }
    if (targetType === 'direct' && !targetUserHandle.trim()) {
      setErrorMsg('Please specify a target @handle for direct challenges.');
      playSound('error');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    playSound('laser');

    try {
      const res = await fetch('/api/dares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          proofRequirement,
          category,
          difficulty,
          rewardCred,
          targetType,
          targetUserHandle: targetType === 'direct' ? targetUserHandle.trim() : undefined,
          creatorId: currentUser.id,
          expiresInHours,
        }),
      });

      if (!res.ok) throw new Error('Failed to create dare');
      const created = await res.json();
      playSound('complete');
      onDareCreated(created);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to broadcast dare to network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="create-dare-modal-container"
        className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10">
              <Zap className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                CREATE NEW <span className="text-indigo-400">CHALLENGE</span>
              </h2>
              <p className="text-xs text-slate-400">
                Dare a specific friend or challenge the community
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* AI Cyber Oracle Quick Assistance */}
        <div className="mt-4 rounded-xl border border-indigo-500/20 bg-slate-900/50 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-indigo-200">
            <Sparkles className="h-4 w-4 text-indigo-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-indigo-300">AI CHALLENGE ASSISTANT:</span> Stuck on ideas? Let AI generate a creative challenge tailored to your parameters.
            </div>
          </div>
          <button
            type="button"
            id="ai-generate-dare-in-modal-btn"
            disabled={isGeneratingAI}
            onClick={handleAIGenerate}
            className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-indigo-550/30 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 transition-all disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Dare</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-950/30 p-2.5 text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Target Selection: Public vs Direct */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
              1. Choose Audience Target
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="select-target-public-btn"
                onClick={() => {
                  setTargetType('public');
                  playSound('click');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  targetType === 'public'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 shadow-sm'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Wider Public (Open Bounty)</span>
              </button>

              <button
                type="button"
                id="select-target-direct-btn"
                onClick={() => {
                  setTargetType('direct');
                  playSound('click');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  targetType === 'direct'
                    ? 'border-pink-500 bg-pink-500/15 text-pink-300 shadow-sm'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Target className="h-4 w-4" />
                <span>Direct Friend / Peer</span>
              </button>
            </div>
          </div>

          {/* If Direct: Target Handle Input or peer suggestion chips */}
          {targetType === 'direct' && (
            <div className="rounded-xl border border-pink-500/10 bg-slate-900/50 p-3">
              <label className="block text-xs font-mono text-pink-300 mb-1">
                Target @Handle
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="target-handle-input"
                  value={targetUserHandle}
                  onChange={(e) => setTargetUserHandle(e.target.value)}
                  placeholder="e.g. @daredaylabs or @alex_dev"
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-mono">Quick Pick:</span>
                {allUsers
                  .filter((u) => u.handle !== currentUser.handle)
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setTargetUserHandle(u.handle)}
                      className="rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-indigo-300 hover:border-indigo-500"
                    >
                      {u.handle}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Dare Title */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
              2. Challenge Headline
            </label>
            <input
              type="text"
              id="dare-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Draw a sketch of your favorite mug, or run 5km"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
              3. Mission Directives & Rules
            </label>
            <textarea
              id="dare-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline specific parameters, constraints, and time limits..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />

            {/* HIGH-VOLTAGE MICROPHONE RECORDING INTERFACE */}
            <div className="mt-2.5 rounded-xl border border-slate-850 bg-slate-950/40 p-3 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className={`h-4 w-4 ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wide">
                    {isRecording ? 'DIRECT AUDIO TRANSMISSION LIVE' : 'AUDIO BRIEF DIRECTIVES'}
                  </span>
                </div>
                {isRecording && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-[10px] font-mono text-rose-300 font-bold animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span>REC: 0:{recordDuration < 10 ? `0${recordDuration}` : recordDuration} / 0:30</span>
                  </div>
                )}
              </div>

              {recordingError && (
                <div className="rounded-lg bg-rose-950/30 border border-rose-500/20 px-2.5 py-1.5 text-[10px] text-rose-300 font-mono flex items-center gap-1.5">
                  <MicOff className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{recordingError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {/* Control Action Buttons */}
                {!audioUrl ? (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      isRecording
                        ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                        : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-white animate-ping" />
                        <span>Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5" />
                        <span>Record Audio (Max 30s)</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={playRecordedAudio}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        title={isPlaying ? "Pause Briefing" : "Play Briefing"}
                      >
                        {isPlaying ? (
                          <span className="flex gap-0.5 items-center justify-center">
                            <span className="h-2.5 w-0.5 bg-white animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <span className="h-3.5 w-0.5 bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="h-2.5 w-0.5 bg-white animate-bounce" style={{ animationDelay: '0.3s' }} />
                          </span>
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-white" />
                        )}
                      </button>
                      
                      <div className="text-[10px] font-mono text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
                        <span>AUDIO_TACTICAL_TELEMETRY.WAV</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={deleteRecording}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                      title="Delete Audio Directive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Animated Waveform when active */}
                {isRecording && (
                  <div className="flex-1 flex items-center gap-1 justify-end h-4">
                    <span className="w-1 bg-rose-500 animate-pulse rounded h-2" style={{ animationDelay: '0.1s' }} />
                    <span className="w-1 bg-rose-500 animate-pulse rounded h-3.5" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 bg-rose-500 animate-pulse rounded h-1.5" style={{ animationDelay: '0.3s' }} />
                    <span className="w-1 bg-rose-500 animate-pulse rounded h-4" style={{ animationDelay: '0.4s' }} />
                    <span className="w-1 bg-rose-500 animate-pulse rounded h-2" style={{ animationDelay: '0.5s' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Proof Requirement */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
              4. Proof of Completion Requirement (For Verification)
            </label>
            <input
              type="text"
              id="dare-proof-req-input"
              value={proofRequirement}
              onChange={(e) => setProofRequirement(e.target.value)}
              placeholder="e.g. Uncut video clip of the interaction, or timestamped photo."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-550 focus:outline-none"
            />
          </div>

          {/* Category & Difficulty Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                Sector / Category
              </label>
              <select
                id="dare-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as DareCategory)}
                className="w-full rounded-xl border border-slate-800 bg-[#07090e] px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="cyber">Code & Tech</option>
                <option value="physical">Fitness & Outdoors</option>
                <option value="social">Social & Interaction</option>
                <option value="creative">Creative & Media</option>
                <option value="absurd">Wild Cards</option>
              </select>
            </div>

            {/* Difficulty Tier */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                Difficulty Tier
              </label>
              <select
                id="dare-difficulty-select"
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value as DareDifficulty)}
                className="w-full rounded-xl border border-slate-800 bg-[#07090e] px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="Level 1 - Starter">Level 1 - Starter (150 Cred)</option>
                <option value="Level 2 - Moderate">Level 2 - Moderate (300 Cred)</option>
                <option value="Level 3 - Intense">Level 3 - Intense (450 Cred)</option>
                <option value="Level 4 - Elite">Level 4 - Elite (650 Cred)</option>
              </select>
            </div>

          </div>

          {/* Cred Bounty Slider */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-mono text-slate-300">Bounty Reward Pool:</span>
              <div className="flex items-center gap-2">
                {/* Dynamic Difficulty Level Badge Preview */}
                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                  rewardCred < 45
                    ? 'border border-emerald-500/50 bg-emerald-950/60 text-emerald-300'
                    : rewardCred < 80
                    ? 'border border-indigo-500/50 bg-indigo-950/60 text-indigo-300'
                    : rewardCred < 140
                    ? 'border border-amber-500/60 bg-amber-950/60 text-amber-300'
                    : 'border border-rose-500/70 bg-rose-950/70 text-rose-300'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    rewardCred < 45 ? 'bg-emerald-400' : rewardCred < 80 ? 'bg-indigo-400' : rewardCred < 140 ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                  <span>
                    {rewardCred < 45 ? 'Easy' : rewardCred < 80 ? 'Medium' : rewardCred < 140 ? 'Hard' : 'Extreme'}
                  </span>
                </span>

                <span className="font-mono font-bold text-amber-300 flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  {rewardCred} Cred
                </span>
              </div>
            </div>
            <input
              type="range"
              min={15}
              max={250}
              step={5}
              value={rewardCred}
              onChange={(e) => setRewardCred(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span className="text-emerald-400/80">15 (Easy)</span>
              <span className="text-indigo-400/80">50 (Medium)</span>
              <span className="text-amber-400/80">100 (Hard)</span>
              <span className="text-rose-400/80">250 (Extreme)</span>
            </div>
          </div>

          {/* Bounty Expiration Window (Countdown Urgency) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-mono text-slate-300 flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-indigo-400" />
                <span>Time-To-Expiry Window:</span>
              </span>
              <span className="font-mono font-bold text-indigo-300">
                {expiresInHours} Hours
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { hours: 12, label: '12h', desc: 'Flash Sprint' },
                { hours: 24, label: '24h', desc: 'Rapid 1-Day' },
                { hours: 48, label: '48h', desc: 'Standard Ops' },
                { hours: 72, label: '72h', desc: 'Extended Grid' },
              ].map((slot) => (
                <button
                  key={slot.hours}
                  type="button"
                  onClick={() => {
                    setExpiresInHours(slot.hours);
                    playSound('click');
                  }}
                  className={`rounded-lg border p-2 text-center transition-all ${
                    expiresInHours === slot.hours
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-800 bg-[#07090e] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-mono text-xs font-bold">{slot.label}</div>
                  <div className="text-[9px] text-slate-400">{slot.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Safety Guidelines */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#070a10] px-3.5 py-2 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span>Zero-tolerance for dangerous or harmful stunts.</span>
            </span>
            {onOpenSafetyModal && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onOpenSafetyModal();
                }}
                className="text-indigo-400 hover:text-indigo-300 hover:underline shrink-0 ml-2"
              >
                Safety Charter
              </button>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-create-dare-btn"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" />
                  <span>Post Challenge</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
