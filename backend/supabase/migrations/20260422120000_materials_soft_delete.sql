-- Soft-delete support for materials.
--
-- Adds `deleted_at timestamptz` to `public.materials` and creates partial
-- indexes that exclude soft-deleted rows from the hot paths (job-scoped and
-- session-scoped material reads). Mirrors the approach used for
-- `public.notes` (see 20260421120000_notes_soft_delete.sql) and
-- `public.jobs`.
--
-- RLS policies are left unchanged; callers filter `deleted_at is null` in
-- application code (parallels `fetchJobDetail` / `listJobsForCurrentUser`).

alter table public.materials
  add column deleted_at timestamptz null;

create index if not exists materials_job_active_idx
  on public.materials (job_id, created_at desc)
  where job_id is not null and deleted_at is null;

create index if not exists materials_session_active_idx
  on public.materials (session_id, created_at desc)
  where session_id is not null and deleted_at is null;
