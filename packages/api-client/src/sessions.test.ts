import { describe, expect, it, vi } from 'vitest';

import { createManualSession, deleteSession, updateSessionTimes } from './sessions';
import { makeBuilder, makeClient } from './testUtils';

describe('sessions api client', () => {
  it('createManualSession inserts manual ended session and returns id', async () => {
    let inserted: unknown;
    let jobPatch: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        sessions: [
          makeBuilder({
            onInsert: (payload) => {
              inserted = payload;
            },
            singleResult: { data: { id: 'sess-123' }, error: null },
          }),
        ],
        jobs: [
          makeBuilder({
            onUpdate: (patch) => {
              jobPatch = patch;
            },
            awaitResult: { data: null, error: null },
          }),
        ],
      },
    });

    const id = await createManualSession(client as never, {
      jobId: 'job-9',
      startedAt: '2026-04-17T13:00:00.000Z',
      endedAt: '2026-04-17T14:30:00.000Z',
    });

    expect(id).toBe('sess-123');
    expect(inserted).toEqual({
      job_id: 'job-9',
      user_id: 'user-1',
      entry_mode: 'manual',
      session_status: 'ended',
      started_at: '2026-04-17T13:00:00.000Z',
      ended_at: '2026-04-17T14:30:00.000Z',
    });
    expect(jobPatch).toEqual({
      job_work_status: 'in_progress',
      job_payment_state: null,
    });
  });

  it('createManualSession throws when no authenticated user exists', async () => {
    const client = makeClient({
      authUserId: null,
      buildersByTable: { sessions: [] },
    });

    await expect(
      createManualSession(client as never, {
        jobId: 'job-9',
        startedAt: '2026-04-17T13:00:00.000Z',
        endedAt: '2026-04-17T14:30:00.000Z',
      }),
    ).rejects.toThrow('No authenticated user available to create a session.');
  });

  it('updateSessionTimes updates start and end timestamps', async () => {
    let patch: unknown;
    const builder = makeBuilder({
      onUpdate: (value) => {
        patch = value;
      },
      maybeSingleResult: { data: { id: 'sess-1' }, error: null },
    });
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        sessions: [builder],
      },
    });

    await updateSessionTimes(client as never, 'sess-1', {
      startedAt: '2026-04-17T09:00:00.000Z',
      endedAt: '2026-04-17T10:00:00.000Z',
    });

    expect(patch).toEqual({
      started_at: '2026-04-17T09:00:00.000Z',
      ended_at: '2026-04-17T10:00:00.000Z',
    });
    expect((builder.in as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('session_status', [
      'ended',
      'in_progress',
    ]);
  });

  it('updateSessionTimes rejects invalid ranges', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        sessions: [makeBuilder({ maybeSingleResult: { data: { id: 'sess-1' }, error: null } })],
      },
    });

    await expect(
      updateSessionTimes(client as never, 'sess-1', {
        startedAt: '2026-04-17T11:00:00.000Z',
        endedAt: '2026-04-17T10:00:00.000Z',
      }),
    ).rejects.toThrow('Session end time must be on or after start time.');
  });

  it('deleteSession soft-deletes by marking deleted_at and clearing ended_at', async () => {
    let patch: unknown;
    const builder = makeBuilder({
      onUpdate: (value) => {
        patch = value;
      },
      maybeSingleResult: { data: { id: 'sess-2' }, error: null },
    });
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        sessions: [builder],
      },
    });

    await deleteSession(client as never, 'sess-2');

    expect((patch as { session_status: string }).session_status).toBe('deleted');
    expect((patch as { ended_at: null }).ended_at).toBeNull();
    expect(typeof (patch as { deleted_at: string }).deleted_at).toBe('string');
    expect(Date.parse((patch as { deleted_at: string }).deleted_at)).not.toBeNaN();
    expect((builder.in as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('session_status', [
      'ended',
      'in_progress',
    ]);
  });

  it('deleteSession rejects already-deleted sessions', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        sessions: [makeBuilder({ maybeSingleResult: { data: null, error: null } })],
      },
    });

    await expect(deleteSession(client as never, 'sess-2')).rejects.toThrow(
      'Delete affected no active rows (session may already be deleted or not owned by you).',
    );
  });
});
