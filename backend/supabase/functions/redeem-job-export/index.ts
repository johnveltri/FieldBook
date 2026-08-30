import { EXPORT_BUCKET, json, serverClient, sha256Hex } from '../_shared/job-export.ts';

function cors(request: Request) {
  const configured = Deno.env.get('EXPORT_DOWNLOAD_BASE_URL') ?? 'https://fieldsoli.com/exports/download';
  const expected = new URL(configured).origin;
  const origin = request.headers.get('origin');
  return {
  // Only the deployed download page may read a bearer-token redemption result.
  'Access-Control-Allow-Origin': origin === expected ? expected : 'null',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
const unavailable = (request: Request) => json({ error: 'export_unavailable' }, 404, cors(request));

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors(request) });
  if (request.method !== 'POST') return unavailable(request);
  let token = '';
  try { token = String((await request.json()).token ?? ''); } catch { return unavailable(request); }
  if (!/^v1\.[A-Za-z0-9_-]{43}$/.test(token)) return unavailable(request);

  const client = serverClient();
  const { data, error } = await client.from('job_export_requests').select('object_path, expires_at, generation_state, delivery_state, reporting_year')
    .eq('token_hash', await sha256Hex(token)).maybeSingle();
  if (error || !data || data.generation_state !== 'ready' || data.delivery_state !== 'sent' || !data.object_path || !data.expires_at) return unavailable(request);
  const remainingSeconds = Math.floor((Date.parse(data.expires_at) - Date.now()) / 1000);
  if (remainingSeconds <= 0) return unavailable(request);
  const { data: signed, error: signError } = await client.storage.from(EXPORT_BUCKET).createSignedUrl(
    data.object_path,
    Math.min(60, remainingSeconds),
    { download: `fieldsoli-job-summary-${data.reporting_year}.csv` },
  );
  if (signError || !signed?.signedUrl) return unavailable(request);
  return json({ signed_url: signed.signedUrl }, 200, cors(request));
});
