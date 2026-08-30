import { describe, expect, it, vi } from 'vitest';

import { requestJobExport, JobExportRequestError } from './jobExports';

function makeClient(invoke: ReturnType<typeof vi.fn>) {
  return { functions: { invoke } } as never;
}

describe('job export request api client', () => {
  it('maps a confirmed payload and sends the snake_case request body', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        status: 'confirmed',
        request_id: 'request-1',
        recipient_email: 'tech@example.com',
        deduplicated: false,
      },
      error: null,
    });

    await expect(
      requestJobExport(makeClient(invoke), { year: 2026, timeZone: 'America/Chicago' }),
    ).resolves.toEqual({
      status: 'confirmed',
      requestId: 'request-1',
      recipientEmail: 'tech@example.com',
      deduplicated: false,
    });
    expect(invoke).toHaveBeenCalledWith('request-job-export', {
      method: 'POST',
      body: { year: 2026, time_zone: 'America/Chicago' },
    });
  });

  it('maps no eligible jobs without treating it as an error', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { status: 'no_eligible_jobs' },
      error: null,
    });
    await expect(requestJobExport(makeClient(invoke), { year: 2026, timeZone: 'UTC' })).resolves.toEqual({
      status: 'no_eligible_jobs',
    });
  });

  it('maps a rate-limited payload', async () => {
    const retryAt = '2026-08-29T14:00:00.000Z';
    const invoke = vi.fn().mockResolvedValue({
      data: { status: 'rate_limited', retry_at: retryAt },
      error: null,
    });
    await expect(requestJobExport(makeClient(invoke), { year: 2026, timeZone: 'UTC' })).resolves.toEqual({
      status: 'rate_limited',
      retryAt,
    });
  });

  it('maps a real non-2xx 429 response to the public result contract', async () => {
    const retryAt = '2026-08-29T14:00:00.000Z';
    const response = new Response(
      JSON.stringify({ status: 'rate_limited', retry_at: retryAt }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code', context: response },
    });

    await expect(requestJobExport(makeClient(invoke), { year: 2026, timeZone: 'UTC' })).resolves.toEqual({
      status: 'rate_limited',
      retryAt,
    });
  });

  it('throws structured metadata for non-rate-limit function errors', async () => {
    const response = new Response(
      JSON.stringify({ error: 'temporarily_unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code', context: response },
    });

    await expect(requestJobExport(makeClient(invoke), { year: 2026, timeZone: 'UTC' })).rejects.toMatchObject({
      name: 'JobExportRequestError',
      status: 503,
    } satisfies Partial<JobExportRequestError>);
  });
});
