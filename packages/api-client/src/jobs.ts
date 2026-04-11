import type { Job, JobId } from '@fieldbook/shared-types';

import type { FieldbookSupabaseClient } from './client';

type JobsRow = {
  id: string;
  title: string;
  customer_name: string | null;
  updated_at: string;
};

function rowToJob(row: JobsRow): Job {
  return {
    id: row.id,
    title: row.title,
    customerName: row.customer_name,
    updatedAt: row.updated_at,
  };
}

/** Loads a single row from `public.jobs` (see `backend/supabase/migrations`). */
export async function fetchJobById(
  client: FieldbookSupabaseClient,
  id: JobId,
): Promise<Job | null> {
  const { data, error } = await client
    .from('jobs')
    .select('id, title, customer_name, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToJob(data as JobsRow);
}
