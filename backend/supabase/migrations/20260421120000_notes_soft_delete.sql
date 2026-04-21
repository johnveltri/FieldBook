-- Soft-delete support for notes.
--
-- Adds `deleted_at timestamptz` to `public.notes` and creates partial indexes
-- that exclude soft-deleted rows from the hot paths (job-scoped and
-- session-scoped note reads). Mirrors the approach used for `public.jobs`.
--
-- RLS policies are left unchanged; callers filter `deleted_at is null` in
-- application code (parallels `fetchJobDetail` / `listJobsForCurrentUser`).

alter table public.notes
  add column deleted_at timestamptz null;

create index if not exists notes_job_active_idx
  on public.notes (job_id, created_at desc)
  where job_id is not null and deleted_at is null;

create index if not exists notes_session_active_idx
  on public.notes (session_id, created_at desc)
  where session_id is not null and deleted_at is null;
