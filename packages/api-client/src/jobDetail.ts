import type {
  JobDetailMaterialBucket,
  JobDetailMaterialLine,
  JobDetailNote,
  JobDetailNoteBucket,
  JobDetailSession,
  JobDetailViewModel,
  JobDetailWorkStatus,
  JobId,
  JobPaymentState,
} from '@fieldbook/shared-types';

import type { FieldbookSupabaseClient } from './client';

type JobWorkStatusDb =
  | 'not_started'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'canceled';

type JobRow = {
  id: string;
  short_description: string;
  customer_name: string | null;
  service_address: string | null;
  job_type: string | null;
  job_work_status: JobWorkStatusDb;
  job_payment_state: JobPaymentState | null;
  revenue_cents: number | null;
  collected_cents: number | null;
  updated_at: string;
};

type SessionRow = {
  id: string;
  job_id: string;
  session_status: 'in_progress' | 'ended' | 'discarded';
  started_at: string;
  ended_at: string | null;
};

type NoteRow = {
  id: string;
  job_id: string | null;
  session_id: string | null;
  body: string;
  created_at: string;
};

type MaterialRow = {
  id: string;
  job_id: string | null;
  session_id: string | null;
  description: string | null;
  /** Postgres `numeric` may deserialize as string. */
  quantity: string | number | null;
  unit: string | null;
  total_cost_cents: number;
  created_at: string;
};

type ActivityRow = {
  id: string;
  event_type: string;
  created_at: string;
  payload: unknown;
};

const moneyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatUsd(cents: number): string {
  return moneyFmt.format(cents / 100);
}

function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatTimeLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function sessionDurationHours(startedAt: string, endedAt: string | null): number {
  const a = new Date(startedAt).getTime();
  const b = endedAt ? new Date(endedAt).getTime() : Date.now();
  return Math.max(0, (b - a) / 3_600_000);
}

function mapWorkStatus(row: JobRow): JobDetailWorkStatus {
  // Keep "paid" as a derived UI status only when work is complete and payment is paid.
  if (row.job_work_status === 'completed' && row.job_payment_state === 'paid') return 'paid';
  switch (row.job_work_status) {
    case 'not_started':
      return 'notStarted';
    case 'in_progress':
      return 'inProgress';
    case 'on_hold':
      return 'onHold';
    case 'completed':
      return 'completed';
    case 'canceled':
      return 'cancelled';
    default:
      return 'notStarted';
  }
}

function mapSession(row: SessionRow): JobDetailSession {
  const start = new Date(row.started_at);
  const end = row.ended_at ? new Date(row.ended_at) : null;
  const timeFmt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const startStr = timeFmt.format(start);
  const endStr = end ? timeFmt.format(end) : '…';
  const hours = sessionDurationHours(row.started_at, row.ended_at);

  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    dateLabel: formatDateLabel(row.started_at),
    timeRangeLabel: `${startStr} – ${endStr}`,
    durationLabel: `${hours.toFixed(1)}h`,
  };
}

function excerptNote(body: string, max = 120): string {
  const t = body.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function materialLine(row: MaterialRow): JobDetailMaterialLine {
  const qty =
    row.quantity != null && row.quantity !== ''
      ? `${row.quantity}${row.unit ? ` ${row.unit}` : ''}`
      : '—';
  return {
    name: row.description?.trim() || 'Material',
    quantityLabel: qty,
    priceLabel: formatUsd(row.total_cost_cents),
  };
}

/** Loads job graph and maps to `JobDetailViewModel`. */
export async function fetchJobDetail(
  client: FieldbookSupabaseClient,
  jobId: JobId,
): Promise<JobDetailViewModel | null> {
  const { data: job, error: jobErr } = await client
    .from('jobs')
    .select(
      'id, short_description, customer_name, service_address, job_type, job_work_status, job_payment_state, revenue_cents, collected_cents, updated_at',
    )
    .eq('id', jobId)
    .is('deleted_at', null)
    .maybeSingle();

  if (jobErr) throw jobErr;
  if (!job) return null;

  const j = job as JobRow;

  const { data: sessionsRaw, error: sErr } = await client
    .from('sessions')
    .select('id, job_id, session_status, started_at, ended_at')
    .eq('job_id', jobId)
    .order('started_at', { ascending: true });

  if (sErr) throw sErr;
  const sessions = (sessionsRaw ?? []) as SessionRow[];
  const activeSessions = sessions.filter((s) => s.session_status !== 'discarded');
  const sessionIds = activeSessions.map((s) => s.id);

  const notesBase = client
    .from('notes')
    .select('id, job_id, session_id, body, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  const notesQ =
    sessionIds.length > 0
      ? notesBase.or(`job_id.eq.${jobId},session_id.in.(${sessionIds.join(',')})`)
      : notesBase.eq('job_id', jobId);

  const [notesRes, matsJobRes, matsSessRes, actRes] = await Promise.all([
    notesQ,
    client.from('materials').select('*').eq('job_id', jobId),
    sessionIds.length
      ? client.from('materials').select('*').in('session_id', sessionIds)
      : Promise.resolve({ data: [] as MaterialRow[], error: null }),
    client
      .from('job_activity_events')
      .select('id, event_type, created_at, payload')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  if (notesRes.error) throw notesRes.error;
  if (matsJobRes.error) throw matsJobRes.error;
  if (matsSessRes.error) throw matsSessRes.error;
  if (actRes.error) throw actRes.error;

  const notesRaw = notesRes.data;
  const matsJob = matsJobRes.data;
  const matsSess = matsSessRes.data;
  const actRaw = actRes.data;

  const matById = new Map<string, MaterialRow>();
  for (const m of (matsJob ?? []) as MaterialRow[]) matById.set(m.id, m);
  for (const m of (matsSess ?? []) as MaterialRow[]) matById.set(m.id, m);
  const materials = [...matById.values()];

  const notes = (notesRaw ?? []) as NoteRow[];

  const revenueCents = j.revenue_cents ?? 0;
  const materialsSpend = materials.reduce((s, m) => s + m.total_cost_cents, 0);
  const materialsCents = -materialsSpend;
  const feesCents = 0;
  const netEarningsCents = revenueCents + materialsCents + feesCents;

  let totalHours = 0;
  for (const s of activeSessions) {
    if (s.session_status === 'ended' || s.session_status === 'in_progress') {
      totalHours += sessionDurationHours(s.started_at, s.ended_at);
    }
  }

  const sessionCount = activeSessions.filter(
    (s) => s.session_status === 'ended' || s.session_status === 'in_progress',
  ).length;

  const netPerHrDisplay =
    totalHours > 0.01
      ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
          netEarningsCents / 100 / totalHours,
        )}/hr`
      : '—';

  let lastTs = 0;
  for (const s of activeSessions) {
    const t = new Date(s.ended_at ?? s.started_at).getTime();
    if (t > lastTs) lastTs = t;
  }
  const lastWorkedLabel =
    lastTs > 0 ? `Last worked ${formatDateLabel(new Date(lastTs).toISOString())}` : 'No sessions yet';

  const matsUnassigned = materials.filter((m) => m.session_id == null);
  const matsBySession = new Map<string, MaterialRow[]>();
  for (const m of materials) {
    if (m.session_id) {
      const list = matsBySession.get(m.session_id) ?? [];
      list.push(m);
      matsBySession.set(m.session_id, list);
    }
  }

  const materialBuckets: JobDetailMaterialBucket[] = [];
  if (matsUnassigned.length) {
    materialBuckets.push({
      id: 'mat-unassigned',
      kind: 'unassigned',
      items: matsUnassigned.sort((a, b) => a.created_at.localeCompare(b.created_at)).map(materialLine),
    });
  }
  for (const s of activeSessions) {
    const ms = matsBySession.get(s.id);
    if (ms?.length) {
      materialBuckets.push({
        id: `mat-${s.id}`,
        kind: 'session',
        sessionDateLabel: formatDateLabel(s.started_at),
        items: ms.sort((a, b) => a.created_at.localeCompare(b.created_at)).map(materialLine),
      });
    }
  }

  const notesUnassigned = notes.filter(
    (n) => n.job_id === jobId && n.session_id == null,
  );
  const notesBySession = new Map<string, NoteRow[]>();
  for (const n of notes) {
    if (n.session_id) {
      const list = notesBySession.get(n.session_id) ?? [];
      list.push(n);
      notesBySession.set(n.session_id, list);
    }
  }

  const mapNote = (n: NoteRow) => ({
    id: n.id,
    body: n.body,
    sessionId: n.session_id,
    excerpt: excerptNote(n.body),
    dateLabel: formatDateLabel(n.created_at),
  });

  const noteBuckets: JobDetailNoteBucket[] = [];
  if (notesUnassigned.length) {
    noteBuckets.push({
      id: 'note-unassigned',
      kind: 'unassigned',
      notes: notesUnassigned.map(mapNote),
    });
  }
  for (const s of activeSessions) {
    const ns = notesBySession.get(s.id);
    if (ns?.length) {
      noteBuckets.push({
        id: `note-${s.id}`,
        kind: 'session',
        sessionDateLabel: formatDateLabel(s.started_at),
        notes: ns.map(mapNote),
      });
    }
  }

  const activities = (actRaw ?? []) as ActivityRow[];
  const latest = activities[0];
  const timeline = latest
    ? {
        title: latest.event_type.replace(/_/g, ' '),
        timeLabel: formatTimeLabel(latest.created_at),
      }
    : {
        title: activeSessions.length ? 'Session activity' : 'No activity yet',
        timeLabel: formatTimeLabel(j.updated_at),
      };
  return {
    id: j.id,
    shortDescription: j.short_description,
    customerName: j.customer_name ?? '',
    serviceAddress: j.service_address ?? '',
    jobType: j.job_type ?? '',
    lastWorkedLabel,
    workStatus: mapWorkStatus(j),
    earnings: {
      revenueCents,
      materialsCents,
      feesCents,
      netEarningsCents,
    },
    metrics: {
      timeLabel: `${totalHours.toFixed(1)}h`,
      netPerHrDisplay,
      sessionCount,
    },
    // All non-discarded sessions (in-progress + ended) so the Session pickers
    // have the full list to choose from. SessionCard renders in-progress rows
    // correctly — `timeRangeLabel` uses `…` for the open end.
    sessions: activeSessions.map(mapSession),
    materialBuckets,
    noteBuckets,
    timeline,
  };
}
