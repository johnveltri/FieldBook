/**
 * Demo mock for Job Detail — optional fallback; primary path is `fetchJobDetail` + Supabase.
 */

import type { JobDetailViewModel } from '@fieldbook/shared-types';

export type {
  JobDetailMaterialBucket,
  JobDetailMaterialLine,
  JobDetailMock,
  JobDetailNote,
  JobDetailNoteBucket,
  JobDetailSession,
  JobDetailViewModel,
  JobDetailWorkStatus,
} from '@fieldbook/shared-types';

export const mockJobDetail: JobDetailViewModel = {
  id: '00000000-0000-0000-0000-000000000001',
  shortDescription: 'Bathroom Remodel Phase 1',
  customerName: 'Andrew G',
  serviceAddress: '123 Main Street\nPerrysburg, OH 43551',
  jobType: 'plumbing',
  lastWorkedLabel: 'Last worked Mar 13',
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
