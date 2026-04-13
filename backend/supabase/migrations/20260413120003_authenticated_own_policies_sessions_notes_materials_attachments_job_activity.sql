-- Replace generic *_owner_all policies with explicit authenticated CRUD policies
-- (same pattern as 20260413120002_jobs_authenticated_policies.sql).
-- Anon policies are unchanged.

drop policy if exists sessions_owner_all on public.sessions;
drop policy if exists notes_owner_all on public.notes;
drop policy if exists materials_owner_all on public.materials;
drop policy if exists attachments_owner_all on public.attachments;
drop policy if exists job_activity_events_owner_all on public.job_activity_events;

-- sessions
create policy "sessions_select_own"
on public.sessions
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "sessions_insert_own"
on public.sessions
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "sessions_update_own"
on public.sessions
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "sessions_delete_own"
on public.sessions
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- notes
create policy "notes_select_own"
on public.notes
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "notes_insert_own"
on public.notes
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "notes_update_own"
on public.notes
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "notes_delete_own"
on public.notes
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- materials
create policy "materials_select_own"
on public.materials
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "materials_insert_own"
on public.materials
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "materials_update_own"
on public.materials
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "materials_delete_own"
on public.materials
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- attachments
create policy "attachments_select_own"
on public.attachments
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "attachments_insert_own"
on public.attachments
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "attachments_update_own"
on public.attachments
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "attachments_delete_own"
on public.attachments
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- job_activity_events
create policy "job_activity_events_select_own"
on public.job_activity_events
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "job_activity_events_insert_own"
on public.job_activity_events
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "job_activity_events_update_own"
on public.job_activity_events
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "job_activity_events_delete_own"
on public.job_activity_events
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
