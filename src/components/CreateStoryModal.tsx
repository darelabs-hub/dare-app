import React, { useState, useRef } from 'react';
import { 
  X, 
  Type, 
  Image as ImageIcon, 
  Video, 
  Upload, 
  Sparkles, 
  Check, 
  Smile, 
  Palette, 
  Volume2, 
  VolumeX, 
  Flame, 
  Zap, 
  Crown, 
  Target, 
  Trophy, 
  RotateCcw,
  Send
} from 'lucide-react';
import { UserProfile, StoryItem } from '../types';
import { playSound } from '../utils/soundEffects';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onPublishStory: (newStory: StoryItem) => void;
}

type StoryMode = 'text' | 'image' | 'video';

const GRADIENT_PRESETS = [
  { id: 'cyber', name: 'Cyber Neon', class: 'from-purple-950 via-indigo-950 to-pink-900', textClass: 'text-white' },
  { id: 'sunset', name: 'Sunset Glow', class: 'from-rose-900 via-pink-800 to-amber-700', textClass: 'text-white' },
  { id: 'ocean', name: 'Electric Cyan', class: 'from-cyan-950 via-blue-950 to-indigo-950', textClass: 'text-white' },
  { id: 'obsidian', name: 'Obsidian Noir', class: 'from-slate-950 via-zinc-900 to-neutral-950', textClass: 'text-white' },
  { id: 'emerald', name: 'Matrix Emerald', class: 'from-emerald-950 via-teal-950 to-cyan-950', textClass: 'text-emerald-200' },
  { id: 'magenta', name: 'Hot Pink', class: 'from-fuchsia-950 via-pink-900 to-rose-950', textClass: 'text-pink-100' },
  { id: 'solar', name: 'Solar Flame', class: 'from-amber-950 via-orange-900 to-red-950', textClass: 'text-amber-100' },
];

const FONT_STYLES = [
  { id: 'sans', name: 'Modern', class: 'font-sans font-extrabold tracking-tight' },
  { id: 'bold', name: 'Poster', class: 'font-black uppercase tracking-wider' },
  { id: 'neon', name: 'Neon', class: 'font-mono uppercase font-black tracking-widest drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]' },
  { id: 'typewriter', name: 'Mono', class: 'font-mono font-medium' },
  { id: 'serif', name: 'Serif', class: 'font-serif italic font-bold' },
];

const STICKER_PRESETS = [
  { id: 'streak', label: '🔥 Hot Streak', icon: '🔥' },
  { id: 'ready', label: '⚡ Dare Accepted', icon: '⚡' },
  { id: 'challenger', label: '👑 Challenger', icon: '👑' },
  { id: 'dareme', label: '🎯 Dare Me', icon: '🎯' },
  { id: 'beast', label: '🥊 Beast Mode', icon: '🥊' },
  { id: 'levelup', label: '🚀 Level Up', icon: '🚀' },
  { id: 'winner', label: '🏆 Verified Proof', icon: '🏆' },
  { id: 'locked', label: '💯 Locked In', icon: '💯' },
];

const PHOTO_FILTERS = [
  { id: 'normal', name: 'Original', class: '' },
  { id: 'cyber', name: 'Cyberpunk', class: 'contrast-125 saturate-150 hue-rotate-15' },
  { id: 'warm', name: 'Golden Hour', class: 'sepia-[0.25] brightness-105 saturate-125' },
  { id: 'noir', name: 'B&W Noir', class: 'grayscale contrast-125' },
  { id: 'vivid', name: 'Vivid Glow', class: 'contrast-110 saturate-200' },
];

const TEXT_PROMPTS = [
  "Just accepted today's dare! Who's stepping up next? ⚡",
  "Crushed my 7-day challenge streak! 🔥",
  "Drop a wild dare for me in the comments 👇",
  "Out here training for the next 1v1 duel 🥊",
  "Locked in on the daily viral mission 🎯",
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPublishStory,
}) => {
  const [mode, setMode] = useState<StoryMode>('text');
  
  // Text Mode State
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].class);
  const [selectedFont, setSelectedFont] = useState(FONT_STYLES[0].class);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(STICKER_PRESETS[0].label);

  // Photo Mode State
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFilter, setPhotoFilter] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  // Video Mode State
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoCaption, setVideoCaption] = useState('');
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image size exceeds 15MB. Please choose a smaller image.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoUrl(event.target.result);
        playSound('pop');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video clip (MP4, WebM, MOV).');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Video clip size exceeds 50MB. Please select a shorter clip.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setVideoUrl(event.target.result);
        playSound('pop');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    // Validation
    if (mode === 'text' && !textContent.trim()) {
      setUploadError('Please enter something to post in your story.');
      return;
    }

    if (mode === 'image' && !photoUrl) {
      setUploadError('Please upload a photo or choose a preset.');
      return;
    }

    if (mode === 'video' && !videoUrl) {
      setUploadError('Please select a short video clip.');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);
    playSound('pop');

    try {
      const newStory: StoryItem = {
        id: `story_${currentUser.id}_${Date.now()}`,
        user: currentUser,
        type: mode,
        text: mode === 'text' ? textContent.trim() : (mode === 'image' ? photoCaption.trim() : videoCaption.trim()),
        mediaUrl: mode === 'image' ? (photoUrl || undefined) : mode === 'video' ? (videoUrl || undefined) : undefined,
        bgGradient: mode === 'text' ? selectedGradient : undefined,
        fontStyle: selectedFont,
        sticker: selectedSticker || undefined,
        filter: mode === 'image' ? photoFilter : undefined,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      onPublishStory(newStory);
      playSound('levelUp');
      onClose();
    } catch (_err) {
      setUploadError('Failed to publish story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-[#0b0e14] border border-slate-800 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col md:flex-row my-auto">
        
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={() => {
            playSound('click');
            onClose();
          }}
          className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          title="Close story creator"
        >
          <X className="h-5 w-5" />
        </button>

        {/* LEFT COLUMN: Vertical 9:16 Live Phone Preview */}
        <div className="w-full md:w-[380px] p-4 sm:p-6 bg-[#07090e] border-b md:border-b-0 md:border-r border-slate-800/80 flex flex-col items-center justify-center">
          <div className="text-center mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
              Live Preview
            </span>
          </div>

          {/* 9:16 Canvas Phone Frame */}
          <div className="relative w-[260px] sm:w-[280px] h-[460px] sm:h-[490px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-black flex flex-col select-none">
            
            {/* Top Story Header in Preview */}
            <div className="absolute top-0 inset-x-0 z-20 p-3 pt-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt={currentUser.name} 
                  className="w-7 h-7 rounded-full object-cover border border-white/30"
                />
                <div className="leading-tight">
                  <p className="text-[11px] font-bold text-white leading-none">{currentUser.name}</p>
                  <p className="text-[9px] text-pink-400 font-medium">Your Story · Just now</p>
                </div>
              </div>
              <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                24h
              </span>
            </div>

            {/* Sticker Badge if active */}
            {selectedSticker && (
              <div className="absolute top-14 left-3 z-20 animate-bounce duration-1000">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg">
                  {selectedSticker}
                </span>
              </div>
            )}

            {/* PREVIEW CONTENT */}
            <div className="relative w-full h-full flex-1 flex items-center justify-center overflow-hidden">
              
              {/* MODE 1: TEXT PREVIEW */}
              {mode === 'text' && (
                <div className={`w-full h-full p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br ${selectedGradient} transition-colors duration-300`}>
                  <p className={`text-base sm:text-lg leading-snug break-words max-w-full ${selectedFont} text-white drop-shadow-md`}>
                    {textContent || 'Tap to type your story update, dare reflection, or challenge shoutout...'}
                  </p>
                </div>
              )}

              {/* MODE 2: PHOTO PREVIEW */}
              {mode === 'image' && (
                <div className="w-full h-full relative bg-slate-900 flex items-center justify-center overflow-hidden">
                  {photoUrl ? (
                    <>
                      <img 
                        src={photoUrl} 
                        alt="Story preview" 
                        className={`w-full h-full object-cover ${photoFilter}`}
                      />
                      {photoCaption && (
                        <div className="absolute bottom-4 inset-x-3 z-20">
                          <p className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-medium text-center border border-white/10 shadow-lg break-words">
                            {photoCaption}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400">
                      <ImageIcon className="h-10 w-10 text-slate-500 stroke-[1.5]" />
                      <p className="text-xs font-medium">Select or upload a photo to preview</p>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: VIDEO PREVIEW */}
              {mode === 'video' && (
                <div className="w-full h-full relative bg-slate-900 flex items-center justify-center overflow-hidden">
                  {videoUrl ? (
                    <>
                      <video 
                        src={videoUrl} 
                        autoPlay 
                        loop 
                        muted={isVideoMuted}
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setIsVideoMuted(!isVideoMuted)}
                        className="absolute bottom-12 right-3 z-20 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors cursor-pointer"
                        title={isVideoMuted ? "Unmute" : "Mute"}
                      >
                        {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      {videoCaption && (
                        <div className="absolute bottom-4 inset-x-3 z-20">
                          <p className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-medium text-center border border-white/10 shadow-lg break-words">
                            {videoCaption}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400">
                      <Video className="h-10 w-10 text-slate-500 stroke-[1.5]" />
                      <p className="text-xs font-medium">Upload a short clip to preview</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom preview footer hint */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* RIGHT COLUMN: Controls & Creator Studio */}
        <div className="flex-1 p-5 sm:p-7 flex flex-col justify-between space-y-6">
          
          <div>
            {/* Header Title */}
            <div className="mb-4 pr-10">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Create Story</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Social
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Post an update, upload media, or share your challenge progress like Instagram & Facebook stories.
              </p>
            </div>

            {/* MODE SELECTOR TABS: Say Something | Photo | Video */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.08] mb-6">
              
              {/* Say Something */}
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setMode('text');
                  setUploadError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'text'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Text Story</span>
              </button>

              {/* Upload Photo */}
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setMode('image');
                  setUploadError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'image'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Upload Photo</span>
              </button>

              {/* Short Clip */}
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setMode('video');
                  setUploadError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'video'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Short Clip</span>
              </button>
            </div>

            {/* TAB CONTENT */}

            {/* 1. TEXT STORY ("Say / Post Something") */}
            {mode === 'text' && (
              <div className="space-y-4">
                {/* Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>What's on your mind?</span>
                    <span className="text-[11px] text-slate-500 font-normal">{textContent.length}/200 chars</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={200}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Type a thought, challenge update, or brag about your streak..."
                    className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all resize-none"
                  />
                </div>

                {/* Quick Inspiration Pills */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 mb-1.5 block">Quick Prompts:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {TEXT_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          playSound('pop');
                          setTextContent(prompt);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-pink-500/40 text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
                      >
                        {prompt.slice(0, 32)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Gradient Palette */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-pink-400" />
                    <span>Story Background</span>
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {GRADIENT_PRESETS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setSelectedGradient(g.class);
                        }}
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g.class} shrink-0 border-2 transition-transform cursor-pointer flex items-center justify-center ${
                          selectedGradient === g.class ? 'border-white scale-110 shadow-md shadow-pink-500/30' : 'border-slate-700 hover:scale-105'
                        }`}
                        title={g.name}
                      >
                        {selectedGradient === g.class && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Font Vibe */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Typography Style
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {FONT_STYLES.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setSelectedFont(f.class);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selectedFont === f.class 
                            ? 'bg-pink-500 text-white border-pink-400 shadow-md shadow-pink-500/25' 
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. PHOTO STORY ("Upload Photo") */}
            {mode === 'image' && (
              <div className="space-y-4">
                
                {/* Upload Trigger / Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Upload Your Photo</span>
                    <span className="text-[11px] text-slate-500">Supports PNG, JPG, WEBP</span>
                  </label>

                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageFileChange} 
                    className="hidden" 
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 hover:from-pink-500/20 hover:to-purple-500/20 border border-pink-500/30 hover:border-pink-500/60 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                    >
                      <Upload className="w-4 h-4 text-pink-400" />
                      <span>{photoUrl ? 'Change Selected Photo' : 'Choose File from Device'}</span>
                    </button>

                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          playSound('pop');
                          setPhotoUrl(null);
                        }}
                        className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Photo Filters */}
                {photoUrl && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Photo Filter
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {PHOTO_FILTERS.map((fil) => (
                        <button
                          key={fil.id}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setPhotoFilter(fil.class);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border shrink-0 transition-all cursor-pointer ${
                            photoFilter === fil.class
                              ? 'bg-pink-500 text-white border-pink-400'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {fil.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Caption */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Caption (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="Add a caption to overlay on your photo..."
                    className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* 3. VIDEO STORY ("Upload Short Clip") */}
            {mode === 'video' && (
              <div className="space-y-4">
                
                {/* Video Upload Trigger */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Upload Short Video Clip</span>
                    <span className="text-[11px] text-slate-500">MP4, WebM, MOV (Max 50MB)</span>
                  </label>

                  <input 
                    ref={videoInputRef}
                    type="file" 
                    accept="video/*" 
                    onChange={handleVideoFileChange} 
                    className="hidden" 
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 hover:from-pink-500/20 hover:to-purple-500/20 border border-pink-500/30 hover:border-pink-500/60 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                    >
                      <Video className="w-4 h-4 text-pink-400" />
                      <span>{videoUrl ? 'Change Selected Clip' : 'Upload Video Clip'}</span>
                    </button>

                    {videoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          playSound('pop');
                          setVideoUrl(null);
                        }}
                        className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove video"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Caption */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Clip Caption (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={videoCaption}
                    onChange={(e) => setVideoCaption(e.target.value)}
                    placeholder="Describe your dare clip or challenge..."
                    className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* STICKER / MOOD BADGE (Available in all modes) */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-pink-400" />
                  <span>Sticker / Vibe Badge</span>
                </label>
                {selectedSticker && (
                  <button
                    type="button"
                    onClick={() => setSelectedSticker(null)}
                    className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    Remove sticker
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {STICKER_PRESETS.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      playSound('pop');
                      setSelectedSticker(selectedSticker === st.label ? null : st.label);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
                      selectedSticker === st.label
                        ? 'bg-pink-500 text-white border-pink-400 shadow-md shadow-pink-500/25'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium animate-shake">
                {uploadError}
              </div>
            )}
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Visible for 24 hours to your friends & community</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sharing Story...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Share to Your Story</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
