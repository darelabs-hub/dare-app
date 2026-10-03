import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playSound } from '../utils/soundEffects';
import { useLanguage } from '../context/LanguageContext';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '',
  variant = 'button'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already running as an installed standalone PWA or user dismissed banner, suppress
  if (isInstalled || (variant === 'banner' && isDismissed)) {
    return null;
  }

  const handleInstallClick = async () => {
    playSound('click');
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowIOSGuide(true);
    }
  };

  if (variant === 'banner') {
    return (
      <>
        {/* Sleek, Modern Social App Banner */}
        <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1017]/90 backdrop-blur-xl p-3.5 sm:p-4 shadow-sm mb-6 ${className}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/60 text-white shadow-sm">
                <Smartphone className="h-5 w-5 text-slate-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                    Get the DARE App
                  </h4>
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.2 text-[10px] font-medium text-cyan-300">
                    Official Web App
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  Add to your home screen for full-screen mode, smoother feed gestures, and instant notifications.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-slate-950" />
                <span>Install App</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* iOS / General Safari Install Guide Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0c1017] p-6 shadow-2xl text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Install DARE Mobile</h3>
                    <p className="text-xs text-slate-400">Add to Home Screen</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-bold text-white text-xs">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Tap the Share Icon</p>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">In Safari or Chrome, tap the <Share2 className="inline h-3.5 w-3.5 text-slate-300 mx-1" /> Share button in the navigation bar.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-bold text-white text-xs">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Select 'Add to Home Screen'</p>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">Scroll down the action sheet and tap <PlusSquare className="inline h-3.5 w-3.5 text-slate-300 mx-1" /> <strong>Add to Home Screen</strong>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 font-bold text-emerald-400 text-xs">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Launch & Enjoy Standalone</p>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">DARE opens in full-screen with fast offline loading, just like an app from the App Store.</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-white hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition-colors cursor-pointer"
              >
                Got It, Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Navbar / Compact Button Variant
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 hover:text-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all active:scale-95 cursor-pointer shadow-sm ${className}`}
        title="Install DARE on your device"
      >
        <Download className="h-3.5 w-3.5 text-slate-300" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* iOS / General Safari Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0c1017] p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Install DARE Mobile</h3>
                  <p className="text-xs text-slate-400">Add to Home Screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-bold text-white text-xs">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Tap the Share Icon</p>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">In Safari or Chrome, tap the <Share2 className="inline h-3.5 w-3.5 text-slate-300 mx-1" /> Share button in the toolbar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-bold text-white text-xs">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Select 'Add to Home Screen'</p>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">Scroll down and tap <PlusSquare className="inline h-3.5 w-3.5 text-slate-300 mx-1" /> <strong>Add to Home Screen</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 font-bold text-emerald-400 text-xs">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Launch & Enjoy</p>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">DARE opens in full-screen with offline caching, just like a native mobile app.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-white hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition-colors cursor-pointer"
            >
              Got It, Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
