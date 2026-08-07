import { describe, expect, it } from 'vitest';

import { createOtherCost } from './otherCosts';
import { makeBuilder, makeClient } from './testUtils';

describe('otherCosts api client', () => {
  it('createOtherCost inserts a non-material row', async () => {
    let inserted: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        job_costs: [
          makeBuilder({
            onInsert: (payload) => {
              inserted = payload;
            },
            singleResult: { data: { id: 'oc-1' }, error: null },
          }),
        ],
      },
    });

    const id = await createOtherCost(client as never, {
      jobId: 'job-9',
      sessionId: null,
      costType: 'permit',
      description: 'City permit',
      costCents: 12_000,
    });

    expect(id).toBe('oc-1');
    expect(inserted).toEqual({
      user_id: 'user-1',
      description: 'City permit',
      quantity: 1,
      unit: 'ea',
      unit_cost_cents: 12_000,
      total_cost_cents: 12_000,
      cost_type: 'permit',
      job_id: 'job-9',
      session_id: null,
    });
  });
});
