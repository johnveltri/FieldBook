export type {
  JobDetailMaterialBucket,
  JobDetailMaterialLine,
  JobDetailMock,
  JobDetailNote,
  JobDetailNoteBucket,
  JobDetailSession,
  JobDetailViewModel,
  JobDetailWorkStatus,
} from './jobDetailView';

/** Stable identifier for a job across DB, API, and clients. */
export type JobId = string;

/** Maps to `public.payment_state_enum` on `jobs.job_payment_state`. */
export type JobPaymentState = 'pending' | 'paid';

/**
 * Domain model for a job — extend as the Job Detail vertical slice grows.
 * Align names with `backend/supabase` migrations when they land.
 */
export type Job = {
  id: JobId;
  /** Maps to `jobs.short_description`. */
  shortDescription: string;
  customerName: string | null;
  /** ISO 8601 timestamp */
  updatedAt: string;
  /** Primary economic fields on the job (cents). Omitted when not selected. */
  revenueCents?: number | null;
  jobPaymentState?: JobPaymentState | null;
  collectedCents?: number | null;
};
