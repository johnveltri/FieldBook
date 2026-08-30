export type RedeemableExport = {
  object_path: string | null;
  expires_at: string | null;
  generation_state: string;
  delivery_state: string;
  reporting_year: number;
};

type RedeemDependencies = {
  allowedOrigin: string;
  hashToken: (token: string) => Promise<string>;
  findByTokenHash: (tokenHash: string) => Promise<RedeemableExport | null>;
  signDownload: (
    objectPath: string,
    expiresInSeconds: number,
    fileName: string,
  ) => Promise<string | null>;
  now?: () => number;
};

export function redeemCorsHeaders(request: Request, allowedOrigin: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (request.headers.get('origin') === allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }
  return headers;
}

function json(body: unknown, status: number, headers: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

export async function handleJobExportRedemption(
  request: Request,
  dependencies: RedeemDependencies,
): Promise<Response> {
  const cors = redeemCorsHeaders(request, dependencies.allowedOrigin);
  const unavailable = () => json({ error: 'export_unavailable' }, 404, cors);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return unavailable();

  let token = '';
  try {
    token = String((await request.json()).token ?? '');
  } catch {
    return unavailable();
  }
  if (!/^v1\.[A-Za-z0-9_-]{43}$/.test(token)) return unavailable();

  let row: RedeemableExport | null;
  try {
    row = await dependencies.findByTokenHash(await dependencies.hashToken(token));
  } catch {
    return unavailable();
  }
  if (
    !row || row.generation_state !== 'ready' || row.delivery_state !== 'sent' ||
    !row.object_path || !row.expires_at
  ) return unavailable();

  const remainingSeconds = Math.floor(
    (Date.parse(row.expires_at) - (dependencies.now?.() ?? Date.now())) / 1000,
  );
  if (remainingSeconds <= 0) return unavailable();

  const signedUrl = await dependencies.signDownload(
    row.object_path,
    Math.min(60, remainingSeconds),
    `fieldsoli-job-summary-${row.reporting_year}.csv`,
  ).catch(() => null);
  if (!signedUrl) return unavailable();
  return json({ signed_url: signedUrl }, 200, cors);
}
