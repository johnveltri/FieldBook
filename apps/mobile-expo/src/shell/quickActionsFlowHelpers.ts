import { listJobsForCurrentUserPage } from '@fieldsolo/api-client';

import type { ChooseJobBottomSheetJob, DropdownBottomSheetOption } from '../components/ds';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export const CAPTURE_JOBS_PAGE_SIZE = 100;

export type CaptureMode = 'inbox' | 'job';

export type CaptureStep =
  | 'idle'
  | 'noteEdit'
  | 'materialEdit'
  | 'chooseJob'
  | 'noteSession'
  | 'materialSession'
  | 'materialUnit';

export type CaptureJob = {
  id: string;
  shortDescription: string;
  customerName: string | null;
};

export const CAPTURE_UNIT_OPTIONS: DropdownBottomSheetOption[] = (
  ['ea', 'ft', 'pcs', 'kit', 'lb', 'gal', 'lot'] as const
).map((u) => ({ id: u, label: u, value: u }));

export function formatCaptureError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    typeof (e as { message: unknown }).message === 'string'
  ) {
    return (e as { message: string }).message;
  }
  return String(e);
}

export function formatLiveSessionJobTitle(now: Date): string {
  const monthDay = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(now);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);
  return `Live Session ${monthDay} at ${time}`;
}

export async function listAllJobsForCapture(): Promise<ChooseJobBottomSheetJob[]> {
  const jobs: ChooseJobBottomSheetJob[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await listJobsForCurrentUserPage(supabase, {
      limit: CAPTURE_JOBS_PAGE_SIZE,
      offset,
      tab: 'all',
    });
    jobs.push(
      ...page.items.map((j) => ({
        id: j.id,
        shortDescription: j.shortDescription,
        customerName: j.customerName,
      })),
    );
    hasMore = page.hasMore && page.items.length > 0;
    offset += page.items.length;
  }

  return jobs;
}

export function assertSupabaseConfigured(): boolean {
  return isSupabaseConfigured();
}
