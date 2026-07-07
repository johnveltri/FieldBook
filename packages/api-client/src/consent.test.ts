import { describe, expect, it } from 'vitest';

import {
  fetchLatestLegalAcceptanceVersions,
  needsLegalReacceptance,
  recordLegalAcceptance,
  recordReacceptanceLegalAcceptances,
  recordSignupLegalAcceptances,
} from './consent';
import { makeBuilder, makeClient } from './testUtils';

describe('consent api client', () => {
  it('recordLegalAcceptance inserts a versioned acceptance row for the current user', async () => {
    let inserted: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        legal_acceptances: [
          makeBuilder({
            onInsert: (payload) => {
              inserted = payload;
            },
          }),
        ],
      },
    });

    await recordLegalAcceptance(client as never, {
      documentType: 'privacy_policy',
      documentVersion: '2026-07-03',
      source: 'mobile_reacceptance',
      appVersion: '1.0.0',
      platform: 'ios',
    });

    expect(inserted).toEqual({
      user_id: 'user-1',
      document_type: 'privacy_policy',
      document_version: '2026-07-03',
      source: 'mobile_reacceptance',
      app_version: '1.0.0',
      platform: 'ios',
    });
  });

  it('recordSignupLegalAcceptances inserts privacy and terms rows', async () => {
    let inserted: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        legal_acceptances: [
          makeBuilder({
            onInsert: (payload) => {
              inserted = payload;
            },
          }),
        ],
      },
    });

    await recordSignupLegalAcceptances(client as never, {
      privacyVersion: '2026-07-03',
      termsVersion: '2026-07-03',
      appVersion: '1.0.0',
      platform: 'android',
    });

    expect(inserted).toEqual([
      {
        user_id: 'user-1',
        document_type: 'privacy_policy',
        document_version: '2026-07-03',
        source: 'mobile_signup',
        app_version: '1.0.0',
        platform: 'android',
      },
      {
        user_id: 'user-1',
        document_type: 'terms',
        document_version: '2026-07-03',
        source: 'mobile_signup',
        app_version: '1.0.0',
        platform: 'android',
      },
    ]);
  });

  it('recordReacceptanceLegalAcceptances inserts rows with mobile_reacceptance source', async () => {
    let inserted: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        legal_acceptances: [
          makeBuilder({
            onInsert: (payload) => {
              inserted = payload;
            },
          }),
        ],
      },
    });

    await recordReacceptanceLegalAcceptances(client as never, {
      privacyVersion: '2026-07-04',
      termsVersion: '2026-07-04',
    });

    expect(inserted).toEqual([
      expect.objectContaining({
        source: 'mobile_reacceptance',
        document_type: 'privacy_policy',
        document_version: '2026-07-04',
      }),
      expect.objectContaining({
        source: 'mobile_reacceptance',
        document_type: 'terms',
        document_version: '2026-07-04',
      }),
    ]);
  });

  it('fetchLatestLegalAcceptanceVersions returns the newest version per document type', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        legal_acceptances: [
          makeBuilder({
            awaitResult: {
              data: [
                {
                  document_type: 'terms',
                  document_version: '2026-07-04',
                  accepted_at: '2026-07-04T12:00:00Z',
                },
                {
                  document_type: 'privacy_policy',
                  document_version: '2026-07-03',
                  accepted_at: '2026-07-03T12:00:00Z',
                },
                {
                  document_type: 'privacy_policy',
                  document_version: '2026-06-01',
                  accepted_at: '2026-06-01T12:00:00Z',
                },
              ],
              error: null,
            },
          }),
        ],
      },
    });

    const versions = await fetchLatestLegalAcceptanceVersions(client as never);

    expect(versions).toEqual({
      privacyPolicyVersion: '2026-07-03',
      termsVersion: '2026-07-04',
    });
  });

  it('needsLegalReacceptance is true when either document version is missing or stale', () => {
    expect(
      needsLegalReacceptance(
        { privacyPolicyVersion: null, termsVersion: null },
        { privacyVersion: '2026-07-03', termsVersion: '2026-07-03' },
      ),
    ).toBe(true);

    expect(
      needsLegalReacceptance(
        { privacyPolicyVersion: '2026-07-03', termsVersion: '2026-06-01' },
        { privacyVersion: '2026-07-03', termsVersion: '2026-07-03' },
      ),
    ).toBe(true);

    expect(
      needsLegalReacceptance(
        { privacyPolicyVersion: '2026-07-03', termsVersion: '2026-07-03' },
        { privacyVersion: '2026-07-03', termsVersion: '2026-07-03' },
      ),
    ).toBe(false);
  });
});
