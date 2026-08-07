import { afterEach, describe, expect, it } from '@jest/globals';
import { Platform } from 'react-native';

import { space } from '../../theme/nativeTokens';
import { shellBottomNavBottomPadding } from './ShellBottomNav';

const originalPlatformOS = Platform.OS;

function setPlatformOS(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  });
}

afterEach(() => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => originalPlatformOS,
  });
});

describe('ShellBottomNav safe-area padding', () => {
  it('keeps Android tab content above the full system-navigation inset', () => {
    setPlatformOS('android');

    expect(shellBottomNavBottomPadding(24)).toBe(24 + space('Spacing/8'));
  });

  it('preserves the minimum Android padding when there is no system inset', () => {
    setPlatformOS('android');

    expect(shellBottomNavBottomPadding(0)).toBe(space('Spacing/12'));
  });
});
