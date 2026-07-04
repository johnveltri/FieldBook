import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  fetchAnalyticsConsentStatus,
  upsertAnalyticsConsentStatus,
  type AnalyticsConsentStatus,
} from '@fieldsolo/api-client';

import { supabase } from '../supabase';
import { analytics } from './client';
import {
  clearAnalyticsConsentCache,
  readAnalyticsConsentCache,
  writeAnalyticsConsentCache,
} from './consentStorage';

export async function syncAnalyticsConsentForUser(userId: string): Promise<void> {
  await resolveAnalyticsConsentForUser(userId);
}

export type AnalyticsConsentResolution = 'granted' | 'withdrawn' | 'missing' | 'unavailable';

/**
 * Hydrates analytics consent from cache and server. Returns `missing` when the
 * user has never recorded a choice (first auth). Returns `unavailable` when the
 * server read fails and there is no local cache — analytics stays off without
 * prompting so offline launches are not blocked.
 */
export async function resolveAnalyticsConsentForUser(
  userId: string,
): Promise<AnalyticsConsentResolution> {
  const cached = await readAnalyticsConsentCache();
  if (cached?.userId === userId) {
    await analytics.applyConsent(cached.status);
  } else {
    await analytics.applyConsent(null);
  }

  try {
    const status = await fetchAnalyticsConsentStatus(supabase);
    if (status) {
      await writeAnalyticsConsentCache(userId, status);
      await analytics.applyConsent(status);
      return status;
    }
    await clearAnalyticsConsentCache();
    await analytics.applyConsent(null);
    return 'missing';
  } catch {
    if (cached?.userId === userId) {
      await analytics.applyConsent(cached.status);
      return cached.status;
    }
    await analytics.applyConsent(null);
    return 'unavailable';
  }
}

export async function grantAnalyticsConsent(userId: string): Promise<void> {
  await upsertAnalyticsConsentStatus(supabase, 'granted');
  await writeAnalyticsConsentCache(userId, 'granted');
  await analytics.grantConsent();
}

export async function withdrawAnalyticsConsent(userId: string): Promise<void> {
  await upsertAnalyticsConsentStatus(supabase, 'withdrawn');
  await writeAnalyticsConsentCache(userId, 'withdrawn');
  await analytics.withdrawConsent();
}

export type { AnalyticsConsentStatus };
