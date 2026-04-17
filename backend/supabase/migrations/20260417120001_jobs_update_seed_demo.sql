-- Mirror jobs_select_seed_demo: allow authenticated users to update the fixed demo job
-- when it still has NULL user_id (local dev before claim_demo_job runs).
create policy "jobs_update_seed_demo"
on public.jobs
for update
to authenticated
using (
  (select auth.uid()) is not null
  and id = '00000000-0000-0000-0000-000000000001'::uuid
)
with check (
  (select auth.uid()) is not null
  and id = '00000000-0000-0000-0000-000000000001'::uuid
);
