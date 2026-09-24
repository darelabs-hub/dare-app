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
  Flame, 
  Zap, 
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

export type ShareCardTheme = 'matrix' | 'synthwave' | 'gold' | 'crimson';

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
  const [selectedTheme, setSelectedTheme] = useState<ShareCardTheme>('matrix');
  const [includeQr, setIncludeQr] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardPreviewRef = useRef<HTMLDivElement | null>(null);

  const shareUrl = dare ? getDareShareUrl(dare.id) : window.location.href;

  // Theme styling definitions
  const themeStyles = {
    matrix: {
      name: 'Cyber Matrix',
      bgGradient: 'from-[#031512] via-[#041d1a] to-[#010908]',
      borderColor: 'border-emerald-500/60',
      accentText: 'text-emerald-400',
      accentBg: 'bg-emerald-500/20',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      gridColor: 'rgba(16, 185, 129, 0.08)',
      primaryHex: '#10b981',
      secondaryHex: '#06b6d4',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
    },
    synthwave: {
      name: 'Synthwave Neon',
      bgGradient: 'from-[#1a052e] via-[#2d0b44] to-[#0f021c]',
      borderColor: 'border-pink-500/60',
      accentText: 'text-pink-400',
      accentBg: 'bg-pink-500/20',
      glowColor: 'rgba(236, 72, 153, 0.4)',
      gridColor: 'rgba(236, 72, 153, 0.08)',
      primaryHex: '#ec4899',
      secondaryHex: '#a855f7',
      badgeBg: 'rgba(236, 72, 153, 0.15)',
    },
    gold: {
      name: 'High-Roller Gold',
      bgGradient: 'from-[#1c1404] via-[#2e2107] to-[#0e0a02]',
      borderColor: 'border-amber-500/60',
      accentText: 'text-amber-400',
      accentBg: 'bg-amber-500/20',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      gridColor: 'rgba(245, 158, 11, 0.08)',
      primaryHex: '#f59e0b',
      secondaryHex: '#eab308',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
    },
    crimson: {
      name: 'Crimson Overdrive',
      bgGradient: 'from-[#200508] via-[#350a0f] to-[#110103]',
      borderColor: 'border-rose-500/60',
      accentText: 'text-rose-400',
      accentBg: 'bg-rose-500/20',
      glowColor: 'rgba(244, 63, 94, 0.4)',
      gridColor: 'rgba(244, 63, 94, 0.08)',
      primaryHex: '#f43f5e',
      secondaryHex: '#ef4444',
      badgeBg: 'rgba(244, 63, 94, 0.15)',
    },
  };

  const activeTheme = themeStyles[selectedTheme];

  // Draw high-res canvas image for download and clipboard copying
  const renderCardToCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!dare) return null;
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 675; // Standard 16:9 social card resolution
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Background Gradient & Cyber Grid
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (selectedTheme === 'matrix') {
      bgGrad.addColorStop(0, '#031411');
      bgGrad.addColorStop(0.5, '#05221d');
      bgGrad.addColorStop(1, '#020b09');
    } else if (selectedTheme === 'synthwave') {
      bgGrad.addColorStop(0, '#19062b');
      bgGrad.addColorStop(0.5, '#2c0b43');
      bgGrad.addColorStop(1, '#0e0219');
    } else if (selectedTheme === 'gold') {
      bgGrad.addColorStop(0, '#1c1304');
      bgGrad.addColorStop(0.5, '#2e1f06');
      bgGrad.addColorStop(1, '#0c0801');
    } else {
      bgGrad.addColorStop(0, '#210508');
      bgGrad.addColorStop(0.5, '#350a0f');
      bgGrad.addColorStop(1, '#100103');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Cyber Grid lines
    ctx.strokeStyle = activeTheme.gridColor;
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. High-Tech Corner Brackets & Outer Neon Border
    ctx.strokeStyle = activeTheme.primaryHex;
    ctx.lineWidth = 4;
    ctx.shadowColor = activeTheme.primaryHex;
    ctx.shadowBlur = 25;
    ctx.strokeRect(30, 30, width - 60, height - 60);
    ctx.shadowBlur = 0; // reset shadow

    // Corner accents
    const bracketSize = 25;
    ctx.fillStyle = activeTheme.primaryHex;
    ctx.fillRect(25, 25, bracketSize, 5);
    ctx.fillRect(25, 25, 5, bracketSize);
    ctx.fillRect(width - 25 - bracketSize, 25, bracketSize, 5);
    ctx.fillRect(width - 30, 25, 5, bracketSize);
    ctx.fillRect(25, height - 30, bracketSize, 5);
    ctx.fillRect(25, height - 25 - bracketSize, 5, bracketSize);
    ctx.fillRect(width - 25 - bracketSize, height - 30, bracketSize, 5);
    ctx.fillRect(width - 30, height - 25 - bracketSize, 5, bracketSize);

    // 3. Header: Brand Logo & Category Badge
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DAREDAY // PROTOCOL', 65, 85);

    // Category & Difficulty Pill
    const categoryText = `${dare.category.toUpperCase()} • ${dare.status.toUpperCase()}`;
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = activeTheme.primaryHex;
    ctx.fillText(categoryText, 65, 120);

    // 4. Reward Bounty Badge (Right side of header)
    ctx.fillStyle = activeTheme.badgeBg;
    ctx.strokeStyle = activeTheme.primaryHex;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(width - 340, 60, 275, 70, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#fef08a'; // gold text
    ctx.fillText(`+${dare.rewardCred} CRED`, width - 315, 108);

    // 5. Dare Title (Multi-line wrapping)
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#ffffff';
    const maxTitleWidth = width - 420;
    const words = dare.title.split(' ');
    let line = '';
    let yPos = 200;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleWidth && n > 0) {
        ctx.fillText(line, 65, yPos);
        line = words[n] + ' ';
        yPos += 54;
        if (yPos > 280) break; // cap to 2 lines
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 65, yPos);

    // 6. Description
    yPos += 35;
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    const descWords = (dare.description || '').split(' ');
    let descLine = '';
    for (let n = 0; n < descWords.length; n++) {
      const testLine = descLine + descWords[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleWidth && n > 0) {
        ctx.fillText(descLine, 65, yPos);
        descLine = descWords[n] + ' ';
        yPos += 30;
        if (yPos > 380) break;
      } else {
        descLine = testLine;
      }
    }
    ctx.fillText(descLine, 65, yPos);

    // 7. Verification / Proof Requirement Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(65, 430, width - 450, 95, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = activeTheme.primaryHex;
    ctx.fillText('PROOF REQUIREMENT:', 85, 460);

    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    const proofText = dare.proofRequirement.length > 75 
      ? dare.proofRequirement.substring(0, 72) + '...' 
      : dare.proofRequirement;
    ctx.fillText(proofText, 85, 495);

    // 8. Creator info Footer
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#94a3b8';
    const creatorHandleDisplay = dare.creator?.handle 
      ? (dare.creator.handle.startsWith('@') ? dare.creator.handle : `@${dare.creator.handle}`)
      : '@DARE_OPS';
    ctx.fillText(`ISSUED BY ${creatorHandleDisplay}`, 65, 595);

    ctx.font = '16px monospace';
    ctx.fillStyle = activeTheme.primaryHex;
    ctx.fillText('dare.app • ACCEPT CHALLENGE', 65, 625);

    // 9. QR Code Rendering (Right Box)
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
              ctx.roundRect(width - 340, 200, 275, 325, 20);
              ctx.fill();

              // Draw QR Code
              ctx.drawImage(qrImg, width - 315, 225, 225, 225);

              // Draw scan text
              ctx.font = 'bold 16px monospace';
              ctx.fillStyle = '#0f172a';
              ctx.textAlign = 'center';
              ctx.fillText('SCAN TO ACCEPT', width - 202, 485);
              ctx.font = '12px monospace';
              ctx.fillStyle = '#64748b';
              ctx.fillText('DIRECT GRID LINK', width - 202, 505);
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
    setStatusMessage('Grid link copied to clipboard!');
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
      link.download = `dare-${dare?.id || 'challenge'}-card.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      playSound('levelUp');
      triggerConfetti();
      setStatusMessage('High-res social card downloaded!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Failed to download image:', err);
      playSound('error');
      setStatusMessage('Failed to render card image.');
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
        if (!blob) throw new Error('Blob generation failed');
        if (navigator.clipboard && 'write' in navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopiedImage(true);
            playSound('levelUp');
            setStatusMessage('Card image copied to clipboard! Ready to paste into Discord/Twitter.');
            setTimeout(() => {
              setCopiedImage(false);
              setStatusMessage(null);
            }, 3200);
            return;
          } catch (clipErr) {
            console.warn('Clipboard write image failed, falling back to download:', clipErr);
          }
        }
        // Fallback to downloading if clipboard write is blocked in browser
        handleDownloadImage();
      }, 'image/png');
    } catch (err) {
      console.error('Failed to copy card image:', err);
      playSound('error');
      setStatusMessage('Clipboard image copy not permitted in this browser.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Native Share API
  const handleNativeShare = async () => {
    playSound('click');
    if (!dare) return;

    try {
      if (navigator.share) {
        // Try sharing with image file if possible
        const canvas = await renderCardToCanvas();
        if (canvas) {
          const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
          if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'dare-card.png', { type: 'image/png' })] })) {
            const file = new File([blob], 'dare-challenge.png', { type: 'image/png' });
            await navigator.share({
              title: `DARE Bounty: ${dare.title}`,
              text: `🔥 Challenge: "${dare.title}" (+${dare.rewardCred} Cred bounty). Accept or bust on DARE!`,
              url: shareUrl,
              files: [file]
            });
            return;
          }
        }

        // Standard text/url share
        await navigator.share({
          title: `DARE Bounty: ${dare.title}`,
          text: `🔥 Challenge: "${dare.title}" (+${dare.rewardCred} Cred bounty). Accept or bust on DARE!`,
          url: shareUrl,
        });
      } else {
        handleCopyLink();
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        handleCopyLink();
      }
    }
  };

  // Social Network Share Handlers
  const handleTwitterShare = () => {
    if (!dare) return;
    playSound('click');
    const text = encodeURIComponent(
      `🔥 CHALLENGE ACCEPTED: "${dare.title}" (+${dare.rewardCred} Cred Bounty) on @DARE!\n\nCan you complete it before the clock runs out? ⏳\n`
    );
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=DARE,CyberBounty,DareAccepted`, '_blank');
  };

  const handleWhatsAppShare = () => {
    if (!dare) return;
    playSound('click');
    const text = encodeURIComponent(
      `⚡ *DARE Challenge Alert!*\n\n*${dare.title}*\n💰 Bounty: +${dare.rewardCred} Cred\n🛡️ Proof: ${dare.proofRequirement}\n\n👉 Accept Challenge: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    if (!dare) return;
    playSound('click');
    const text = encodeURIComponent(`🔥 DARE Bounty: ${dare.title} (+${dare.rewardCred} Cred)`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.telegram.org/share/url?url=${url}&text=${text}`, '_blank');
  };

  const handleRedditShare = () => {
    if (!dare) return;
    playSound('click');
    const title = encodeURIComponent(`[DARE Challenge] ${dare.title} (+${dare.rewardCred} Cred Bounty)`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://reddit.com/submit?url=${url}&title=${title}`, '_blank');
  };

  const handleDiscordMarkdownCopy = async () => {
    if (!dare) return;
    playSound('click');
    const discordText = `**>>> ⚡ DARE CHALLENGE PROTOCOL ⚡**\n**Challenge:** \`${dare.title}\`\n**Bounty:** \`+${dare.rewardCred} CRED\` | **Tier:** \`${dare.category.toUpperCase()}\`\n**Proof Requirement:** *${dare.proofRequirement}*\n**Accept on Grid:** <${shareUrl}>`;
    await copyToClipboard(discordText);
    setStatusMessage('Discord markdown embed copied to clipboard!');
    setTimeout(() => setStatusMessage(null), 2800);
  };

  if (!isOpen || !dare) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Hidden QR SVG for Canvas extraction */}
      <div className="sr-only" aria-hidden="true">
        <QRCodeSVG
          id="share-card-qr-source"
          value={shareUrl}
          size={256}
          level="H"
          marginSize={1}
          fgColor="#090d16"
          bgColor="#ffffff"
        />
      </div>

      <div className="relative w-full max-w-4xl rounded-3xl border border-cyan-500/40 bg-[#070b12] text-slate-100 shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glowing HUD Accents */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative flex items-center justify-between border-b border-slate-800/80 bg-[#0a0f18] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/50 bg-cyan-950/60 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Share2 className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-tech text-lg sm:text-xl font-bold tracking-wider text-white uppercase">
                  Native Holographic Share Card
                </h2>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                  CARD V2.0
                </span>
              </div>
              <p className="font-mono text-xs text-slate-400">
                Generate high-resolution social share cards, scannable QR codes, and 1-click broadcasts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Controls Bar: Theme Selector & QR toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0a0f1a] p-3.5">
            <div className="flex items-center gap-2">
              <span className="font-tech text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                <span>Cyber Aesthetic:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['matrix', 'synthwave', 'gold', 'crimson'] as ShareCardTheme[]).map((theme) => {
                  const t = themeStyles[theme];
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setSelectedTheme(theme);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-tech font-bold uppercase transition-all cursor-pointer ${
                        selectedTheme === theme
                          ? `${t.accentBg} ${t.borderColor} ${t.accentText} border shadow-[0_0_12px_${t.glowColor}]`
                          : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.primaryHex }} />
                      <span>{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setIncludeQr(!includeQr);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                  includeQr
                    ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>QR Code HUD: {includeQr ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Live Interactive Card Preview */}
          <div className="relative group perspective-1000">
            <div
              ref={cardPreviewRef}
              id="dare-holographic-share-card-preview"
              className={`relative rounded-3xl border-2 ${activeTheme.borderColor} bg-gradient-to-br ${activeTheme.bgGradient} p-6 sm:p-8 text-white shadow-[0_0_40px_${activeTheme.glowColor}] overflow-hidden transition-all duration-300`}
            >
              {/* Scanline & Grid Effect */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `linear-gradient(to right, ${activeTheme.primaryHex} 1px, transparent 1px), linear-gradient(to bottom, ${activeTheme.primaryHex} 1px, transparent 1px)`,
                  backgroundSize: '30px 30px',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none animate-scanline" />

              {/* Top Row: Brand & Bounty */}
              <div className="relative flex items-start justify-between gap-4 z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tech text-xs font-bold uppercase tracking-widest text-slate-300">
                      DAREDAY // PROTOCOL
                    </span>
                    <span className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold ${activeTheme.accentBg} ${activeTheme.accentText}`}>
                      VERIFIED
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`font-mono text-xs font-bold uppercase ${activeTheme.accentText}`}>
                      {dare.category.toUpperCase()}
                    </span>
                    <span className="text-slate-600 font-bold">•</span>
                    <span className="font-mono text-xs text-slate-400 uppercase">
                      STATUS: {dare.status}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center gap-2 rounded-2xl border ${activeTheme.borderColor} ${activeTheme.accentBg} px-4 py-2 shadow-lg`}>
                  <Coins className="h-5 w-5 text-amber-400 animate-spin-slow" />
                  <span className="font-tech text-xl sm:text-2xl font-black text-amber-300">
                    +{dare.rewardCred} CRED
                  </span>
                </div>
              </div>

              {/* Middle Section: Title, Description & QR */}
              <div className="relative mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center z-10">
                <div className="md:col-span-2 space-y-3">
                  <h3 className="font-tech text-xl sm:text-2xl font-bold text-white leading-tight">
                    {dare.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                    {dare.description}
                  </p>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-400 uppercase text-[10px]">
                      <ShieldCheck className={`h-3.5 w-3.5 ${activeTheme.accentText}`} />
                      <span>Proof Requirement</span>
                    </div>
                    <p className="mt-1 font-mono text-slate-200 text-xs">
                      {dare.proofRequirement}
                    </p>
                  </div>
                </div>

                {/* QR Code preview block */}
                {includeQr && (
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-3.5 text-slate-950 shadow-2xl text-center md:ml-auto">
                    <QRCodeSVG
                      value={shareUrl}
                      size={130}
                      level="H"
                      marginSize={1}
                      fgColor="#090d16"
                      bgColor="#ffffff"
                    />
                    <span className="mt-2 font-mono text-[10px] font-bold text-slate-900 tracking-wider">
                      SCAN TO ACCEPT
                    </span>
                    <span className="font-mono text-[8px] text-slate-500 uppercase">
                      Direct Challenge
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer: Creator & Protocol Link */}
              <div className="relative mt-6 flex flex-wrap items-center justify-between border-t border-white/10 pt-4 z-10 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">ISSUED BY:</span>
                  <span className={`font-bold ${activeTheme.accentText}`}>
                    {dare.creator?.handle 
                      ? (dare.creator.handle.startsWith('@') ? dare.creator.handle : `@${dare.creator.handle}`)
                      : '@DARE_OPS'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-300">
                  <span>dare.app</span>
                  <span className="text-slate-600">•</span>
                  <span>AI ARBITER CONSENSUS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Message Banner */}
          {statusMessage && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3 text-xs font-mono font-bold text-emerald-300 animate-in fade-in duration-150">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              id="download-share-card-btn"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-cyan-500 px-4 py-3.5 text-sm font-tech font-bold uppercase text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isGenerating ? 'Rendering...' : 'Download Card PNG'}</span>
            </button>

            <button
              type="button"
              id="copy-card-image-btn"
              onClick={handleCopyImageToClipboard}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 rounded-2xl border border-pink-500/50 bg-pink-950/40 px-4 py-3.5 text-sm font-tech font-bold uppercase text-pink-300 hover:border-pink-400 hover:bg-pink-900/50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {copiedImage ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedImage ? 'Image Copied!' : 'Copy Image to Clipboard'}</span>
            </button>

            <button
              type="button"
              id="native-device-share-btn"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/50 bg-emerald-950/40 px-4 py-3.5 text-sm font-tech font-bold uppercase text-emerald-300 hover:border-emerald-400 hover:bg-emerald-900/50 active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Native Device Share</span>
            </button>
          </div>

          {/* Social Broadcast Integrations */}
          <div className="rounded-2xl border border-slate-800 bg-[#0a0f18] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-tech text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span>1-Click Direct Broadcast Channels</span>
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Copied Link' : 'Copy Direct Link'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={handleTwitterShare}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs font-bold text-slate-200 hover:border-sky-500/60 hover:text-sky-400 hover:bg-sky-950/20 transition-all cursor-pointer"
              >
                <span className="text-sm">𝕏</span>
                <span>Twitter / X</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs font-bold text-slate-200 hover:border-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-950/20 transition-all cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleTelegramShare}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs font-bold text-slate-200 hover:border-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-950/20 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4 text-cyan-400" />
                <span>Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleRedditShare}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs font-bold text-slate-200 hover:border-orange-500/60 hover:text-orange-400 hover:bg-orange-950/20 transition-all cursor-pointer"
              >
                <span className="text-sm text-orange-400">👽</span>
                <span>Reddit</span>
              </button>

              <button
                type="button"
                onClick={handleDiscordMarkdownCopy}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs font-bold text-slate-200 hover:border-indigo-500/60 hover:text-indigo-400 hover:bg-indigo-950/20 transition-all cursor-pointer col-span-2 sm:col-span-1"
              >
                <span className="text-sm text-indigo-400">👾</span>
                <span>Discord</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
