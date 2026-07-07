import AsyncStorage from '@react-native-async-storage/async-storage';

import { FIELD_SOLO_LEGAL_ACCEPTANCE_CACHE_KEY } from './storageKeys';

type LegalAcceptanceCache = {
  userId: string;
  privacyVersion: string;
  termsVersion: string;
};

export async function cacheLegalAcceptance(input: LegalAcceptanceCache): Promise<void> {
  await AsyncStorage.setItem(
    FIELD_SOLO_LEGAL_ACCEPTANCE_CACHE_KEY,
    JSON.stringify(input),
  );
}

export async function hasCachedLegalAcceptance(
  expected: LegalAcceptanceCache,
): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(FIELD_SOLO_LEGAL_ACCEPTANCE_CACHE_KEY);
    if (!raw) return false;
    const cached = JSON.parse(raw) as Partial<LegalAcceptanceCache>;
    return (
      cached.userId === expected.userId
      && cached.privacyVersion === expected.privacyVersion
      && cached.termsVersion === expected.termsVersion
    );
  } catch {
    return false;
  }
}
