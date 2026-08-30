import {
  EXPORT_BUCKET, ExportRequest, csvText, dateInZone, downloadUrl, errorCode,
  escapeHtml, expirationInZone, exportObjectPath, exportTokenForRequest, json, money,
  requiredEnv, serverClient, sha256Hex, workerAuthorized,
} from '../_shared/job-export.ts';

type ExportRow = {
  job_id: string; job_description: string; customer_name: string | null; service_address: string | null;
  work_status: string; payment_status: string | null; created_at: string; last_worked_at: string | null;
  completed_at: string; paid_at: string | null; revenue_cents: number | null;
  material_cost: number; helper_labor_cost: number; equipment_rental_cost: number; permit_cost: number;
  disposal_cost: number; travel_parking_cost: number; other_cost: number;
};

const HEADERS = [
  'job_id', 'job_description', 'customer_name', 'service_address', 'work_status', 'payment_status',
  'created_date', 'last_worked_date', 'completed_date', 'paid_date', 'revenue', 'material_cost',
  'helper_labor_cost', 'equipment_rental_cost', 'permit_cost', 'disposal_cost', 'travel_parking_cost',
  'other_cost', 'total_costs', 'net_earnings',
];

function rowToCsv(row: ExportRow, timeZone: string): string {
  const costs = [row.material_cost, row.helper_labor_cost, row.equipment_rental_cost, row.permit_cost, row.disposal_cost, row.travel_parking_cost, row.other_cost].map(Number);
  const total = costs.reduce((sum, value) => sum + value, 0);
  const paidDate = row.payment_status === 'paid' ? dateInZone(row.paid_at, timeZone) : '';
  const cells = [
    row.job_id, row.job_description, row.customer_name, row.service_address, row.work_status, row.payment_status,
    dateInZone(row.created_at, timeZone), dateInZone(row.last_worked_at, timeZone), dateInZone(row.completed_at, timeZone), paidDate,
    row.revenue_cents === null ? '' : money(row.revenue_cents), ...costs.map(money), money(total),
    row.revenue_cents === null ? '' : money(Number(row.revenue_cents) - total),
  ];
  // Only free-form, user-supplied text is formula-sanitized. Dates, UUIDs,
  // enum values, and monetary values remain machine-readable CSV values (in
  // particular, a negative net earnings value must not acquire an apostrophe).
  return cells.map((cell, index) => {
    if ([1, 2, 3].includes(index)) return csvText(cell);
    const text = String(cell ?? '');
    return `"${text.replaceAll('"', '""')}"`;
  }).join(',');
}

async function buildCsv(request: ExportRequest): Promise<Uint8Array> {
  const client = serverClient();
  let beforeCompletedAt: string | null = null;
  let beforeCreatedAt: string | null = null;
  let beforeId: string | null = null;
  let csv = `\ufeff${HEADERS.join(',')}\r\n`;
  while (true) {
    const { data, error } = await client.rpc('job_export_rows', {
      p_request_id: request.id, p_before_completed_at: beforeCompletedAt,
      p_before_created_at: beforeCreatedAt, p_before_id: beforeId, p_limit: 500,
    });
    if (error) throw new Error(`rows_${errorCode(error)}`);
    const rows = (data ?? []) as ExportRow[];
    for (const row of rows) csv += `${rowToCsv(row, request.reporting_time_zone)}\r\n`;
    if (rows.length < 500) break;
    const last = rows.at(-1)!;
    beforeCompletedAt = last.completed_at;
    beforeCreatedAt = last.created_at;
    beforeId = last.job_id;
  }
  return new TextEncoder().encode(csv);
}

function emailContent(request: ExportRequest, token: string, expiresAt: string) {
  const year = String(request.reporting_year);
  const url = downloadUrl(token);
  const safeUrl = escapeHtml(url);
  const expiration = expirationInZone(expiresAt, request.reporting_time_zone);
  const text = [
    'Your job export is ready', '',
    `Your ${year} FieldSoli job summary CSV is ready to download.`, '',
    `Download CSV: ${url}`, '',
    `This link expires on ${expiration}.`, '',
    'Anyone with this link can download the CSV until it expires. Do not forward or share it.',
    'The file may contain customer names, service addresses, job descriptions, and financial information. Store it securely.', '',
    'If the button does not work, copy and paste this link into your browser:', url, '',
    'If you did not request this export, do not download it. Contact support@fieldsoli.com.', '',
    'FieldSoli · support@fieldsoli.com',
  ].join('\n');
  const preview = `Download your ${year} job summary CSV before the secure link expires.`;
  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f8;font-family:Arial,sans-serif;color:#18212b"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preview)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:12px"><tr><td style="padding:32px"><p style="margin:0 0 24px;font-weight:700;font-size:20px">FieldSoli</p><h1 style="margin:0 0 16px;font-size:26px">Your job export is ready</h1><p style="line-height:1.5">Your ${year} FieldSoli job summary CSV is ready to download.</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#18212b;color:#fff;padding:13px 20px;border-radius:7px;text-decoration:none;font-weight:700">Download CSV</a></p><p style="line-height:1.5">This link expires on ${escapeHtml(expiration)}.</p><p style="line-height:1.5">Anyone with this link can download the CSV until it expires. Do not forward or share it.</p><p style="line-height:1.5">The file may contain customer names, service addresses, job descriptions, and financial information. Store it securely.</p><p style="line-height:1.5">If the button does not work, copy and paste this link into your browser:</p><p style="word-break:break-all;line-height:1.5"><a href="${safeUrl}">${safeUrl}</a></p><p style="line-height:1.5">If you did not request this export, do not download it. Contact <a href="mailto:support@fieldsoli.com">support@fieldsoli.com</a>.</p><p style="margin:28px 0 0;color:#667085;font-size:13px">FieldSoli · support@fieldsoli.com</p></td></tr></table></td></tr></table></body></html>`;
  return { url, html, text };
}

async function ensureArtifact(request: ExportRequest): Promise<ExportRequest> {
  const client = serverClient();
  if (request.generation_state === 'ready' && request.object_path) return request;
  const path = exportObjectPath(request.user_id, request.id);
  await client.from('job_export_requests').update({ generation_state: 'processing', generation_attempts: request.generation_attempts + 1 }).eq('id', request.id);
  const bytes = await buildCsv(request);
  if (bytes.byteLength > 25 * 1024 * 1024) throw new Error('csv_too_large');
  const { error: uploadError } = await client.storage.from(EXPORT_BUCKET).upload(path, new Blob([bytes], { type: 'text/csv' }), {
    // storage-js prefixes this value with `max-age=`. Including `no-store`
    // produces the valid private-artifact directive `max-age=0, no-store`.
    contentType: 'text/csv', cacheControl: '0, no-store', upsert: false,
  });
  if (uploadError) {
    const { data: existing, error: listError } = await client.storage.from(EXPORT_BUCKET).list(`${request.user_id}/${request.id}`, { search: 'job-summary.csv' });
    if (listError || !existing?.some((object) => object.name === 'job-summary.csv')) throw new Error(`upload_${errorCode(uploadError)}`);
  }
  const { data, error } = await client.from('job_export_requests').update({
    generation_state: 'ready', object_path: path, byte_size: bytes.byteLength, generated_at: new Date().toISOString(), failure_code: null,
  }).eq('id', request.id).select().single();
  if (error) throw new Error(`artifact_state_${errorCode(error)}`);
  return data as ExportRequest;
}

async function sendEmail(request: ExportRequest): Promise<void> {
  const client = serverClient();
  if (request.delivery_state === 'sent') return;
  const token = await exportTokenForRequest(request.id);
  const deliveryAttempt = request.delivery_attempts + 1;
  let expiresAt = request.expires_at;
  if (!request.token_hash || !expiresAt) {
    const firstSendAt = new Date();
    expiresAt = new Date(firstSendAt.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await client.from('job_export_requests').update({
      token_hash: await sha256Hex(token), expires_at: expiresAt, first_send_at: firstSendAt.toISOString(),
      delivery_state: 'processing', delivery_attempts: deliveryAttempt,
    }).eq('id', request.id).is('token_hash', null);
    if (error) throw new Error(`token_state_${errorCode(error)}`);
  } else if (request.token_hash !== await sha256Hex(token)) {
    throw new Error('token_hash_mismatch');
  } else {
    const { error } = await client.from('job_export_requests').update({
      delivery_state: 'processing', delivery_attempts: deliveryAttempt,
    }).eq('id', request.id);
    if (error) throw new Error(`attempt_state_${errorCode(error)}`);
  }
  const content = emailContent(request, token, expiresAt!);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requiredEnv('RESEND_EXPORT_API_KEY')}`,
      'Content-Type': 'application/json', 'Idempotency-Key': `job-export/${request.id}`,
    },
    body: JSON.stringify({
      from: 'FieldSoli <noreply@fieldsoli.com>', reply_to: 'support@fieldsoli.com', to: [request.recipient_email],
      subject: `Your ${request.reporting_year} FieldSoli job export is ready`, text: content.text, html: content.html,
      tags: [{ name: 'category', value: 'job_export' }],
    }),
  });
  const payload = await response.json().catch(() => ({})) as { id?: string };
  if (!response.ok) {
    const permanent = [400, 401, 403, 422].includes(response.status);
    throw new Error(`${permanent ? 'permanent' : 'transient'}_resend_${response.status}`);
  }
  const { error } = await client.from('job_export_requests').update({
    delivery_state: 'sent', resend_message_id: payload.id ?? null, sent_at: new Date().toISOString(), delivery_attempts: deliveryAttempt, failure_code: null,
  }).eq('id', request.id);
  if (error) throw new Error(`sent_state_${errorCode(error)}`);
}

async function processMessage(messageId: number, requestId: string, readCount: number) {
  const client = serverClient();
  const { data, error } = await client.from('job_export_requests').select('*').eq('id', requestId).maybeSingle();
  if (error) throw new Error(`load_${errorCode(error)}`);
  if (!data || ['failed', 'deleted'].includes(data.generation_state) || ['failed', 'revoked', 'expired'].includes(data.delivery_state)) {
    await client.rpc('ack_job_export_queue_message', { p_message_id: messageId }); return;
  }
  let working = data as ExportRequest;
  try {
    working = await ensureArtifact(working);
    await sendEmail(working);
    await client.rpc('ack_job_export_queue_message', { p_message_id: messageId });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown';
    const terminal = reason.startsWith('permanent_') || reason === 'csv_too_large' || reason === 'token_hash_mismatch' || readCount >= 5;
    if (terminal) {
      const current = working;
      const { error: removeError } = current.object_path
        ? await client.storage.from(EXPORT_BUCKET).remove([current.object_path])
        : { error: null };
      await client.from('job_export_requests').update({
        generation_state: removeError ? 'ready' : (current.generation_state === 'ready' ? 'deleted' : 'failed'),
        delivery_state: 'failed', failure_code: reason.slice(0, 80), next_retry_at: null,
        // A failed cleanup gets picked up by the daily expiry scan instead of
        // silently leaving a private object behind forever.
        expires_at: removeError ? (current.expires_at ?? new Date().toISOString()) : current.expires_at,
        object_path: removeError ? current.object_path : null,
        ...(removeError ? {} : {
          recipient_email: '', token_hash: null, resend_message_id: null,
          scrubbed_at: new Date().toISOString(),
        }),
      }).eq('id', requestId);
      await client.rpc('ack_job_export_queue_message', { p_message_id: messageId });
      console.error('[job-export] terminal processing failure', { requestId, failure: `${reason.slice(0, 60)}${removeError ? '_cleanup' : ''}` });
      return;
    }
    const delay = [60, 120, 240, 480][Math.min(readCount - 1, 3)];
    await client.from('job_export_requests').update({ next_retry_at: new Date(Date.now() + delay * 1000).toISOString(), failure_code: reason.slice(0, 80) }).eq('id', requestId);
    await client.rpc('retry_job_export_queue_message', { p_message_id: messageId, p_delay_seconds: delay });
    console.warn('[job-export] retry scheduled', { requestId, failure: reason.slice(0, 80) });
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!workerAuthorized(request)) return json({ error: 'unauthorized' }, 401);
  const client = serverClient();
  const { data, error } = await client.rpc('claim_job_export_queue_messages', { p_quantity: 5 });
  if (error) return json({ error: 'temporarily_unavailable' }, 503);
  for (const message of (data ?? []) as Array<{ message_id: number; request_id: string; read_count: number }>) {
    await processMessage(message.message_id, message.request_id, message.read_count);
  }
  return json({ ok: true });
});
