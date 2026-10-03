import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Share2, 
  Check, 
  Sparkles, 
  QrCode, 
  ShieldCheck, 
  Coins, 
  Layers, 
  Globe, 
  Send,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { DareItem, UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';
import { copyToClipboard, getDareShareUrl } from '../utils/clipboard';
import { triggerConfetti } from './ConfettiEffect';

export type ShareCardTheme = 'obsidian' | 'midnight' | 'gold' | 'crimson';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  dare: DareItem | null;
  currentUser: UserProfile;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  dare,
  currentUser,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<ShareCardTheme>('obsidian');
  const [includeQr, setIncludeQr] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const cardPreviewRef = useRef<HTMLDivElement | null>(null);

  const shareUrl = dare ? getDareShareUrl(dare.id) : (typeof window !== 'undefined' ? window.location.href : 'https://dare.me.uk');

  // Modern, refined theme styling definitions
  const themeStyles = {
    obsidian: {
      name: 'Obsidian Minimal',
      bgGradient: 'from-[#0D111A] via-[#090C14] to-[#05070B]',
      cardBg: '#090C14',
      borderColor: 'border-white/[0.12]',
      accentText: 'text-emerald-400',
      primaryHex: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      borderHex: 'rgba(255, 255, 255, 0.12)',
    },
    midnight: {
      name: 'Midnight Slate',
      bgGradient: 'from-[#0F172A] via-[#0B1120] to-[#060913]',
      cardBg: '#0B1120',
      borderColor: 'border-cyan-500/30',
      accentText: 'text-cyan-400',
      primaryHex: '#06B6D4',
      badgeBg: 'rgba(6, 182, 212, 0.1)',
      borderHex: 'rgba(6, 182, 212, 0.3)',
    },
    gold: {
      name: 'Prestige Amber',
      bgGradient: 'from-[#1A140A] via-[#120D04] to-[#0A0701]',
      cardBg: '#120D04',
      borderColor: 'border-amber-500/30',
      accentText: 'text-amber-400',
      primaryHex: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      borderHex: 'rgba(245, 158, 11, 0.3)',
    },
    crimson: {
      name: 'Crimson Onyx',
      bgGradient: 'from-[#1A0A10] via-[#12050B] to-[#0A0206]',
      cardBg: '#12050B',
      borderColor: 'border-pink-500/30',
      accentText: 'text-pink-400',
      primaryHex: '#EC4899',
      badgeBg: 'rgba(236, 72, 153, 0.1)',
      borderHex: 'rgba(236, 72, 153, 0.3)',
    },
  };

  const activeTheme = themeStyles[selectedTheme];

  // Draw high-res canvas image (1200x675) for download and clipboard copying
  const renderCardToCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!dare) return null;
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 675; // 16:9 aspect ratio
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Background Fill with subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (selectedTheme === 'obsidian') {
      bgGrad.addColorStop(0, '#0E131F');
      bgGrad.addColorStop(0.5, '#090C14');
      bgGrad.addColorStop(1, '#05070B');
    } else if (selectedTheme === 'midnight') {
      bgGrad.addColorStop(0, '#0F172A');
      bgGrad.addColorStop(0.5, '#0B1120');
      bgGrad.addColorStop(1, '#060913');
    } else if (selectedTheme === 'gold') {
      bgGrad.addColorStop(0, '#1C150A');
      bgGrad.addColorStop(0.5, '#120D04');
      bgGrad.addColorStop(1, '#0A0701');
    } else {
      bgGrad.addColorStop(0, '#1C0A12');
      bgGrad.addColorStop(0.5, '#12050B');
      bgGrad.addColorStop(1, '#0A0206');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Refined outer border
    ctx.strokeStyle = activeTheme.borderHex;
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // 3. Header: Brand Wordmark & Metadata
    ctx.font = '800 28px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DARE', 70, 90);

    const categoryText = `·  ${(dare.category || 'Challenge').toUpperCase()}  ·  ${(dare.difficulty || 'Moderate')}`;
    ctx.font = '600 16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(categoryText, 160, 90);

    // Reward Badge on Right
    ctx.fillStyle = activeTheme.badgeBg;
    ctx.strokeStyle = activeTheme.primaryHex;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(width - 320, 58, 250, 50, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#fde047';
    ctx.fillText(`+${dare.rewardCred} CRED`, width - 295, 91);

    // 4. Challenge Title (Multi-line wrapping with tight tracking)
    ctx.font = 'bold 42px sans-serif';
    ctx.fillStyle = '#ffffff';
    const maxTitleWidth = includeQr ? width - 460 : width - 140;
    const words = dare.title.split(' ');
    let line = '';
    let yPos = 180;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleWidth && n > 0) {
        ctx.fillText(line, 70, yPos);
        line = words[n] + ' ';
        yPos += 52;
        if (yPos > 260) break;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 70, yPos);

    // 5. Description
    yPos += 40;
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    const descWords = (dare.description || '').split(' ');
    let descLine = '';
    for (let n = 0; n < descWords.length; n++) {
      const testLine = descLine + descWords[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleWidth && n > 0) {
        ctx.fillText(descLine, 70, yPos);
        descLine = descWords[n] + ' ';
        yPos += 30;
        if (yPos > 380) break;
      } else {
        descLine = testLine;
      }
    }
    ctx.fillText(descLine, 70, yPos);

    // 6. Proof Requirement Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(70, 420, maxTitleWidth, 100, 14);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 15px sans-serif';
    ctx.fillStyle = activeTheme.primaryHex;
    ctx.fillText('PROOF REQUIREMENT', 95, 452);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    const proofText = dare.proofRequirement.length > 90 
      ? dare.proofRequirement.substring(0, 87) + '...' 
      : dare.proofRequirement;
    ctx.fillText(proofText, 95, 488);

    // 7. Footer: Creator & App Domain
    ctx.font = '600 18px sans-serif';
    ctx.fillStyle = '#94a3b8';
    const creatorHandleDisplay = dare.creator?.handle 
      ? (dare.creator.handle.startsWith('@') ? dare.creator.handle : `@${dare.creator.handle}`)
      : (dare.creator?.name || 'Community');
    ctx.fillText(`Created by ${creatorHandleDisplay}`, 70, 590);

    ctx.font = '600 16px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('dare.me.uk  ·  Real-World Social Challenges', 70, 618);

    // 8. QR Code Rendering
    if (includeQr) {
      try {
        const qrSvgElement = document.getElementById('share-card-qr-source');
        if (qrSvgElement) {
          const svgData = new XMLSerializer().serializeToString(qrSvgElement);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const URL = window.URL || window.webkitURL || window;
          const blobURL = URL.createObjectURL(svgBlob);
          const qrImg = new Image();

          await new Promise<void>((resolve) => {
            qrImg.onload = () => {
              // Draw QR Container Box
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.roundRect(width - 320, 160, 250, 320, 20);
              ctx.fill();

              // Draw QR Code
              ctx.drawImage(qrImg, width - 295, 185, 200, 200);

              // Draw scan text
              ctx.font = 'bold 15px sans-serif';
              ctx.fillStyle = '#0f172a';
              ctx.textAlign = 'center';
              ctx.fillText('Scan to Accept', width - 195, 430);
              ctx.font = '12px sans-serif';
              ctx.fillStyle = '#64748b';
              ctx.fillText('Direct Challenge Link', width - 195, 452);
              ctx.textAlign = 'left';

              URL.revokeObjectURL(blobURL);
              resolve();
            };
            qrImg.onerror = () => resolve();
            qrImg.src = blobURL;
          });
        }
      } catch (e) {
        console.warn('Could not render QR code to canvas:', e);
      }
    }

    return canvas;
  }, [dare, selectedTheme, includeQr, activeTheme]);

  // Copy Link Handler
  const handleCopyLink = async () => {
    playSound('click');
    await copyToClipboard(shareUrl);
    setCopiedLink(true);
    setStatusMessage('Challenge link copied to clipboard');
    setTimeout(() => {
      setCopiedLink(false);
      setStatusMessage(null);
    }, 2800);
  };

  // Download High-Res PNG
  const handleDownloadImage = async () => {
    playSound('click');
    setIsGenerating(true);
    try {
      const canvas = await renderCardToCanvas();
      if (!canvas) throw new Error('Canvas render failed');

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `dare-${dare?.id || 'challenge'}-share.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      playSound('complete');
      triggerConfetti();
      setStatusMessage('High-resolution card saved!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Unable to render card image. Try copying link directly.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImageToClipboard = async () => {
    playSound('click');
    setIsGenerating(true);
    try {
      const canvas = await renderCardToCanvas();
      if (!canvas) throw new Error('Canvas render failed');

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          if (navigator.clipboard && (window as any).ClipboardItem) {
            const item = new (window as any).ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            setCopiedImage(true);
            playSound('complete');
            setStatusMessage('Card image copied to clipboard!');
            setTimeout(() => {
              setCopiedImage(false);
              setStatusMessage(null);
            }, 3000);
          } else {
            handleCopyLink();
          }
        } catch {
          handleCopyLink();
        } finally {
          setIsGenerating(false);
        }
      }, 'image/png');
    } catch {
      setIsGenerating(false);
      handleCopyLink();
    }
  };

  // Web Share API
  const handleNativeShare = async () => {
    playSound('click');
    if (!dare) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DARE: ${dare.title}`,
          text: `I challenge you to complete "${dare.title}" on DARE! Earn +${dare.rewardCred} Cred:`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const handleTwitterShare = () => {
    if (!dare) return;
    const text = encodeURIComponent(`I dare you to take on "${dare.title}"! Earn +${dare.rewardCred} Cred on @dare: ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    if (!dare) return;
    const text = encodeURIComponent(`🔥 *DARE Challenge*: "${dare.title}" (+${dare.rewardCred} Cred)\n\nAccept challenge here: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    if (!dare) return;
    const text = encodeURIComponent(`DARE: ${dare.title} (+${dare.rewardCred} Cred)`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  const handleRedditShare = () => {
    if (!dare) return;
    const title = encodeURIComponent(`DARE Challenge: ${dare.title} (+${dare.rewardCred} Cred)`);
    window.open(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${title}`, '_blank');
  };

  if (!isOpen || !dare) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      
      {/* Hidden QR Code source used for Canvas Render */}
      <div className="hidden">
        <QRCodeSVG
          id="share-card-qr-source"
          value={shareUrl}
          size={250}
          level="H"
          marginSize={0}
          fgColor="#090d16"
          bgColor="#ffffff"
        />
      </div>

      <div className="relative w-full max-w-3xl rounded-2xl border border-white/[0.08] bg-[#0A0D14] text-slate-100 shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0C1018] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-white shrink-0">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Share Challenge
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate high-resolution social share cards and invite friends.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Controls Bar: Theme Selector & QR toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Theme:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['obsidian', 'midnight', 'gold', 'crimson'] as ShareCardTheme[]).map((theme) => {
                  const t = themeStyles[theme];
                  const isSelected = selectedTheme === theme;
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setSelectedTheme(theme);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-950 font-semibold shadow-sm'
                          : 'border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.primaryHex }} />
                      <span>{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                setIncludeQr(!includeQr);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                includeQr
                  ? 'border-white/30 bg-white/10 text-white font-semibold'
                  : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>QR Code: {includeQr ? 'On' : 'Off'}</span>
            </button>
          </div>

          {/* Live Interactive Card Preview */}
          <div className="relative group">
            <div
              ref={cardPreviewRef}
              id="dare-holographic-share-card-preview"
              className={`relative rounded-2xl border ${activeTheme.borderColor} bg-gradient-to-br ${activeTheme.bgGradient} p-6 sm:p-7 text-white shadow-xl overflow-hidden transition-all duration-200`}
            >
              {/* Top Row: Brand & Reward */}
              <div className="relative flex items-start justify-between gap-4 z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black tracking-tight text-white">
                      DARE
                    </span>
                    <span className="text-xs text-slate-400">
                      · {dare.category} · {dare.difficulty}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-1.5 shadow-sm">
                  <Coins className="h-4 w-4 text-amber-400" />
                  <span className="font-mono text-sm font-bold text-amber-300 tabular-nums">
                    +{dare.rewardCred} Cred
                  </span>
                </div>
              </div>

              {/* Middle Section: Title, Description & QR */}
              <div className="relative mt-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-center z-10">
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                    {dare.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                    {dare.description}
                  </p>

                  <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px] mb-1">
                      <ShieldCheck className={`h-3.5 w-3.5 ${activeTheme.accentText}`} />
                      <span>Proof Requirement</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {dare.proofRequirement}
                    </p>
                  </div>
                </div>

                {/* QR Code preview block */}
                {includeQr && (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-white p-3 text-slate-950 shadow-md text-center md:ml-auto">
                    <QRCodeSVG
                      value={shareUrl}
                      size={110}
                      level="H"
                      marginSize={0}
                      fgColor="#090d16"
                      bgColor="#ffffff"
                    />
                    <span className="mt-2 text-[11px] font-bold text-slate-950">
                      Scan to Accept
                    </span>
                    <span className="text-[9px] text-slate-500">
                      dare.me.uk
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer: Creator & Link */}
              <div className="relative mt-6 flex flex-wrap items-center justify-between border-t border-white/[0.08] pt-3.5 z-10 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span>Created by</span>
                  <span className="font-semibold text-white">
                    {dare.creator?.handle 
                      ? (dare.creator.handle.startsWith('@') ? dare.creator.handle : `@${dare.creator.handle}`)
                      : (dare.creator?.name || 'Community')}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  dare.me.uk
                </div>
              </div>
            </div>
          </div>

          {/* Status Message Banner */}
          {statusMessage && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] border border-white/[0.1] p-3 text-xs font-semibold text-white animate-in fade-in duration-150">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              id="download-share-card-btn"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-100 px-4 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-slate-950" />
              <span>{isGenerating ? 'Rendering...' : 'Download Card PNG'}</span>
            </button>

            <button
              type="button"
              id="copy-card-image-btn"
              onClick={handleCopyImageToClipboard}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-4 py-3 text-xs sm:text-sm font-semibold text-white transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {copiedImage ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedImage ? 'Image Copied' : 'Copy Image'}</span>
            </button>

            <button
              type="button"
              id="native-device-share-btn"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-4 py-3 text-xs sm:text-sm font-semibold text-white transition-all active:scale-[0.98] cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Share Link</span>
            </button>
          </div>

          {/* Social Broadcast Integrations */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <span>Direct Share</span>
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleTwitterShare}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] px-3 py-2 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              >
                <span className="font-bold">𝕏</span>
                <span>Twitter / X</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] px-3 py-2 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleTelegramShare}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] px-3 py-2 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-cyan-400" />
                <span>Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleRedditShare}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] px-3 py-2 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              >
                <span className="text-orange-400 font-bold">r/</span>
                <span>Reddit</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
