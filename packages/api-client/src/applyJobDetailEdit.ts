import type { JobId } from '@fieldsolo/shared-types';

import type { FieldSoloSupabaseClient } from './client';
import type { OtherCostTypeDb } from './otherCosts';

export type ApplyJobDetailEditJobPatch = {
  shortDescription: string;
  customerName: string;
  serviceAddress: string;
  revenueCents: number | null;
};

export type ApplyJobDetailEditSessionRow = {
  id: string;
  startedAt: string;
  endedAt: string;
  clockTimesExplicit: boolean;
  startedTz: string | null;
};

export type ApplyJobDetailEditNoteRow = {
  id: string;
  body: string;
  sessionId: string | null;
};

export type ApplyJobDetailEditMaterialRow = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitCostCents: number;
  sessionId: string | null;
};

export type ApplyJobDetailEditOtherCostRow = {
  id: string;
  costType: OtherCostTypeDb;
  description: string;
  costCents: number;
  sessionId: string | null;
};

export type ApplyJobDetailEditPayload = {
  job: ApplyJobDetailEditJobPatch;
  sessions: {
    create: ApplyJobDetailEditSessionRow[];
    update: ApplyJobDetailEditSessionRow[];
    deleteIds: string[];
  };
  notes: {
    create: ApplyJobDetailEditNoteRow[];
    update: ApplyJobDetailEditNoteRow[];
    deleteIds: string[];
  };
  materials: {
    create: ApplyJobDetailEditMaterialRow[];
    update: ApplyJobDetailEditMaterialRow[];
    deleteIds: string[];
  };
  otherCosts: {
    create: ApplyJobDetailEditOtherCostRow[];
    update: ApplyJobDetailEditOtherCostRow[];
    deleteIds: string[];
  };
};

export type ApplyJobDetailEditErrorCode =
  | 'unauthorized'
  | 'not_found'
  | 'invalid'
  | 'conflict';

export class ApplyJobDetailEditError extends Error {
  readonly code: ApplyJobDetailEditErrorCode;

  constructor(code: ApplyJobDetailEditErrorCode) {
    super(`apply_job_detail_edit failed: ${code}`);
    this.name = 'ApplyJobDetailEditError';
    this.code = code;
  }
}

type RpcResult =
  | { status: 'ok' }
  | { status: 'error'; code: ApplyJobDetailEditErrorCode };

function toRpcPayload(payload: ApplyJobDetailEditPayload): Record<string, unknown> {
  return {
    job: {
      shortDescription: payload.job.shortDescription,
      customerName: payload.job.customerName,
      serviceAddress: payload.job.serviceAddress,
      revenueCents: payload.job.revenueCents,
    },
    sessions: payload.sessions,
    notes: payload.notes,
    materials: payload.materials,
    otherCosts: payload.otherCosts,
  };
}

/** Applies a job-detail edit diff in one database transaction. */
export async function applyJobDetailEdit(
  client: FieldSoloSupabaseClient,
  jobId: JobId,
  payload: ApplyJobDetailEditPayload,
): Promise<void> {
  const { data, error } = await client.rpc('apply_job_detail_edit', {
    p_job_id: jobId,
    p_payload: toRpcPayload(payload) as import('./database.types').Json,
  });

  if (error) throw error;

  const result = data as RpcResult | null;
  if (!result || result.status === 'ok') return;
  if (result.status === 'error' && result.code) {
    throw new ApplyJobDetailEditError(result.code);
  }
  throw new ApplyJobDetailEditError('invalid');
}
