import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Send, 
  Check 
} from 'lucide-react';
import { UserProfile, StoryItem } from '../types';
import { playSound } from '../utils/soundEffects';

export type { StoryItem };

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryItem[];
  initialIndex?: number;
  currentUser: UserProfile;
  onDeleteStory?: (storyId: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  onClose,
  stories,
  initialIndex = 0,
  currentUser,
  onDeleteStory,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState('');
  const [replySentMessage, setReplySentMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || isPaused || stories.length === 0) return;

    const interval = 50; // update every 50ms
    const totalTime = 6000; // 6 seconds per story
    const increment = (interval / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(c => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex, isPaused, stories.length, onClose]);

  useEffect(() => {
    setProgress(0);
    setReplySentMessage(null);
  }, [currentIndex]);

  if (!isOpen || stories.length === 0) return null;

  const currentStory = stories[currentIndex] || stories[0];
  const isLiked = liked[currentStory.id];
  const isOwner = currentUser?.id === currentStory.user?.id;
  const isVideo = currentStory.type === 'video' || (currentStory.mediaUrl && (currentStory.mediaUrl.endsWith('.mp4') || currentStory.mediaUrl.includes('video') || currentStory.mediaUrl.startsWith('data:video/')));

  const handleNext = () => {
    playSound('click');
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    playSound('click');
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
    }
  };

  const handleLike = () => {
    playSound('pop');
    setLiked(prev => ({ ...prev, [currentStory.id]: !prev[currentStory.id] }));
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    playSound('pop');
    setReplySentMessage(`Reply sent to ${currentStory.user.name}!`);
    setReplyText('');
    setTimeout(() => {
      setReplySentMessage(null);
    }, 2500);
  };

  const handleDelete = () => {
    if (onDeleteStory) {
      playSound('pop');
      onDeleteStory(currentStory.id);
      if (stories.length <= 1) {
        onClose();
      } else {
        handleNext();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-2 sm:p-4">
      
      {/* Top Action Buttons */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {isOwner && onDeleteStory && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-2.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 border border-rose-500/30 transition-colors cursor-pointer"
            title="Delete your story"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            playSound('click');
            onClose();
          }}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Close story"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation arrows (Desktop) */}
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentIndex === 0}
        className="hidden sm:flex absolute left-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 cursor-pointer transition-all"
        title="Previous story"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
        title="Next story"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Story Container (Facebook/Instagram style 9:16 card) */}
      <div 
        className="relative w-full max-w-sm h-full max-h-[85vh] sm:h-[820px] rounded-3xl bg-[#121620] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 select-none my-auto"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        
        {/* Top Progress Bars */}
        <div className="absolute top-0 inset-x-0 z-30 flex gap-1.5 p-3 bg-gradient-to-b from-black/80 to-transparent">
          {stories.map((st, idx) => (
            <div key={st.id} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Creator Header */}
        <div className="absolute top-5 inset-x-0 z-30 flex items-center justify-between px-4 pt-1">
          <div className="flex items-center gap-3">
            <img 
              src={currentStory.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt={currentStory.user?.name || 'User'} 
              className="h-9 w-9 rounded-full object-cover border border-white/20 shadow-md"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white shadow-sm">{currentStory.user?.name || 'Challenger'}</span>
                {currentStory.user?.isPro && (
                  <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-amber-400 text-slate-950">PRO</span>
                )}
                {isOwner && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-500/80 text-white">You</span>
                )}
              </div>
              <span className="text-[10px] text-slate-300 shadow-sm">{currentStory.user?.handle || ''} · Active now</span>
            </div>
          </div>

          {/* Sound toggle for Video */}
          {isVideo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Sticker Pill Overlay */}
        {currentStory.sticker && (
          <div className="absolute top-18 left-4 z-30 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-xl">
              {currentStory.sticker}
            </span>
          </div>
        )}

        {/* Story Media / Content Body */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          
          {/* VIDEO STORY */}
          {isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video 
                ref={videoRef}
                src={currentStory.mediaUrl}
                autoPlay
                playsInline
                loop
                muted={isMuted}
                className="w-full h-full object-cover"
              />
              {currentStory.text && (
                <div className="absolute bottom-20 inset-x-4 z-20 pointer-events-none">
                  <p className="px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md text-white text-xs font-semibold text-center border border-white/10 shadow-xl break-words">
                    {currentStory.text}
                  </p>
                </div>
              )}
            </div>
          ) : currentStory.mediaUrl ? (
            /* IMAGE STORY */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img 
                src={currentStory.mediaUrl} 
                alt="Story media" 
                className={`w-full h-full object-cover ${currentStory.filter || ''}`}
              />
              {currentStory.text && (
                <div className="absolute bottom-20 inset-x-4 z-20 pointer-events-none">
                  <p className="px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md text-white text-xs font-semibold text-center border border-white/10 shadow-xl break-words">
                    {currentStory.text}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* TEXT STORY ("Say / Post something") */
            <div className={`w-full h-full p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br ${currentStory.bgGradient || 'from-indigo-950 via-purple-950 to-slate-950'} text-white space-y-4`}>
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg">
                <Flame className="h-8 w-8 text-pink-400 animate-pulse" />
              </div>
              <p className={`text-base sm:text-lg leading-relaxed max-w-xs ${currentStory.fontStyle || 'font-sans font-bold'} text-white drop-shadow-md`}>
                {currentStory.text || `Checked in on daily challenge & banked active streak!` }
              </p>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-medium text-slate-200 border border-white/10">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>Level {currentStory.user?.level || 1} Challenger</span>
              </div>
            </div>
          )}

          {/* Tap zones for left/right navigation */}
          <div 
            className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          />
          <div 
            className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
          />
        </div>

        {/* Reply Feedback Banner */}
        {replySentMessage && (
          <div className="absolute bottom-20 inset-x-4 z-40 p-2.5 rounded-2xl bg-emerald-500/90 text-white text-xs font-bold flex items-center justify-center gap-2 backdrop-blur-md shadow-xl animate-fade-in">
            <Check className="w-4 h-4" />
            <span>{replySentMessage}</span>
          </div>
        )}

        {/* Bottom Interaction Footer */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center gap-3">
          <form onSubmit={handleSendReply} className="flex-1 relative">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${currentStory.user?.name || 'challenger'}...`}
              className="w-full rounded-full bg-white/10 border border-white/20 px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-white transition-colors pr-10"
            />
            {replyText.trim() && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-pink-500 text-white hover:bg-pink-400 transition-colors cursor-pointer"
              >
                <Send className="w-3 h-3" />
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={handleLike}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
              isLiked ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Like story"
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-white' : ''}`} />
          </button>
        </div>

      </div>
    </div>
  );
};
