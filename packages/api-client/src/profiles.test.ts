import { describe, expect, it } from 'vitest';

import { updateCurrentUserProfile } from './profiles';
import { makeBuilder, makeClient } from './testUtils';

describe('profiles api client', () => {
  it('updates only editable profile columns for an existing row', async () => {
    let updated: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        profiles: [
          makeBuilder({
            onUpdate: (patch) => {
              updated = patch;
            },
            maybeSingleResult: {
              data: {
                id: 'user-1',
                first_name: 'Jane',
                last_name: 'Doe',
                trades: ['HVAC'],
              },
              error: null,
            },
          }),
        ],
      },
    });

    await expect(
      updateCurrentUserProfile(client as never, {
        firstName: ' Jane ',
        lastName: 'Doe',
        trades: [' HVAC ', 'hvac', ''],
      }),
    ).resolves.toEqual({
      id: 'user-1',
      firstName: 'Jane',
      lastName: 'Doe',
      trades: ['HVAC'],
    });

    expect(updated).toEqual({
      first_name: 'Jane',
      last_name: 'Doe',
      trades: ['HVAC'],
    });
    expect(updated).not.toHaveProperty('id');
  });

  it('inserts an owner-scoped row when the profile is missing', async () => {
    let inserted: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        profiles: [
          makeBuilder({
            maybeSingleResult: { data: null, error: null },
          }),
          makeBuilder({
            onInsert: (payload) => {
              inserted = payload;
            },
            maybeSingleResult: {
              data: {
                id: 'user-1',
                first_name: 'Jane',
                last_name: null,
                trades: [],
              },
              error: null,
            },
          }),
        ],
      },
    });

    await expect(
      updateCurrentUserProfile(client as never, { firstName: 'Jane' }),
    ).resolves.toEqual({
      id: 'user-1',
      firstName: 'Jane',
      lastName: null,
      trades: [],
    });

    expect(inserted).toEqual({ id: 'user-1', first_name: 'Jane' });
  });
});
