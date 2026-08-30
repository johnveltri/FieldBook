import type { FieldSoloSupabaseClient } from './client';

export type JobExportRequestInput = {
  year: number;
  timeZone: string;
};

export type JobExportRequestResult =
  | {
      status: 'confirmed';
      requestId: string;
      recipientEmail: string;
      deduplicated: boolean;
    }
  | { status: 'no_eligible_jobs' }
  | { status: 'rate_limited'; retryAt: string };

/** A request failure that retains the Edge Function HTTP status and code. */
export class JobExportRequestError extends Error {
  readonly status: number | null;
  readonly code: string | null;
  readonly retryAt: string | null;

  constructor(message: string, options?: { status?: number | null; code?: string | null; retryAt?: string | null }) {
    super(message);
    this.name = 'JobExportRequestError';
    this.status = options?.status ?? null;
    this.code = options?.code ?? null;
    this.retryAt = options?.retryAt ?? null;
  }
}

type FunctionResponse = {
  status?: unknown;
  request_id?: unknown;
  recipient_email?: unknown;
  deduplicated?: unknown;
  retry_at?: unknown;
  error?: unknown;
  code?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function resultFromPayload(payload: unknown): JobExportRequestResult | null {
  if (!isRecord(payload) || typeof payload.status !== 'string') return null;
  if (payload.status === 'no_eligible_jobs') return { status: 'no_eligible_jobs' };
  if (payload.status === 'rate_limited' && typeof payload.retry_at === 'string') {
    return { status: 'rate_limited', retryAt: payload.retry_at };
  }
  if (
    payload.status === 'confirmed' &&
    typeof payload.request_id === 'string' &&
    typeof payload.recipient_email === 'string'
  ) {
    return {
      status: 'confirmed',
      requestId: payload.request_id,
      recipientEmail: payload.recipient_email,
      deduplicated: payload.deduplicated === true,
    };
  }
  return null;
}

async function readFunctionError(error: unknown): Promise<JobExportRequestError> {
  const context = isRecord(error) && 'context' in error ? error.context : null;
  let payload: FunctionResponse | null = null;
  if (context && typeof (context as Response).json === 'function') {
    try {
      const parsed = await (context as Response).json();
      if (isRecord(parsed)) payload = parsed as FunctionResponse;
    } catch {
      // The response may have no JSON body (network/relay errors).
    }
  }
  const status = context && typeof (context as Response).status === 'number'
    ? (context as Response).status
    : null;
  const message =
    payload && typeof payload.error === 'string'
      ? payload.error
      : error instanceof Error
        ? error.message
        : 'Could not request your export.';
  return new JobExportRequestError(message, {
    status,
    code: payload && typeof payload.code === 'string' ? payload.code : null,
    retryAt: payload && typeof payload.retry_at === 'string' ? payload.retry_at : null,
  });
}

/** Queues a one-year job export for the currently authenticated user. */
export async function requestJobExport(
  client: FieldSoloSupabaseClient,
  input: JobExportRequestInput,
): Promise<JobExportRequestResult> {
  const { data, error } = await client.functions.invoke<FunctionResponse>('request-job-export', {
    method: 'POST',
    body: { year: input.year, time_zone: input.timeZone },
  });

  const result = resultFromPayload(data);
  if (result) return result;
  if (error) {
    const functionError = await readFunctionError(error);
    if (functionError.status === 429 && functionError.retryAt) {
      return { status: 'rate_limited', retryAt: functionError.retryAt };
    }
    throw functionError;
  }
  throw new JobExportRequestError('Could not request your export.');
}
