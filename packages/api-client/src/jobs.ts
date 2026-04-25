import type {
  Job,
  JobDetailWorkStatus,
  JobId,
  JobPaymentState,
} from '@fieldbook/shared-types';

import type { FieldbookSupabaseClient } from './client';

type JobsRow = {
  id: string;
  short_description: string;
  customer_name: string | null;
  updated_at: string;
  revenue_cents: number | null;
  job_payment_state: JobPaymentState | null;
  collected_cents: number | null;
};

type JobWorkStatusDb =
  | 'not_started'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'canceled';

function rowToJob(row: JobsRow): Job {
  return {
    id: row.id,
    shortDescription: row.short_description,
    customerName: row.customer_name,
    updatedAt: row.updated_at,
    revenueCents: row.revenue_cents,
    jobPaymentState: row.job_payment_state,
    collectedCents: row.collected_cents,
  };
}

/**
 * Returns the most recently updated job id visible to the current session (RLS).
 * Use with an authenticated Supabase client so only that user's rows are returned.
 */
export async function fetchFirstJobIdForCurrentUser(
  client: FieldbookSupabaseClient,
): Promise<string | null> {
  const { data, error } = await client
    .from('jobs')
    .select('id')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as { id: string } | null)?.id ?? null;
}

/** Loads a single row from `public.jobs` (see `backend/supabase/migrations`). */
export async function fetchJobById(
  client: FieldbookSupabaseClient,
  id: JobId,
): Promise<Job | null> {
  const { data, error } = await client
    .from('jobs')
    .select(
      'id, short_description, customer_name, updated_at, revenue_cents, job_payment_state, collected_cents',
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToJob(data as JobsRow);
}

export type UpdateJobInput = {
  shortDescription: string;
  customerName: string;
  serviceAddress: string;
  revenueCents: number | null;
  jobType: string;
};

export type ListJobsForCurrentUserItem = {
  id: JobId;
  shortDescription: string;
  customerName: string | null;
  updatedAt: string;
  lastWorkedLabel: string;
  timeLabel: string;
  jobType: string | null;
  workStatus: JobDetailWorkStatus;
  jobPaymentState: JobPaymentState | null;
  revenueCents: number | null;
  /** Optional: may be unavailable on older local schemas. */
  materialsCents: number | null;
  /** Optional: may be unavailable on older local schemas. */
  netEarningsCents: number | null;
  collectedCents: number | null;
};

type ListJobsRow = {
  id: string;
  short_description: string;
  customer_name: string | null;
  updated_at: string;
  job_type: string | null;
  job_work_status: JobWorkStatusDb;
  job_payment_state: JobPaymentState | null;
  revenue_cents: number | null;
  collected_cents: number | null;
};

type ListJobSessionRow = {
  id: string;
  job_id: string;
  session_status: 'in_progress' | 'ended' | 'deleted';
  started_at: string;
  ended_at: string | null;
};

type ListJobMaterialRow = {
  id: string;
  job_id: string | null;
  session_id: string | null;
  total_cost_cents: number;
};

function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

function mapWorkStatus(row: {
  job_work_status: JobWorkStatusDb;
  job_payment_state: JobPaymentState | null;
}): JobDetailWorkStatus {
  if (row.job_work_status === 'completed' && row.job_payment_state === 'paid') return 'paid';
  switch (row.job_work_status) {
    case 'not_started':
      return 'notStarted';
    case 'in_progress':
      return 'inProgress';
    case 'on_hold':
      return 'onHold';
    case 'completed':
      return 'completed';
    case 'canceled':
      return 'cancelled';
    default:
      return 'notStarted';
  }
}

/**
 * Returns all jobs visible to the signed-in user (RLS), newest first.
 */
export async function listJobsForCurrentUser(
  client: FieldbookSupabaseClient,
): Promise<ListJobsForCurrentUserItem[]> {
  const { data, error } = await client
    .from('jobs')
    .select(
      'id, short_description, customer_name, updated_at, job_type, job_work_status, job_payment_state, revenue_cents, collected_cents',
    )
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as ListJobsRow[];
  if (rows.length === 0) return [];

  const jobIds = rows.map((row) => row.id);
  const { data: sessionsData, error: sessionsError } = await client
    .from('sessions')
    .select('id, job_id, session_status, started_at, ended_at')
    .in('job_id', jobIds);
  if (sessionsError) throw sessionsError;

  const sessions = ((sessionsData ?? []) as ListJobSessionRow[]).filter(
    (s) => s.session_status !== 'deleted',
  );
  const sessionJobIdBySessionId = new Map<string, string>();
  const totalHoursByJobId = new Map<string, number>();
  for (const s of sessions) {
    sessionJobIdBySessionId.set(s.id, s.job_id);
    if (s.session_status === 'ended' || s.session_status === 'in_progress') {
      const a = new Date(s.started_at).getTime();
      const b = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
      const hours = Math.max(0, (b - a) / 3_600_000);
      totalHoursByJobId.set(s.job_id, (totalHoursByJobId.get(s.job_id) ?? 0) + hours);
    }
  }

  const latestWorkedByJobId = new Map<string, number>();
  for (const s of sessions) {
    const ts = new Date(s.ended_at ?? s.started_at).getTime();
    const prev = latestWorkedByJobId.get(s.job_id) ?? 0;
    if (ts > prev) latestWorkedByJobId.set(s.job_id, ts);
  }

  const sessionIds = sessions.map((s) => s.id);
  // Match `fetchJobDetail`: exclude soft-deleted materials from the
  // per-job rollup so the MAT / NET metrics on the jobs list stay in
  // sync with what the user sees on JobDetailScreen after deleting a
  // material. Without this filter the rollup keeps counting deleted
  // rows and the list card's materials + net never drop back down.
  const [materialsByJobRes, materialsBySessionRes] = await Promise.all([
    client
      .from('materials')
      .select('id, job_id, session_id, total_cost_cents')
      .in('job_id', jobIds)
      .is('deleted_at', null),
    sessionIds.length > 0
      ? client
          .from('materials')
          .select('id, job_id, session_id, total_cost_cents')
          .in('session_id', sessionIds)
          .is('deleted_at', null)
      : Promise.resolve({ data: [] as ListJobMaterialRow[], error: null }),
  ]);
  if (materialsByJobRes.error) throw materialsByJobRes.error;
  if (materialsBySessionRes.error) throw materialsBySessionRes.error;

  const materialById = new Map<string, ListJobMaterialRow>();
  for (const m of (materialsByJobRes.data ?? []) as ListJobMaterialRow[]) {
    materialById.set(m.id, m);
  }
  for (const m of (materialsBySessionRes.data ?? []) as ListJobMaterialRow[]) {
    materialById.set(m.id, m);
  }

  const materialsSpendByJobId = new Map<string, number>();
  for (const m of materialById.values()) {
    const materialJobId =
      m.job_id ??
      (m.session_id ? sessionJobIdBySessionId.get(m.session_id) ?? null : null);
    if (!materialJobId) continue;
    materialsSpendByJobId.set(
      materialJobId,
      (materialsSpendByJobId.get(materialJobId) ?? 0) + m.total_cost_cents,
    );
  }

  return rows.map((row) => {
    const latestTs = latestWorkedByJobId.get(row.id) ?? 0;
    const lastWorkedLabel =
      latestTs > 0
        ? `Last worked ${formatDateLabel(new Date(latestTs).toISOString())}`
        : 'No sessions yet';
    const totalHours = totalHoursByJobId.get(row.id) ?? 0;
    const materialsSpendCents = materialsSpendByJobId.get(row.id) ?? 0;
    const materialsCents = -materialsSpendCents;
    const revenueCents = row.revenue_cents ?? 0;
    const netEarningsCents = revenueCents + materialsCents;

    return {
    id: row.id,
    shortDescription: row.short_description,
    customerName: row.customer_name,
    updatedAt: row.updated_at,
    lastWorkedLabel,
    timeLabel: `${totalHours.toFixed(1)}h`,
    jobType: row.job_type,
    workStatus: mapWorkStatus(row),
    jobPaymentState: row.job_payment_state,
    revenueCents: row.revenue_cents,
    materialsCents,
    netEarningsCents,
    collectedCents: row.collected_cents,
    };
  });
}

export async function createBlankJobForCurrentUser(
  client: FieldbookSupabaseClient,
): Promise<JobId> {
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  const userId = authData.user?.id;
  if (!userId) {
    throw new Error('No authenticated user available to create a job.');
  }

  const { data, error } = await client
    .from('jobs')
    .insert({
      user_id: userId,
      short_description: 'Untitled Job',
      customer_name: '',
      service_address: '',
      job_type: '',
      created_via: 'add_job',
      job_work_status: 'not_started',
    })
    .select('id')
    .single();

  if (error) throw error;
  return (data as { id: string }).id;
}

export async function deleteJobById(
  client: FieldbookSupabaseClient,
  id: JobId,
): Promise<void> {
  const { data, error } = await client
    .from('jobs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Delete affected no rows (check RLS: job must be owned by you).');
  }
}

function normalizeEditableJobInput(input: UpdateJobInput): UpdateJobInput {
  const shortDescription = input.shortDescription.trim();
  if (!shortDescription) {
    throw new Error('Job title is required.');
  }

  if (
    input.revenueCents != null &&
    (!Number.isInteger(input.revenueCents) || input.revenueCents < 0)
  ) {
    throw new Error('Revenue must be a non-negative dollar amount.');
  }

  return {
    shortDescription,
    customerName: input.customerName.trim(),
    serviceAddress: input.serviceAddress.trim(),
    revenueCents: input.revenueCents,
    jobType: input.jobType.trim(),
  };
}

export async function updateJobById(
  client: FieldbookSupabaseClient,
  id: JobId,
  input: UpdateJobInput,
): Promise<void> {
  const normalized = normalizeEditableJobInput(input);
  const patch = {
    short_description: normalized.shortDescription,
    customer_name: normalized.customerName,
    service_address: normalized.serviceAddress,
    revenue_cents: normalized.revenueCents,
    job_type: normalized.jobType,
  };

  const { data, error } = await client
    .from('jobs')
    .update(patch)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Update affected no rows (check RLS: job must be owned by you).');
  }
}

/**
 * Maps UI job status to `jobs` row columns. `paid` in the view model is
 * `completed` + `job_payment_state: paid` in the database.
 */
export function jobDetailWorkStatusToDbColumns(status: JobDetailWorkStatus): {
  job_work_status: JobWorkStatusDb;
  job_payment_state: JobPaymentState | null;
} {
  switch (status) {
    case 'notStarted':
      return { job_work_status: 'not_started', job_payment_state: null };
    case 'inProgress':
      return { job_work_status: 'in_progress', job_payment_state: null };
    case 'onHold':
      return { job_work_status: 'on_hold', job_payment_state: null };
    case 'completed':
      return { job_work_status: 'completed', job_payment_state: 'pending' };
    case 'paid':
      return { job_work_status: 'completed', job_payment_state: 'paid' };
    case 'cancelled':
      return { job_work_status: 'canceled', job_payment_state: null };
  }
}

export async function updateJobStatusById(
  client: FieldbookSupabaseClient,
  id: JobId,
  status: JobDetailWorkStatus,
): Promise<void> {
  const patch = jobDetailWorkStatusToDbColumns(status);
  const { data, error } = await client
    .from('jobs')
    .update(patch)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Update affected no rows (check RLS: job must be owned by you).');
  }
}
