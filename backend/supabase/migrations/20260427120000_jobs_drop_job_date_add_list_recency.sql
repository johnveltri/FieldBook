-- Remove unused job_date; list sort uses session activity or job creation time (sort only).

drop index if exists public.jobs_user_date_idx;

alter table public.jobs
  drop column if exists job_date;

-- Sort key for paginated lists: coalesce(last_worked_at, created_at). User-facing
-- "last worked" remains jobs.last_worked_at only (see api-client labels).
alter table public.jobs
  add column list_recency_at timestamptz
  generated always as (coalesce (last_worked_at, created_at)) stored;

comment on column public.jobs.list_recency_at is
  'List ordering only: coalesce(last_worked_at, created_at). Not for “last worked” copy.';

drop index if exists public.jobs_user_last_worked_active_idx;

create index jobs_user_list_recency_active_idx
  on public.jobs (user_id, list_recency_at desc, id desc)
  where deleted_at is null;
