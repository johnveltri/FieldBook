export type PostHogDeletionResult =
  | { status: 'skipped'; reason: 'not_configured' }
  | {
      status: 'queued';
      persons_found: number;
      persons_deleted: number;
      events_queued_for_deletion: boolean;
    }
  | { status: 'failed'; detail: string };

const POSTHOG_DELETE_TIMEOUT_MS = 5_000;

/**
 * Queue deletion of a PostHog person (and associated events) by distinct_id.
 *
 * FieldSolo identifies analytics users with the Supabase auth user id after
 * consent is granted. Requires server-side secrets:
 *   POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID
 * Optional: POSTHOG_API_HOST (defaults to https://us.posthog.com)
 */
export async function queuePostHogPersonDeletion(
  distinctId: string,
): Promise<PostHogDeletionResult> {
  const apiKey = Deno.env.get('POSTHOG_PERSONAL_API_KEY')?.trim() ?? '';
  const projectId = Deno.env.get('POSTHOG_PROJECT_ID')?.trim() ?? '';
  const apiHost = (
    Deno.env.get('POSTHOG_API_HOST')?.trim() || 'https://us.posthog.com'
  ).replace(/\/+$/, '');

  if (!apiKey || !projectId) {
    return { status: 'skipped', reason: 'not_configured' };
  }

  const url = `${apiHost}/api/projects/${projectId}/persons/bulk_delete/`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(POSTHOG_DELETE_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        distinct_ids: [distinctId],
        delete_events: true,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return {
        status: 'failed',
        detail: `posthog_http_${response.status}:${detail.slice(0, 500)}`,
      };
    }

    const body = (await response.json()) as {
      persons_found?: number;
      persons_deleted?: number;
      events_queued_for_deletion?: boolean;
    };

    return {
      status: 'queued',
      persons_found: body.persons_found ?? 0,
      persons_deleted: body.persons_deleted ?? 0,
      events_queued_for_deletion: body.events_queued_for_deletion ?? false,
    };
  } catch (error) {
    return {
      status: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
