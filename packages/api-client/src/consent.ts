import type { FieldSoloSupabaseClient } from './client';

export type LegalDocumentType = 'privacy_policy' | 'terms';

export type RecordLegalAcceptanceInput = {
  documentType: LegalDocumentType;
  documentVersion: string;
  source: string;
  appVersion?: string | null;
  platform?: string | null;
};

type LegalAcceptanceRow = {
  user_id: string;
  document_type: LegalDocumentType;
  document_version: string;
  source: string;
  app_version: string | null;
  platform: string | null;
};

async function requireAuthenticatedUserId(
  client: FieldSoloSupabaseClient,
): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) {
    throw new Error('No authenticated user available to record legal acceptance.');
  }
  return userId;
}

function rowFromInput(
  userId: string,
  input: RecordLegalAcceptanceInput,
): LegalAcceptanceRow {
  return {
    user_id: userId,
    document_type: input.documentType,
    document_version: input.documentVersion,
    source: input.source,
    app_version: input.appVersion ?? null,
    platform: input.platform ?? null,
  };
}

export async function recordLegalAcceptance(
  client: FieldSoloSupabaseClient,
  input: RecordLegalAcceptanceInput,
): Promise<void> {
  const userId = await requireAuthenticatedUserId(client);
  const { error } = await client
    .from('legal_acceptances')
    .insert(rowFromInput(userId, input));

  if (error) throw error;
}

export async function recordSignupLegalAcceptances(
  client: FieldSoloSupabaseClient,
  input: {
    privacyVersion: string;
    termsVersion: string;
    appVersion?: string | null;
    platform?: string | null;
  },
): Promise<void> {
  const userId = await requireAuthenticatedUserId(client);
  const rows: LegalAcceptanceRow[] = [
    rowFromInput(userId, {
      documentType: 'privacy_policy',
      documentVersion: input.privacyVersion,
      source: 'mobile_signup',
      appVersion: input.appVersion,
      platform: input.platform,
    }),
    rowFromInput(userId, {
      documentType: 'terms',
      documentVersion: input.termsVersion,
      source: 'mobile_signup',
      appVersion: input.appVersion,
      platform: input.platform,
    }),
  ];

  const { error } = await client.from('legal_acceptances').insert(rows);
  if (error) throw error;
}
