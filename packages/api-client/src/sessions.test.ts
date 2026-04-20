import { describe, expect, it } from 'vitest';

import { createManualSession, discardSession, updateSessionTimes } from './sessions';
import { makeBuilder, makeClient } from './testUtils';

describe('sessions api client', () => {
  it('createManualSession inserts manual ended session and returns id', async () => {
    let inserted: unknown;
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
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        sessions: [
          makeBuilder({
            onUpdate: (value) => {
              patch = value;
            },
            maybeSingleResult: { data: { id: 'sess-1' }, error: null },
          }),
        ],
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

  it('discardSession marks discarded_at and clears ended_at', async () => {
    let patch: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        sessions: [
          makeBuilder({
            onUpdate: (value) => {
              patch = value;
            },
            maybeSingleResult: { data: { id: 'sess-2' }, error: null },
          }),
        ],
      },
    });

    await discardSession(client as never, 'sess-2');

    expect((patch as { session_status: string }).session_status).toBe('discarded');
    expect((patch as { ended_at: null }).ended_at).toBeNull();
    expect(typeof (patch as { discarded_at: string }).discarded_at).toBe('string');
    expect(Date.parse((patch as { discarded_at: string }).discarded_at)).not.toBeNaN();
  });
});
