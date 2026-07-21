const LOCAL_BACKEND_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

/**
 * Store builds must use the hosted backend and privacy-safe analytics flags.
 * Local development remains free to use .env.local and local Supabase.
 */
function validateReleaseEnvironment(env = process.env) {
  const isProductionBuild =
    env.EAS_BUILD === 'true'
    || env.FIELDSOLO_RELEASE_EXPORT === 'true';

  if (!isProductionBuild) return;

  if (env.EXPO_PUBLIC_APP_ENV !== 'production') {
    throw new Error(
      'Production builds require EXPO_PUBLIC_APP_ENV=production.',
    );
  }

  const rawUrl = (env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  if (!rawUrl) {
    throw new Error(
      'Production builds require EXPO_PUBLIC_SUPABASE_URL.',
    );
  }

  let backendUrl;
  try {
    backendUrl = new URL(rawUrl);
  } catch {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL must be a valid URL.');
  }

  if (
    backendUrl.protocol !== 'https:'
    || LOCAL_BACKEND_HOSTS.has(backendUrl.hostname)
  ) {
    throw new Error(
      'Production builds must use an HTTPS hosted Supabase URL, not a local backend.',
    );
  }

  if (!(env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim()) {
    throw new Error(
      'Production builds require EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  if (env.EXPO_PUBLIC_ANALYTICS_DEBUG_RICH !== 'false') {
    throw new Error(
      'Production builds require EXPO_PUBLIC_ANALYTICS_DEBUG_RICH=false.',
    );
  }
}

module.exports = { validateReleaseEnvironment };
