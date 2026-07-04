import type { FieldSoloSupabaseClient } from './client';

export type AnalyticsConsentStatus = 'granted' | 'withdrawn';

type AnalyticsConsentRow = {
  status: AnalyticsConsentStatus;
  updated_at: string;
};

export async function fetchAnalyticsConsentStatus(
  client: FieldSoloSupabaseClient,
): Promise<AnalyticsConsentStatus | null> {
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  const userId = authData.user?.id;
  if (!userId) return null;

  const { data, error } = await client
    .from('analytics_consent')
    .select('status, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return (data as AnalyticsConsentRow).status;
}

export async function upsertAnalyticsConsentStatus(
  client: FieldSoloSupabaseClient,
  status: AnalyticsConsentStatus,
): Promise<void> {
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  const userId = authData.user?.id;
  if (!userId) {
    throw new Error('No authenticated user available to update analytics consent.');
  }

  const { error } = await client.from('analytics_consent').upsert(
    {
      user_id: userId,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) throw error;
}
