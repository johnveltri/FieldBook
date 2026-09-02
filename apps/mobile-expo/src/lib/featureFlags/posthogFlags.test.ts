import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  clearPostHogFlagCacheForTests,
  fetchPostHogBooleanFlag,
  normalizeDebugEmail,
} from './posthogFlags';

jest.mock('../analytics/config', () => ({
  analyticsConfig: {
    posthogKey: 'ph_test_key',
    posthogHost: 'https://us.i.posthog.com',
  },
}));

describe('normalizeDebugEmail', () => {
  it('lowercases and trims email', () => {
    expect(normalizeDebugEmail('  User@Example.COM ')).toBe('user@example.com');
  });

  it('returns null for blank email', () => {
    expect(normalizeDebugEmail('   ')).toBeNull();
    expect(normalizeDebugEmail(null)).toBeNull();
  });
});

describe('fetchPostHogBooleanFlag', () => {
  beforeEach(() => {
    clearPostHogFlagCacheForTests();
    global.fetch = jest.fn() as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns false when distinct id is missing', async () => {
    await expect(
      fetchPostHogBooleanFlag('job-detail-fullscreen-edit', { distinctId: '  ' }),
    ).resolves.toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('posts distinct id and debug_email to PostHog flags endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ featureFlags: { 'job-detail-fullscreen-edit': true } }),
    });

    await expect(
      fetchPostHogBooleanFlag('job-detail-fullscreen-edit', {
        distinctId: 'user-1',
        personProperties: { debug_email: 'user@example.com' },
      }),
    ).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith('https://us.i.posthog.com/flags?v=2', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: 'ph_test_key',
        distinct_id: 'user-1',
        person_properties: { debug_email: 'user@example.com' },
      }),
    });
  });

  it('fails closed on HTTP errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    await expect(
      fetchPostHogBooleanFlag('job-detail-fullscreen-edit', {
        distinctId: 'user-1',
      }),
    ).resolves.toBe(false);
  });

  it('uses in-memory cache for repeated lookups', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ featureFlags: { 'job-detail-fullscreen-edit': true } }),
    });

    const input = {
      distinctId: 'user-1',
      personProperties: { debug_email: 'user@example.com' },
    };

    await expect(fetchPostHogBooleanFlag('job-detail-fullscreen-edit', input)).resolves.toBe(true);
    await expect(fetchPostHogBooleanFlag('job-detail-fullscreen-edit', input)).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
