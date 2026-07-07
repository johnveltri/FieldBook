import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AnalyticsConsentStatus } from '@fieldsolo/api-client';

import { FIELD_SOLO_ANALYTICS_CONSENT_CACHE_KEY } from '../storageKeys';

export type AnalyticsConsentCache = {
  userId: string;
  status: AnalyticsConsentStatus;
};

export async function readAnalyticsConsentCache(): Promise<AnalyticsConsentCache | null> {
  try {
    const raw = await AsyncStorage.getItem(FIELD_SOLO_ANALYTICS_CONSENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnalyticsConsentCache;
    if (
      typeof parsed.userId === 'string'
      && (parsed.status === 'granted' || parsed.status === 'withdrawn')
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function writeAnalyticsConsentCache(
  userId: string,
  status: AnalyticsConsentStatus,
): Promise<void> {
  const payload: AnalyticsConsentCache = { userId, status };
  await AsyncStorage.setItem(FIELD_SOLO_ANALYTICS_CONSENT_CACHE_KEY, JSON.stringify(payload));
}

export async function clearAnalyticsConsentCache(): Promise<void> {
  await AsyncStorage.removeItem(FIELD_SOLO_ANALYTICS_CONSENT_CACHE_KEY);
}
