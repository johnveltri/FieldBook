import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export const EXPORT_BUCKET = 'job-exports';
export const DOWNLOAD_PATH = '/exports/download';

export type ExportRequest = {
  id: string;
  user_id: string;
  reporting_year: number;
  reporting_time_zone: string;
  recipient_email: string;
  generation_state: 'queued' | 'processing' | 'ready' | 'failed' | 'deleted';
  delivery_state: 'pending' | 'processing' | 'sent' | 'failed' | 'revoked' | 'expired';
  object_path: string | null;
  byte_size: number | null;
  token_hash: string | null;
  expires_at: string | null;
  resend_message_id: string | null;
  first_send_at: string | null;
  generation_attempts: number;
  delivery_attempts: number;
};

export function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function serverClient() {
  return createClient(
    requiredEnv('SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

export function errorCode(error: unknown): string {
  return typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: unknown }).code ?? 'unknown')
    : 'unknown';
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

export function workerAuthorized(request: Request): boolean {
  const secret = Deno.env.get('EXPORT_WORKER_SECRET');
  const supplied = request.headers.get('x-export-worker-secret') ?? '';
  return Boolean(secret) && safeEqual(secret!, supplied);
}

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function exportTokenForRequest(requestId: string): Promise<string> {
  // A per-environment 32+ byte secret makes this 32-byte HMAC output opaque.
  // We persist only the SHA-256 of the finished bearer token, while every
  // retry can deterministically render the exact same email/link.
  const secret = requiredEnv('EXPORT_TOKEN_SECRET');
  if (new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error('EXPORT_TOKEN_SECRET must be at least 32 bytes');
  }
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(requestId)));
  return `v1.${base64url(signature)}`;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function exportObjectPath(userId: string, requestId: string): string {
  return `${userId}/${requestId}/job-summary.csv`;
}

export function downloadUrl(token: string): string {
  const configured = Deno.env.get('EXPORT_DOWNLOAD_BASE_URL') || `https://fieldsoli.com${DOWNLOAD_PATH}`;
  return `${configured}#token=${encodeURIComponent(token)}`;
}
