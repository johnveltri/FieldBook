import type { JobDetailViewModel } from '@fieldsolo/shared-types';

import {
  buildApplyJobDetailEditPayload,
  createJobEditDraft,
  validateJobEditDraft,
  type JobEditDraft,
} from './useJobEditDraft';

function minimalJob(overrides: Partial<JobDetailViewModel> = {}): JobDetailViewModel {
  return {
    id: 'job-1',
    shortDescription: 'Test job',
    customerName: '',
    serviceAddress: '',
    displaySessions: [],
    noteBuckets: [],
    materialBuckets: [],
    otherCostBuckets: [],
    earnings: { revenueCents: null },
    ...overrides,
  } as JobDetailViewModel;
}

describe('validateJobEditDraft capture-now', () => {
  it('only blocks Done when the job title is blank', () => {
    const partialDraft: JobEditDraft = {
      shortDescription: 'Titled job',
      customerName: '',
      serviceAddress: '',
      revenueCents: null,
      sessions: [
        {
          id: 'sess-1',
          isNew: true,
          removed: false,
          date: '',
          durationHours: 0,
          clockTimesExplicit: false,
          explicitStartClock: false,
          explicitEndClock: false,
          startedAt: '2026-09-01T13:00:00.000Z',
          endedAt: '2026-09-01T13:00:00.000Z',
          startedTz: 'UTC',
        },
      ],
      materials: [
        {
          id: 'mat-1',
          isNew: true,
          removed: false,
          description: '',
          totalCostCents: 0,
          showBreakdown: true,
          quantity: 0,
          unit: '',
          unitCostCents: 0,
          sessionId: null,
        },
      ],
      notes: [],
      otherCosts: [
        {
          id: 'oc-1',
          isNew: true,
          removed: false,
          costType: '',
          costTypeExplicit: false,
          description: '',
          costCents: 0,
          sessionId: null,
        },
      ],
    };

    expect(validateJobEditDraft(partialDraft).canDone).toBe(true);
    expect(validateJobEditDraft({ ...partialDraft, shortDescription: '' }).canDone).toBe(false);
  });

  it('includes a referenced date-only session in the payload', () => {
    const job = minimalJob();
    const snapshot = createJobEditDraft(job);
    const draft: JobEditDraft = {
      ...snapshot,
      sessions: [
        {
          id: 'sess-new',
          isNew: true,
          removed: false,
          date: '2026-09-01',
          durationHours: 0,
          clockTimesExplicit: false,
          explicitStartClock: false,
          explicitEndClock: false,
          startedAt: '2026-09-01T13:00:00.000Z',
          endedAt: '2026-09-01T13:00:00.000Z',
          startedTz: 'UTC',
        },
      ],
      materials: [
        {
          id: 'mat-1',
          isNew: true,
          removed: false,
          description: 'Kit',
          totalCostCents: 3000,
          showBreakdown: false,
          quantity: 0,
          unit: '',
          unitCostCents: 0,
          sessionId: 'sess-new',
        },
      ],
    };

    const payload = buildApplyJobDetailEditPayload(snapshot, draft);
    expect(payload.sessions.create[0]?.calendarDateExplicit).toBe(true);
    expect(payload.materials.create[0]?.sessionId).toBe('sess-new');
  });

  it('persists sessions without a calendar date', () => {
    const job = minimalJob();
    const snapshot = createJobEditDraft(job);
    const draft: JobEditDraft = {
      ...snapshot,
      sessions: [
        {
          id: 'sess-undated',
          isNew: true,
          removed: false,
          date: '',
          durationHours: 1,
          clockTimesExplicit: false,
          explicitStartClock: false,
          explicitEndClock: false,
          startedAt: '2026-09-01T13:00:00.000Z',
          endedAt: '2026-09-01T14:00:00.000Z',
          startedTz: 'UTC',
        },
      ],
    };

    const payload = buildApplyJobDetailEditPayload(snapshot, draft);
    expect(payload.sessions.create[0]?.calendarDateExplicit).toBe(false);
  });

  it('drops notes with empty bodies and deletes existing cleared notes', () => {
    const job = minimalJob();
    const snapshot = createJobEditDraft(job);
    const draft: JobEditDraft = {
      ...snapshot,
      notes: [
        { id: 'note-new', isNew: true, removed: false, body: '', sessionId: null },
        { id: 'note-old', isNew: false, removed: false, body: '', sessionId: null },
      ],
    };

    const payload = buildApplyJobDetailEditPayload(snapshot, draft);
    expect(payload.notes.create).toHaveLength(0);
    expect(payload.notes.deleteIds).toEqual(['note-old']);
  });

  it('persists partial materials and other costs', () => {
    const job = minimalJob();
    const snapshot = createJobEditDraft(job);
    const draft: JobEditDraft = {
      ...snapshot,
      materials: [
        {
          id: 'mat-1',
          isNew: true,
          removed: false,
          description: '',
          totalCostCents: 0,
          showBreakdown: true,
          quantity: 2,
          unit: '',
          unitCostCents: 0,
          sessionId: null,
        },
      ],
      otherCosts: [
        {
          id: 'oc-1',
          isNew: true,
          removed: false,
          costType: '',
          costTypeExplicit: false,
          description: 'Permit pending',
          costCents: 0,
          sessionId: null,
        },
      ],
    };

    const payload = buildApplyJobDetailEditPayload(snapshot, draft);
    expect(payload.materials.create[0]).toMatchObject({
      description: '',
      quantity: 2,
      unitCostCents: 0,
    });
    expect(payload.otherCosts.create[0]).toMatchObject({
      costType: 'other',
      costTypeExplicit: false,
      costCents: 0,
    });
  });

  it('persists breakdown materials with empty description and recomputed total', () => {
    const job = minimalJob();
    const snapshot = createJobEditDraft(job);
    const draft: JobEditDraft = {
      ...snapshot,
      materials: [
        {
          id: 'mat-1',
          isNew: true,
          removed: false,
          description: '',
          totalCostCents: 0,
          showBreakdown: true,
          quantity: 2,
          unit: 'ea',
          unitCostCents: 3000,
          sessionId: null,
        },
      ],
    };

    const payload = buildApplyJobDetailEditPayload(snapshot, draft);
    expect(payload.materials.create[0]).toMatchObject({
      description: '',
      quantity: 2,
      unitCostCents: 3000,
    });
  });
});
