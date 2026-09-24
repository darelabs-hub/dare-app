import { playSound } from './soundEffects';

export interface PushPreferences {
  directDares: boolean;
  stakes: boolean;
  proofVotes: boolean;
  dropZones: boolean;
  dailyOps: boolean;
  soundEnabled: boolean;
}

export const DEFAULT_PUSH_PREFERENCES: PushPreferences = {
  directDares: true,
  stakes: true,
  proofVotes: true,
  dropZones: true,
  dailyOps: true,
  soundEnabled: true,
};

const STORAGE_KEY_PREFS = 'dareday_push_preferences';
const STORAGE_KEY_DISMISSED_BANNER = 'dareday_push_banner_dismissed';

/**
 * Checks if browser environment supports Web Notifications
 */
export function isPushNotificationSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'Notification' in window;
  } catch (_e) {
    return false;
  }
}

/**
 * Checks if running inside an iframe
 */
export function isRunningInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (_e) {
    return true;
  }
}

/**
 * Returns current permission status: 'default' | 'granted' | 'denied' | 'unsupported'
 */
export function getPushPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isPushNotificationSupported()) return 'unsupported';
  try {
    return Notification.permission;
  } catch (_e) {
    return 'unsupported';
  }
}

/**
 * Comprehensive Protocol Diagnostics State
 */
export function getPushProtocolState(): {
  status: NotificationPermission | 'unsupported';
  isNativeSupported: boolean;
  isInIframe: boolean;
  isInAppHudActive: boolean;
} {
  const isSupported = isPushNotificationSupported();
  const inIframe = isRunningInIframe();
  const status = getPushPermissionStatus();

  return {
    status,
    isNativeSupported: isSupported,
    isInIframe: inIframe,
    isInAppHudActive: true, // In-App Cyber HUD Telemetry is always active and guaranteed
  };
}

/**
 * Requests Notification permission from browser safely
 */
export async function requestPushNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushNotificationSupported()) return 'unsupported';

  try {
    // If in iframe, some browsers deny Notification.requestPermission()
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      playSound('levelUp');
    }
    return permission;
  } catch (err) {
    console.warn('Notification permission request notice (falling back to In-App Cyber HUD Telemetry):', err);
    return getPushPermissionStatus();
  }
}

/**
 * Gets push preferences from local storage
 */
export function getStoredPushPreferences(): PushPreferences {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PREFS);
    if (data) {
      return { ...DEFAULT_PUSH_PREFERENCES, ...JSON.parse(data) };
    }
  } catch (e) {
    console.warn('Failed to parse push preferences:', e);
  }
  return DEFAULT_PUSH_PREFERENCES;
}

/**
 * Saves push preferences to local storage and syncs to backend
 */
export async function saveStoredPushPreferences(prefs: PushPreferences, userId?: string): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    if (userId) {
      await fetch(`/api/push/preferences/${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs }),
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('Failed to save push preferences:', e);
  }
}

/**
 * Checks if push banner was dismissed by user
 */
export function isPushBannerDismissed(): boolean {
  return localStorage.getItem(STORAGE_KEY_DISMISSED_BANNER) === 'true';
}

/**
 * Sets dismissed state for push banner
 */
export function dismissPushBanner(): void {
  localStorage.setItem(STORAGE_KEY_DISMISSED_BANNER, 'true');
}

/**
 * Options for dispatching a system notification
 */
export interface LocalPushOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  dareId?: string;
  userId?: string;
  onClick?: () => void;
}

/**
 * Dispatches a system alert across both In-App Holographic HUD and Native Browser Web Push
 */
export async function dispatchSystemNotification(options: LocalPushOptions): Promise<{
  success: boolean;
  nativeDelivered: boolean;
  hudDelivered: boolean;
}> {
  const prefs = getStoredPushPreferences();

  // 1. Trigger acoustic telemetry sound if enabled
  if (prefs.soundEnabled) {
    playSound('notification');
  }

  // 2. ALWAYS dispatch in-app Cyber System Alert HUD event
  let hudDelivered = false;
  try {
    window.dispatchEvent(
      new CustomEvent('dare:system-alert', {
        detail: {
          title: options.title,
          body: options.body,
          tag: options.tag || 'SYSTEM TRANSMISSION',
          dareId: options.dareId,
          data: options.data,
          onClick: options.onClick,
        },
      })
    );
    hudDelivered = true;
  } catch (e) {
    console.warn('HUD event dispatch error:', e);
  }

  // 3. Optional backend sync if userId provided
  if (options.userId) {
    fetch('/api/push/dispatch-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: options.userId,
        title: options.title,
        body: options.body,
        dareId: options.dareId,
      }),
    }).catch(() => {});
  }

  // 4. Attempt Native Web Notification if supported and granted
  let nativeDelivered = false;
  if (isPushNotificationSupported() && Notification.permission === 'granted') {
    try {
      const iconUrl = options.icon || '/favicon.ico';
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: iconUrl,
        badge: options.badge || iconUrl,
        tag: options.tag || `dare-notif-${Date.now()}`,
        data: {
          url: window.location.href,
          dareId: options.dareId,
          ...options.data,
        },
        // @ts-ignore
        vibrate: [200, 100, 200],
        silent: !prefs.soundEnabled,
      };

      // Try Service Worker showNotification if active
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration().catch(() => null);
        if (registration && registration.showNotification) {
          await registration.showNotification(options.title, notificationOptions);
          nativeDelivered = true;
        }
      }

      if (!nativeDelivered) {
        const notification = new Notification(options.title, notificationOptions);
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          notification.close();
          if (options.onClick) {
            options.onClick();
          } else if (options.dareId) {
            const url = new URL(window.location.href);
            url.searchParams.set('dare', options.dareId);
            window.history.pushState({}, '', url.toString());
            window.dispatchEvent(new CustomEvent('dare:open-dare', { detail: { dareId: options.dareId } }));
          }
        };
        nativeDelivered = true;
      }
    } catch (nativeErr) {
      console.warn('Native notification dispatch notice:', nativeErr);
    }
  }

  return {
    success: hudDelivered || nativeDelivered,
    nativeDelivered,
    hudDelivered,
  };
}
