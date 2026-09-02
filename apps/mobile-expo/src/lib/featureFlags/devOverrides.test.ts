import { describe, expect, it } from '@jest/globals';

import { isJobDetailFullscreenEditDevOverrideEnabled } from './devOverrides';

describe('isJobDetailFullscreenEditDevOverrideEnabled', () => {
  it('is enabled only in development dev builds with env true', () => {
    expect(
      isJobDetailFullscreenEditDevOverrideEnabled({
        dev: true,
        environment: 'development',
        envValue: 'true',
      }),
    ).toBe(true);
  });

  it('is disabled in production environment', () => {
    expect(
      isJobDetailFullscreenEditDevOverrideEnabled({
        dev: true,
        environment: 'production',
        envValue: 'true',
      }),
    ).toBe(false);
  });

  it('is disabled in release builds', () => {
    expect(
      isJobDetailFullscreenEditDevOverrideEnabled({
        dev: false,
        environment: 'development',
        envValue: 'true',
      }),
    ).toBe(false);
  });

  it('is disabled when env is unset or false', () => {
    expect(
      isJobDetailFullscreenEditDevOverrideEnabled({
        dev: true,
        environment: 'development',
        envValue: undefined,
      }),
    ).toBe(false);
    expect(
      isJobDetailFullscreenEditDevOverrideEnabled({
        dev: true,
        environment: 'development',
        envValue: 'false',
      }),
    ).toBe(false);
  });
});
