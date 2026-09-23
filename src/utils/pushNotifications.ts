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
 * Checks if browser supports Web Notifications
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission status: 'default' | 'granted' | 'denied' | 'unsupported'
 */
export function getPushPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests Notification permission from browser
 */
export async function requestPushNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      playSound('levelUp');
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission;
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
 * Options for dispatching a local browser notification
 */
export interface LocalPushOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  dareId?: string;
  onClick?: () => void;
}

/**
 * Dispatches a system notification if permission is granted
 */
export async function dispatchSystemNotification(options: LocalPushOptions): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const prefs = getStoredPushPreferences();
  if (prefs.soundEnabled) {
    playSound('notification');
  }

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
    // Vibration pattern (ms): vibrate - pause - vibrate
    // @ts-ignore
    vibrate: [200, 100, 200],
    silent: !prefs.soundEnabled,
  };

  try {
    // 1. Try via active Service Worker if available for reliable background execution
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.showNotification) {
        await registration.showNotification(options.title, notificationOptions);
        return true;
      }
    }

    // 2. Fallback to standard Window Notification API
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

    return true;
  } catch (err) {
    console.error('Failed to trigger native notification:', err);
    return false;
  }
}
