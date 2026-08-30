import { describe, expect, it } from 'vitest';

import { buildExportDeletionPlan } from './job-export-deletion';

describe('account deletion export cleanup plan', () => {
  it('blocks Auth deletion while a worker is active and includes deterministic upload paths', () => {
    const plan = buildExportDeletionPlan('user-1', [
      { id: 'ready', generation_state: 'ready', object_path: 'user-1/ready/job-summary.csv' },
      { id: 'claimed', generation_state: 'processing', object_path: null },
    ]);

    expect(plan.generationInFlight).toBe(true);
    expect(plan.objectPaths).toEqual([
      'user-1/ready/job-summary.csv',
      'user-1/claimed/job-summary.csv',
    ]);
  });
});
