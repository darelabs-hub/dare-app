import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Radio, 
  Sparkles, 
  AlertCircle,
  FileText,
  Clock
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
      setSpeechError('Web Speech Recognition is not supported by your browser. You can still type your cyber comment below!');
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
        
        // Start Timer
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => {
            if (prev >= 60) {
              // Auto stop at 60s max
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
        console.warn('Web Speech Recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // Keep listening or gently inform
        } else {
          setSpeechError(`Speech capture notice: ${event.error}. You can still transmit or edit manually.`);
        }
      };

      recognition.onend = () => {
        // Only mark stopped if user didn't intentionally keep it
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Could not initialize audio capture. Please try typing your transmission.');
    }
  };

  // Submit Voice Note as Comment
  const handleSendVoiceNote = async () => {
    if (!dare) return;
    const textToSend = voiceTranscript.trim() || '🎙️ [Voice Audio Transmission Recorded]';
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
      alert('Web Speech Synthesis is not supported in this environment.');
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

    // Stop any existing playback
    window.speechSynthesis.cancel();
    playSound('click');

    const cleanText = comment.text.replace(/^🎙️\s*\[.*?\]\s*/, '').trim() || comment.text;
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Give it a sleek cyberpunk cadence
    utterance.rate = 1.02;
    utterance.pitch = 1.05;

    // Pick an English voice if available
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

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="comments-drawer-container"
        className="relative flex h-full w-full max-w-md flex-col border-l border-cyan-500/30 bg-[#0a0d14] p-4 sm:p-6 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-tech text-base sm:text-lg font-bold text-white tracking-wide truncate">
                  TRANSMISSIONS & VOICENOTES
                </h2>
                <span className="rounded-full bg-cyan-950/80 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/30 shrink-0">
                  {dare.comments.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                Voice logs, crowd reactions & telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white shrink-0 ml-2 cursor-pointer transition-colors"
            title="Close Drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dare Preview Banner */}
        <div className="mt-3 rounded-xl border border-slate-800/90 bg-slate-900/60 p-3 text-xs shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-cyan-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Radio className="h-3 w-3" />
              <span>Target Dare Subject</span>
            </span>
            <span className="font-mono text-[10px] text-amber-400 font-bold">
              +{dare.rewardCred} CRED
            </span>
          </div>
          <p className="font-bold text-slate-100 line-clamp-1 mt-0.5">{dare.title}</p>
        </div>

        {/* Comment Stream */}
        <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1 min-h-0">
          {dare.comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 text-cyan-400 mb-2.5">
                <Mic className="h-6 w-6 opacity-60 animate-pulse" />
              </div>
              <span className="font-bold text-slate-300">No transmissions broadcasted yet</span>
              <span className="mt-1 text-slate-500 text-[11px] max-w-[220px]">
                Be the first to leave text or tap the mic icon to record a cyber voice note!
              </span>
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
                  className={`rounded-xl border p-3 text-xs transition-all ${
                    isVoice
                      ? 'border-cyan-500/40 bg-gradient-to-b from-[#0e1626] to-[#090e18] shadow-md'
                      : 'border-slate-800/80 bg-[#07090e]'
                  }`}
                >
                  {/* Author & Timestamp */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={c.avatar}
                        alt={c.userName}
                        className="h-6 w-6 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
                      />
                      <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-cyan-300 truncate max-w-[130px]">
                          {c.userHandle}
                        </span>
                        {isVoice && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-950 border border-cyan-400/40 px-2 py-0.2 text-[9px] font-mono font-bold text-cyan-300">
                            <Mic className="h-2.5 w-2.5 text-cyan-400" />
                            <span>VOICE NOTE</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {c.timestamp}
                    </span>
                  </div>

                  {/* Voice Note Audio Player UI */}
                  {isVoice ? (
                    <div className="mt-1.5 space-y-2">
                      <div className="flex items-center gap-2.5 rounded-xl border border-cyan-500/30 bg-[#05080e] p-2.5">
                        {/* Play/Pause Button */}
                        <button
                          type="button"
                          onClick={() => handlePlayVoiceComment(c)}
                          title={isPlaying ? (isPaused ? 'Resume Voice Note' : 'Pause Voice Note') : 'Play Voice Note'}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                            isPlaying
                              ? 'bg-pink-500 text-white shadow-[0_0_12px_#ec4899]'
                              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          }`}
                        >
                          {isPlaying && !isPaused ? (
                            <Pause className="h-4 w-4 fill-current" />
                          ) : (
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                          )}
                        </button>

                        {/* Equalizer Frequency Waves / Scrub Line */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 mb-1">
                            <span className="flex items-center gap-1">
                              <Volume2 className="h-3 w-3 text-cyan-400" />
                              <span>{isPlaying ? (isPaused ? 'Paused' : 'Broadcasting Audio') : 'Voice Transmission'}</span>
                            </span>
                            <span className="text-slate-400">
                              {c.voiceDuration ? `${c.voiceDuration}s` : 'Audio Log'}
                            </span>
                          </div>

                          {/* Dynamic Waveform Bars */}
                          <div className="flex items-center gap-1 h-4">
                            {[40, 75, 55, 90, 60, 80, 45, 100, 70, 85, 50, 95, 65, 40, 85, 60].map((heightPct, idx) => (
                              <div
                                key={idx}
                                className={`flex-1 rounded-full transition-all duration-150 ${
                                  isPlaying && !isPaused
                                    ? 'bg-gradient-to-t from-cyan-400 to-pink-500 animate-pulse'
                                    : 'bg-slate-700/80'
                                }`}
                                style={{
                                  height: isPlaying && !isPaused ? `${Math.max(20, (heightPct * ((idx % 3) + 1)) % 100)}%` : `${heightPct * 0.4}%`,
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
                            title="Stop Audio"
                            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0 cursor-pointer"
                          >
                            <Square className="h-3.5 w-3.5 fill-current text-slate-400" />
                          </button>
                        )}
                      </div>

                      {/* Transcript Toggle */}
                      <div className="flex items-center justify-between px-1">
                        <button
                          type="button"
                          onClick={() => toggleTranscript(c.id)}
                          className="flex items-center gap-1 text-[10px] font-mono text-cyan-400/90 hover:text-cyan-300 underline cursor-pointer"
                        >
                          <FileText className="h-2.5 w-2.5" />
                          <span>{showTranscript ? 'Hide Speech Transcript' : 'View Speech Transcript'}</span>
                        </button>
                      </div>

                      {/* Transcribed Text Display */}
                      {showTranscript && (
                        <p className="rounded-lg border border-slate-800 bg-[#06080d] p-2 text-slate-300 font-mono text-[11px] leading-relaxed break-words animate-in fade-in duration-150">
                          {c.text.replace(/^🎙️\s*\[.*?\]\s*/, '')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-200 leading-relaxed font-mono text-[11px] break-words">
                      {c.text}
                    </p>
                  )}
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Recording HUD Overlay (Active during Web Speech recording) */}
        {isRecording && (
          <div className="mt-3 rounded-2xl border border-pink-500/50 bg-[#0f0a14] p-3.5 shadow-xl animate-in slide-in-from-bottom duration-200 shrink-0">
            <div className="flex items-center justify-between border-b border-pink-500/30 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-pink-500 animate-ping" />
                <span className="font-tech text-xs font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1">
                  <span>RECORDING LIVE TRANSMISSION</span>
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-pink-400 bg-pink-950/60 px-2 py-0.5 rounded-lg border border-pink-500/40">
                <Clock className="h-3 w-3" />
                <span>{formatSeconds(recordingSeconds)} / 01:00</span>
              </div>
            </div>

            {/* Live Visualizer Wave */}
            <div className="flex items-center justify-center gap-1 h-6 my-2 bg-black/40 rounded-xl p-1.5 border border-pink-500/20">
              {[30, 80, 50, 100, 70, 90, 40, 85, 60, 95, 45, 100, 65, 80, 55, 90, 35, 75].map((val, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-pink-600 to-rose-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.max(25, (val + (recordingSeconds * 10)) % 100)}%`,
                    animationDelay: `${i * 60}ms`,
                    animationDuration: '600ms'
                  }}
                />
              ))}
            </div>

            {/* Live Speech Recognition Transcript Preview */}
            <div className="mt-2 rounded-xl border border-slate-800 bg-[#07090e] p-2.5 text-xs">
              <span className="text-[10px] font-mono text-slate-500 block mb-1">
                Real-Time Voice Dictation Stream:
              </span>
              <p className="font-mono text-slate-200 min-h-[32px] text-[11px] italic break-words">
                {voiceTranscript ? `"${voiceTranscript}"` : 'Speak into your microphone... audio is converting to cyber transmission in real time.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCancelRecording}
                className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="flex items-center gap-1 rounded-xl border border-pink-500/40 bg-pink-950/40 px-3 py-1.5 text-xs font-semibold text-pink-300 hover:bg-pink-900/50 transition-colors cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop</span>
                </button>

                <button
                  type="button"
                  id="send-voice-note-btn"
                  onClick={handleSendVoiceNote}
                  disabled={isSubmitting || recordingSeconds < 1}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Transmit Voice Note</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification Alert */}
        {speechError && (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-950/30 p-2.5 text-xs text-amber-300 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] leading-tight">{speechError}</p>
            </div>
            <button
              onClick={() => setSpeechError(null)}
              className="text-amber-400 hover:text-white p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Input Bar with Voice Mic Button */}
        {!isRecording && (
          <form onSubmit={handleSubmitText} className="mt-3 border-t border-slate-800 pt-3 shrink-0">
            <div className="flex items-center gap-2">
              {/* Mic Trigger Button for Web Speech Voice Note */}
              <button
                type="button"
                id="record-voice-comment-btn"
                onClick={handleStartRecording}
                title="Record Web Speech Voice Note"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-500/40 bg-pink-950/30 text-pink-300 hover:border-pink-400 hover:bg-pink-900/50 hover:text-white transition-all shrink-0 cursor-pointer shadow-[0_0_10px_rgba(236,72,153,0.2)]"
              >
                <Mic className="h-4.5 w-4.5" />
              </button>

              {/* Text Input Field */}
              <input
                type="text"
                id="comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Speak via mic or type comment...`}
                className="flex-1 min-w-0 rounded-xl border border-slate-800 bg-[#07090e] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
              />

              {/* Text Submit Button */}
              <button
                type="submit"
                id="send-comment-btn"
                disabled={isSubmitting || !commentText.trim()}
                className="flex h-10 items-center justify-center rounded-xl bg-cyan-500 px-4 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-40 transition-colors shrink-0 cursor-pointer glow-cyan"
                title="Send text comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-pink-400" />
                <span>Web Speech API Voice Notes Active</span>
              </span>
              <span>Hold/Tap Mic to Record</span>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
