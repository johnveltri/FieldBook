/** Stable identifier for a job across DB, API, and clients. */
export type JobId = string;

/**
 * Domain model for a job — extend as the Job Detail vertical slice grows.
 * Align names with `backend/supabase` migrations when they land.
 */
export type Job = {
  id: JobId;
  title: string;
  customerName: string | null;
  /** ISO 8601 timestamp */
  updatedAt: string;
};
