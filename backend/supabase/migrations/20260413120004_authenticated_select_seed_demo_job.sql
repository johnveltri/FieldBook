-- Seeded demo job (`seed.sql`) uses NULL `user_id` on jobs/sessions/notes/materials.
-- Authenticated "own row" policies hide those rows. Allow any signed-in user to read the
-- fixed demo job id so local dev + Job Detail match Supabase data (not the TS mock).

-- Demo job UUID — keep in sync with `seed.sql` and `EXPO_PUBLIC_DEFAULT_JOB_ID`.
create policy "jobs_select_seed_demo"
on public.jobs
for select
to authenticated
using (id = '00000000-0000-0000-0000-000000000001'::uuid);

create policy "sessions_select_seed_demo"
on public.sessions
for select
to authenticated
using (
  job_id = '00000000-0000-0000-0000-000000000001'::uuid
  and (select auth.uid()) is not null
);

create policy "notes_select_seed_demo"
on public.notes
for select
to authenticated
using (
  (
    job_id = '00000000-0000-0000-0000-000000000001'::uuid
    or session_id in (
      select s.id
      from public.sessions s
      where s.job_id = '00000000-0000-0000-0000-000000000001'::uuid
    )
  )
  and (select auth.uid()) is not null
);

create policy "materials_select_seed_demo"
on public.materials
for select
to authenticated
using (
  (
    job_id = '00000000-0000-0000-0000-000000000001'::uuid
    or session_id in (
      select s.id
      from public.sessions s
      where s.job_id = '00000000-0000-0000-0000-000000000001'::uuid
    )
  )
  and (select auth.uid()) is not null
);

create policy "job_activity_events_select_seed_demo"
on public.job_activity_events
for select
to authenticated
using (
  job_id = '00000000-0000-0000-0000-000000000001'::uuid
  and (select auth.uid()) is not null
);
