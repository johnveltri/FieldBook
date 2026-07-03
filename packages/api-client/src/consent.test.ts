import { describe, expect, it } from 'vitest';

import { recordLegalAcceptance, recordSignupLegalAcceptances } from './consent';
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
});
