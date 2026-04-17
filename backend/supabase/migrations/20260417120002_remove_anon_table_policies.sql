-- Secure shared schema defaults: remove direct public-table access for the anon role.
-- The Expo client still uses the publishable anon key for Supabase Auth; this only
-- affects table RLS on public tables.
--
-- Local debugging that needs temporary open table access can opt in via:
--   backend/supabase/snippets/enable_local_anon_table_access.sql

drop policy if exists "jobs_select_anon" on public.jobs;

drop policy if exists "sessions_select_anon" on public.sessions;
drop policy if exists "sessions_insert_anon" on public.sessions;
drop policy if exists "sessions_update_anon" on public.sessions;
drop policy if exists "sessions_delete_anon" on public.sessions;

drop policy if exists "notes_select_anon" on public.notes;
drop policy if exists "notes_insert_anon" on public.notes;
drop policy if exists "notes_update_anon" on public.notes;
drop policy if exists "notes_delete_anon" on public.notes;

drop policy if exists "materials_select_anon" on public.materials;
drop policy if exists "materials_insert_anon" on public.materials;
drop policy if exists "materials_update_anon" on public.materials;
drop policy if exists "materials_delete_anon" on public.materials;

drop policy if exists "attachments_select_anon" on public.attachments;
drop policy if exists "attachments_insert_anon" on public.attachments;
drop policy if exists "attachments_update_anon" on public.attachments;
drop policy if exists "attachments_delete_anon" on public.attachments;

drop policy if exists "job_activity_events_select_anon" on public.job_activity_events;
drop policy if exists "job_activity_events_insert_anon" on public.job_activity_events;
drop policy if exists "job_activity_events_update_anon" on public.job_activity_events;
drop policy if exists "job_activity_events_delete_anon" on public.job_activity_events;
