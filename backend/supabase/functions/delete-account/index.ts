// Edge Function: delete the currently-authenticated user.
//
// The Supabase JS client cannot directly call `auth.admin.deleteUser` because
// that endpoint requires the service-role key. This function:
//   1. Reads the caller's JWT from the Authorization header.
//   2. Resolves the user via the anon-key client.
//   3. Uses a service-role client to call `auth.admin.deleteUser(user.id)`.
//
// Cascade FKs on `public.profiles` (this migration), and on `jobs` /
// `sessions` / `notes` / `material_entries` / `attachments` /
// `job_activity_events` (existing migrations) clean up all related rows.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse({ error: 'server_misconfigured' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return jsonResponse({ error: 'missing_bearer_token' }, 401);
  }

  // Resolve the caller using their JWT (anon-key client + Authorization header).
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse(
      { error: 'invalid_token', detail: userErr?.message ?? null },
      401,
    );
  }

  // Service-role client for the privileged delete.
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(
    userData.user.id,
  );
  if (deleteErr) {
    return jsonResponse(
      { error: 'delete_failed', detail: deleteErr.message },
      500,
    );
  }

  return jsonResponse({ ok: true }, 200);
});
