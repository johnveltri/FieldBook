import { describe, expect, it, vi } from 'vitest';

import { cleanExpiredExportArtifacts } from './job-export-cleanup';

describe('expired export cleanup', () => {
  it('scrubs successful deletions and retains failed objects for a later retry', async () => {
    const markExpired = vi.fn().mockResolvedValue(undefined);
    const removeObject = vi.fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('storage unavailable'));
    const scrubDeleted = vi.fn().mockResolvedValue(undefined);
    const logDeletionFailure = vi.fn();
    const now = Date.parse('2026-08-30T12:00:00.000Z');

    await cleanExpiredExportArtifacts([
      { id: 'recent', object_path: 'user/recent/job-summary.csv', expires_at: '2026-08-30T11:00:00.000Z' },
      { id: 'overdue', object_path: 'user/overdue/job-summary.csv', expires_at: '2026-08-29T08:00:00.000Z' },
    ], { markExpired, removeObject, scrubDeleted, logDeletionFailure, now: () => now });

    expect(markExpired).toHaveBeenCalledTimes(2);
    expect(scrubDeleted).toHaveBeenCalledTimes(1);
    expect(scrubDeleted).toHaveBeenCalledWith('recent', '2026-08-30T12:00:00.000Z');
    expect(logDeletionFailure).toHaveBeenCalledWith({ requestId: 'overdue', overdue: true });
  });
});
