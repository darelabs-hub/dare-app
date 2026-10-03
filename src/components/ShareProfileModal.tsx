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
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43l-.48-.01c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z"/>
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}: ${deepLink}`)}`,
    },
    {
      name: 'X',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(deepLink)}`,
    },
    {
      name: 'Telegram',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.92 0 1.66-.74 1.66-1.66 0-.91-.74-1.66-1.66-1.66-.92 0-1.66.75-1.66 1.66 0 .92.74 1.66 1.66 1.66m1.39 9.74v-8.37H5.07v8.37h2.78z"/>
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(deepLink)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      
      {/* Modal Card */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0A0D14] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-200">
              <Share2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Share Profile</h3>
              <p className="text-xs text-slate-400">Invite friends & share on DARE</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Segmented Tab Control */}
        <div className="px-5 pt-4 shrink-0">
          <div className="flex items-center p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setActiveTab('link');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-white text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'qrcode'
                  ? 'bg-white text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* TAB 1: Link & Channels */}
          {activeTab === 'link' && (
            <div className="space-y-4 animate-fade-in">
              {/* Profile Card Preview */}
              <div className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="h-12 w-12 rounded-full p-[1.5px] bg-white/10">
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={user.name}
                        className="h-full w-full rounded-full object-cover bg-slate-900"
                      />
                    </div>
                    {user.isPro && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950 text-[8px] font-bold border border-[#0A0D14]">
                        <Crown className="w-2.5 h-2.5 fill-slate-950" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-white tracking-tight">{user.name}</h4>
                      {user.isPro && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">PRO</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      @{cleanHandle}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                      <div>
                        <span className="font-semibold text-white">{user.completedDaresCount ?? (user as any).completedDares?.length ?? 0}</span>
                        <span className="text-slate-500 ml-1">Dares</span>
                      </div>
                      <span className="text-slate-600">·</span>
                      <div>
                        <span className="font-semibold text-white">{user.cred || 0}</span>
                        <span className="text-slate-500 ml-1">Cred</span>
                      </div>
                      {user.streak ? (
                        <>
                          <span className="text-slate-600">·</span>
                          <div className="flex items-center gap-1 text-rose-400 font-medium">
                            <Flame className="w-3 h-3 text-rose-400" />
                            <span>{user.streak}d streak</span>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Platform watermark */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium">DARE Social Platform</span>
                  <span className="font-mono text-slate-400">dare.app</span>
                </div>
              </div>

              {/* Direct Profile Link Box */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Direct Profile Link
                </label>
                <div className="flex items-center gap-2 p-1 bg-white/[0.03] rounded-xl border border-white/[0.08] focus-within:border-white/20 transition-colors">
                  <input
                    type="text"
                    readOnly
                    value={deepLink}
                    className="flex-1 bg-transparent px-2.5 text-xs text-slate-200 font-mono focus:outline-none select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                      copied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-slate-950 hover:bg-slate-100 active:scale-95'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
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

              {/* Native Device Share Action */}
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Share via Device Sheet</span>
                </button>
              )}

              {/* Direct Social Channels */}
              <div>
                <span className="block text-xs font-medium text-slate-400 mb-2">
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
                      className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/20 transition-all text-slate-300 hover:text-white cursor-pointer"
                      title={`Share on ${ch.name}`}
                    >
                      {ch.icon}
                      <span className="text-[11px] font-medium text-slate-300 truncate w-full text-center">
                        {ch.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Scan QR Code */}
          {activeTab === 'qrcode' && (
            <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in py-1">
              
              {/* QR Code Pass Card */}
              <div 
                ref={qrRef}
                className="w-full max-w-[260px] bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col items-center text-center space-y-3.5"
              >
                {/* Identity header inside the pass */}
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full p-[1.5px] bg-white/10">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={user.name}
                      className="h-full w-full rounded-full object-cover bg-slate-900"
                    />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2 tracking-tight">{user.name}</h4>
                  <p className="text-xs font-mono text-slate-400">@{cleanHandle}</p>
                </div>

                {/* QR Code Canvas */}
                <div className="p-3 rounded-xl bg-white shadow-md flex items-center justify-center">
                  <QRCodeCanvas
                    value={deepLink}
                    size={150}
                    level="H"
                    marginSize={1}
                  />
                </div>

                {/* Pass branding watermark */}
                <div className="text-[11px] text-slate-400 font-medium">
                  Scan to view profile
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">
                Scan with any smartphone camera to view <span className="text-white font-medium">@{cleanHandle}</span> on DARE.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  <span>Save Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
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
