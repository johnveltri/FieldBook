-- Authenticated users: CRUD only rows where jobs.user_id = auth.uid().
-- Anon policies (e.g. jobs_select_anon) remain separate for dev / anon key flows.

create policy "jobs_select_own"
on public.jobs
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "jobs_insert_own"
on public.jobs
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "jobs_update_own"
on public.jobs
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "jobs_delete_own"
on public.jobs
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
