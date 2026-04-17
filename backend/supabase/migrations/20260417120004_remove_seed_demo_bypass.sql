-- Remove seed-demo bypass paths. Authenticated access should rely only on
-- normal ownership policies (`*_own`) and real user-owned rows.

drop policy if exists "jobs_select_seed_demo" on public.jobs;
drop policy if exists "sessions_select_seed_demo" on public.sessions;
drop policy if exists "notes_select_seed_demo" on public.notes;
drop policy if exists "materials_select_seed_demo" on public.materials;
drop policy if exists "job_activity_events_select_seed_demo" on public.job_activity_events;

drop policy if exists "jobs_update_seed_demo" on public.jobs;

drop function if exists public.claim_demo_job();
