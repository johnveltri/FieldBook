import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  clearPostHogFlagCacheForTests,
  fetchPostHogBooleanFlag,
} from './posthogFlags';

jest.mock('../analytics/config', () => ({
  analyticsConfig: {
    posthogKey: 'ph_test_key',
    posthogHost: 'https://us.i.posthog.com',
  },
}));

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

  it('posts only the Supabase user UUID as distinct id', async () => {
    (global.fetch as jest.Mock<any>).mockResolvedValue({
      ok: true,
      json: async () => ({ featureFlags: { 'job-detail-fullscreen-edit': true } }),
    });

    await expect(
      fetchPostHogBooleanFlag('job-detail-fullscreen-edit', {
        distinctId: 'user-1',
      }),
    ).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith('https://us.i.posthog.com/flags?v=2', expect.objectContaining({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: 'ph_test_key',
        distinct_id: 'user-1',
      }),
      signal: expect.any(AbortSignal),
    }));
  });

  it('fails closed on HTTP errors', async () => {
    (global.fetch as jest.Mock<any>).mockResolvedValue({ ok: false });

    await expect(
      fetchPostHogBooleanFlag('job-detail-fullscreen-edit', {
        distinctId: 'user-1',
      }),
    ).resolves.toBe(false);
  });

  it('fails closed when PostHog throws', async () => {
    (global.fetch as jest.Mock<any>).mockRejectedValue(new Error('Network down'));

    await expect(
      fetchPostHogBooleanFlag('job-detail-fullscreen-edit', { distinctId: 'user-1' }),
    ).resolves.toBe(false);
  });

  it('fails closed when PostHog never resolves', async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock<any>).mockReturnValue(new Promise(() => {}));

    const result = fetchPostHogBooleanFlag('job-detail-fullscreen-edit', {
      distinctId: 'user-1',
    });
    await jest.advanceTimersByTimeAsync(4_000);

    await expect(result).resolves.toBe(false);
    const requestInit = (global.fetch as jest.Mock<any>).mock.calls[0]?.[1] as RequestInit;
    expect(requestInit.signal?.aborted).toBe(true);
    jest.useRealTimers();
  });

  it('uses in-memory cache for repeated lookups', async () => {
    (global.fetch as jest.Mock<any>).mockResolvedValue({
      ok: true,
      json: async () => ({ featureFlags: { 'job-detail-fullscreen-edit': true } }),
    });

    const input = { distinctId: 'user-1' };

    await expect(fetchPostHogBooleanFlag('job-detail-fullscreen-edit', input)).resolves.toBe(true);
    await expect(fetchPostHogBooleanFlag('job-detail-fullscreen-edit', input)).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
