/**
 * Static mock for Job Detail (`1836:1875`) — TODO: replace with Supabase-backed selectors.
 */

/** Mirrors design-system `StatusPill` kinds for the job header pill. */
export type JobDetailWorkStatus =
  | 'paid'
  | 'notStarted'
  | 'inProgress'
  | 'completed'
  | 'onHold'
  | 'cancelled';

export type JobDetailSession = {
  id: string;
  dateLabel: string;
  timeRangeLabel: string;
  durationLabel: string;
};

export type JobDetailMaterialLine = {
  name: string;
  quantityLabel: string;
  priceLabel: string;
};

/** Bucket: `Unassigned` or `Mar 25, 2026` + Session row. */
export type JobDetailMaterialBucket = {
  id: string;
  /** `unassigned` → uppercase “Unassigned” header; else “Mar 25, 2026 Session”. */
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

export type JobDetailMock = {
  id: string;
  shortDescription: string;
  customerName: string;
  /** Shown after bullet in meta row, e.g. `Last worked Mar 13`. */
  lastWorkedLabel: string;
  categoryLabel: string;
  workStatus: JobDetailWorkStatus;
  /** Mirrors `JobSummaryCard`: Revenue, Materials, Fees, Net Earnings. */
  earnings: {
    revenueCents: number;
    materialsCents: number;
    feesCents: number;
    netEarningsCents: number;
  };
  /** Mirrors `MetricCard` tertiary-only (job): Time | NET/HR | Sessions. */
  metrics: {
    timeLabel: string;
    netPerHrDisplay: string;
    sessionCount: number;
  };
  sessions: JobDetailSession[];
  materialBuckets: JobDetailMaterialBucket[];
  noteBuckets: JobDetailNoteBucket[];
  /** Mirrors `RowCard` activity line under Timeline. */
  timeline: {
    title: string;
    timeLabel: string;
  };
};

export const mockJobDetail: JobDetailMock = {
  id: '00000000-0000-0000-0000-000000000001',
  shortDescription: 'Bathroom Remodel Phase 1',
  customerName: 'Andrew G',
  lastWorkedLabel: 'Last worked Mar 13',
  categoryLabel: 'Handyman / General Home Services',
  workStatus: 'inProgress',
  earnings: {
    revenueCents: 2_220_000,
    materialsCents: -2_220_000,
    feesCents: -20_000,
    netEarningsCents: 2_220_000,
  },
  metrics: {
    timeLabel: '102.0h',
    netPerHrDisplay: '6,337/hr',
    sessionCount: 239,
  },
  sessions: [
    {
      id: 'sess-1',
      dateLabel: 'Mar 25, 2026',
      timeRangeLabel: '9:00 AM – 10:00 AM',
      durationLabel: '1.0h',
    },
  ],
  materialBuckets: [
    {
      id: 'mat-unassigned',
      kind: 'unassigned',
      items: [
        { name: 'Moen Faucet', quantityLabel: '1 ea', priceLabel: '$75.00' },
      ],
    },
    {
      id: 'mat-s1',
      kind: 'session',
      sessionDateLabel: 'Mar 25, 2026',
      items: [
        { name: 'Moen Faucet', quantityLabel: '1 ea', priceLabel: '$75.00' },
      ],
    },
  ],
  noteBuckets: [
    {
      id: 'note-unassigned',
      kind: 'unassigned',
      notes: [
        {
          excerpt:
            'Client requested brushed nickel finish. Old valve was slightly corroded but salvageable. Will... ',
          dateLabel: 'Mar 25, 2026',
        },
      ],
    },
    {
      id: 'note-s1',
      kind: 'session',
      sessionDateLabel: 'Mar 25, 2026',
      notes: [{ excerpt: 'dsfsdf', dateLabel: 'Mar 25, 2026' }],
    },
  ],
  timeline: {
    title: 'Session Started',
    timeLabel: '10:06 PM',
  },
};
