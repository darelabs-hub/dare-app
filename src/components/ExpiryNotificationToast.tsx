import React, { useEffect, useState } from 'react';
import { Clock, X, AlertTriangle, ShieldCheck, Terminal, Upload, Zap } from 'lucide-react';
import { playSound } from '../utils/soundEffects';

export interface ExpiryToastData {
  id: string;
  dareId: string;
  dareTitle: string;
  timeLeftMinutes: number;
  expiresAtString: string;
}

interface ExpiryNotificationToastProps {
  toast: ExpiryToastData | null;
  onDismiss: () => void;
  onSubmitProof: () => void;
}

export const ExpiryNotificationToast: React.FC<ExpiryNotificationToastProps> = ({
  toast,
  onDismiss,
  onSubmitProof,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [toastProgress, setToastProgress] = useState(100);

  // Synchronize dare expiration countdown
  useEffect(() => {
    if (!toast) return;

    const updateCountdown = () => {
      const msLeft = new Date(toast.expiresAtString).getTime() - Date.now();
      if (msLeft <= 0) {
        setSecondsRemaining(0);
      } else {
        setSecondsRemaining(Math.ceil(msLeft / 1000));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [toast]);

  // Synchronize temporary toast auto-dismiss progress (15 seconds)
  useEffect(() => {
    if (!toast) return;

    setToastProgress(100);
    const duration = 15000; // 15 seconds temporary toast
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setToastProgress((prev) => {
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

  // Format countdown string
  const formatTimeLeft = (sec: number) => {
    if (sec <= 0) return 'EXPIRED';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const minutesRemaining = Math.max(1, Math.ceil(secondsRemaining / 60));

  return (
    <div
      id="dare-expiry-toast-notification"
      role="alert"
      aria-live="assertive"
      className="fixed bottom-24 right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-3rem)] rounded-2xl border border-rose-500 bg-[#0a060d]/95 p-4 text-white shadow-[0_0_30px_rgba(244,63,94,0.25)] backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300"
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-500 bg-rose-950/60 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-rose-400">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span>CHRONO REMINDER</span>
              <span className="rounded bg-rose-500/20 px-1.5 py-0.2 font-mono text-[8px] text-rose-300 border border-rose-500/30">
                1HR REMAINING
              </span>
            </div>
            <h4 className="font-sans text-xs sm:text-sm font-bold text-white mt-0.5 truncate max-w-[190px] sm:max-w-[250px]">
              {toast.dareTitle}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            playSound('click');
            onDismiss();
          }}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          aria-label="Dismiss reminder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Expiry Alarm Body */}
      <div className="mt-3.5 flex items-center justify-between gap-3 rounded-xl border border-rose-950/80 bg-rose-950/20 px-3 py-2.5">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-rose-300/70 uppercase tracking-wider">
            GRID EXPIRATION DEADLINE
          </span>
          <span className="text-sm font-mono font-black text-rose-200 mt-0.5">
            {formatTimeLeft(secondsRemaining)}
          </span>
        </div>
        
        {/* Dynamic Warning Accent */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-rose-300 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-400 animate-bounce" />
          <span>SUBMIT PROOF NOW</span>
        </div>
      </div>

      {/* Helper Cue */}
      <p className="mt-2.5 text-[11px] font-sans text-slate-400 leading-relaxed">
        Your accepted dare expires in less than an hour! Upload your telemetry proof to earn full <strong>CRED</strong> before your window closes.
      </p>

      {/* Interactive Action Buttons */}
      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            playSound('accept');
            onSubmitProof();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3 py-2 text-xs font-bold text-white transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] hover:shadow-[0_0_18px_rgba(244,63,94,0.5)] cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload Proof</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playSound('click');
            onDismiss();
          }}
          className="rounded-xl border border-slate-800 bg-[#060910] hover:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          Dismiss
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="mt-3.5 h-1 w-full overflow-hidden rounded-full bg-slate-950">
        <div
          className="h-full bg-gradient-to-r from-rose-600 to-pink-500 transition-all duration-75"
          style={{ width: `${toastProgress}%` }}
        />
      </div>
    </div>
  );
};
