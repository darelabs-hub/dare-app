/**
 * DARE Unified Analytics & Event Tracking Engine
 * Supports:
 * 1. Google Analytics 4 (GA4) via gtag
 * 2. PostHog / Plausible if configured
 * 3. Server-side event stream (/api/analytics/event) for instant real-time telemetry
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    posthog?: any;
    DARE_GA_ID?: string;
  }
}

let isInitialized = false;

export interface AnalyticsEvent {
  event: string;
  category?: 'dares' | 'economy' | 'social' | 'auth' | 'navigation' | 'gameplay';
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  userId?: string;
  userHandle?: string;
}

/**
 * Initialize Analytics tags (Google Analytics 4 & external scripts)
 */
export function initAnalytics(customGaId?: string) {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  const gaId = 
    customGaId || 
    (import.meta.env.VITE_GA_MEASUREMENT_ID as string) || 
    window.DARE_GA_ID;

  if (gaId && /^G-[A-Za-z0-9]+$/.test(gaId.trim())) {
    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId.trim()}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer?.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaId.trim(), {
        send_page_view: true,
        cookie_flags: 'SameSite=None;Secure',
      });
      console.log(`📊 GA4 telemetry initialized with ID: ${gaId.trim()}`);
    } catch (e) {
      console.warn('Could not initialize GA4 tag:', e);
    }
  }

  // Track initial page view
  trackEvent({
    event: 'page_view',
    category: 'navigation',
    label: window.location.pathname + window.location.search,
    metadata: {
      referrer: document.referrer || 'direct',
      screen: `${window.innerWidth}x${window.innerHeight}`,
    },
  });
}

/**
 * Track an action across all configured analytics destinations
 */
export function trackEvent(params: AnalyticsEvent) {
  if (typeof window === 'undefined') return;

  const payload = {
    ...params,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  // 1. Send to Google Analytics 4 (if configured)
  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', params.event, {
        event_category: params.category || 'general',
        event_label: params.label,
        value: params.value,
        ...params.metadata,
      });
    } catch (_e) {
      // Safe fallback
    }
  }

  // 2. Send to PostHog (if configured)
  if (typeof window.posthog?.capture === 'function') {
    try {
      window.posthog.capture(params.event, {
        category: params.category,
        label: params.label,
        value: params.value,
        ...params.metadata,
      });
    } catch (_e) {
      // Safe fallback
    }
  }

  // 3. Send to Server-Side DARE Telemetry Stream (/api/analytics/event)
  try {
    const jsonStr = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/event', blob);
    } else {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (_e) {
    // Non-blocking telemetry
  }
}
