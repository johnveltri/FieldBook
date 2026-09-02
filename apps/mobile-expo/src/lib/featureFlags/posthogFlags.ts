import { analyticsConfig } from '../analytics/config';

const CACHE_TTL_MS = 5 * 60 * 1000;

type FlagCacheEntry = {
  value: boolean;
  expiresAt: number;
};

const flagCache = new Map<string, FlagCacheEntry>();

type PostHogFlagsResponse = {
  featureFlags?: Record<string, boolean | string>;
};

export type FetchPostHogBooleanFlagInput = {
  distinctId: string;
};

function cacheKey(flagKey: string, distinctId: string): string {
  return `${flagKey}:${distinctId}`;
}

function readCache(key: string): boolean | null {
  const entry = flagCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    flagCache.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache(key: string, value: boolean): void {
  flagCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Clears in-memory flag cache (tests only). */
export function clearPostHogFlagCacheForTests(): void {
  flagCache.clear();
}

/** Keep flag checks bounded so an unavailable PostHog endpoint cannot block navigation. */
const POSTHOG_FLAG_TIMEOUT_MS = 4_000;

export async function fetchPostHogBooleanFlag(
  flagKey: string,
  input: FetchPostHogBooleanFlagInput,
): Promise<boolean> {
  const distinctId = input.distinctId.trim();
  if (!distinctId) return false;

  const token = analyticsConfig.posthogKey;
  if (!token) return false;

  const key = cacheKey(flagKey, distinctId);
  const cached = readCache(key);
  if (cached !== null) return cached;

  const host = analyticsConfig.posthogHost.replace(/\/+$/, '');
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      fetch(`${host}/flags?v=2`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, distinct_id: distinctId }),
        signal: controller.signal,
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error('PostHog feature flag request timed out'));
        }, POSTHOG_FLAG_TIMEOUT_MS);
      }),
    ]);
    if (!response.ok) {
      writeCache(key, false);
      return false;
    }
    const data = (await response.json()) as PostHogFlagsResponse;
    const enabled = data.featureFlags?.[flagKey] === true;
    writeCache(key, enabled);
    return enabled;
  } catch {
    writeCache(key, false);
    return false;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
