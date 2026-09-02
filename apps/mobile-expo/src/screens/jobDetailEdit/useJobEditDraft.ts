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
  normalizeSessionStartedTz,
  resolveSessionDraftTimes,
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
  const sessions: DraftSessionRow[] = job.displaySessions.map((s) => ({
    id: s.id,
    isNew: false,
    removed: false,
    date: isoToLocalDate(s.startedAt),
    durationHours: durationHoursBetween(s.startedAt, s.endedAt ?? s.startedAt),
    clockTimesExplicit: s.clockTimesExplicit,
    explicitStartClock: s.clockTimesExplicit,
    explicitEndClock: s.clockTimesExplicit,
    startedAt: s.startedAt,
    endedAt: s.endedAt ?? s.startedAt,
    startedTz: deviceIanaTimeZone(),
  }));

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
        description: m.name,
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
      costType: c.costType as OtherCostTypeDb,
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

function isBlankNewSession(row: DraftSessionRow): boolean {
  return (
    row.isNew &&
    !row.removed &&
    row.durationHours <= 0 &&
    !row.explicitStartClock &&
    !row.explicitEndClock
  );
}

function isBlankNewNote(row: DraftNoteRow): boolean {
  return row.isNew && !row.removed && row.body.trim() === '';
}

function isBlankNewMaterial(row: DraftMaterialRow): boolean {
  return row.isNew && !row.removed && row.description.trim() === '' && row.totalCostCents <= 0;
}

/** Stored as description + total only (qty 1, unit ea). Edit UI shows empty breakdown fields. */
function isMaterialFastPath(quantity: number, unit: string | null | undefined): boolean {
  const u = (unit ?? '').trim();
  return quantity === 1 && (u === '' || u === 'ea');
}

function isBlankNewOtherCost(row: DraftOtherCostRow): boolean {
  return row.isNew && !row.removed && !row.costType && row.costCents <= 0;
}

export type JobEditValidation = {
  canDone: boolean;
  titleBlank: boolean;
  partialInvalidRows: string[];
};

export function validateJobEditDraft(draft: JobEditDraft): JobEditValidation {
  const partialInvalidRows: string[] = [];
  const titleBlank = draft.shortDescription.trim() === '';

  for (const row of draft.sessions) {
    if (row.removed || isBlankNewSession(row)) continue;
    if (!row.date.trim() || row.durationHours <= 0) partialInvalidRows.push('session');
  }

  for (const row of draft.notes) {
    if (row.removed || isBlankNewNote(row)) continue;
    if (row.body.trim() === '') partialInvalidRows.push('note');
  }

  for (const row of draft.materials) {
    if (row.removed || isBlankNewMaterial(row)) continue;
    if (row.description.trim() === '') partialInvalidRows.push('material');
    else if (row.totalCostCents <= 0 && !row.showBreakdown) partialInvalidRows.push('material');
    else if (
      row.showBreakdown &&
      (row.quantity <= 0 || row.unitCostCents <= 0 || !row.unit.trim())
    ) {
      partialInvalidRows.push('material');
    }
  }

  for (const row of draft.otherCosts) {
    if (row.removed || isBlankNewOtherCost(row)) continue;
    if (!row.costType) partialInvalidRows.push('otherCost');
    else if (row.costCents <= 0) partialInvalidRows.push('otherCost');
  }

  return {
    canDone: !titleBlank && partialInvalidRows.length === 0,
    titleBlank,
    partialInvalidRows,
  };
}

function resolveEditSessionTimes(row: DraftSessionRow): { startedAt: string; endedAt: string } {
  if (row.explicitStartClock && row.explicitEndClock) {
    return { startedAt: row.startedAt, endedAt: row.endedAt };
  }
  const hours = Math.max(0, row.durationHours);
  if (row.explicitStartClock) {
    const startedAt = row.startedAt;
    return {
      startedAt,
      endedAt: new Date(new Date(startedAt).getTime() + hours * 3_600_000).toISOString(),
    };
  }
  if (row.explicitEndClock) {
    const endedAt = row.endedAt;
    return {
      startedAt: new Date(new Date(endedAt).getTime() - hours * 3_600_000).toISOString(),
      endedAt,
    };
  }
  return resolveSessionDraftTimes({ ...row, clockTimesExplicit: false });
}

function materialPersistFields(row: DraftMaterialRow): {
  quantity: number;
  unit: string;
  unitCostCents: number;
} {
  if (row.showBreakdown) {
    return {
      quantity: row.quantity,
      unit: row.unit.trim(),
      unitCostCents: row.unitCostCents,
    };
  }
  return { quantity: 1, unit: 'ea', unitCostCents: row.totalCostCents };
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
    if (isBlankNewSession(row)) continue;
    if (!row.date.trim()) continue;

    const { startedAt, endedAt } = resolveEditSessionTimes(row);
    const apiRow = {
      id: row.id,
      startedAt,
      endedAt,
      clockTimesExplicit: row.explicitStartClock && row.explicitEndClock,
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
    if (isBlankNewNote(row)) continue;
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
    if (!row.costType) continue;
    const apiRow = {
      id: row.id,
      costType: row.costType,
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
