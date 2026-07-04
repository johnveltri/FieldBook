import { describe, expect, it } from 'vitest';

import {
  fetchAnalyticsConsentStatus,
  upsertAnalyticsConsentStatus,
} from './analyticsConsent';
import { makeBuilder, makeClient } from './testUtils';

describe('analytics consent api client', () => {
  it('fetchAnalyticsConsentStatus returns null when no row exists', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        analytics_consent: [
          makeBuilder({
            maybeSingleResult: { data: null, error: null },
          }),
        ],
      },
    });

    await expect(fetchAnalyticsConsentStatus(client as never)).resolves.toBeNull();
  });

  it('fetchAnalyticsConsentStatus returns the stored status', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        analytics_consent: [
          makeBuilder({
            maybeSingleResult: {
              data: { status: 'granted', updated_at: '2026-07-03T12:00:00Z' },
              error: null,
            },
          }),
        ],
      },
    });

    await expect(fetchAnalyticsConsentStatus(client as never)).resolves.toBe('granted');
  });

  it('upsertAnalyticsConsentStatus writes the user consent row', async () => {
    let upserted: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        analytics_consent: [
          makeBuilder({
            onUpsert: (payload) => {
              upserted = payload;
            },
          }),
        ],
      },
    });

    await upsertAnalyticsConsentStatus(client as never, 'withdrawn');

    expect(upserted).toEqual(
      expect.objectContaining({
        user_id: 'user-1',
        status: 'withdrawn',
      }),
    );
  });
});
