import { EXPORT_BUCKET, json, serverClient, workerAuthorized } from '../_shared/job-export.ts';
import {
  cleanExpiredExportArtifacts, type ExpiredExportArtifact,
} from '../_shared/job-export-cleanup.ts';

function absent(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /not found|does not exist|404/i.test(message);
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!workerAuthorized(request)) return json({ error: 'unauthorized' }, 401);
  const client = serverClient();
  const now = new Date().toISOString();
  const { data: expired, error } = await client.from('job_export_requests').select('id, object_path, expires_at')
    .lt('expires_at', now).not('object_path', 'is', null).limit(500);
  if (error) return json({ error: 'temporarily_unavailable' }, 503);

  try {
    await cleanExpiredExportArtifacts((expired ?? []) as ExpiredExportArtifact[], {
      markExpired: async (id) => {
        const { error: updateError } = await client.from('job_export_requests')
          .update({ delivery_state: 'expired' }).eq('id', id);
        if (updateError) throw updateError;
      },
      removeObject: async (objectPath) => {
        const { error: removeError } = await client.storage.from(EXPORT_BUCKET).remove([objectPath]);
        if (removeError && !absent(removeError)) throw removeError;
        return { absent: Boolean(removeError) };
      },
      scrubDeleted: async (id, scrubbedAt) => {
        const { error: updateError } = await client.from('job_export_requests').update({
          generation_state: 'deleted', delivery_state: 'expired', object_path: null,
          recipient_email: '', token_hash: null, resend_message_id: null, scrubbed_at: scrubbedAt,
        }).eq('id', id);
        if (updateError) throw updateError;
      },
      logDeletionFailure: ({ requestId, overdue }) => {
        console.error(
          overdue ? '[job-export] overdue artifact deletion failure' : '[job-export] artifact deletion failure',
          { requestId },
        );
      },
    });
  } catch (cleanupError) {
    console.error('[job-export] cleanup state update failure', cleanupError);
    return json({ error: 'temporarily_unavailable' }, 503);
  }

  // Coarse rows remain seven days after sensitive fields are scrubbed for
  // operational diagnostics, then are removed without a secondary queue.
  await client.from('job_export_requests').delete().lt('scrubbed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  return json({ ok: true });
});
