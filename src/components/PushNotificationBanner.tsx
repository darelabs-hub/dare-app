import React, { useState, useEffect } from 'react';
import { BellRing, Check, X, Bell } from 'lucide-react';
import { 
  isPushNotificationSupported, 
  getPushPermissionStatus, 
  requestPushNotificationPermission, 
  isPushBannerDismissed, 
  dismissPushBanner 
} from '../utils/pushNotifications';
import { playSound } from '../utils/soundEffects';

interface PushNotificationBannerProps {
  userId?: string;
  onSubscribed?: () => void;
  onNavigateToDare?: (dareId: string) => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  userId,
  onSubscribed,
  onNavigateToDare: _onNavigateToDare,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);

  useEffect(() => {
    if (!isPushNotificationSupported()) {
      return;
    }

    const state = getPushPermissionStatus();
    setPermission(state);

    if (state === 'default' && !isPushBannerDismissed()) {
      // Delay presentation slightly so it doesn't jarringly block the initial load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    playSound('click');
    setIsRequesting(true);

    try {
      const res = await requestPushNotificationPermission();
      setPermission(res);
      if (res === 'granted') {
        setJustEnabled(true);
        playSound('complete');
        if (onSubscribed) onSubscribed();

        setTimeout(() => {
          setIsVisible(false);
        }, 2200);
      } else {
        if (res === 'denied' || res === 'unsupported') {
          setIsVisible(false);
        }
      }
    } catch (e) {
      console.warn('Failed to subscribe to web push:', e);
    } finally {
      setIsRequesting(false);
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
      className="fixed bottom-20 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-md z-40 rounded-2xl border border-white/[0.08] bg-[#0A0D14]/95 p-4 text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-200">
            <BellRing className="h-5 w-5 text-slate-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-semibold tracking-tight text-white">
                Turn On Notifications
              </h4>
            </div>
            <p className="mt-0.5 text-xs text-slate-300 leading-snug">
              Get alerted when peers challenge you directly, stake Cred on your dares, or verify your submissions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          id="enable-web-push-btn"
          onClick={handleEnable}
          disabled={isRequesting || justEnabled}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white text-slate-950 px-3.5 py-2 text-xs font-bold shadow-sm hover:bg-slate-100 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {justEnabled ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Notifications Enabled</span>
            </>
          ) : (
            <>
              <Bell className="h-3.5 w-3.5" />
              <span>{isRequesting ? 'Enabling...' : 'Enable Notifications'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          Later
        </button>
      </div>
    </div>
  );
};
