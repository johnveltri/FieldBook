import { describe, expect, it } from 'vitest';

import { createNote, softDeleteNote, updateNote } from './notes';
import { makeBuilder, makeClient } from './testUtils';

describe('notes api client', () => {
  // --- createNote -----------------------------------------------------------

  it('createNote inserts an unassigned (job-scoped) note with session_id null', async () => {
    let inserted: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        notes: [
          makeBuilder({
            onInsert: (payload) => {
              inserted = payload;
            },
            singleResult: { data: { id: 'note-1' }, error: null },
          }),
        ],
      },
    });

    const id = await createNote(client as never, {
      jobId: 'job-9',
      sessionId: null,
      body: '  Replaced faucet  ',
    });

    expect(id).toBe('note-1');
    // Exactly one parent: job_id set, session_id null (satisfies notes_exactly_one_parent).
    expect(inserted).toEqual({
      user_id: 'user-1',
      body: 'Replaced faucet',
      job_id: 'job-9',
      session_id: null,
    });
  });

  it('createNote inserts a session-scoped note with job_id null', async () => {
    let inserted: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        notes: [
          makeBuilder({
            onInsert: (payload) => {
              inserted = payload;
            },
            singleResult: { data: { id: 'note-2' }, error: null },
          }),
        ],
      },
    });

    const id = await createNote(client as never, {
      jobId: 'job-9',
      sessionId: 'sess-1',
      body: 'Observed leak at joint',
    });

    expect(id).toBe('note-2');
    // Session-scoped: session_id set, job_id cleared.
    expect(inserted).toEqual({
      user_id: 'user-1',
      body: 'Observed leak at joint',
      job_id: null,
      session_id: 'sess-1',
    });
  });

  it('createNote throws when body is blank', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: { notes: [] },
    });

    await expect(
      createNote(client as never, { jobId: 'job-9', sessionId: null, body: '   ' }),
    ).rejects.toThrow('Note body must not be blank.');
  });

  it('createNote throws when no authenticated user exists', async () => {
    const client = makeClient({
      authUserId: null,
      buildersByTable: { notes: [] },
    });

    await expect(
      createNote(client as never, { jobId: 'job-9', sessionId: null, body: 'hello' }),
    ).rejects.toThrow('No authenticated user available to create a note.');
  });

  // --- updateNote -----------------------------------------------------------

  it('updateNote updates body only when sessionId is omitted', async () => {
    let patch: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        notes: [
          makeBuilder({
            onUpdate: (value) => {
              patch = value;
            },
            maybeSingleResult: { data: { id: 'note-1' }, error: null },
          }),
        ],
      },
    });

    await updateNote(client as never, 'note-1', { body: '  trimmed body  ' });

    expect(patch).toEqual({ body: 'trimmed body' });
  });

  it('updateNote moves a note to a session by clearing job_id in the same UPDATE', async () => {
    let patch: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        notes: [
          makeBuilder({
            onUpdate: (value) => {
              patch = value;
            },
            maybeSingleResult: { data: { id: 'note-1' }, error: null },
          }),
        ],
      },
    });

    await updateNote(client as never, 'note-1', { sessionId: 'sess-42' });

    // Both fields written in one UPDATE so notes_exactly_one_parent is never
    // transiently violated.
    expect(patch).toEqual({ job_id: null, session_id: 'sess-42' });
  });

  it('updateNote moves a session-scoped note back to unassigned by resolving parent job', async () => {
    let patch: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        // 1) SELECT current job_id/session_id on notes (session-scoped row).
        // 2) SELECT job_id from sessions to resolve parent job.
        // 3) UPDATE notes.
        notes: [
          makeBuilder({
            maybeSingleResult: {
              data: { job_id: null, session_id: 'sess-7' },
              error: null,
            },
          }),
          makeBuilder({
            onUpdate: (value) => {
              patch = value;
            },
            maybeSingleResult: { data: { id: 'note-1' }, error: null },
          }),
        ],
        sessions: [
          makeBuilder({
            maybeSingleResult: { data: { job_id: 'job-9' }, error: null },
          }),
        ],
      },
    });

    await updateNote(client as never, 'note-1', { sessionId: null });

    // Re-parented to the original job; session_id cleared in the same UPDATE.
    expect(patch).toEqual({ job_id: 'job-9', session_id: null });
  });

  it('updateNote combines body edit and session reassignment in one UPDATE', async () => {
    let patch: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        notes: [
          makeBuilder({
            onUpdate: (value) => {
              patch = value;
            },
            maybeSingleResult: { data: { id: 'note-1' }, error: null },
          }),
        ],
      },
    });

    await updateNote(client as never, 'note-1', {
      body: 'Updated body',
      sessionId: 'sess-5',
    });

    expect(patch).toEqual({
      body: 'Updated body',
      job_id: null,
      session_id: 'sess-5',
    });
  });

  it('updateNote rejects a blank body', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: { notes: [] },
    });

    await expect(
      updateNote(client as never, 'note-1', { body: '   ' }),
    ).rejects.toThrow('Note body must not be blank.');
  });

  it('updateNote throws when the target row is not affected (e.g. RLS)', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        notes: [
          makeBuilder({
            maybeSingleResult: { data: null, error: null },
          }),
        ],
      },
    });

    await expect(
      updateNote(client as never, 'note-1', { body: 'new body' }),
    ).rejects.toThrow('Update affected no rows (check RLS: note must be owned by you).');
  });

  // --- softDeleteNote -------------------------------------------------------

  it('softDeleteNote stamps deleted_at with an ISO timestamp', async () => {
    let patch: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        notes: [
          makeBuilder({
            onUpdate: (value) => {
              patch = value;
            },
            maybeSingleResult: { data: { id: 'note-1' }, error: null },
          }),
        ],
      },
    });

    await softDeleteNote(client as never, 'note-1');

    const row = patch as { deleted_at: string };
    expect(typeof row.deleted_at).toBe('string');
    expect(Date.parse(row.deleted_at)).not.toBeNaN();
  });

  it('softDeleteNote throws when no rows are affected', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        notes: [
          makeBuilder({
            maybeSingleResult: { data: null, error: null },
          }),
        ],
      },
    });

    await expect(softDeleteNote(client as never, 'note-1')).rejects.toThrow(
      'Delete affected no rows (check RLS: note must be owned by you).',
    );
  });
});
