import type { FieldSoloSupabaseClient } from './client';

export type LegalDocumentType = 'privacy_policy' | 'terms';

export type LegalAcceptanceVersions = {
  privacyPolicyVersion: string | null;
  termsVersion: string | null;
};

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
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const sessionUserId = sessionData.session?.user?.id;
  if (sessionUserId) return sessionUserId;

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
    .upsert(rowFromInput(userId, input), {
      onConflict: 'user_id,document_type,document_version',
      ignoreDuplicates: true,
    });

  if (error) throw error;
}

async function recordBothLegalAcceptances(
  client: FieldSoloSupabaseClient,
  input: {
    privacyVersion: string;
    termsVersion: string;
    source: string;
    appVersion?: string | null;
    platform?: string | null;
  },
): Promise<void> {
  const userId = await requireAuthenticatedUserId(client);
  const rows: LegalAcceptanceRow[] = [
    rowFromInput(userId, {
      documentType: 'privacy_policy',
      documentVersion: input.privacyVersion,
      source: input.source,
      appVersion: input.appVersion,
      platform: input.platform,
    }),
    rowFromInput(userId, {
      documentType: 'terms',
      documentVersion: input.termsVersion,
      source: input.source,
      appVersion: input.appVersion,
      platform: input.platform,
    }),
  ];

  const { error } = await client.from('legal_acceptances').upsert(rows, {
    onConflict: 'user_id,document_type,document_version',
    ignoreDuplicates: true,
  });
  if (error) throw error;
}

export async function fetchLatestLegalAcceptanceVersions(
  client: FieldSoloSupabaseClient,
): Promise<LegalAcceptanceVersions> {
  const userId = await requireAuthenticatedUserId(client);
  const { data, error } = await client
    .from('legal_acceptances')
    .select('document_type, document_version, accepted_at')
    .eq('user_id', userId)
    .order('accepted_at', { ascending: false });

  if (error) throw error;

  const versions: LegalAcceptanceVersions = {
    privacyPolicyVersion: null,
    termsVersion: null,
  };

  for (const row of data ?? []) {
    const type = row.document_type as LegalDocumentType;
    const version = row.document_version as string;
    if (type === 'privacy_policy' && versions.privacyPolicyVersion == null) {
      versions.privacyPolicyVersion = version;
    }
    if (type === 'terms' && versions.termsVersion == null) {
      versions.termsVersion = version;
    }
  }

  return versions;
}

export function needsLegalReacceptance(
  accepted: LegalAcceptanceVersions,
  required: { privacyVersion: string; termsVersion: string },
): boolean {
  return (
    accepted.privacyPolicyVersion !== required.privacyVersion
    || accepted.termsVersion !== required.termsVersion
  );
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
  await recordBothLegalAcceptances(client, {
    ...input,
    source: 'mobile_signup',
  });
}

export async function recordReacceptanceLegalAcceptances(
  client: FieldSoloSupabaseClient,
  input: {
    privacyVersion: string;
    termsVersion: string;
    appVersion?: string | null;
    platform?: string | null;
  },
): Promise<void> {
  await recordBothLegalAcceptances(client, {
    ...input,
    source: 'mobile_reacceptance',
  });
}
