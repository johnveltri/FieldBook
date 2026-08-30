import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { json, requiredEnv } from '../_shared/job-export.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, CORS);

  const authorization = request.headers.get('authorization') ?? '';
  if (!authorization.toLowerCase().startsWith('bearer ')) return json({ error: 'unauthorized' }, 401, CORS);

  let parsed: unknown;
  try { parsed = await request.json(); } catch { return json({ error: 'invalid_request' }, 422, CORS); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return json({ error: 'invalid_request' }, 422, CORS);
  }
  const input = parsed as { year?: unknown; time_zone?: unknown };
  const keys = Object.keys(input).sort();
  if (
    keys.length !== 2 || keys[0] !== 'time_zone' || keys[1] !== 'year' ||
    !Number.isInteger(input.year) || typeof input.time_zone !== 'string' || input.time_zone.length > 100
  ) {
    return json({ error: 'invalid_request' }, 422, CORS);
  }

  const url = requiredEnv('SUPABASE_URL');
  const anonKey = requiredEnv('SUPABASE_ANON_KEY');
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Always resolve the caller afresh. The RPC also uses auth.uid() and reads
  // auth.users itself, so request fields can never select another account.
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) return json({ error: 'unauthorized' }, 401, CORS);

  const { data, error } = await client.rpc('accept_job_export_request', {
    p_year: input.year,
    p_time_zone: input.time_zone,
  });
  if (error || !data || typeof data !== 'object') return json({ error: 'temporarily_unavailable' }, 503, CORS);

  const result = data as Record<string, unknown>;
  switch (result.status) {
    case 'confirmed':
      return json(result, result.deduplicated ? 200 : 202, CORS);
    case 'no_eligible_jobs':
      return json(result, 200, CORS);
    case 'rate_limited': {
      const retryAt = typeof result.retry_at === 'string' ? result.retry_at : '';
      return json(result, 429, { ...CORS, ...(retryAt ? { 'Retry-After': String(Math.max(1, Math.ceil((Date.parse(retryAt) - Date.now()) / 1000))) } : {}) });
    }
    case 'unverified_email':
    case 'invalid_time_zone':
    case 'invalid_year':
      return json({ error: result.status }, 422, CORS);
    default:
      return json({ error: 'unauthorized' }, 401, CORS);
  }
});
