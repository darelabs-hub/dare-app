import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  Image as ImageIcon, 
  Send, 
  Trash2, 
  Flame, 
  X, 
  ExternalLink, 
  MessageCircle, 
  RefreshCw, 
  Play, 
  Maximize2, 
  AlertCircle, 
  Link2,
  Loader2
} from 'lucide-react';
import { SocialFeedPost, UserProfile, DareItem } from '../types';
import { playSound } from '../utils/soundEffects';
import { fetchWithRetry } from '../utils/api';
import { isVideoMedia } from '../utils/mediaHelper';
import { compressImage } from '../utils/imageCompressor';

/**
 * Human-friendly relative timestamp
 */
const formatPostTime = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 7 * 86400) return `${Math.floor(diffSec / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * High-performance avatar with native lazy-loading, aspect-square container, and graceful fallback
 */
interface LazyAvatarProps {
  src?: string;
  name: string;
  className?: string;
  fallbackClassName?: string;
}

const LazyAvatar: React.FC<LazyAvatarProps> = ({
  src,
  name,
  className = "aspect-square h-10 w-10 rounded-full object-cover border border-white/10 shrink-0",
  fallbackClassName = "aspect-square h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-white font-semibold text-sm shrink-0",
}) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={fallbackClassName}>
        {name?.[0]?.toUpperCase() || 'U'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setError(true)}
      className={className}
    />
  );
};

/**
 * Aspect-ratio media container with skeleton shimmer, smooth fade-in, and lazy loading
 */
interface FeedMediaContainerProps {
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  alt?: string;
  onOpenLightbox?: () => void;
}

const FeedMediaContainer: React.FC<FeedMediaContainerProps> = ({
  mediaUrl,
  mediaType,
  alt = 'Community media',
  onOpenLightbox,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isVideo = isVideoMedia(mediaUrl, mediaType);

  return (
    <div 
      onClick={onOpenLightbox}
      className="relative w-full aspect-[4/5] max-h-[580px] rounded-2xl overflow-hidden bg-black group cursor-pointer select-none shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_8px_28px_rgba(0,0,0,0.55)]"
    >
      {/* Background blurred color glow for letterboxed/pillarboxed media */}
      {!isVideo && !hasError && (
        <img
          src={mediaUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-30 scale-110 pointer-events-none"
        />
      )}

      {/* Shimmer Placeholder while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 animate-pulse text-slate-500 gap-2">
          {isVideo ? (
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
              <Play className="w-4 h-4 text-white/80 ml-0.5" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
              <ImageIcon className="w-4 h-4 text-white/80" />
            </div>
          )}
          <span className="text-[11px] text-slate-400">Loading...</span>
        </div>
      )}

      {/* Error Fallback */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-slate-500 gap-1.5 p-4 text-center">
          <AlertCircle className="w-5 h-5 text-slate-600" />
          <span className="text-xs font-medium text-slate-400">Media unavailable</span>
        </div>
      ) : isVideo ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video
            src={mediaUrl}
            preload="metadata"
            controls
            onLoadedData={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className="w-full h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <img
          src={mediaUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`relative z-10 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Top Format Tag */}
      {!hasError && (
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-black/75 backdrop-blur-md text-white shadow-sm">
            {isVideo ? 'Video' : 'Photo'}
          </span>
        </div>
      )}

      {/* Hover Expand Hint */}
      {!hasError && !isVideo && (
        <div className="absolute bottom-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-black/80 backdrop-blur-md text-white shadow-md">
            <Maximize2 className="w-3 h-3" />
            Expand
          </span>
        </div>
      )}
    </div>
  );
};

interface SocialFeedWallProps {
  currentUser: UserProfile;
  dares?: DareItem[];
  onOpenDare?: (dare: DareItem) => void;
  onOpenCreateDare?: () => void;
}

const SocialFeedWallComponent: React.FC<SocialFeedWallProps> = ({
  currentUser,
  dares = [],
  onOpenDare,
}) => {
  const [posts, setPosts] = useState<SocialFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [attachedDareId, setAttachedDareId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'all' | 'media' | 'my_posts'>('all');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchPosts = async () => {
    try {
      const res = await fetchWithRetry('/api/social-feed');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const processMediaFile = async (file: File) => {
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast('File must be under 25MB');
      return;
    }

    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name);

    if (isVideo) {
      if (file.size > 15 * 1024 * 1024) {
        showToast('Video clip must be under 15MB');
        return;
      }
      setIsProcessingMedia(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setMediaUrl(result);
          setMediaType('video');
          playSound('pop');
          showToast('Video attached');
        }
        setIsProcessingMedia(false);
      };
      reader.onerror = () => {
        setIsProcessingMedia(false);
        showToast('Failed to read video file');
      };
      reader.readAsDataURL(file);
    } else {
      setIsProcessingMedia(true);
      // Read as DataURL first so we have the file bytes safely in memory
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) {
          setIsProcessingMedia(false);
          showToast('Failed to read image file');
          return;
        }

        try {
          // Attempt canvas resize and compression for fast posting
          const compressed = await compressImage(rawDataUrl, 1280, 1280, 0.8);
          setMediaUrl(compressed || rawDataUrl);
          setMediaType('image');
          playSound('pop');
          showToast('Photo attached');
        } catch (_compressErr) {
          // Direct fallback to uncompressed data url if canvas manipulation fails
          setMediaUrl(rawDataUrl);
          setMediaType('image');
          playSound('pop');
          showToast('Photo attached');
        } finally {
          setIsProcessingMedia(false);
        }
      };
      reader.onerror = () => {
        setIsProcessingMedia(false);
        showToast('Failed to read photo file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await processMediaFile(file);
    } finally {
      // Clear input value ONLY after reading file so consecutive uploads of the same file trigger onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processMediaFile(files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          processMediaFile(file);
          break;
        }
      }
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !mediaUrl) return;

    setIsSubmitting(true);
    try {
      const attachedDare = dares.find(d => d.id === attachedDareId);
      const res = await fetch('/api/social-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorHandle: currentUser.handle,
          authorAvatar: currentUser.avatar,
          isPro: currentUser.isPro,
          content: postContent.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
          mediaType: mediaUrl ? (mediaType || (isVideoMedia(mediaUrl) ? 'video' : 'image')) : undefined,
          tags: selectedTag ? [selectedTag] : undefined,
          dareRef: attachedDare ? {
            id: attachedDare.id,
            title: attachedDare.title,
            rewardCred: attachedDare.rewardCred,
            category: attachedDare.category,
          } : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.post) {
          setPosts(prev => [data.post, ...prev]);
        }
        setPostContent('');
        setMediaUrl('');
        setMediaType('image');
        setSelectedTag(null);
        setAttachedDareId('');
        playSound('pop');
        showToast('Update shared with the community');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to post update. Please try a smaller image.');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      showToast('Network error while posting update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    playSound('pop');
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const hasLiked = p.likedUserIds?.includes(currentUser.id);
      return {
        ...p,
        likesCount: hasLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
        likedUserIds: hasLiked 
          ? (p.likedUserIds || []).filter(id => id !== currentUser.id)
          : [...(p.likedUserIds || []), currentUser.id],
      };
    }));

    try {
      await fetch(`/api/social-feed/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch {
      // Revert if error
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    playSound('pop');
    const newComment = {
      id: `c_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorHandle: currentUser.handle,
      authorAvatar: currentUser.avatar,
      text,
      createdAt: new Date().toISOString(),
    };

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: [...(p.comments || []), newComment],
      };
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    try {
      await fetch(`/api/social-feed/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorHandle: currentUser.handle,
          authorAvatar: currentUser.avatar,
          text,
        }),
      });
    } catch {
      // Fail silently
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this update?')) return;
    playSound('pop');
    setPosts(prev => prev.filter(p => p.id !== postId));

    try {
      await fetch(`/api/social-feed/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      showToast('Post removed');
    } catch {
      // Silent error
    }
  };

  const handleSharePost = async (post: SocialFeedPost) => {
    playSound('click');
    const url = `${window.location.origin}/#feed-${post.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard');
    }
  };

  // Filtered post stream
  const filteredPosts = posts.filter(post => {
    if (feedFilter === 'media') {
      return Boolean(post.mediaUrl);
    }
    if (feedFilter === 'my_posts') {
      return post.authorId === currentUser.id;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-2">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-white text-slate-950 px-4 py-2.5 text-xs font-semibold shadow-xl border border-white/20 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Minimalist Apple-Style Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Community Feed
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Updates, challenge progress, and creator discussions.
          </p>
        </div>

        <button
          onClick={fetchPosts}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
          title="Refresh feed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-white' : ''}`} />
        </button>
      </div>

      {/* Clean Composer Card with Shadow Separation & Drag-and-Drop Image Support */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-2xl bg-[#121620] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all ${
          isDragOver ? 'ring-2 ring-cyan-400 bg-cyan-950/20' : ''
        }`}
      >
        <form onSubmit={handleCreatePost} className="space-y-3.5">
          <div className="flex items-start gap-3">
            <LazyAvatar
              src={currentUser.avatar}
              name={currentUser.name}
              className="aspect-square h-9 w-9 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                onPaste={handlePaste}
                placeholder="Share an achievement, photo, or thought with the community (paste image with Ctrl+V / Cmd+V or drag & drop)..."
                rows={3}
                className="w-full bg-black/30 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors resize-none border-none shadow-inner"
              />
            </div>
          </div>

          {/* Uniform 4:5 Aspect-Ratio Container for Composer Attached Media Preview */}
          {mediaUrl && (
            <div className="relative w-full aspect-[4/5] max-h-72 rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center group shadow-md">
              {isVideoMedia(mediaUrl, mediaType) ? (
                <video src={mediaUrl} controls className="w-full h-full object-cover" />
              ) : (
                <img 
                  src={mediaUrl} 
                  alt="Attached preview" 
                  loading="lazy" 
                  decoding="async" 
                  className="w-full h-full object-cover" 
                />
              )}
              <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-black/75 backdrop-blur-md text-white shadow-sm">
                  {isVideoMedia(mediaUrl, mediaType) ? 'Video Preview' : '4:5 Photo Preview'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMediaUrl('');
                  setMediaType('image');
                }}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/80 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 shadow-md transition-colors z-10 cursor-pointer"
                title="Remove media"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Composer Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Upload Photo Button */}
              <button
                type="button"
                disabled={isProcessingMedia}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
              >
                {isProcessingMedia ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                    <span className="text-cyan-300 font-semibold">Processing...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>Photo / Video</span>
                  </>
                )}
              </button>

              {/* Media URL Input Option */}
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Paste an image or video URL:');
                  if (url) {
                    const clean = url.trim();
                    setMediaUrl(clean);
                    setMediaType(isVideoMedia(clean) ? 'video' : 'image');
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                title="Attach URL"
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>URL</span>
              </button>

              {/* Clean Tag Selection */}
              {['challenge', 'proof', 'fitness', 'creative'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer capitalize ${
                    selectedTag === tag 
                      ? 'bg-white text-slate-950 font-semibold' 
                      : 'bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}

              {/* Link an open challenge if available */}
              {dares.length > 0 && (
                <select
                  value={attachedDareId}
                  onChange={(e) => setAttachedDareId(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-white/30"
                >
                  <option value="">Link Challenge (Optional)</option>
                  {dares.slice(0, 10).map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title} (+{d.rewardCred} CR)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!postContent.trim() && !mediaUrl)}
              className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="h-3 w-3" />
              <span>Post</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sleek Segmented Filter Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 px-1">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          {[
            { id: 'all', label: 'All Updates' },
            { id: 'media', label: 'Media' },
            { id: 'my_posts', label: 'My Posts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFeedFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                feedFilter === tab.id
                  ? 'bg-white text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {filteredPosts.length} {filteredPosts.length === 1 ? 'update' : 'updates'}
        </span>
      </div>

      {/* Posts Stream */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <RefreshCw className="h-6 w-6 text-slate-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading feed...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 space-y-2">
          <MessageSquare className="h-8 w-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">
            {feedFilter === 'my_posts' ? 'No posts yet' : 'No updates in this stream'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {feedFilter === 'my_posts' 
              ? 'Share your first update, challenge photo, or discussion above.'
              : 'Be the first to share an update, challenge photo, or achievement!'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredPosts.map(post => {
            const hasLiked = post.likedUserIds?.includes(currentUser.id);
            const isAuthor = post.authorId === currentUser.id;
            const isCommentsOpen = expandedComments[post.id];

            return (
              <div 
                key={post.id}
                className="rounded-2xl bg-[#121620] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all space-y-3.5"
              >
                {/* Creator Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <LazyAvatar
                      src={post.authorAvatar}
                      name={post.authorName}
                      className="aspect-square h-10 w-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-white">{post.authorName}</span>
                        {post.isPro && (
                          <span className="text-[9px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 px-1 py-0.2 rounded">
                            PRO
                          </span>
                        )}
                        <span className="text-xs text-slate-500">{post.authorHandle}</span>
                        <span className="text-slate-600 text-xs">·</span>
                        <span className="text-xs text-slate-500">
                          {formatPostTime(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isAuthor && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Content Text */}
                {post.content && (
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.tags.map(t => (
                      <span key={t} className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Uniform 4:5 Aspect-Ratio Media Container */}
                {post.mediaUrl && (
                  <FeedMediaContainer
                    mediaUrl={post.mediaUrl}
                    mediaType={post.mediaType}
                    alt={`Post media by ${post.authorName}`}
                    onOpenLightbox={() => setLightboxMedia(post.mediaUrl || null)}
                  />
                )}

                {/* Linked Challenge Card with Subtle Shadow Separation */}
                {post.dareRef && (
                  <div className="rounded-xl bg-black/30 p-3 flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 shrink-0">
                        <Flame className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-500 block">Linked Challenge</span>
                        <h4 className="text-xs font-semibold text-white truncate">{post.dareRef.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-amber-400">
                        +{post.dareRef.rewardCred} CR
                      </span>
                      {onOpenDare && (
                        <button
                          onClick={() => {
                            const foundDare = dares.find(d => d.id === post.dareRef?.id);
                            if (foundDare) onOpenDare(foundDare);
                          }}
                          className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>View</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                        hasLiked ? 'text-rose-400 font-medium' : 'hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{post.likesCount || 0}</span>
                    </button>

                    {/* Comments Toggle Button */}
                    <button
                      onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{(post.comments || []).length} Comments</span>
                    </button>
                  </div>

                  {/* Share Link */}
                  <button
                    onClick={() => handleSharePost(post)}
                    className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                    title="Copy link"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Expandable Comments Section */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-white/5 space-y-2.5 animate-in fade-in duration-200">
                    {/* Comments List */}
                    {(post.comments || []).length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {post.comments.map(c => (
                          <div key={c.id} className="flex items-start gap-2.5 rounded-lg bg-black/30 p-2.5 shadow-sm">
                            <LazyAvatar
                              src={c.authorAvatar}
                              name={c.authorName}
                              className="aspect-square h-6 w-6 rounded-full object-cover shrink-0 mt-0.5 border border-white/10"
                              fallbackClassName="aspect-square h-6 w-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-semibold text-[9px] shrink-0 mt-0.5 border border-white/10"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-white truncate">{c.authorName}</span>
                                <span className="text-slate-500 text-[10px]">
                                  {formatPostTime(c.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5">{c.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                        placeholder="Write a comment..."
                        className="flex-1 bg-black/30 border-none rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-white/20 shadow-inner"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Media Modal */}
      {lightboxMedia && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxMedia(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideoMedia(lightboxMedia) ? (
              <video 
                src={lightboxMedia} 
                controls 
                autoPlay 
                className="max-h-[85vh] max-w-full rounded-xl border border-white/10 shadow-2xl bg-black" 
              />
            ) : (
              <img 
                src={lightboxMedia} 
                alt="Enlarged community media" 
                loading="eager"
                decoding="async"
                className="max-h-[85vh] max-w-full object-contain rounded-xl border border-white/10 shadow-2xl" 
              />
            )}
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 p-2 rounded-full bg-slate-900 border border-slate-700 text-white hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
              title="Close viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export const SocialFeedWall = React.memo(SocialFeedWallComponent, (prev, next) => {
  return (
    prev.currentUser?.id === next.currentUser?.id &&
    prev.dares?.length === next.dares?.length
  );
});
