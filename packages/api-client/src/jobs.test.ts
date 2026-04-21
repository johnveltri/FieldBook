import { describe, expect, it } from 'vitest';

import { fetchJobDetail } from './jobDetail';
import {
  createBlankJobForCurrentUser,
  deleteJobById,
  listJobsForCurrentUser,
  updateJobById,
} from './jobs';
import { makeBuilder, makeClient } from './testUtils';

describe('jobs api client', () => {
  it('createBlankJobForCurrentUser inserts required defaults and returns id', async () => {
    let inserted: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        jobs: [
          makeBuilder({
            onInsert: (payload) => {
              inserted = payload;
            },
            singleResult: { data: { id: 'job-123' }, error: null },
          }),
        ],
      },
    });

    const id = await createBlankJobForCurrentUser(client as never);

    expect(id).toBe('job-123');
    expect(inserted).toEqual({
      user_id: 'user-1',
      short_description: 'Untitled Job',
      customer_name: '',
      service_address: '',
      job_type: '',
      created_via: 'add_job',
      job_work_status: 'not_started',
    });
  });

  it('createBlankJobForCurrentUser throws without authenticated user', async () => {
    const client = makeClient({
      authUserId: null,
      buildersByTable: { jobs: [] },
    });

    await expect(createBlankJobForCurrentUser(client as never)).rejects.toThrow(
      'No authenticated user available to create a job.',
    );
  });

  it('deleteJobById performs soft-delete and validates affected rows', async () => {
    let patch: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        jobs: [
          makeBuilder({
            onUpdate: (value) => {
              patch = value;
            },
            maybeSingleResult: { data: { id: 'job-1' }, error: null },
          }),
        ],
      },
    });

    await deleteJobById(client as never, 'job-1');

    expect(typeof (patch as { deleted_at: unknown }).deleted_at).toBe('string');
    expect(Date.parse((patch as { deleted_at: string }).deleted_at)).not.toBeNaN();
  });

  it('deleteJobById throws when no rows are affected', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        jobs: [
          makeBuilder({
            maybeSingleResult: { data: null, error: null },
          }),
        ],
      },
    });

    await expect(deleteJobById(client as never, 'job-1')).rejects.toThrow(
      'Delete affected no rows',
    );
  });

  it('updateJobById validates input and normalizes strings', async () => {
    let patch: unknown;
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        jobs: [
          makeBuilder({
            onUpdate: (value) => {
              patch = value;
            },
            maybeSingleResult: { data: { id: 'job-1' }, error: null },
          }),
        ],
      },
    });

    await updateJobById(client as never, 'job-1', {
      shortDescription: '  Replace ceiling fan  ',
      customerName: '  Jane Doe ',
      serviceAddress: '  101 Main St ',
      revenueCents: 125000,
      jobType: '  Electrical ',
    });

    expect(patch).toEqual({
      short_description: 'Replace ceiling fan',
      customer_name: 'Jane Doe',
      service_address: '101 Main St',
      revenue_cents: 125000,
      job_type: 'Electrical',
    });
  });

  it('updateJobById rejects blank titles and invalid revenue', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        jobs: [makeBuilder({ maybeSingleResult: { data: { id: 'job-1' }, error: null } })],
      },
    });

    await expect(
      updateJobById(client as never, 'job-1', {
        shortDescription: '   ',
        customerName: '',
        serviceAddress: '',
        revenueCents: 0,
        jobType: '',
      }),
    ).rejects.toThrow('Job title is required.');

    await expect(
      updateJobById(client as never, 'job-1', {
        shortDescription: 'Valid title',
        customerName: '',
        serviceAddress: '',
        revenueCents: -1,
        jobType: '',
      }),
    ).rejects.toThrow('Revenue must be a non-negative dollar amount.');

    await expect(
      updateJobById(client as never, 'job-1', {
        shortDescription: 'Valid title',
        customerName: '',
        serviceAddress: '',
        revenueCents: 99.5,
        jobType: '',
      }),
    ).rejects.toThrow('Revenue must be a non-negative dollar amount.');
  });

  it('listJobsForCurrentUser computes metrics from non-discarded sessions and material dedupe', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        jobs: [
          makeBuilder({
            awaitResult: {
              data: [
                {
                  id: 'job-1',
                  short_description: 'Install faucet',
                  customer_name: 'Alice',
                  updated_at: '2026-04-17T10:00:00.000Z',
                  job_type: 'plumbing',
                  job_work_status: 'completed',
                  job_payment_state: 'paid',
                  revenue_cents: 50000,
                  collected_cents: 50000,
                },
              ],
              error: null,
            },
          }),
        ],
        sessions: [
          makeBuilder({
            awaitResult: {
              data: [
                {
                  id: 'sess-ended',
                  job_id: 'job-1',
                  session_status: 'ended',
                  started_at: '2026-04-16T10:00:00.000Z',
                  ended_at: '2026-04-16T12:00:00.000Z',
                },
                {
                  id: 'sess-discarded',
                  job_id: 'job-1',
                  session_status: 'discarded',
                  started_at: '2026-04-17T10:00:00.000Z',
                  ended_at: null,
                },
              ],
              error: null,
            },
          }),
        ],
        materials: [
          makeBuilder({
            awaitResult: {
              data: [
                {
                  id: 'mat-shared',
                  job_id: 'job-1',
                  session_id: 'sess-ended',
                  total_cost_cents: 4000,
                },
                {
                  id: 'mat-job-only',
                  job_id: 'job-1',
                  session_id: null,
                  total_cost_cents: 1000,
                },
              ],
              error: null,
            },
          }),
          makeBuilder({
            awaitResult: {
              data: [
                {
                  id: 'mat-shared',
                  job_id: 'job-1',
                  session_id: 'sess-ended',
                  total_cost_cents: 4000,
                },
              ],
              error: null,
            },
          }),
        ],
      },
    });

    const rows = await listJobsForCurrentUser(client as never);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'job-1',
      workStatus: 'paid',
      timeLabel: '2.0h',
      revenueCents: 50000,
      materialsCents: -5000,
      netEarningsCents: 45000,
      collectedCents: 50000,
    });
    expect(rows[0].lastWorkedLabel).toContain('Last worked');
  });

  it('list and detail stay aligned for shared job fields and earnings', async () => {
    const jobsBuilder = makeBuilder({
      awaitResult: {
        data: [
          {
            id: 'job-sync',
            short_description: 'Water heater replacement',
            customer_name: 'Bob',
            updated_at: '2026-04-17T10:00:00.000Z',
            job_type: 'plumbing',
            job_work_status: 'completed',
            job_payment_state: 'pending',
            revenue_cents: 120000,
            collected_cents: 0,
          },
        ],
        error: null,
      },
    });

    const sessionsForListBuilder = makeBuilder({
      awaitResult: {
        data: [
          {
            id: 'sess-sync',
            job_id: 'job-sync',
            session_status: 'ended',
            started_at: '2026-04-16T09:00:00.000Z',
            ended_at: '2026-04-16T12:00:00.000Z',
          },
        ],
        error: null,
      },
    });

    const matsListByJobBuilder = makeBuilder({
      awaitResult: {
        data: [
          {
            id: 'mat-sync',
            job_id: 'job-sync',
            session_id: 'sess-sync',
            total_cost_cents: 7000,
          },
        ],
        error: null,
      },
    });

    const matsListBySessionBuilder = makeBuilder({
      awaitResult: {
        data: [
          {
            id: 'mat-sync',
            job_id: 'job-sync',
            session_id: 'sess-sync',
            total_cost_cents: 7000,
          },
        ],
        error: null,
      },
    });

    const jobDetailJobBuilder = makeBuilder({
      maybeSingleResult: {
        data: {
          id: 'job-sync',
          short_description: 'Water heater replacement',
          customer_name: 'Bob',
          service_address: '22 Cedar St',
          job_type: 'plumbing',
          job_work_status: 'completed',
          job_payment_state: 'pending',
          revenue_cents: 120000,
          collected_cents: 0,
          updated_at: '2026-04-17T10:00:00.000Z',
        },
        error: null,
      },
    });

    const sessionsForDetailBuilder = makeBuilder({
      awaitResult: {
        data: [
          {
            id: 'sess-sync',
            job_id: 'job-sync',
            session_status: 'ended',
            started_at: '2026-04-16T09:00:00.000Z',
            ended_at: '2026-04-16T12:00:00.000Z',
          },
        ],
        error: null,
      },
    });

    const notesBuilder = makeBuilder({
      awaitResult: { data: [], error: null },
    });
    const matsDetailByJobBuilder = makeBuilder({
      awaitResult: {
        data: [
          {
            id: 'mat-sync',
            job_id: 'job-sync',
            session_id: 'sess-sync',
            description: 'Pipe fittings',
            quantity: 1,
            unit: 'ea',
            total_cost_cents: 7000,
            created_at: '2026-04-16T12:30:00.000Z',
          },
        ],
        error: null,
      },
    });
    const matsDetailBySessionBuilder = makeBuilder({
      awaitResult: {
        data: [
          {
            id: 'mat-sync',
            job_id: 'job-sync',
            session_id: 'sess-sync',
            description: 'Pipe fittings',
            quantity: 1,
            unit: 'ea',
            total_cost_cents: 7000,
            created_at: '2026-04-16T12:30:00.000Z',
          },
        ],
        error: null,
      },
    });
    const activityBuilder = makeBuilder({
      awaitResult: { data: [], error: null },
    });

    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        jobs: [jobsBuilder, jobDetailJobBuilder],
        sessions: [sessionsForListBuilder, sessionsForDetailBuilder],
        materials: [
          matsListByJobBuilder,
          matsListBySessionBuilder,
          matsDetailByJobBuilder,
          matsDetailBySessionBuilder,
        ],
        notes: [notesBuilder],
        job_activity_events: [activityBuilder],
      },
    });

    const [listRows, detail] = await Promise.all([
      listJobsForCurrentUser(client as never),
      fetchJobDetail(client as never, 'job-sync'),
    ]);

    expect(detail).not.toBeNull();
    expect(listRows).toHaveLength(1);

    const listRow = listRows[0];
    const jobDetail = detail!;

    expect(listRow.id).toBe(jobDetail.id);
    expect(listRow.shortDescription).toBe(jobDetail.shortDescription);
    expect(listRow.customerName).toBe(jobDetail.customerName);
    expect(listRow.revenueCents).toBe(jobDetail.earnings.revenueCents);
    expect(listRow.materialsCents).toBe(jobDetail.earnings.materialsCents);
    expect(listRow.netEarningsCents).toBe(jobDetail.earnings.netEarningsCents);
    expect(listRow.timeLabel).toBe(jobDetail.metrics.timeLabel);
  });

  it('fetchJobDetail includes only ended sessions in the sessions list', async () => {
    const client = makeClient({
      authUserId: 'user-1',
      buildersByTable: {
        jobs: [
          makeBuilder({
            maybeSingleResult: {
              data: {
                id: 'job-2',
                short_description: 'Panel upgrade',
                customer_name: 'Casey',
                service_address: '44 North Ave',
                job_type: 'electrical',
                job_work_status: 'in_progress',
                job_payment_state: 'pending',
                revenue_cents: 150000,
                collected_cents: 0,
                updated_at: '2026-04-17T10:00:00.000Z',
              },
              error: null,
            },
          }),
        ],
        sessions: [
          makeBuilder({
            awaitResult: {
              data: [
                {
                  id: 'sess-ended',
                  job_id: 'job-2',
                  session_status: 'ended',
                  started_at: '2026-04-16T09:00:00.000Z',
                  ended_at: '2026-04-16T10:00:00.000Z',
                },
                {
                  id: 'sess-progress',
                  job_id: 'job-2',
                  session_status: 'in_progress',
                  started_at: '2026-04-17T09:00:00.000Z',
                  ended_at: null,
                },
              ],
              error: null,
            },
          }),
        ],
        notes: [makeBuilder({ awaitResult: { data: [], error: null } })],
        materials: [
          makeBuilder({ awaitResult: { data: [], error: null } }),
          makeBuilder({ awaitResult: { data: [], error: null } }),
        ],
        job_activity_events: [makeBuilder({ awaitResult: { data: [], error: null } })],
      },
    });

    const detail = await fetchJobDetail(client as never, 'job-2');

    expect(detail).not.toBeNull();
    expect(detail?.sessions.map((s) => s.id)).toEqual(['sess-ended']);
  });
});
