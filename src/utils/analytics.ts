/**
 * DARE Unified Analytics & Event Tracking Engine
 * Supports:
 * 1. PostHog EU (Session Replays, Heatmaps, Autocapture, Conversion Funnels)
 * 2. Google Analytics 4 (GA4) via gtag
 * 3. Server-side event stream (/api/analytics/event)
 */
import posthog from 'posthog-js';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    posthog?: any;
    DARE_GA_ID?: string;
    DARE_POSTHOG_KEY?: string;
  }
}

let isInitialized = false;

// Default configured PostHog EU API Key
const DEFAULT_POSTHOG_KEY = 'phc_umBihDRVL5X4FvUdYgNWUY3CFbickbDNmGB6oLQqdSJ4';
// Reverse proxy endpoint hosted on the same domain (dare.me.uk/ingest/)
const rawHost = (import.meta.env.VITE_POSTHOG_HOST as string) || '/ingest';
const POSTHOG_PROXY_HOST = rawHost.endsWith('/') && rawHost.length > 1 ? rawHost.slice(0, -1) : rawHost;
const POSTHOG_UI_HOST = 'https://eu.posthog.com';

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
 * Initialize Analytics tags (PostHog & Google Analytics 4)
 */
export function initAnalytics(customGaId?: string, customPosthogKey?: string) {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Initialize PostHog EU via /ingest reverse proxy
  const phKey = 
    customPosthogKey || 
    (import.meta.env.VITE_POSTHOG_KEY as string) || 
    window.DARE_POSTHOG_KEY || 
    DEFAULT_POSTHOG_KEY;

  if (phKey && phKey.startsWith('phc_')) {
    try {
      posthog.init(phKey, {
        api_host: POSTHOG_PROXY_HOST,
        ui_host: POSTHOG_UI_HOST,
        person_profiles: 'always',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        capture_performance: true,
        session_recording: {
          recordCrossOriginIframes: false,
          maskAllInputs: false,
        },
        loaded: (ph) => {
          console.log('🦔 PostHog telemetry & session recording initialized via reverse proxy (/ingest) on EU instance');
        },
      });
      window.posthog = posthog;
    } catch (e) {
      console.warn('Could not initialize PostHog:', e);
    }
  }

  // 2. Initialize Google Analytics 4 (if configured)
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

  // 3. Track initial page view in server telemetry
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
 * Identify the logged in user for PostHog profile tracking & replays
 */
export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  try {
    if (posthog && typeof posthog.identify === 'function') {
      posthog.identify(userId, traits);
    }
  } catch (_e) {
    // Non-blocking
  }
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

  // 1. Send to PostHog
  try {
    if (posthog && typeof posthog.capture === 'function') {
      posthog.capture(params.event, {
        category: params.category || 'general',
        label: params.label,
        value: params.value,
        userId: params.userId,
        userHandle: params.userHandle,
        ...params.metadata,
      });
    }
  } catch (_e) {
    // Safe fallback
  }

  // 2. Send to Google Analytics 4 (if configured)
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
