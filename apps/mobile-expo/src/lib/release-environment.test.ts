import { describe, expect, it } from '@jest/globals';

const { validateReleaseEnvironment } = require('../../release-env') as {
  validateReleaseEnvironment: (env: Record<string, string | undefined>) => void;
};

const hostedReleaseEnv = {
  EAS_BUILD: 'true',
  EXPO_PUBLIC_APP_ENV: 'production',
  EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
  EXPO_PUBLIC_ANALYTICS_DEBUG_RICH: 'false',
  EXPO_PUBLIC_ANALYTICS_PROVIDER: 'posthog',
  EXPO_PUBLIC_POSTHOG_KEY: 'posthog-project-key',
};

describe('validateReleaseEnvironment', () => {
  it('allows local Supabase during development', () => {
    expect(() =>
      validateReleaseEnvironment({
        EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      }),
    ).not.toThrow();
  });

  it('validates explicit local release exports', () => {
    expect(() =>
      validateReleaseEnvironment({
        ...hostedReleaseEnv,
        EAS_BUILD: undefined,
        FIELDSOLO_RELEASE_EXPORT: 'true',
      }),
    ).not.toThrow();
  });

  it('accepts a privacy-safe hosted production environment', () => {
    expect(() => validateReleaseEnvironment(hostedReleaseEnv)).not.toThrow();
  });

  it('rejects a local backend for production builds', () => {
    expect(() =>
      validateReleaseEnvironment({
        ...hostedReleaseEnv,
        EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      }),
    ).toThrow('HTTPS hosted Supabase URL');
  });

  it('rejects rich analytics debugging for production builds', () => {
    expect(() =>
      validateReleaseEnvironment({
        ...hostedReleaseEnv,
        EXPO_PUBLIC_ANALYTICS_DEBUG_RICH: 'true',
      }),
    ).toThrow('EXPO_PUBLIC_ANALYTICS_DEBUG_RICH=false');
  });

  it('requires consent-gated PostHog configuration for production builds', () => {
    expect(() =>
      validateReleaseEnvironment({
        ...hostedReleaseEnv,
        EXPO_PUBLIC_ANALYTICS_PROVIDER: 'none',
      }),
    ).toThrow('EXPO_PUBLIC_ANALYTICS_PROVIDER=posthog');

    expect(() =>
      validateReleaseEnvironment({
        ...hostedReleaseEnv,
        EXPO_PUBLIC_POSTHOG_KEY: '',
      }),
    ).toThrow('EXPO_PUBLIC_POSTHOG_KEY');
  });
});
