-- Cover each composite ownership foreign key in its declared column order.
-- The user-only RLS indexes remain useful because these begin with parent IDs.

create index sessions_job_owner_idx
  on public.sessions (job_id, user_id);

create index notes_job_owner_idx
  on public.notes (job_id, user_id)
  where job_id is not null;
create index notes_session_owner_idx
  on public.notes (session_id, user_id)
  where session_id is not null;

create index job_costs_job_owner_idx
  on public.job_costs (job_id, user_id)
  where job_id is not null;
create index job_costs_session_owner_idx
  on public.job_costs (session_id, user_id)
  where session_id is not null;

create index attachments_job_owner_idx
  on public.attachments (job_id, user_id)
  where job_id is not null;
create index attachments_session_owner_idx
  on public.attachments (session_id, user_id)
  where session_id is not null;

create index job_activity_events_job_owner_idx
  on public.job_activity_events (job_id, user_id);
