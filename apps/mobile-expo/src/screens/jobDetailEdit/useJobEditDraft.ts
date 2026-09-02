import { useCallback, useMemo, useState } from 'react';
import type { JobDetailViewModel } from '@fieldsolo/shared-types';
import type {
  ApplyJobDetailEditPayload,
  SessionDurationDraft,
} from '@fieldsolo/api-client';
import {
  createDefaultSessionDraft,
  deviceIanaTimeZone,
  durationHoursBetween,
  inferSessionClockExplicitFlags,
  JOB_DETAIL_EMPTY_LABELS,
  normalizeSessionStartedTz,
  resolveSessionDraftTimes,
  todayLocalDateString,
} from '@fieldsolo/api-client';
import type { OtherCostTypeDb } from '@fieldsolo/api-client';

export type DraftRowBase = {
  id: string;
  isNew: boolean;
  removed: boolean;
};

export type DraftSessionRow = DraftRowBase &
  SessionDurationDraft & {
    /** User picked start clock; empty shows Start placeholder. */
    explicitStartClock: boolean;
    /** User picked end clock; empty shows End placeholder. */
    explicitEndClock: boolean;
  };

export type DraftNoteRow = DraftRowBase & {
  body: string;
  sessionId: string | null;
};

export type DraftMaterialRow = DraftRowBase & {
  description: string;
  totalCostCents: number;
  showBreakdown: boolean;
  quantity: number;
  unit: string;
  unitCostCents: number;
  sessionId: string | null;
};

export type DraftOtherCostRow = DraftRowBase & {
  costType: OtherCostTypeDb | '';
  costTypeExplicit: boolean;
  description: string;
  costCents: number;
  sessionId: string | null;
};

export type JobEditDraft = {
  shortDescription: string;
  customerName: string;
  serviceAddress: string;
  revenueCents: number | null;
  sessions: DraftSessionRow[];
  notes: DraftNoteRow[];
  materials: DraftMaterialRow[];
  otherCosts: DraftOtherCostRow[];
};

export type JobEditSnapshot = JobEditDraft;

function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isoToLocalDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Builds an in-memory edit draft from a loaded job (excludes in-progress session). */
export function createJobEditDraft(job: JobDetailViewModel): JobEditDraft {
  const sessions: DraftSessionRow[] = job.displaySessions.map((s) => {
    const calendarDateExplicit = s.calendarDateExplicit !== false;
    const date = calendarDateExplicit ? isoToLocalDate(s.startedAt) : '';
    const durationHours = durationHoursBetween(s.startedAt, s.endedAt ?? s.startedAt);
    let explicitStartClock = s.clockStartExplicit;
    let explicitEndClock = s.clockEndExplicit;
    if (!explicitStartClock && !explicitEndClock) {
      if (s.clockTimesExplicit) {
        explicitStartClock = true;
        explicitEndClock = true;
      } else {
        const inferred = inferSessionClockExplicitFlags({
          date,
          durationHours,
          startedAt: s.startedAt,
          endedAt: s.endedAt ?? s.startedAt,
        });
        explicitStartClock = inferred.explicitStartClock;
        explicitEndClock = inferred.explicitEndClock;
      }
    }
    return {
      id: s.id,
      isNew: false,
      removed: false,
      date,
      durationHours,
      clockTimesExplicit: explicitStartClock || explicitEndClock,
      explicitStartClock,
      explicitEndClock,
      startedAt: s.startedAt,
      endedAt: s.endedAt ?? s.startedAt,
      startedTz: deviceIanaTimeZone(),
    };
  });

  const notes: DraftNoteRow[] = job.noteBuckets.flatMap((b) =>
    b.notes.map((n) => ({
      id: n.id,
      isNew: false,
      removed: false,
      body: n.body,
      sessionId: n.sessionId,
    })),
  );

  const materials: DraftMaterialRow[] = job.materialBuckets.flatMap((b) =>
    b.items.map((m) => {
      const fastPath = isMaterialFastPath(m.quantity, m.unit);
      return {
        id: m.id,
        isNew: false,
        removed: false,
        description:
          m.name === JOB_DETAIL_EMPTY_LABELS.materialDescription ? '' : m.name,
        totalCostCents: Math.round(m.unitCostCents * m.quantity),
        showBreakdown: !fastPath,
        quantity: fastPath ? 0 : m.quantity,
        unit: fastPath ? '' : m.unit || '',
        unitCostCents: fastPath ? 0 : m.unitCostCents,
        sessionId: m.sessionId,
      };
    }),
  );

  const otherCosts: DraftOtherCostRow[] = job.otherCostBuckets.flatMap((b) =>
    b.items.map((c) => ({
      id: c.id,
      isNew: false,
      removed: false,
      costType: c.costTypeExplicit === false ? '' : (c.costType as OtherCostTypeDb),
      costTypeExplicit: c.costTypeExplicit !== false,
      description: c.description,
      costCents: c.costCents,
      sessionId: c.sessionId,
    })),
  );

  return {
    shortDescription: job.shortDescription,
    customerName: job.customerName,
    serviceAddress: job.serviceAddress,
    revenueCents: job.earnings.revenueCents,
    sessions,
    notes,
    materials,
    otherCosts,
  };
}

function rowsEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function isJobEditDraftDirty(snapshot: JobEditSnapshot, draft: JobEditDraft): boolean {
  return !rowsEqual(snapshot, draft);
}

function isBlankNewSession(row: DraftSessionRow, draft: JobEditDraft): boolean {
  if (!row.isNew || row.removed) return false;
  if (sessionReferencedInDraft(draft, row.id)) return false;
  const noDate = !row.date.trim();
  const noTimeData =
    row.durationHours <= 0 && !row.explicitStartClock && !row.explicitEndClock;
  return noDate && noTimeData;
}

function sessionReferencedInDraft(draft: JobEditDraft, sessionId: string): boolean {
  for (const row of draft.notes) {
    if (!row.removed && row.sessionId === sessionId && !isBlankNewNote(row)) return true;
  }
  for (const row of draft.materials) {
    if (!row.removed && row.sessionId === sessionId && !isBlankNewMaterial(row)) return true;
  }
  for (const row of draft.otherCosts) {
    if (!row.removed && row.sessionId === sessionId && !isBlankNewOtherCost(row)) return true;
  }
  return false;
}

function isBlankNewNote(row: DraftNoteRow): boolean {
  return row.isNew && !row.removed && row.body.trim() === '';
}

function isBlankNewMaterial(row: DraftMaterialRow): boolean {
  if (!row.isNew || row.removed) return false;
  return (
    row.description.trim() === '' &&
    row.totalCostCents <= 0 &&
    !row.showBreakdown &&
    row.quantity <= 0 &&
    row.unitCostCents <= 0 &&
    !row.unit.trim() &&
    !row.sessionId
  );
}

function shouldDropNote(row: DraftNoteRow): boolean {
  return !row.removed && row.body.trim() === '';
}

/** Stored as description + total only (qty 1, unit ea). Edit UI shows empty breakdown fields. */
function isMaterialFastPath(quantity: number, unit: string | null | undefined): boolean {
  const u = (unit ?? '').trim();
  return quantity === 1 && (u === '' || u === 'ea');
}

function isBlankNewOtherCost(row: DraftOtherCostRow): boolean {
  if (!row.isNew || row.removed) return false;
  return (
    !row.costType &&
    row.costCents <= 0 &&
    row.description.trim() === '' &&
    !row.sessionId
  );
}

export type JobEditValidation = {
  canDone: boolean;
  titleBlank: boolean;
  partialInvalidRows: string[];
};

export function validateJobEditDraft(draft: JobEditDraft): JobEditValidation {
  const titleBlank = draft.shortDescription.trim() === '';
  return {
    canDone: !titleBlank,
    titleBlank,
    partialInvalidRows: [],
  };
}

function resolveEditSessionTimes(row: DraftSessionRow): { startedAt: string; endedAt: string } {
  const date = row.date.trim() || todayLocalDateString();
  const normalized = { ...row, date };
  if (normalized.explicitStartClock && normalized.explicitEndClock) {
    return { startedAt: normalized.startedAt, endedAt: normalized.endedAt };
  }
  const hours = Math.max(0, normalized.durationHours);
  if (normalized.explicitStartClock) {
    const startedAt = normalized.startedAt;
    return {
      startedAt,
      endedAt: new Date(new Date(startedAt).getTime() + hours * 3_600_000).toISOString(),
    };
  }
  if (normalized.explicitEndClock) {
    const endedAt = normalized.endedAt;
    return {
      startedAt: new Date(new Date(endedAt).getTime() - hours * 3_600_000).toISOString(),
      endedAt,
    };
  }
  return resolveSessionDraftTimes({ ...normalized, clockTimesExplicit: false });
}

export function materialHasBreakdown(row: DraftMaterialRow): boolean {
  return (
    row.showBreakdown ||
    row.quantity > 0 ||
    row.unitCostCents > 0 ||
    !!row.unit.trim()
  );
}

export function materialBreakdownTotalCents(row: DraftMaterialRow): number {
  if (row.quantity > 0 && row.unitCostCents > 0) {
    return Math.round(row.unitCostCents * row.quantity);
  }
  return 0;
}

function materialPersistFields(row: DraftMaterialRow): {
  quantity: number;
  unit: string;
  unitCostCents: number;
} {
  if (materialHasBreakdown(row)) {
    return {
      quantity: Math.max(0, row.quantity),
      unit: row.unit.trim() || 'ea',
      unitCostCents: Math.max(0, row.unitCostCents),
    };
  }
  return {
    quantity: row.totalCostCents > 0 || row.description.trim() ? 1 : 0,
    unit: 'ea',
    unitCostCents: Math.max(0, row.totalCostCents),
  };
}

/** Builds the apply RPC diff from snapshot + current draft. */
export function buildApplyJobDetailEditPayload(
  snapshot: JobEditSnapshot,
  draft: JobEditDraft,
): ApplyJobDetailEditPayload {
  const payload: ApplyJobDetailEditPayload = {
    job: {
      shortDescription: draft.shortDescription.trim(),
      customerName: draft.customerName.trim(),
      serviceAddress: draft.serviceAddress.trim(),
      revenueCents: draft.revenueCents,
    },
    sessions: { create: [], update: [], deleteIds: [] },
    notes: { create: [], update: [], deleteIds: [] },
    materials: { create: [], update: [], deleteIds: [] },
    otherCosts: { create: [], update: [], deleteIds: [] },
  };

  for (const row of draft.sessions) {
    if (row.removed && !row.isNew) {
      payload.sessions.deleteIds.push(row.id);
      continue;
    }
    if (isBlankNewSession(row, draft)) continue;

    const { startedAt, endedAt } = resolveEditSessionTimes(row);
    const apiRow = {
      id: row.id,
      startedAt,
      endedAt,
      clockTimesExplicit: row.explicitStartClock || row.explicitEndClock,
      clockStartExplicit: row.explicitStartClock,
      clockEndExplicit: row.explicitEndClock,
      calendarDateExplicit: !!row.date.trim(),
      startedTz: normalizeSessionStartedTz(row.startedTz),
    };

    const snap = snapshot.sessions.find((s) => s.id === row.id);
    if (row.isNew) {
      payload.sessions.create.push(apiRow);
    } else if (!snap || !rowsEqual({ ...snap, isNew: false, removed: false }, { ...row, isNew: false, removed: false })) {
      payload.sessions.update.push(apiRow);
    }
  }

  for (const row of draft.notes) {
    if (row.removed && !row.isNew) {
      payload.notes.deleteIds.push(row.id);
      continue;
    }
    if (shouldDropNote(row)) {
      if (!row.isNew) payload.notes.deleteIds.push(row.id);
      continue;
    }
    const apiRow = { id: row.id, body: row.body.trim(), sessionId: row.sessionId };
    const snap = snapshot.notes.find((n) => n.id === row.id);
    if (row.isNew) payload.notes.create.push(apiRow);
    else if (!snap || !rowsEqual(snap, row)) payload.notes.update.push(apiRow);
  }

  for (const row of draft.materials) {
    if (row.removed && !row.isNew) {
      payload.materials.deleteIds.push(row.id);
      continue;
    }
    if (isBlankNewMaterial(row)) continue;
    const { quantity, unit, unitCostCents } = materialPersistFields(row);
    const apiRow = {
      id: row.id,
      description: row.description.trim(),
      quantity,
      unit,
      unitCostCents,
      sessionId: row.sessionId,
    };
    const snap = snapshot.materials.find((m) => m.id === row.id);
    if (row.isNew) payload.materials.create.push(apiRow);
    else if (!snap || !rowsEqual(snap, row)) payload.materials.update.push(apiRow);
  }

  for (const row of draft.otherCosts) {
    if (row.removed && !row.isNew) {
      payload.otherCosts.deleteIds.push(row.id);
      continue;
    }
    if (isBlankNewOtherCost(row)) continue;
    const apiRow = {
      id: row.id,
      costType: (row.costType || 'other') as OtherCostTypeDb,
      costTypeExplicit: !!row.costType,
      description: row.description,
      costCents: row.costCents,
      sessionId: row.sessionId,
    };
    const snap = snapshot.otherCosts.find((c) => c.id === row.id);
    if (row.isNew) payload.otherCosts.create.push(apiRow);
    else if (!snap || !rowsEqual(snap, row)) payload.otherCosts.update.push(apiRow);
  }

  return payload;
}

export function useJobEditDraft(job: JobDetailViewModel | null) {
  const [snapshot, setSnapshot] = useState<JobEditSnapshot | null>(null);
  const [draft, setDraft] = useState<JobEditDraft | null>(null);

  const resetFromJob = useCallback((j: JobDetailViewModel) => {
    const next = createJobEditDraft(j);
    setSnapshot(next);
    setDraft(next);
  }, []);

  const dirty = useMemo(
    () => (snapshot && draft ? isJobEditDraftDirty(snapshot, draft) : false),
    [snapshot, draft],
  );

  const validation = useMemo(
    () => (draft ? validateJobEditDraft(draft) : { canDone: false, titleBlank: true, partialInvalidRows: [] }),
    [draft],
  );

  const updateDraft = useCallback((patch: Partial<JobEditDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const addSession = useCallback(() => {
    const base = createDefaultSessionDraft();
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            sessions: [
              ...prev.sessions,
              {
                id: newId(),
                isNew: true,
                removed: false,
                ...base,
                date: '',
                durationHours: 0,
                explicitStartClock: false,
                explicitEndClock: false,
              },
            ],
          }
        : prev,
    );
  }, []);

  const addNote = useCallback(() => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            notes: [
              ...prev.notes,
              { id: newId(), isNew: true, removed: false, body: '', sessionId: null },
            ],
          }
        : prev,
    );
  }, []);

  const addMaterial = useCallback(() => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            materials: [
              ...prev.materials,
              {
                id: newId(),
                isNew: true,
                removed: false,
                description: '',
                totalCostCents: 0,
                showBreakdown: false,
                quantity: 0,
                unit: '',
                unitCostCents: 0,
                sessionId: null,
              },
            ],
          }
        : prev,
    );
  }, []);

  const addOtherCost = useCallback(() => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            otherCosts: [
              ...prev.otherCosts,
              {
                id: newId(),
                isNew: true,
                removed: false,
                costType: '',
                costTypeExplicit: false,
                description: '',
                costCents: 0,
                sessionId: null,
              },
            ],
          }
        : prev,
    );
  }, []);

  const removeRow = useCallback(
    (kind: 'sessions' | 'notes' | 'materials' | 'otherCosts', id: string) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const key = kind;
        return {
          ...prev,
          [key]: prev[key].map((row) => (row.id === id ? { ...row, removed: true } : row)),
        };
      });
    },
    [],
  );

  const updateSession = useCallback((id: string, patch: Partial<DraftSessionRow>) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            sessions: prev.sessions.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          }
        : prev,
    );
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<DraftNoteRow>) => {
    setDraft((prev) =>
      prev
        ? { ...prev, notes: prev.notes.map((r) => (r.id === id ? { ...r, ...patch } : r)) }
        : prev,
    );
  }, []);

  const updateMaterial = useCallback((id: string, patch: Partial<DraftMaterialRow>) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            materials: prev.materials.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          }
        : prev,
    );
  }, []);

  const updateOtherCost = useCallback((id: string, patch: Partial<DraftOtherCostRow>) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            otherCosts: prev.otherCosts.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          }
        : prev,
    );
  }, []);

  const buildPayload = useCallback(() => {
    if (!snapshot || !draft) return null;
    return buildApplyJobDetailEditPayload(snapshot, draft);
  }, [snapshot, draft]);

  const discardDraft = useCallback(() => {
    if (snapshot) setDraft(snapshot);
  }, [snapshot]);

  return {
    snapshot,
    draft,
    dirty,
    validation,
    resetFromJob,
    updateDraft,
    addSession,
    addNote,
    addMaterial,
    addOtherCost,
    removeRow,
    updateSession,
    updateNote,
    updateMaterial,
    updateOtherCost,
    buildPayload,
    discardDraft,
  };
}
