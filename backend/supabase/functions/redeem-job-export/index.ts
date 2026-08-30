import { EXPORT_BUCKET, serverClient, sha256Hex } from '../_shared/job-export.ts';
import { handleJobExportRedemption } from '../_shared/job-export-redeem.ts';

Deno.serve(async (request) => {
  const client = serverClient();
  const configured = Deno.env.get('EXPORT_DOWNLOAD_BASE_URL') ?? 'https://fieldsoli.com/exports/download';
  return await handleJobExportRedemption(request, {
    allowedOrigin: new URL(configured).origin,
    hashToken: sha256Hex,
    findByTokenHash: async (tokenHash) => {
      const { data, error } = await client.from('job_export_requests')
        .select('object_path, expires_at, generation_state, delivery_state, reporting_year')
        .eq('token_hash', tokenHash)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    signDownload: async (objectPath, expiresInSeconds, fileName) => {
      const { data, error } = await client.storage.from(EXPORT_BUCKET).createSignedUrl(
        objectPath,
        expiresInSeconds,
        { download: fileName },
      );
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  });
});
