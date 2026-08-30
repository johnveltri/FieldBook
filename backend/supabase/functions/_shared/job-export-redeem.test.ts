import { describe, expect, it, vi } from 'vitest';

import { handleJobExportRedemption, redeemCorsHeaders } from './job-export-redeem';

const token = `v1.${'A'.repeat(43)}`;
const allowedOrigin = 'https://fieldsoli.com';

function request(body: unknown = { token }, origin = allowedOrigin) {
  return new Request('https://project.supabase.co/functions/v1/redeem-job-export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    allowedOrigin,
    hashToken: vi.fn().mockResolvedValue('hash'),
    findByTokenHash: vi.fn().mockResolvedValue({
      object_path: 'user/request/job-summary.csv',
      expires_at: '2026-08-30T13:00:00.000Z',
      generation_state: 'ready',
      delivery_state: 'sent',
      reporting_year: 2026,
    }),
    signDownload: vi.fn().mockResolvedValue('https://storage.example/signed'),
    now: () => Date.parse('2026-08-30T12:00:00.000Z'),
    ...overrides,
  };
}

describe('job export redemption', () => {
  it.each([
    ['malformed token', request({ token: 'bad' }), {}],
    ['unknown token', request(), { findByTokenHash: vi.fn().mockResolvedValue(null) }],
    ['expired token', request(), { now: () => Date.parse('2026-08-31T12:00:00.000Z') }],
    ['signing failure', request(), { signDownload: vi.fn().mockResolvedValue(null) }],
  ])('returns the same generic 404 for %s', async (_label, input, overrides) => {
    const response = await handleJobExportRedemption(input, dependencies(overrides));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'export_unavailable' });
  });

  it('returns a signed URL with a maximum 60-second lifetime', async () => {
    const deps = dependencies();
    const response = await handleJobExportRedemption(request(), deps);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ signed_url: 'https://storage.example/signed' });
    expect(deps.signDownload).toHaveBeenCalledWith(
      'user/request/job-summary.csv',
      60,
      'fieldsoli-job-summary-2026.csv',
    );
  });

  it('omits CORS permission for every origin except the download site', () => {
    expect(redeemCorsHeaders(request(), allowedOrigin)['Access-Control-Allow-Origin'])
      .toBe(allowedOrigin);
    expect(redeemCorsHeaders(request({}, 'https://attacker.example'), allowedOrigin))
      .not.toHaveProperty('Access-Control-Allow-Origin');
  });
});
