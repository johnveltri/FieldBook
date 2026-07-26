import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  getFirstRunOnboardingState,
  setFirstRunOnboardingState,
} from './firstRunOnboardingStorage';

describe('firstRunOnboardingStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('keeps dismissal state scoped to the signed-in user', async () => {
    await setFirstRunOnboardingState('user-a', 'dismissed');

    await expect(getFirstRunOnboardingState('user-a')).resolves.toBe('dismissed');
    await expect(getFirstRunOnboardingState('user-b')).resolves.toBeNull();
  });

  it('persists completion separately from dismissal', async () => {
    await setFirstRunOnboardingState('user-a', 'completed');

    await expect(getFirstRunOnboardingState('user-a')).resolves.toBe('completed');
  });
});
