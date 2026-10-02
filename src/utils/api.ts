/**
 * Resilient API Fetch Helper with automatic retry & exponential backoff.
 * Handles server warm-up periods, transient proxy timeouts (502/503/504),
 * and prevents uncaught network error disruptions.
 */
export interface FetchRetryOptions {
  retries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMs?: number;
}

export type FetchWithRetryInit = RequestInit & FetchRetryOptions;

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: FetchWithRetryInit,
  options?: FetchRetryOptions
): Promise<Response> {
  const mergedOptions: FetchRetryOptions = {
    retries: options?.retries ?? init?.retries ?? 3,
    initialDelayMs: options?.initialDelayMs ?? init?.initialDelayMs ?? init?.backoffMs ?? 600,
    maxDelayMs: options?.maxDelayMs ?? init?.maxDelayMs ?? 3000,
  };

  const { retries = 3, initialDelayMs = 600, maxDelayMs = 3000 } = mergedOptions;

  // Strip custom options from standard RequestInit
  let standardInit: RequestInit | undefined = undefined;
  if (init) {
    const { retries: _, initialDelayMs: _1, maxDelayMs: _2, backoffMs: _3, ...rest } = init;
    standardInit = rest;
  }

  let delay = initialDelayMs;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(input, standardInit);

      // Return immediately on successful response
      if (response.ok) {
        return response;
      }

      // Retry on temporary server errors during startup (502 Bad Gateway / 503 Service Unavailable / 504 Gateway Timeout)
      if ([502, 503, 504].includes(response.status) && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, maxDelayMs);
        continue;
      }

      return response;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        // Wait before retrying on network errors like "Failed to fetch"
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, maxDelayMs);
      }
    }
  }

  throw lastError;
}

export async function safeFetchJson<T>(
  url: string,
  fallbackValue: T,
  init?: FetchWithRetryInit
): Promise<T> {
  try {
    const res = await fetchWithRetry(url, init);
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    return fallbackValue;
  } catch (err) {
    console.warn(`[SafeFetch] Notice for ${url}:`, err);
    return fallbackValue;
  }
}
