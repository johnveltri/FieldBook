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
  personProperties?: Record<string, string | null | undefined>;
};

function cacheKey(flagKey: string, distinctId: string, personProperties: Record<string, string>): string {
  const props = Object.keys(personProperties)
    .sort()
    .map((key) => `${key}=${personProperties[key]}`)
    .join('|');
  return `${flagKey}:${distinctId}:${props}`;
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

export function normalizeDebugEmail(email: string | null | undefined): string | null {
  const trimmed = (email ?? '').trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export async function fetchPostHogBooleanFlag(
  flagKey: string,
  input: FetchPostHogBooleanFlagInput,
): Promise<boolean> {
  const distinctId = input.distinctId.trim();
  if (!distinctId) return false;

  const token = analyticsConfig.posthogKey;
  if (!token) return false;

  const personProperties = Object.fromEntries(
    Object.entries(input.personProperties ?? {})
      .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
      .map(([key, value]) => [key, (value as string).trim()]),
  ) as Record<string, string>;

  const key = cacheKey(flagKey, distinctId, personProperties);
  const cached = readCache(key);
  if (cached !== null) return cached;

  const host = analyticsConfig.posthogHost.replace(/\/+$/, '');
  try {
    const response = await fetch(`${host}/flags?v=2`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        distinct_id: distinctId,
        person_properties: personProperties,
      }),
    });
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
  }
}
