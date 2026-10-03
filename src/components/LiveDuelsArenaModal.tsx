import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Users, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight,
  Radio,
  Camera,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Send,
  Heart,
  Gift,
  Play,
  Eye,
  ShieldCheck,
  Coins,
  ChevronRight,
  AlertCircle,
  Flame,
  Zap,
  RotateCw,
  Plus
} from 'lucide-react';
import { LiveDuel, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface LiveDuelsArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserCredUpdated?: (newCred: number) => void;
}

interface ChatMessage {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  text: string;
  timestamp: number;
  isTip?: boolean;
  tipAmount?: number;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

const REACTION_EMOJIS = ['🔥', '👏', '⚡', '👑', '❤️', '🚀'];

const CATEGORY_TABS = [
  { id: 'all', label: 'All Streams' },
  { id: 'physical', label: 'Fitness' },
  { id: 'creative', label: 'Creative' },
  { id: 'tech', label: 'Skills' },
  { id: 'social', label: 'Social' },
];

export const LiveDuelsArenaModal: React.FC<LiveDuelsArenaModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserCredUpdated,
}) => {
  const [duels, setDuels] = useState<LiveDuel[]>([]);
  const [activeDuel, setActiveDuel] = useState<LiveDuel | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'lobby' | 'arena' | 'create'>('lobby');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Stream state (Strict genuine user numbers only)
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [challengerVotes, setChallengerVotes] = useState<number>(0);
  const [opponentVotes, setOpponentVotes] = useState<number>(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showTipMenu, setShowTipMenu] = useState(false);
  const [tipTarget, setTipTarget] = useState<'challenger' | 'opponent'>('challenger');
  const [hasVotedSide, setHasVotedSide] = useState<'challenger' | 'opponent' | null>(null);

  // In-modal Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Camera & Audio Controls
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Timer reference
  const [timeLeft, setTimeLeft] = useState<number>(180);

  // Create duel state
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState<'physical' | 'creative' | 'tech' | 'social'>('physical');
  const [createDuration, setCreateDuration] = useState<number>(180);
  const [createStakes, setCreateStakes] = useState<number>(100);
  const [createBrief, setCreateBrief] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch duels on open
  useEffect(() => {
    if (isOpen) {
      fetchDuels();
    } else {
      stopCamera();
      if (wsRef.current) {
        wsRef.current.close();
      }
    }
  }, [isOpen]);

  const fetchDuels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/duels');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDuels(data);
          if (data.length > 0 && !activeDuel) {
            setActiveDuel(data[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load duels', err);
    } finally {
      setLoading(false);
    }
  };

  // Setup camera stream
  const startCamera = async (videoElement: HTMLVideoElement | null) => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });
        mediaStreamRef.current = stream;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
        setIsCameraActive(true);
      }
    } catch (_err) {
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const toggleCamera = () => {
    playSound('click');
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraActive(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    playSound('click');
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicActive(audioTrack.enabled);
      }
    }
  };

  // Manage camera when transitioning to arena or create
  useEffect(() => {
    if (viewMode === 'arena') {
      startCamera(localVideoRef.current);
    } else if (viewMode === 'create') {
      startCamera(previewVideoRef.current);
    } else {
      stopCamera();
    }
  }, [viewMode, activeDuel?.id]);

  // Connect WebSocket when entering arena
  useEffect(() => {
    if (viewMode !== 'arena' || !activeDuel) return;

    fetch(`/api/duels/${activeDuel.id}/stream`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.challengerVotes !== undefined) setChallengerVotes(data.challengerVotes);
          if (data.opponentVotes !== undefined) setOpponentVotes(data.opponentVotes);
          if (data.viewerCount !== undefined) setViewerCount(data.viewerCount);
          if (data.messages) setChatMessages(data.messages);
        }
      })
      .catch((e) => console.warn(e));

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join_stream', duelId: activeDuel.id }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'room_snapshot' && msg.duelId === activeDuel.id) {
            setChallengerVotes(msg.challengerVotes);
            setOpponentVotes(msg.opponentVotes);
            setViewerCount(msg.viewerCount);
            if (msg.messages) setChatMessages(msg.messages);
          } else if (msg.type === 'viewer_count_update' && msg.duelId === activeDuel.id) {
            setViewerCount(msg.viewerCount);
          } else if (msg.type === 'votes_update' && msg.duelId === activeDuel.id) {
            setChallengerVotes(msg.challengerVotes);
            setOpponentVotes(msg.opponentVotes);
          } else if (msg.type === 'chat' && msg.duelId === activeDuel.id) {
            setChatMessages((prev) => [...prev.slice(-40), msg.message]);
            scrollChatToBottom();
          } else if (msg.type === 'tip_broadcast' && msg.duelId === activeDuel.id) {
            setChatMessages((prev) => [...prev.slice(-40), msg.tip]);
            setChallengerVotes(msg.challengerVotes);
            setOpponentVotes(msg.opponentVotes);
            triggerFloatingReaction(msg.emoji || '🚀');
            scrollChatToBottom();
          } else if (msg.type === 'floating_reaction' && msg.duelId === activeDuel.id) {
            triggerFloatingReaction(msg.emoji || '🔥');
          }
        } catch (_err) {
          // ignore
        }
      };

      return () => {
        ws.close();
      };
    } catch (_err) {
      // ignore
    }
  }, [viewMode, activeDuel?.id]);

  // Live Timer Countdown
  useEffect(() => {
    if (viewMode !== 'arena' || !activeDuel || activeDuel.status !== 'in_progress') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, (activeDuel.endsAt || Date.now() + 180000) - now);
      const remainingSec = Math.ceil(remainingMs / 1000);
      setTimeLeft(remainingSec);
    }, 1000);

    return () => clearInterval(interval);
  }, [viewMode, activeDuel]);

  const scrollChatToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const triggerFloatingReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: `react_${Date.now()}_${Math.random()}`,
      emoji,
      x: Math.floor(Math.random() * 30) + 65,
    };
    setFloatingReactions((prev) => [...prev.slice(-15), newReaction]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2200);
  };

  const handleSendReaction = (emoji: string) => {
    playSound('pop');
    triggerFloatingReaction(emoji);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeDuel) {
      wsRef.current.send(JSON.stringify({ type: 'reaction', duelId: activeDuel.id, emoji }));
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !activeDuel) return;

    const text = chatInput.trim();
    setChatInput('');

    try {
      const res = await fetch(`/api/duels/${activeDuel.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: currentUser.name,
          authorHandle: currentUser.handle,
          authorAvatar: currentUser.avatar,
          text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev.slice(-40), data.message]);
        scrollChatToBottom();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleVote = async (side: 'challenger' | 'opponent') => {
    if (!activeDuel || hasVotedSide) return;
    playSound('pop');
    setHasVotedSide(side);

    if (side === 'challenger') {
      setChallengerVotes((prev) => prev + 1);
    } else {
      setOpponentVotes((prev) => prev + 1);
    }

    try {
      await fetch(`/api/duels/${activeDuel.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side }),
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSendTip = async (amount: number, emoji: string) => {
    if (!activeDuel) return;
    if (currentUser.cred < amount) {
      playSound('error');
      showToast(`Insufficient balance: You have ${currentUser.cred} Cred, but ${amount} Cred is required.`);
      return;
    }

    playSound('purchase');
    setShowTipMenu(false);

    try {
      const res = await fetch(`/api/duels/${activeDuel.id}/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          fromName: currentUser.name,
          fromHandle: currentUser.handle,
          fromAvatar: currentUser.avatar,
          toSide: tipTarget,
          amountCred: amount,
          emoji,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (onUserCredUpdated && data.userCred !== undefined) {
          onUserCredUpdated(data.userCred);
        }
        setChallengerVotes(data.challengerVotes);
        setOpponentVotes(data.opponentVotes);
        triggerFloatingReaction(emoji);
        showToast(`Sent ${amount} Cred tip to ${tipTarget === 'challenger' ? activeDuel.challenger.name : activeDuel.opponent.name}!`);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCreateDuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    if (currentUser.cred < createStakes) {
      playSound('error');
      showToast(`Insufficient balance: You have ${currentUser.cred} Cred, but ${createStakes} Cred is required.`);
      return;
    }

    try {
      playSound('pop');
      const res = await fetch('/api/duels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle,
          category: createCategory,
          durationSeconds: createDuration,
          entryFeeCred: createStakes,
          challengeBrief: createBrief || `Live split-screen battle: ${createTitle}`,
          proofCriteria: 'Continuous live video streaming demonstrating full completion of challenge rules.',
          creator: currentUser,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        playSound('levelUp');
        setDuels((prev) => [data.duel, ...prev]);
        setActiveDuel(data.duel);
        setViewMode('arena');
        if (onUserCredUpdated && data.userCred !== undefined) {
          onUserCredUpdated(data.userCred);
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalVotes = challengerVotes + opponentVotes;
  const challengerPercent = totalVotes > 0 ? Math.round((challengerVotes / totalVotes) * 100) : 50;
  const opponentPercent = 100 - challengerPercent;

  const filteredDuels = duels.filter((d) => {
    if (selectedCategory === 'all') return true;
    return d.category === selectedCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/90 p-0 sm:p-4 backdrop-blur-2xl animate-in fade-in duration-200 overflow-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[160] px-4 py-2.5 rounded-xl bg-slate-900/95 border border-white/15 text-white text-xs font-medium shadow-2xl backdrop-blur-xl flex items-center gap-2 pointer-events-none max-w-[90vw]">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Modal Shell */}
      <div className="relative w-full h-full sm:h-[90vh] sm:max-h-[860px] sm:max-w-5xl flex flex-col sm:rounded-3xl border-0 sm:border border-white/[0.10] bg-[#07090e] text-slate-200 shadow-2xl overflow-hidden">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-[#0b0e16] shrink-0 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
              <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  Live Battle Arena
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">
                Real-time camera streaming &amp; community-voted head-to-head battles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {viewMode === 'arena' ? (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setViewMode('lobby');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 text-xs font-medium text-slate-200 hover:text-white transition-all cursor-pointer"
              >
                <span>← All Streams</span>
              </button>
            ) : viewMode === 'create' ? (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setViewMode('lobby');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 text-xs font-medium text-slate-200 hover:text-white transition-all cursor-pointer"
              >
                <span>Cancel</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  playSound('pop');
                  setViewMode('create');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Video className="h-3.5 w-3.5 text-slate-950" />
                <span>+ Go Live</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Close arena"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: LOBBY (Real-Time Streams Discovery) */}
        {/* ======================================================== */}
        {viewMode === 'lobby' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 space-y-5 overscroll-contain">
            
            {/* Creator Studio Hero Banner */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-r from-slate-900/90 via-[#0d121c] to-slate-900/90 p-4 sm:p-5 overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative z-10 space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>Real-Time Video Arena</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Stream Live Split-Screen Challenges
                </h4>
                <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                  Broadcast live from your camera. Viewers vote in real-time to decide the champion, tip Cred directly, and award the prize pot.
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    setViewMode('create');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-950" />
                  <span>Launch Live Stream</span>
                </button>
              </div>
            </div>

            {/* Category Segmented Tabs */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] overflow-x-auto max-w-full">
                {CATEGORY_TABS.map((tab) => {
                  const isActive = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setSelectedCategory(tab.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-white text-slate-950 shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>{filteredDuels.length} active live duel{filteredDuels.length === 1 ? '' : 's'}</span>
              </div>
            </div>

            {/* Zero-Mock Stream State */}
            {filteredDuels.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Radio className="w-7 h-7 animate-pulse" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase">
                    No Live Battles Currently Broadcasting
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    All battles on DARE are 100% genuine live camera feeds. Be the first to start a split-screen match or invite community challengers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound('pop');
                    setViewMode('create');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Live Battle</span>
                </button>
              </div>
            ) : (
              /* Genuine Streams Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDuels.map((duel) => (
                  <div
                    key={duel.id}
                    className="rounded-2xl border border-white/[0.08] bg-[#0c0f17] hover:border-white/[0.18] transition-all duration-200 overflow-hidden flex flex-col group shadow-sm"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950 border-b border-white/[0.06]">
                      <div className="absolute inset-0 grid grid-cols-2">
                        <div className="relative h-full border-r border-white/[0.08] overflow-hidden flex items-center justify-center bg-gradient-to-b from-slate-900/60 to-black">
                          <img
                            src={duel.challenger.avatar}
                            alt={duel.challenger.name}
                            className="w-12 h-12 rounded-full object-cover border border-white/20 shadow-xl"
                          />
                          <div className="absolute bottom-2 inset-x-2 text-center">
                            <p className="text-xs font-semibold text-white truncate">{duel.challenger.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{duel.challenger.handle}</p>
                          </div>
                        </div>

                        <div className="relative h-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-slate-900/60 to-black">
                          <img
                            src={duel.opponent.avatar}
                            alt={duel.opponent.name}
                            className="w-12 h-12 rounded-full object-cover border border-white/20 shadow-xl"
                          />
                          <div className="absolute bottom-2 inset-x-2 text-center">
                            <p className="text-xs font-semibold text-white truncate">{duel.opponent.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{duel.opponent.handle}</p>
                          </div>
                        </div>
                      </div>

                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-md">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                          LIVE
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 capitalize">
                          {duel.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col justify-between flex-1 space-y-3 bg-[#0a0d14]">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="capitalize">{duel.category} Challenge</span>
                          <span className="font-mono text-amber-400 font-semibold">{duel.potCred} Cred Pot</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white tracking-tight">
                          {duel.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {duel.challengeBrief}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>In Progress</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            playSound('pop');
                            setActiveDuel(duel);
                            setViewMode('arena');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Watch</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: SPLIT-SCREEN LIVE ARENA (Mobile-Optimized) */}
        {/* ======================================================== */}
        {viewMode === 'arena' && activeDuel && (
          <div className="relative flex-1 flex flex-col overflow-hidden bg-black">
            
            {/* Top Match Header: Countdown & Momentum */}
            <div className="shrink-0 p-2.5 sm:p-3 bg-[#090b10] border-b border-white/[0.08] z-20">
              <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white text-xs font-mono">
                    <Eye className="h-3 w-3 text-slate-300" />
                    <span>{viewerCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/15 text-white font-mono text-xs">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-semibold">{formatTimer(timeLeft)}</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>+{activeDuel.potCred} CR</span>
                </div>
              </div>

              {/* Momentum Bar */}
              <div className="max-w-2xl mx-auto mt-2">
                <div className="flex justify-between items-center text-[10px] font-semibold text-white mb-0.5 px-0.5">
                  <span className="text-cyan-300 truncate max-w-[130px]">{activeDuel.challenger.name} ({challengerPercent}%)</span>
                  <span className="text-rose-300 truncate max-w-[130px]">({opponentPercent}%) {activeDuel.opponent.name}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-900 border border-white/10 overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300"
                    style={{ width: `${challengerPercent}%` }}
                  />
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${opponentPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Split Screen Video Grid: Responsive Side-by-Side (Mobile: h-48 sm:h-auto sm:flex-1) */}
            <div className="grid grid-cols-2 gap-2 p-2 sm:p-3 h-48 sm:h-auto sm:flex-1 shrink-0 overflow-hidden">
              
              {/* CHALLENGER TILE */}
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 border border-white/[0.10] flex flex-col justify-between">
                {currentUser.id === activeDuel.challenger.id && isCameraActive ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0f1422] to-[#06080d] p-2 text-center">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-indigo-500 shadow-xl">
                      <img
                        src={activeDuel.challenger.avatar}
                        alt={activeDuel.challenger.name}
                        className="w-full h-full rounded-full object-cover bg-slate-900"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 mt-1.5 font-semibold">Challenger</span>
                  </div>
                )}

                {/* Top overlay tag */}
                <div className="relative z-10 p-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-white bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded truncate max-w-[100px]">
                    {activeDuel.challenger.handle}
                  </span>
                </div>

                {/* Bottom action row: Name & Vote button */}
                <div className="relative z-10 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-1">
                  <p className="text-[11px] font-semibold text-white truncate max-w-[80px]">
                    {activeDuel.challenger.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleVote('challenger')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-md cursor-pointer active:scale-95 ${
                      hasVotedSide === 'challenger'
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-white hover:bg-slate-200 text-slate-950'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Vote ({challengerVotes})</span>
                  </button>
                </div>
              </div>

              {/* OPPONENT TILE */}
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 border border-white/[0.10] flex flex-col justify-between">
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#19111b] to-[#06080d] p-2 text-center">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 to-pink-500 shadow-xl">
                    <img
                      src={activeDuel.opponent.avatar}
                      alt={activeDuel.opponent.name}
                      className="w-full h-full rounded-full object-cover bg-slate-900"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-rose-300 mt-1.5 font-semibold">Contender</span>
                </div>

                {/* Top overlay tag */}
                <div className="relative z-10 p-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-white bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded truncate max-w-[100px]">
                    {activeDuel.opponent.handle}
                  </span>
                </div>

                {/* Bottom action row: Name & Vote button */}
                <div className="relative z-10 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-1">
                  <p className="text-[11px] font-semibold text-white truncate max-w-[80px]">
                    {activeDuel.opponent.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleVote('opponent')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-md cursor-pointer active:scale-95 ${
                      hasVotedSide === 'opponent'
                        ? 'bg-rose-500 text-white'
                        : 'bg-white hover:bg-slate-200 text-slate-950'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Vote ({opponentVotes})</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Floating Reactions Particle Layer */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {floatingReactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute text-2xl animate-bounce transition-all duration-1000 select-none drop-shadow-lg"
                  style={{
                    left: `${r.x}%`,
                    bottom: '22%',
                  }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* Dedicated Chat Stream Section (Clean Separation) */}
            <div className="flex-1 min-h-0 flex flex-col justify-end px-3 py-2 overflow-hidden bg-black/40">
              <div 
                ref={chatScrollRef}
                className="overflow-y-auto space-y-1.5 pr-1 max-h-36 sm:max-h-48"
              >
                {chatMessages.length === 0 ? (
                  <div className="text-center py-2 text-[11px] text-slate-500 font-mono">
                    Live chat active • Send a cheer or Cred tip to support creators!
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-xs px-2.5 py-1 rounded-xl backdrop-blur-xl max-w-sm flex items-start gap-2 ${
                        msg.isTip
                          ? 'bg-amber-500/20 border border-amber-400/40 text-amber-200'
                          : 'bg-white/[0.06] border border-white/10 text-white'
                      }`}
                    >
                      <img
                        src={msg.authorAvatar}
                        alt={msg.authorName}
                        className="w-4 h-4 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div className="leading-tight min-w-0">
                        <span className="font-semibold text-slate-300 mr-1 text-[11px]">
                          {msg.authorHandle}:
                        </span>
                        <span className={msg.isTip ? 'font-semibold text-amber-300' : 'text-slate-100'}>
                          {msg.text}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Stream Interaction Bar (Chat, Tips, Reactions) */}
            <div className="p-2 sm:p-3 bg-[#080a0f] border-t border-white/[0.08] shrink-0 z-30">
              
              {/* Quick Emojis & Tip Bar */}
              <div className="flex items-center justify-between gap-1.5 pb-2">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSendReaction(emoji)}
                      className="text-base p-1 hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('pop');
                      setShowTipMenu(!showTipMenu);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tip Cred</span>
                  </button>

                  {/* Camera & Mic toggles if challenger */}
                  {currentUser.id === activeDuel.challenger.id && (
                    <>
                      <button
                        type="button"
                        onClick={toggleCamera}
                        className={`p-1 rounded-lg border text-xs cursor-pointer ${
                          isCameraActive ? 'bg-white/10 border-white/20 text-white' : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        }`}
                        title="Toggle Camera"
                      >
                        {isCameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={toggleMic}
                        className={`p-1 rounded-lg border text-xs cursor-pointer ${
                          isMicActive ? 'bg-white/10 border-white/20 text-white' : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        }`}
                        title="Toggle Mic"
                      >
                        {isMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Chat with live audience..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  maxLength={160}
                  className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-40 text-slate-950 font-bold transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Tip Popover / Drawer */}
              {showTipMenu && (
                <div className="mt-2 p-3 rounded-xl bg-[#0e121d] border border-amber-500/30 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold">Support Streamer</span>
                    <span className="text-amber-400 font-mono font-semibold">Your Balance: {currentUser.cred} CR</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipTarget('challenger')}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center cursor-pointer ${
                        tipTarget === 'challenger'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-white/[0.03] border-white/10 text-slate-400'
                      }`}
                    >
                      {activeDuel.challenger.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipTarget('opponent')}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center cursor-pointer ${
                        tipTarget === 'opponent'
                          ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                          : 'bg-white/[0.03] border-white/10 text-slate-400'
                      }`}
                    >
                      {activeDuel.opponent.name}
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[25, 50, 100, 250].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSendTip(amt, '🚀')}
                        className="py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/25 text-amber-300 text-xs font-mono font-bold transition-all cursor-pointer text-center"
                      >
                        +{amt} CR
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: CREATE LIVE DUEL (Streamer Studio) */}
        {/* ======================================================== */}
        {viewMode === 'create' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
            <div className="max-w-2xl mx-auto space-y-5">
              
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Launch Live Video Battle
                </h4>
                <p className="text-xs text-slate-400">
                  Broadcast live from your camera. Challenge a peer or allow open community contenders.
                </p>
              </div>

              {/* Camera Preview */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center">
                {isCameraActive ? (
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">Camera preview inactive or permission denied</p>
                    <button
                      type="button"
                      onClick={() => startCamera(previewVideoRef.current)}
                      className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-white cursor-pointer"
                    >
                      Enable Camera
                    </button>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[11px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Ready to Stream</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateDuel} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Challenge Title &amp; Objective
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 100 Push-Up Speed Battle, 60s Freestyle Sketch"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={createCategory}
                      onChange={(e) => setCreateCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                    >
                      <option value="physical">Fitness &amp; Endurance</option>
                      <option value="creative">Creative &amp; Art</option>
                      <option value="tech">Skills &amp; Mind</option>
                      <option value="social">Social &amp; Interactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Match Stakes (Pot Cred)
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[50, 100, 250, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCreateStakes(amt)}
                          className={`py-2 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all ${
                            createStakes === amt
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {amt} CR
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Challenge Rules &amp; Verification Brief
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe specific rules, form requirements, and win conditions..."
                    value={createBrief}
                    onChange={(e) => setCreateBrief(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    <span>Entry stake: </span>
                    <span className="font-mono text-amber-400 font-semibold">{createStakes} Cred</span>
                  </div>

                  <button
                    type="submit"
                    disabled={!createTitle.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-40 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
                  >
                    <Radio className="w-4 h-4 text-rose-600" />
                    <span>Go Live Now</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
