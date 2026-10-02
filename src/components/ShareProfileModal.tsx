import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Smartphone, 
  Download,
  Flame,
  Crown
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qrcode'>('link');
  const qrRef = useRef<HTMLDivElement>(null);

  const cleanHandle = useMemo(() => {
    if (!user.handle) return user.id;
    return user.handle.replace(/^@/, '');
  }, [user.handle, user.id]);

  const deepLink = useMemo(() => {
    if (typeof window === 'undefined') return `https://dare.app/?u=${encodeURIComponent(cleanHandle)}`;
    return `${window.location.origin}/?u=${encodeURIComponent(cleanHandle)}`;
  }, [cleanHandle]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    playSound('pop');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(deepLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = deepLink;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_err) {
      console.warn('Unable to copy to clipboard');
    }
  };

  const handleNativeShare = async () => {
    playSound('click');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name} on DARE`,
          text: `Check out ${user.name}'s (@${cleanHandle}) profile on DARE:`,
          url: deepLink,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    playSound('pop');
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    try {
      const imageUri = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = imageUri;
      downloadLink.download = `dare-profile-${cleanHandle}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (_err) {
      console.warn('Failed to export QR code');
    }
  };

  const shareText = `Check out ${user.name} (@${cleanHandle}) on DARE`;

  const SOCIAL_CHANNELS = [
    {
      name: 'WhatsApp',
      color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43l-.48-.01c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z"/>
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}: ${deepLink}`)}`,
    },
    {
      name: 'X (Twitter)',
      color: 'hover:border-slate-500/50 hover:bg-slate-500/10 text-slate-200',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(deepLink)}`,
    },
    {
      name: 'Telegram',
      color: 'hover:border-sky-500/50 hover:bg-sky-500/10 text-sky-400',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'LinkedIn',
      color: 'hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-400',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.92 0 1.66-.74 1.66-1.66 0-.91-.74-1.66-1.66-1.66-.92 0-1.66.75-1.66 1.66 0 .92.74 1.66 1.66 1.66m1.39 9.74v-8.37H5.07v8.37h2.78z"/>
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(deepLink)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      
      {/* Modal Card with comfortable padding and maximum height constraint */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0c1017] border border-slate-800/90 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Share2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Share Profile</h3>
              <p className="text-[11px] text-slate-400">Invite friends & share on DARE</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle: Link & Channels vs Scan QR Code */}
        <div className="px-5 pt-3.5 shrink-0">
          <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800/90">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setActiveTab('link');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Link & Channels</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                setActiveTab('qrcode');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'qrcode'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR Code</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* TAB 1: Link & Channels */}
          {activeTab === 'link' && (
            <div className="space-y-4 animate-fade-in">
              {/* Profile Card Preview */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#131722] to-[#0c0f17] border border-slate-800/80 p-3.5 sm:p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="h-13 w-13 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 shadow-md">
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={user.name}
                        className="h-full w-full rounded-full object-cover bg-slate-950"
                      />
                    </div>
                    {user.isPro && (
                      <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-400 text-slate-950 text-[9px] font-black border-2 border-[#0c1017]">
                        <Crown className="w-2.5 h-2.5 fill-slate-950" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-black text-white">{user.name}</h4>
                      {user.isPro && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950">PRO</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      @{cleanHandle}
                    </p>

                    {/* Social stats */}
                    <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white">{user.completedDaresCount ?? (user as any).completedDares?.length ?? 0}</span>
                        <span className="text-slate-500">Dares</span>
                      </div>
                      <span className="text-slate-600">·</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-amber-400">{user.cred || 0}</span>
                        <span className="text-slate-500">Cred</span>
                      </div>
                      {user.streak ? (
                        <>
                          <span className="text-slate-600">·</span>
                          <div className="flex items-center gap-0.5 text-pink-400 font-semibold">
                            <Flame className="w-3 h-3 fill-pink-500 text-pink-500" />
                            <span>{user.streak}d streak</span>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Platform watermark */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-medium tracking-wide">DARE Social Platform</span>
                  <span className="font-mono text-cyan-400/80">dare.app</span>
                </div>
              </div>

              {/* Direct Profile Link Box with Copy Button */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Direct Profile Link
                </label>
                <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 focus-within:border-slate-600 transition-colors">
                  <input
                    type="text"
                    readOnly
                    value={deepLink}
                    className="flex-1 bg-transparent px-2.5 text-xs text-slate-200 font-mono focus:outline-none select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      copied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-slate-950 hover:bg-slate-200 active:scale-95'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Native Device Share Button (if supported) */}
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Share via Device Sheet...</span>
                </button>
              )}

              {/* Direct Social Channels */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 mb-2">
                  Share via Social
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {SOCIAL_CHANNELS.map((ch) => (
                    <a
                      key={ch.name}
                      href={ch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => playSound('click')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 transition-all cursor-pointer ${ch.color}`}
                      title={`Share on ${ch.name}`}
                    >
                      {ch.icon}
                      <span className="text-[10px] font-medium text-slate-300 truncate w-full text-center">
                        {ch.name.split(' ')[0]}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Scan QR Code (Self-contained DARE Nametag Pass) */}
          {activeTab === 'qrcode' && (
            <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in py-1">
              
              {/* DARE Nametag Digital Pass Card */}
              <div 
                ref={qrRef}
                className="w-full max-w-[280px] bg-gradient-to-b from-[#131722] via-[#0f131d] to-[#090c13] border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center space-y-3.5 relative overflow-hidden"
              >
                {/* Accent top glow */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-600" />

                {/* Identity header inside the pass */}
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 shadow-md">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={user.name}
                      className="h-full w-full rounded-full object-cover bg-slate-950"
                    />
                  </div>
                  <h4 className="text-sm font-black text-white mt-1.5 tracking-tight">{user.name}</h4>
                  <p className="text-[11px] font-mono text-cyan-400 font-semibold">@{cleanHandle}</p>
                </div>

                {/* QR Code Canvas */}
                <div className="p-3 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                  <QRCodeCanvas
                    value={deepLink}
                    size={160}
                    level="H"
                    marginSize={1}
                  />
                </div>

                {/* Pass branding watermark */}
                <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-300 uppercase tracking-widest font-mono">
                  <span>DARE</span>
                  <span className="text-pink-400">·</span>
                  <span className="text-slate-400 font-normal normal-case">Social Profile</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center max-w-xs leading-normal">
                Point any smartphone camera to open <span className="text-white font-semibold">@{cleanHandle}</span> on DARE.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-pink-400" />
                  <span>Save QR Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
