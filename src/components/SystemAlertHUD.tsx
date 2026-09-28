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

export const SystemAlertHUD: React.FC = () => {
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

  return (
    <div 
      id="system-alert-hud"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/50 bg-[#070b13]/95 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(99,102,241,0.3)] backdrop-blur-xl">
        
        {/* Progress bar line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-50"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start gap-3 pt-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-400">
            <BellRing className="h-4 w-4" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">
                {activeAlert.tag || 'System Alert'}
              </span>
              <button
                onClick={() => setActiveAlert(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <h4 className="text-xs font-bold text-white leading-snug">
              {activeAlert.title}
            </h4>

            <p className="text-[11px] text-slate-300 leading-normal line-clamp-2">
              {activeAlert.body}
            </p>

            {activeAlert.onClick && (
              <button
                onClick={() => {
                  activeAlert.onClick?.();
                  setActiveAlert(null);
                }}
                className="mt-2 flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
