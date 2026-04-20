/**
 * View model for Job Detail screen — aligns with DB + derived UI fields.
 * Maps from Supabase via `@fieldbook/api-client` `fetchJobDetail`.
 */

/** Mirrors design-system `StatusPill` kinds for the job header pill (includes derived `paid`). */
export type JobDetailWorkStatus =
  | 'paid'
  | 'notStarted'
  | 'inProgress'
  | 'completed'
  | 'onHold'
  | 'cancelled';

export type JobDetailSession = {
  id: string;
  /** ISO 8601 timestamp (UTC with offset). Raw session start for prefilling edit UI. */
  startedAt: string;
  /** ISO 8601 timestamp or null while a session is still in progress. */
  endedAt: string | null;
  dateLabel: string;
  timeRangeLabel: string;
  durationLabel: string;
};

export type JobDetailMaterialLine = {
  name: string;
  quantityLabel: string;
  priceLabel: string;
};

export type JobDetailMaterialBucket = {
  id: string;
  kind: 'unassigned' | 'session';
  sessionDateLabel?: string;
  items: JobDetailMaterialLine[];
};

export type JobDetailNote = {
  excerpt: string;
  dateLabel: string;
};

export type JobDetailNoteBucket = {
  id: string;
  kind: 'unassigned' | 'session';
  sessionDateLabel?: string;
  notes: JobDetailNote[];
};

/** Full payload for `JobDetailScreen`. */
export type JobDetailViewModel = {
  id: string;
  shortDescription: string;
  customerName: string;
  serviceAddress: string;
  jobType: string;
  lastWorkedLabel: string;
  workStatus: JobDetailWorkStatus;
  earnings: {
    revenueCents: number;
    materialsCents: number;
    feesCents: number;
    netEarningsCents: number;
  };
  metrics: {
    timeLabel: string;
    netPerHrDisplay: string;
    sessionCount: number;
  };
  sessions: JobDetailSession[];
  materialBuckets: JobDetailMaterialBucket[];
  noteBuckets: JobDetailNoteBucket[];
  timeline: {
    title: string;
    timeLabel: string;
  };
};

/** @deprecated Use JobDetailViewModel */
export type JobDetailMock = JobDetailViewModel;
