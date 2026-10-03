import React, { useEffect, useState } from 'react';
import { CheckCircle2, Link2, X, ExternalLink, Sparkles } from 'lucide-react';
import { playSound } from '../utils/soundEffects';

export interface ToastData {
  id: string;
  dareId: string;
  dareTitle: string;
  url: string;
}

interface ShareToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const ShareToast: React.FC<ShareToastProps> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const duration = 3800; // 3.8 seconds
    const intervalTime = 40;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          setTimeout(() => onDismiss(), 0);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      id="dare-share-toast-notification"
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-3rem)] rounded-2xl border border-emerald-500/50 bg-[#0a0f18]/95 p-4 text-white shadow-2xl backdrop-blur-xl glow-green animate-in slide-in-from-bottom-5 duration-300"
    >
      {/* Top row: Status header & close button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-400 bg-emerald-950/60 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-tech text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span>Link Copied</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[9px] text-emerald-300">
                CLIPBOARD
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-300 truncate max-w-[220px] sm:max-w-[280px]">
              "{toast.dareTitle}"
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            playSound('click');
            onDismiss();
          }}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Middle row: Visual direct URL preview chip */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-[#060910] px-2.5 py-1.5 font-mono text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <Link2 className="h-3 w-3 text-cyan-400 shrink-0" />
          <span className="truncate text-cyan-300/90">{toast.url}</span>
        </div>
        <span className="shrink-0 text-emerald-400/90 text-[10px] font-bold uppercase ml-2">
          Direct Grid Link
        </span>
      </div>

      {/* Helper cue */}
      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Anyone with this link opens this exact dare directly.</span>
      </div>

      {/* Bottom auto-dismiss animated progress bar */}
      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
