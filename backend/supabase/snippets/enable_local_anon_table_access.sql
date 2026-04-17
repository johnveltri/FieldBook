-- LOCAL ONLY
-- Re-enable direct anon-role access to public tables for temporary debugging.
-- Do not apply this to hosted or shared environments.
--
-- Revert to the secure default with:
--   npx supabase db reset --workdir backend

create policy "jobs_select_anon" on public.jobs for select to anon using (true);

create policy "sessions_select_anon" on public.sessions for select to anon using (true);
create policy "sessions_insert_anon" on public.sessions for insert to anon with check (true);
create policy "sessions_update_anon" on public.sessions for update to anon using (true) with check (true);
create policy "sessions_delete_anon" on public.sessions for delete to anon using (true);

create policy "notes_select_anon" on public.notes for select to anon using (true);
create policy "notes_insert_anon" on public.notes for insert to anon with check (true);
create policy "notes_update_anon" on public.notes for update to anon using (true) with check (true);
create policy "notes_delete_anon" on public.notes for delete to anon using (true);

create policy "materials_select_anon" on public.materials for select to anon using (true);
create policy "materials_insert_anon" on public.materials for insert to anon with check (true);
create policy "materials_update_anon" on public.materials for update to anon using (true) with check (true);
create policy "materials_delete_anon" on public.materials for delete to anon using (true);

create policy "attachments_select_anon" on public.attachments for select to anon using (true);
create policy "attachments_insert_anon" on public.attachments for insert to anon with check (true);
create policy "attachments_update_anon" on public.attachments for update to anon using (true) with check (true);
create policy "attachments_delete_anon" on public.attachments for delete to anon using (true);

create policy "job_activity_events_select_anon" on public.job_activity_events for select to anon using (true);
create policy "job_activity_events_insert_anon" on public.job_activity_events for insert to anon with check (true);
create policy "job_activity_events_update_anon" on public.job_activity_events for update to anon using (true) with check (true);
create policy "job_activity_events_delete_anon" on public.job_activity_events for delete to anon using (true);
