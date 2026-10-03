import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Mic, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  FileText,
  Clock,
  AlertCircle,
  Coins
} from 'lucide-react';
import { DareItem, UserProfile, DareComment } from '../types';
import { playSound } from '../utils/soundEffects';

interface CommentsDrawerProps {
  dare: DareItem | null;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (dareId: string, commentText: string, isVoiceNote?: boolean, voiceDuration?: number) => void;
}

// Check for Web Speech Recognition API in current browser window
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = 
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition || 
    null;
  return SpeechRecognition;
};

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  dare,
  currentUser,
  isOpen,
  onClose,
  onAddComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Voice Recording State (Web Speech Recognition)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  // Voice Note Playback State (Web Speech Synthesis)
  const [playingCommentId, setPlayingCommentId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showTranscriptMap, setShowTranscriptMap] = useState<Record<string, boolean>>({});

  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Stop voice audio playback safely
  const stopVoicePlayback = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlayingCommentId(null);
    setIsPaused(false);
  };

  // Cancel Recording safely
  const handleCancelRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setVoiceTranscript('');
    setRecordingSeconds(0);
    setSpeechError(null);
  };

  // Stop recording & synthesis when drawer closes
  useEffect(() => {
    if (!isOpen) {
      handleCancelRecording();
      stopVoicePlayback();
    }
  }, [isOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop Recording and prepare voice note
  const handleStopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsRecording(false);
    playSound('click');
  };

  // Start Voice Recording with Web Speech API
  const handleStartRecording = () => {
    setSpeechError(null);
    setVoiceTranscript('');
    setRecordingSeconds(0);

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setSpeechError('Voice recording is not supported in this browser. You can still type your comment below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let accumulatedFinal = '';

      recognition.onstart = () => {
        setIsRecording(true);
        playSound('laser');
        
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => {
            if (prev >= 60) {
              handleStopRecording();
              return 60;
            }
            return prev + 1;
          });
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            accumulatedFinal += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const combined = (accumulatedFinal + interim).trim();
        setVoiceTranscript(combined);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in browser settings.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice capture note: ${event.error}. You can still type or edit manually.`);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Could not initialize audio recording. Please type your comment.');
    }
  };

  // Submit Voice Note as Comment
  const handleSendVoiceNote = async () => {
    if (!dare) return;
    const textToSend = voiceTranscript.trim() || '🎙️ [Voice Memo Recorded]';
    const duration = Math.max(1, recordingSeconds);

    setIsSubmitting(true);
    playSound('laser');
    try {
      await onAddComment(dare.id, textToSend, true, duration);
      handleCancelRecording();
      setCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Standard Text Comment
  const handleSubmitText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dare || !commentText.trim()) return;

    setIsSubmitting(true);
    playSound('click');
    try {
      await onAddComment(dare.id, commentText.trim(), false);
      setCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Play Voice Note Comment using Web Speech Synthesis
  const handlePlayVoiceComment = (comment: DareComment) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    if (playingCommentId === comment.id) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    window.speechSynthesis.cancel();
    playSound('click');

    const cleanText = comment.text.replace(/^🎙️\s*\[.*?\]\s*/, '').trim() || comment.text;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setPlayingCommentId(comment.id);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setPlayingCommentId(null);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setPlayingCommentId(null);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleTranscript = (commentId: string) => {
    setShowTranscriptMap(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !dare) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="comments-drawer-container"
        className="relative flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0A0D14] p-5 sm:p-6 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-white shrink-0">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight truncate">
                  Discussion
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  · {dare.comments.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Community thoughts and voice notes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dare Preview Banner */}
        <div className="mt-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-xs shrink-0 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-semibold text-white capitalize">{dare.category || 'Challenge'}</span>
            <span className="text-amber-400 font-mono font-semibold flex items-center gap-1">
              <Coins className="h-3 w-3" />
              <span>+{dare.rewardCred} Cred</span>
            </span>
          </div>
          <p className="font-semibold text-slate-100 line-clamp-1 leading-snug">{dare.title}</p>
        </div>

        {/* Comment Stream */}
        <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1 min-h-0 overscroll-contain">
          {dare.comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-center text-slate-400 text-xs p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-slate-400 mb-3">
                <MessageSquare className="h-5 w-5" />
              </div>
              <p className="font-semibold text-white text-sm">No comments yet</p>
              <p className="mt-1 text-slate-400 text-xs max-w-[240px] leading-relaxed">
                Be the first to share tips, encouragement, or record a quick voice note.
              </p>
            </div>
          ) : (
            dare.comments.map((c) => {
              const isPlaying = playingCommentId === c.id;
              const isVoice = c.isVoiceNote || c.text.includes('🎙️');
              const showTranscript = showTranscriptMap[c.id];

              return (
                <div
                  key={c.id}
                  id={`comment-${c.id}`}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-xs transition-colors hover:border-white/[0.15]"
                >
                  {/* Author & Timestamp */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={c.avatar}
                        alt={c.userName}
                        className="h-6 w-6 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-white truncate max-w-[140px]">
                          {c.userName || c.userHandle}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {c.userHandle}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {c.timestamp}
                    </span>
                  </div>

                  {/* Voice Note Audio Player UI */}
                  {isVoice ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/40 p-3">
                        {/* Play/Pause Button */}
                        <button
                          type="button"
                          onClick={() => handlePlayVoiceComment(c)}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                            isPlaying
                              ? 'bg-white text-slate-950 shadow-sm'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                          aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
                        >
                          {isPlaying && !isPaused ? (
                            <Pause className="h-4 w-4 fill-current" />
                          ) : (
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                          )}
                        </button>

                        {/* Audio Waveform & Status */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                            <span className="flex items-center gap-1.5 font-medium text-slate-300">
                              <Volume2 className="h-3.5 w-3.5 text-slate-400" />
                              <span>{isPlaying ? (isPaused ? 'Paused' : 'Playing Voice Note') : 'Voice Memo'}</span>
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {c.voiceDuration ? `${c.voiceDuration}s` : 'Audio'}
                            </span>
                          </div>

                          {/* Minimalist Waveform Bars */}
                          <div className="flex items-center gap-1 h-3.5">
                            {[40, 75, 55, 90, 60, 80, 45, 100, 70, 85, 50, 95, 65, 40, 85, 60].map((heightPct, idx) => (
                              <div
                                key={idx}
                                className={`flex-1 rounded-full transition-all duration-150 ${
                                  isPlaying && !isPaused
                                    ? 'bg-white animate-pulse'
                                    : 'bg-white/20'
                                }`}
                                style={{
                                  height: isPlaying && !isPaused ? `${Math.max(25, (heightPct * ((idx % 3) + 1)) % 100)}%` : `${heightPct * 0.4}%`,
                                  animationDelay: `${idx * 75}ms`
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Stop button when active */}
                        {isPlaying && (
                          <button
                            type="button"
                            onClick={stopVoicePlayback}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] shrink-0 cursor-pointer"
                            aria-label="Stop playback"
                          >
                            <Square className="h-3.5 w-3.5 fill-current" />
                          </button>
                        )}
                      </div>

                      {/* Transcript Toggle */}
                      <div className="flex items-center justify-between px-1">
                        <button
                          type="button"
                          onClick={() => toggleTranscript(c.id)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <FileText className="h-3 w-3" />
                          <span>{showTranscript ? 'Hide transcript' : 'View transcript'}</span>
                        </button>
                      </div>

                      {/* Transcribed Text Display */}
                      {showTranscript && (
                        <p className="rounded-lg border border-white/[0.08] bg-black/40 p-2.5 text-slate-300 text-xs leading-relaxed break-words">
                          {c.text.replace(/^🎙️\s*\[.*?\]\s*/, '')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-200 leading-relaxed text-xs break-words mt-1">
                      {c.text}
                    </p>
                  )}
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Recording HUD Overlay */}
        {isRecording && (
          <div className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 shadow-xl animate-in slide-in-from-bottom duration-200 shrink-0 space-y-3">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-semibold text-rose-300">
                  Recording Voice Note
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-500/30">
                <Clock className="h-3 w-3" />
                <span>{formatSeconds(recordingSeconds)} / 01:00</span>
              </div>
            </div>

            {/* Live Visualizer Wave */}
            <div className="flex items-center justify-center gap-1 h-6 bg-black/40 rounded-xl p-1.5 border border-white/[0.06]">
              {[30, 80, 50, 100, 70, 90, 40, 85, 60, 95, 45, 100, 65, 80, 55, 90, 35, 75].map((val, i) => (
                <div
                  key={i}
                  className="flex-1 bg-rose-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.max(25, (val + (recordingSeconds * 10)) % 100)}%`,
                    animationDelay: `${i * 60}ms`,
                    animationDuration: '600ms'
                  }}
                />
              ))}
            </div>

            {/* Live Dictation Preview */}
            <div className="rounded-xl border border-white/[0.08] bg-black/40 p-2.5 text-xs">
              <p className="text-slate-300 min-h-[30px] italic break-words leading-relaxed">
                {voiceTranscript ? `"${voiceTranscript}"` : 'Listening... speak clearly into your microphone.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelRecording}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/40 transition-colors cursor-pointer"
                >
                  <Square className="h-3 w-3 fill-current" />
                  <span>Stop</span>
                </button>

                <button
                  type="button"
                  id="send-voice-note-btn"
                  onClick={handleSendVoiceNote}
                  disabled={isSubmitting || recordingSeconds < 1}
                  className="flex items-center gap-1.5 rounded-lg bg-white text-slate-950 px-3.5 py-1.5 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                >
                  <Send className="h-3 w-3" />
                  <span>Send Voice Note</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {speechError && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="flex-1 min-w-0">
              <p className="leading-tight">{speechError}</p>
            </div>
            <button
              type="button"
              onClick={() => setSpeechError(null)}
              className="text-amber-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        {!isRecording && (
          <form onSubmit={handleSubmitText} className="mt-3.5 border-t border-white/[0.08] pt-3.5 shrink-0">
            <div className="flex items-center gap-2">
              {/* Mic Trigger Button */}
              <button
                type="button"
                id="record-voice-comment-btn"
                onClick={handleStartRecording}
                title="Record voice note"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white transition-all shrink-0 cursor-pointer"
              >
                <Mic className="h-4 w-4" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                id="comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment or tap mic..."
                className="flex-1 min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-white/30 focus:outline-none transition-colors"
              />

              {/* Submit Button */}
              <button
                type="submit"
                id="send-comment-btn"
                disabled={isSubmitting || !commentText.trim()}
                className="flex h-10 items-center justify-center rounded-xl bg-white px-4 text-slate-950 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors shrink-0 cursor-pointer shadow-sm"
                title="Send comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
