import type { Job, JobId, JobPaymentState } from '@fieldbook/shared-types';

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

export async function updateJobById(
  client: FieldbookSupabaseClient,
  id: JobId,
  input: UpdateJobInput,
): Promise<void> {
  const patch = {
    short_description: input.shortDescription,
    customer_name: input.customerName,
    service_address: input.serviceAddress,
    revenue_cents: input.revenueCents,
    job_type: input.jobType,
  };

  const { data, error } = await client
    .from('jobs')
    .update(patch)
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      'Update affected no rows (check RLS: job must be owned by you or be the demo job).',
    );
  }
}
