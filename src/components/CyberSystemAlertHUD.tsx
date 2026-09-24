import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  X, 
  Sparkles, 
  Zap, 
  Radio, 
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';

export interface SystemAlertDetail {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  dareId?: string;
  data?: any;
  onClick?: () => void;
}

export const CyberSystemAlertHUD: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<SystemAlertDetail | null>(null);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const handleSystemAlert = (e: Event) => {
      const customEvent = e as CustomEvent<SystemAlertDetail>;
      if (customEvent && customEvent.detail) {
        setActiveAlert(customEvent.detail);
        setProgress(100);
      }
    };

    window.addEventListener('dare:system-alert', handleSystemAlert);
    return () => {
      window.removeEventListener('dare:system-alert', handleSystemAlert);
    };
  }, []);

  useEffect(() => {
    if (!activeAlert) return;

    const duration = 5000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          setActiveAlert(null);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeAlert]);

  if (!activeAlert) return null;

  const handleAction = () => {
    playSound('click');
    if (activeAlert.onClick) {
      activeAlert.onClick();
    } else if (activeAlert.dareId) {
      const url = new URL(window.location.href);
      url.searchParams.set('dare', activeAlert.dareId);
      window.history.pushState({}, '', url.toString());
      window.dispatchEvent(new CustomEvent('dare:open-dare', { detail: { dareId: activeAlert.dareId } }));
      const el = document.getElementById(`dare-card-${activeAlert.dareId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setActiveAlert(null);
  };

  return (
    <div 
      id="cyber-system-alert-hud"
      className="fixed top-4 sm:top-6 right-4 sm:right-6 z-[120] max-w-sm sm:max-w-md w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="relative rounded-2xl border border-cyan-400/60 bg-[#070b14]/95 p-4 text-slate-100 shadow-[0_0_35px_rgba(6,182,212,0.35)] backdrop-blur-xl overflow-hidden ring-1 ring-cyan-500/30">
        
        {/* Holographic Glowing Ambient Background */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-28 w-28 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-28 w-28 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

        {/* Header telemetry pill */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-950 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.6)]">
              <Radio className="h-3 w-3 animate-pulse" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
              {activeAlert.tag || 'SYSTEM TRANSMISSION'}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          <button
            type="button"
            aria-label="Dismiss alert"
            onClick={() => {
              playSound('click');
              setActiveAlert(null);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-900/60 to-indigo-900/60 border border-cyan-400/40 text-cyan-300 shadow-inner">
            <BellRing className="h-5 w-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
              {activeAlert.title}
            </h4>
            <p className="mt-0.5 text-[11px] sm:text-xs text-slate-300 font-mono line-clamp-2 leading-relaxed">
              {activeAlert.body}
            </p>
          </div>
        </div>

        {/* Interactive Action Bar */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[9px] font-mono text-slate-500">
            DARE PROTOCOL • ENCRYPTED UPLINK
          </span>

          <button
            type="button"
            onClick={handleAction}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-[11px] font-mono font-bold transition-all shadow-sm hover:scale-102 active:scale-98 cursor-pointer"
          >
            <span>Acknowledge</span>
            <ChevronRight className="h-3 w-3 text-cyan-400" />
          </button>
        </div>

        {/* Animated Laser Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
