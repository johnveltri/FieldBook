import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  cacheLegalAcceptance,
  hasCachedLegalAcceptance,
} from './legalAcceptanceStorage';

const current = {
  userId: 'user-1',
  privacyVersion: '2026-07-03',
  termsVersion: '2026-07-03',
};

describe('legal acceptance cache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('recognizes a cached acceptance only for the same user and versions', async () => {
    await cacheLegalAcceptance(current);

    await expect(hasCachedLegalAcceptance(current)).resolves.toBe(true);
    await expect(
      hasCachedLegalAcceptance({ ...current, userId: 'user-2' }),
    ).resolves.toBe(false);
    await expect(
      hasCachedLegalAcceptance({ ...current, termsVersion: '2026-08-01' }),
    ).resolves.toBe(false);
  });

  it('fails closed for malformed cache data', async () => {
    await AsyncStorage.setItem('fieldsolo.legal.acceptanceCache', '{bad json');

    await expect(hasCachedLegalAcceptance(current)).resolves.toBe(false);
  });
});
