import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  X, 
  Check, 
  Sparkles, 
  Crosshair, 
  ShieldCheck, 
  Zap,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';
import { 
  isPushNotificationSupported, 
  getPushPermissionStatus, 
  requestPushNotificationPermission, 
  isPushBannerDismissed, 
  dismissPushBanner,
  dispatchSystemNotification,
  getStoredPushPreferences,
  saveStoredPushPreferences,
  PushPreferences
} from '../utils/pushNotifications';
import { playSound } from '../utils/soundEffects';

interface PushNotificationBannerProps {
  userId?: string;
  onNavigateToDare?: (dareId: string) => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  userId,
  onNavigateToDare,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [justEnabled, setJustEnabled] = useState<boolean>(false);

  useEffect(() => {
    const status = getPushPermissionStatus();
    setPermission(status);

    if (status === 'default' && !isPushBannerDismissed()) {
      // Show subtle banner after small delay so user isn't immediately bombarded
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsRequesting(true);
    playSound('click');
    const result = await requestPushNotificationPermission();
    setPermission(result);
    setIsRequesting(false);

    if (result === 'granted') {
      setJustEnabled(true);
      dismissPushBanner();
      
      // Dispatch immediate welcome cyber push notification
      await dispatchSystemNotification({
        title: '⚡ DARE Uplink Connected!',
        body: 'You will now receive real-time alerts for direct challenge bounties, staking pools, and proximity drop zones.',
        tag: 'dare-welcome',
      });

      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    } else {
      setIsVisible(false);
      dismissPushBanner();
    }
  };

  const handleDismiss = () => {
    playSound('click');
    setIsVisible(false);
    dismissPushBanner();
  };

  if (!isVisible || permission !== 'default') return null;

  return (
    <div
      id="push-notification-permission-banner"
      className="fixed bottom-20 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-md z-40 rounded-2xl border border-cyan-500/50 bg-[#070e17]/95 p-4 text-white shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 glow-cyan"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400 bg-cyan-950/80 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <BellRing className="h-5 w-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-tech text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-300">
                Web Push Uplink
              </h4>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-cyan-300">
                INSTANT ALERTS
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300 leading-snug">
              Get notified when peers challenge you directly, stake Cred on your dares, or when you are near an AR Drop Zone.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          id="enable-web-push-btn"
          onClick={handleEnable}
          disabled={isRequesting || justEnabled}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-cyan-500 px-3.5 py-2 text-xs font-tech font-bold uppercase text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {justEnabled ? (
            <>
              <Check className="h-4 w-4 text-emerald-300" />
              <span>Uplink Active!</span>
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5" />
              <span>{isRequesting ? 'Authorizing...' : 'Enable Notifications'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-tech font-bold uppercase text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Later
        </button>
      </div>
    </div>
  );
};
