import React, { useState, useRef, useEffect } from 'react';
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
  Dumbbell,
  Palette,
  Timer,
  Mic,
  MicOff,
  Play,
  Trash2,
  CheckCircle2,
  Crown,
  Activity,
  Globe,
  Swords,
  ArrowRight,
  Sparkle
} from 'lucide-react';
import { DareCategory, DareDifficulty, DareFormat, DareCircle, DareItem, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface CreateDareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onDareCreated: (newDareData: any) => void;
  onDareUpdated?: (updatedDare: DareItem) => void;
  editingDare?: DareItem | null;
  onOpenSafetyModal?: () => void;
  onOpenProUpgrade?: () => void;
  onSignIn?: () => void;
  isAuthenticated?: boolean;
  initialTargetType?: 'public' | 'direct';
  initialTargetUserHandle?: string;
  initialFormat?: DareFormat;
}

interface CategoryOption {
  id: DareCategory;
  label: string;
  tagline: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'social',
    label: 'Social',
    tagline: 'Interactions & banter',
    icon: <Zap className="h-4 w-4 text-pink-400" />,
  },
  {
    id: 'physical',
    label: 'Fitness & Action',
    tagline: 'Stunts & endurance',
    icon: <Dumbbell className="h-4 w-4 text-emerald-400" />,
  },
  {
    id: 'creative',
    label: 'Creative & Arts',
    tagline: 'Design, media & music',
    icon: <Palette className="h-4 w-4 text-purple-400" />,
  },
  {
    id: 'tech',
    label: 'Skills & Brain',
    tagline: 'Puzzles, IQ & code',
    icon: <Activity className="h-4 w-4 text-cyan-400" />,
  },
  {
    id: 'absurd',
    label: 'Wild & Fun',
    tagline: 'Unexpected & bold',
    icon: <Flame className="h-4 w-4 text-amber-400" />,
  },
];

export const CreateDareModal: React.FC<CreateDareModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onDareCreated,
  onDareUpdated,
  editingDare,
  onOpenSafetyModal,
  onOpenProUpgrade,
  initialTargetType,
  initialTargetUserHandle,
  initialFormat,
}) => {
  const isEditing = Boolean(editingDare);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proofRequirement, setProofRequirement] = useState('');
  const [category, setCategory] = useState<DareCategory>('social');
  const [difficulty, setDifficulty] = useState<DareDifficulty>('Level 2 - Moderate');
  const [rewardCred, setRewardCred] = useState(75);
  const [bountyBonus, setBountyBonus] = useState(0);
  const [dareFormat, setDareFormat] = useState<DareFormat>('public');
  const [selectedCircleId, setSelectedCircleId] = useState('');
  const [circles, setCircles] = useState<DareCircle[]>([]);
  const [expiresInHours, setExpiresInHours] = useState(48);
  const [targetType, setTargetType] = useState<'public' | 'direct'>('public');
  const [targetUserHandle, setTargetUserHandle] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Load User Circles
  useEffect(() => {
    if (isOpen) {
      fetch('/api/circles')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCircles(data);
            if (data.length > 0 && !selectedCircleId) {
              setSelectedCircleId(data[0].id);
            }
          }
        })
        .catch((err) => console.warn('Circles load err:', err));
    }
  }, [isOpen, selectedCircleId]);

  // Initialize or Reset Form
  useEffect(() => {
    if (isOpen) {
      if (editingDare) {
        setTitle(editingDare.title || '');
        setDescription(editingDare.description || '');
        setProofRequirement(editingDare.proofRequirement || '');
        setCategory(editingDare.category || 'social');
        setDifficulty(editingDare.difficulty || 'Level 2 - Moderate');
        setRewardCred(editingDare.rewardCred || 75);
        setBountyBonus(editingDare.bountyPoolTotal || 0);
        setDareFormat(editingDare.format || 'public');
        setTargetType(editingDare.targetType || 'public');
        setTargetUserHandle(editingDare.targetUserHandle || '');
        if (editingDare.circleId) setSelectedCircleId(editingDare.circleId);
      } else {
        if (initialFormat) setDareFormat(initialFormat);
        if (initialTargetType) setTargetType(initialTargetType);
        if (initialTargetUserHandle) setTargetUserHandle(initialTargetUserHandle);
        if (initialFormat === '1v1' || initialTargetType === 'direct') {
          setDareFormat('1v1');
          setTargetType('direct');
        }
        setTitle('');
        setDescription('');
        setProofRequirement('');
        setCategory('social');
        setRewardCred(75);
        setBountyBonus(0);
        setDareFormat('public');
        setTargetType('public');
        setTargetUserHandle('');
      }
      setErrorMsg('');
      setAudioUrl(null);
      setIsRecording(false);
    }
  }, [isOpen, editingDare, initialTargetType, initialTargetUserHandle, initialFormat]);

  useEffect(() => {
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
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      playSound('laser');

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone access denied:', err);
      setRecordingError('Microphone unavailable or permission denied.');
      playSound('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      playSound('complete');
    }
  };

  const playRecordedAudio = () => {
    if (!audioUrl) return;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordDuration(0);
    playSound('click');
  };

  const handleDifficultyChange = (diff: DareDifficulty) => {
    setDifficulty(diff);
    playSound('click');
    if (diff === 'Level 1 - Starter') setRewardCred(30);
    if (diff === 'Level 2 - Moderate') setRewardCred(75);
    if (diff === 'Level 3 - Intense') setRewardCred(150);
    if (diff === 'Level 4 - Elite') setRewardCred(250);
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

      if (!res.ok) throw new Error('AI generator unavailable');
      const data = await res.json();

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.proofRequirement) setProofRequirement(data.proofRequirement);
      if (data.recommendedDifficulty) setDifficulty(data.recommendedDifficulty);
      if (data.recommendedCred) setRewardCred(data.recommendedCred);
      playSound('complete');
    } catch (err) {
      console.error(err);
      setErrorMsg('AI generator busy. Enter your custom challenge details below.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please provide a challenge title and rules description.');
      playSound('error');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (isEditing && editingDare) {
        const res = await fetch(`/api/dares/${editingDare.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            proofRequirement: proofRequirement.trim(),
            category,
            difficulty,
            rewardCred,
            format: dareFormat,
            bountyBonus,
            expiresInHours,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update challenge');
        }

        const data = await res.json();
        playSound('complete');
        if (onDareUpdated && data.dare) {
          onDareUpdated(data.dare);
        } else {
          onDareCreated(data.dare);
        }
        onClose();
      } else {
        const selectedCircle = circles.find(c => c.id === selectedCircleId);
        const res = await fetch('/api/dares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            proofRequirement: proofRequirement.trim(),
            category,
            difficulty,
            rewardCred,
            format: dareFormat,
            bountyBonus,
            circleId: dareFormat === 'group' ? selectedCircleId : undefined,
            circleName: dareFormat === 'group' ? selectedCircle?.name : undefined,
            targetType: dareFormat === '1v1' ? 'direct' : 'public',
            targetUserHandle: dareFormat === '1v1' ? targetUserHandle.trim() : undefined,
            creatorId: currentUser.id,
            creator: currentUser,
            expiresInHours,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create challenge');
        }
        const created = await res.json();
        playSound('complete');
        onDareCreated(created);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save challenge.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* Modern High-End Modal Container */}
      <div 
        id="create-dare-modal-container"
        className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0E1117] p-5 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isEditing ? 'Edit Challenge' : 'Create Challenge'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Set the rules, reward, and duration for participants.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Clean AI Assist Banner */}
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>AI Challenge Assistant</span>
              </div>
              <p className="text-xs text-slate-400">
                Generate an engaging challenge idea tailored to your topic.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="ai-generate-dare-in-modal-btn"
            disabled={isGeneratingAI}
            onClick={handleAIGenerate}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkle className="h-3.5 w-3.5 text-indigo-400" />
                <span>Auto-Draft</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 1. Format Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Participation Format
              </label>
              <span className="text-[11px] text-slate-500">Who can accept</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Public */}
              <button
                type="button"
                id="select-format-public-btn"
                onClick={() => {
                  setDareFormat('public');
                  setTargetType('public');
                  playSound('click');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  dareFormat === 'public'
                    ? 'border-white/40 bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                    : 'border-white/5 bg-[#141822] text-slate-400 hover:border-white/15 hover:text-slate-200'
                }`}
              >
                <Globe className={`h-4 w-4 mb-1.5 ${dareFormat === 'public' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <div className="text-xs font-semibold text-white">Public</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Open to all</div>
              </button>

              {/* 1v1 Duel */}
              <button
                type="button"
                id="select-format-1v1-btn"
                onClick={() => {
                  setDareFormat('1v1');
                  setTargetType('direct');
                  playSound('click');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  dareFormat === '1v1'
                    ? 'border-white/40 bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                    : 'border-white/5 bg-[#141822] text-slate-400 hover:border-white/15 hover:text-slate-200'
                }`}
              >
                <Swords className={`h-4 w-4 mb-1.5 ${dareFormat === '1v1' ? 'text-rose-400' : 'text-slate-400'}`} />
                <div className="text-xs font-semibold text-white">1v1 Duel</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Target rival</div>
              </button>

              {/* Circle */}
              <button
                type="button"
                id="select-format-group-btn"
                onClick={() => {
                  setDareFormat('group');
                  setTargetType('public');
                  playSound('click');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  dareFormat === 'group'
                    ? 'border-white/40 bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                    : 'border-white/5 bg-[#141822] text-slate-400 hover:border-white/15 hover:text-slate-200'
                }`}
              >
                <Users className={`h-4 w-4 mb-1.5 ${dareFormat === 'group' ? 'text-purple-400' : 'text-slate-400'}`} />
                <div className="text-xs font-semibold text-white">Circle</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Private squad</div>
              </button>

              {/* Solo Quest */}
              <button
                type="button"
                id="select-format-solo-btn"
                onClick={() => {
                  setDareFormat('solo');
                  setTargetType('public');
                  playSound('click');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  dareFormat === 'solo'
                    ? 'border-white/40 bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                    : 'border-white/5 bg-[#141822] text-slate-400 hover:border-white/15 hover:text-slate-200'
                }`}
              >
                <Target className={`h-4 w-4 mb-1.5 ${dareFormat === 'solo' ? 'text-amber-400' : 'text-slate-400'}`} />
                <div className="text-xs font-semibold text-white">Solo Quest</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Milestone</div>
              </button>
            </div>

            {/* Direct Target Friend Selector Drawer */}
            {dareFormat === '1v1' && (
              <div className="mt-3 rounded-xl border border-white/10 bg-[#141822] p-3.5 space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Target Rival Handle
                </label>
                <input
                  type="text"
                  id="target-handle-input"
                  value={targetUserHandle}
                  onChange={(e) => setTargetUserHandle(e.target.value)}
                  placeholder="@username"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                
                {/* Quick Friend Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500">Quick select:</span>
                  {allUsers
                    .filter((u) => u.handle !== currentUser.handle)
                    .slice(0, 6)
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setTargetUserHandle(u.handle);
                        }}
                        className={`rounded-md border px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                          targetUserHandle === u.handle
                            ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300 font-semibold'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {u.handle}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Circle Selector Drawer */}
            {dareFormat === 'group' && (
              <div className="mt-3 rounded-xl border border-white/10 bg-[#141822] p-3.5 space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Select Circle
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {circles.map(circle => (
                    <button
                      key={circle.id}
                      type="button"
                      onClick={() => {
                        setSelectedCircleId(circle.id);
                        playSound('click');
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        selectedCircleId === circle.id
                          ? 'border-indigo-400 bg-indigo-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <span className="text-lg">{circle.avatar}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-white truncate">{circle.name}</div>
                        <div className="text-[10px] text-slate-500">{circle.memberCount} members</div>
                      </div>
                      {selectedCircleId === circle.id && <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Challenge Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Challenge Title
              </label>
              <span className="text-[11px] text-slate-500">
                {title.length}/120
              </span>
            </div>
            <input
              type="text"
              id="dare-title-input"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Run a 5K before sunrise or sketch a 60-second portrait"
              className="w-full rounded-xl border border-white/10 bg-[#141822] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* 3. Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      playSound('pop');
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isActive 
                        ? 'border-indigo-400/80 bg-indigo-500/10 text-white shadow-sm ring-1 ring-indigo-400/30' 
                        : 'border-white/5 bg-[#141822] text-slate-400 hover:border-white/15 hover:text-slate-200'
                    }`}
                  >
                    <div className="mb-1">{cat.icon}</div>
                    <span className="text-xs font-semibold block truncate w-full">
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate w-full hidden sm:block mt-0.5">
                      {cat.tagline}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Description & Voice Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Rules & Instructions
            </label>
            <textarea
              id="dare-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe constraints, requirements, and steps to complete..."
              className="w-full rounded-xl border border-white/10 bg-[#141822] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors resize-none"
              required
            />

            {/* Clean Voice Note Module */}
            <div className="mt-2.5 rounded-xl border border-white/10 bg-[#141822] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className={`h-4 w-4 ${isRecording ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                  <span className="text-xs font-medium text-slate-300">
                    {isRecording ? 'Recording audio instructions...' : 'Voice Note (Optional)'}
                  </span>
                </div>
                {isRecording && (
                  <span className="text-xs font-mono text-rose-400 font-bold">
                    0:{recordDuration < 10 ? `0${recordDuration}` : recordDuration} / 0:30
                  </span>
                )}
              </div>

              {recordingError && (
                <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1.5">
                  <MicOff className="h-3 w-3 shrink-0" />
                  <span>{recordingError}</span>
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between gap-3">
                {!audioUrl ? (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      isRecording
                        ? 'bg-rose-600 text-white'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
                    }`}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>{isRecording ? 'Stop Recording' : 'Record Audio (30s)'}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={playRecordedAudio}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-950 font-bold transition-all cursor-pointer"
                      >
                        {isPlaying ? <span className="h-2.5 w-2.5 bg-slate-950 rounded-xs" /> : <Play className="h-3 w-3 fill-slate-950 ml-0.5" />}
                      </button>
                      <span className="text-xs text-slate-300">
                        Voice instruction attached
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={deleteRecording}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove audio"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Proof Criteria */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Verification Proof Criteria
            </label>
            <input
              type="text"
              id="dare-proof-req-input"
              value={proofRequirement}
              onChange={(e) => setProofRequirement(e.target.value)}
              placeholder="e.g., Video clip showing full repetition count or photo with timestamp"
              className="w-full rounded-xl border border-white/10 bg-[#141822] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          {/* 6. Difficulty, Rewards & Expiry */}
          <div className="rounded-xl border border-white/10 bg-[#141822] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-amber-400" />
                <span>Difficulty & Reward</span>
              </label>

              <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-md">
                Total Reward: {rewardCred + bountyBonus} Cred
              </span>
            </div>

            {/* Difficulty Tier Selector (4 Tiers) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Level 1 - Starter' as DareDifficulty, label: 'Starter', cred: 30 },
                { id: 'Level 2 - Moderate' as DareDifficulty, label: 'Moderate', cred: 75 },
                { id: 'Level 3 - Intense' as DareDifficulty, label: 'Intense', cred: 150 },
                { id: 'Level 4 - Elite' as DareDifficulty, label: 'Extreme', cred: 250 },
              ].map(tier => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => handleDifficultyChange(tier.id)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                    difficulty === tier.id
                      ? 'border-indigo-400/80 bg-indigo-500/20 text-white shadow-sm'
                      : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/15 hover:text-white'
                  }`}
                >
                  <span className="font-semibold">{tier.label}</span>
                  <span className="text-[10px] text-slate-500">{tier.cred} Base Cred</span>
                </button>
              ))}
            </div>

            {/* Extra Bounty Boost */}
            <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs text-slate-400">
                <span>Extra Bounty (Optional)</span>
                <span className="text-[10px] text-slate-500 ml-2">Balance: {currentUser.cred} CR</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 50, 100, 250].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setBountyBonus(amount);
                      playSound('click');
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      bountyBonus === amount
                        ? 'border border-amber-400/60 bg-amber-400/20 text-amber-300 font-semibold'
                        : 'border border-white/5 bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {amount === 0 ? 'None' : `+${amount}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Expiry Window */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-slate-500" />
                <span>Time Limit</span>
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { hours: 12, label: '12h' },
                  { hours: 24, label: '24h' },
                  { hours: 48, label: '48h' },
                  { hours: 72, label: '72h' },
                ].map((slot) => (
                  <button
                    key={slot.hours}
                    type="button"
                    onClick={() => {
                      setExpiresInHours(slot.hours);
                      playSound('click');
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      expiresInHours === slot.hours
                        ? 'border border-white/30 bg-white/10 text-white font-semibold'
                        : 'border border-white/5 bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pro Multiplier Benefit */}
          <div className="rounded-xl border border-white/10 bg-[#141822] p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <Crown className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">PRO 2X Cred Multipliers</span>
                <p className="text-[11px] text-slate-400">
                  Featured placement in community feed and double completion points.
                </p>
              </div>
            </div>

            {onOpenProUpgrade && (
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  onOpenProUpgrade();
                }}
                className="shrink-0 rounded-lg border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-300 transition-colors cursor-pointer"
              >
                Learn More
              </button>
            )}
          </div>

          {/* Safety Notice */}
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>Zero tolerance for dangerous or non-consensual stunts.</span>
            </span>
            {onOpenSafetyModal && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onOpenSafetyModal();
                }}
                className="text-slate-300 hover:text-white underline shrink-0 ml-2 cursor-pointer"
              >
                Guidelines
              </button>
            )}
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="submit-create-dare-btn"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.98] px-5 py-2.5 text-xs font-bold text-slate-950 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <span>{isEditing ? 'Save Changes' : 'Publish Challenge'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
