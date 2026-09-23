import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X, Check, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playSound } from '../utils/soundEffects';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '',
  variant = 'button'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
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
        <div className={`relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60 p-4 shadow-xl mb-6 ${className}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/40">
                <Smartphone className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-wider text-indigo-400 uppercase">MOBILE APP PROTOCOL</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-mono text-emerald-400">
                    <ShieldCheck className="h-3 w-3" /> PWA Ready
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-0.5">Install DARE directly on your Phone or Desktop</h4>
                <p className="text-xs text-slate-400 mt-0.5">Instant launch, offline caching, and full-screen experience without App Store downloads.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Install App</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                title="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* iOS / General Safari Install Guide Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-indigo-500/30 bg-[#0f172a] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Install DARE Mobile</h3>
                    <p className="text-xs text-slate-400">Add to Home Screen</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 font-bold text-indigo-400">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Tap the Share Icon</p>
                    <p className="text-slate-400 mt-0.5">In your mobile browser (Safari / Chrome), tap the <Share2 className="inline h-3.5 w-3.5 text-indigo-400 mx-1" /> Share button in the navigation bar.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 font-bold text-indigo-400">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Select 'Add to Home Screen'</p>
                    <p className="text-slate-400 mt-0.5">Scroll down the action sheet and tap <PlusSquare className="inline h-3.5 w-3.5 text-indigo-400 mx-1" /> <strong>Add to Home Screen</strong>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 font-bold text-emerald-400">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Launch & Enjoy Standalone</p>
                    <p className="text-slate-400 mt-0.5">DARE will be pinned to your phone's home screen as a standalone application icon.</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer"
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
        className={`inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 hover:border-indigo-400 px-3 py-1.5 text-xs font-mono font-semibold text-indigo-300 transition-all active:scale-95 cursor-pointer shadow-sm ${className}`}
        title="Install DARE on your device"
      >
        <Download className="h-3.5 w-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* iOS / General Safari Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-indigo-500/30 bg-[#0f172a] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Install DARE Mobile</h3>
                  <p className="text-xs text-slate-400">Add to Home Screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 font-bold text-indigo-400">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Tap the Share Icon</p>
                  <p className="text-slate-400 mt-0.5">In Safari or Chrome on mobile, tap the <Share2 className="inline h-3.5 w-3.5 text-indigo-400 mx-1" /> Share button in the toolbar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 font-bold text-indigo-400">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Select 'Add to Home Screen'</p>
                  <p className="text-slate-400 mt-0.5">Scroll down and tap <PlusSquare className="inline h-3.5 w-3.5 text-indigo-400 mx-1" /> <strong>Add to Home Screen</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 font-bold text-emerald-400">
                  <Check className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Launch & Play</p>
                  <p className="text-slate-400 mt-0.5">DARE opens full-screen with offline caching, just like a native app.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer"
            >
              Got It, Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
