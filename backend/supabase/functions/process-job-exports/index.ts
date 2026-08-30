import {
  EXPORT_BUCKET, ExportRequest, downloadUrl, errorCode, exportObjectPath,
  exportTokenForRequest, json, requiredEnv, serverClient, sha256Hex, workerAuthorized,
} from '../_shared/job-export.ts';
import {
  buildJobExportCsv, buildJobExportEmail, type JobExportRow,
} from '../_shared/job-export-content.ts';

async function buildCsv(request: ExportRequest): Promise<Uint8Array> {
  const client = serverClient();
  return await buildJobExportCsv(request.reporting_time_zone, async (cursor) => {
    const { data, error } = await client.rpc('job_export_rows', {
      p_request_id: request.id,
      p_before_completed_at: cursor.beforeCompletedAt,
      p_before_created_at: cursor.beforeCreatedAt,
      p_before_id: cursor.beforeId,
      p_limit: cursor.limit,
    });
    if (error) throw new Error(`rows_${errorCode(error)}`);
    return (data ?? []) as JobExportRow[];
  });
}

async function markRevokedRequestCleaned(request: ExportRequest, path: string): Promise<void> {
  const client = serverClient();
  const { error: removeError } = await client.storage.from(EXPORT_BUCKET).remove([path]);
  const now = new Date().toISOString();
  const { error: stateError } = await client.from('job_export_requests').update({
    generation_state: removeError ? 'ready' : 'deleted',
    delivery_state: 'revoked',
    object_path: removeError ? path : null,
    expires_at: removeError ? (request.expires_at ?? now) : request.expires_at,
    recipient_email: '',
    token_hash: null,
    resend_message_id: null,
    scrubbed_at: removeError ? null : now,
  }).eq('id', request.id).eq('delivery_state', 'revoked');
  if (removeError || stateError) {
    console.error('[job-export] revoked artifact cleanup failure', {
      requestId: request.id,
      failure: errorCode(removeError ?? stateError),
    });
  }
}

async function ensureArtifact(request: ExportRequest): Promise<ExportRequest> {
  const client = serverClient();
  if (request.generation_state === 'ready' && request.object_path) return request;
  const path = exportObjectPath(request.user_id, request.id);
  const { data: started, error: startError } = await client.from('job_export_requests')
    .update({ generation_state: 'processing', generation_attempts: request.generation_attempts + 1 })
    .eq('id', request.id)
    .in('delivery_state', ['pending', 'processing'])
    .select()
    .maybeSingle();
  if (startError) throw new Error(`artifact_start_${errorCode(startError)}`);
  if (!started) throw new Error('request_revoked');

  const bytes = await buildCsv(request);
  if (bytes.byteLength > 25 * 1024 * 1024) throw new Error('csv_too_large');

  // Account deletion revokes the row before touching Storage. Re-check after
  // CSV generation so a claimed worker cannot upload after that revocation.
  const { data: current, error: currentError } = await client.from('job_export_requests')
    .select('delivery_state')
    .eq('id', request.id)
    .maybeSingle();
  if (currentError) throw new Error(`artifact_guard_${errorCode(currentError)}`);
  if (!current || !['pending', 'processing'].includes(current.delivery_state)) {
    await markRevokedRequestCleaned(request, path);
    throw new Error('request_revoked');
  }

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
  }).eq('id', request.id).in('delivery_state', ['pending', 'processing']).select().maybeSingle();
  if (error) {
    await markRevokedRequestCleaned(request, path);
    throw new Error(`artifact_state_${errorCode(error)}`);
  }
  if (!data) {
    await markRevokedRequestCleaned(request, path);
    throw new Error('request_revoked');
  }
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
    const { data, error } = await client.from('job_export_requests').update({
      token_hash: await sha256Hex(token), expires_at: expiresAt, first_send_at: firstSendAt.toISOString(),
      delivery_state: 'processing', delivery_attempts: deliveryAttempt,
    }).eq('id', request.id).is('token_hash', null).in('delivery_state', ['pending', 'processing'])
      .select('id').maybeSingle();
    if (error) throw new Error(`token_state_${errorCode(error)}`);
    if (!data) throw new Error('request_revoked');
  } else if (request.token_hash !== await sha256Hex(token)) {
    throw new Error('token_hash_mismatch');
  } else {
    const { data, error } = await client.from('job_export_requests').update({
      delivery_state: 'processing', delivery_attempts: deliveryAttempt,
    }).eq('id', request.id).in('delivery_state', ['pending', 'processing'])
      .select('id').maybeSingle();
    if (error) throw new Error(`attempt_state_${errorCode(error)}`);
    if (!data) throw new Error('request_revoked');
  }
  const content = buildJobExportEmail({
    reportingYear: request.reporting_year,
    reportingTimeZone: request.reporting_time_zone,
    downloadUrl: downloadUrl(token),
    expiresAt: expiresAt!,
  });
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
  const { data: sentRow, error } = await client.from('job_export_requests').update({
    delivery_state: 'sent', resend_message_id: payload.id ?? null, sent_at: new Date().toISOString(), delivery_attempts: deliveryAttempt, failure_code: null,
  }).eq('id', request.id).eq('delivery_state', 'processing').select('id').maybeSingle();
  if (error) throw new Error(`sent_state_${errorCode(error)}`);
  if (!sentRow) throw new Error('request_revoked');
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
    if (reason === 'request_revoked') {
      await markRevokedRequestCleaned(working, exportObjectPath(working.user_id, working.id));
      await client.rpc('ack_job_export_queue_message', { p_message_id: messageId });
      return;
    }
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
  const { data, error } = await client.rpc('claim_job_export_queue_messages', { p_quantity: 1 });
  if (error) return json({ error: 'temporarily_unavailable' }, 503);
  for (const message of (data ?? []) as Array<{ message_id: number; request_id: string; read_count: number }>) {
    await processMessage(message.message_id, message.request_id, message.read_count);
  }
  return json({ ok: true });
});
