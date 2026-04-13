-- Rename material_entries → materials (indexes, triggers, constraints, policies).
-- Add job_activity_events for timeline / audit.

-- -----------------------------------------------------------------------------
-- Rename table: material_entries → materials
-- -----------------------------------------------------------------------------

alter table public.material_entries rename to materials;

-- Indexes
alter index public.material_entries_job_created_idx rename to materials_job_created_idx;
alter index public.material_entries_session_created_idx rename to materials_session_created_idx;

-- Triggers
alter trigger set_material_entries_updated_at on public.materials
  rename to set_materials_updated_at;
alter trigger material_entries_enforce_job_session on public.materials
  rename to materials_enforce_job_session;

-- Check constraints
alter table public.materials rename constraint material_entries_at_least_one_parent to materials_at_least_one_parent;
alter table public.materials rename constraint material_entries_quantity_nonnegative to materials_quantity_nonnegative;
alter table public.materials rename constraint material_entries_unit_cost_nonnegative to materials_unit_cost_nonnegative;
alter table public.materials rename constraint material_entries_total_cost_nonnegative to materials_total_cost_nonnegative;
alter table public.materials rename constraint material_entries_description_not_blank to materials_description_not_blank;

-- RLS policies
alter policy material_entries_owner_all on public.materials rename to materials_owner_all;
alter policy material_entries_select_anon on public.materials rename to materials_select_anon;
alter policy material_entries_insert_anon on public.materials rename to materials_insert_anon;
alter policy material_entries_update_anon on public.materials rename to materials_update_anon;
alter policy material_entries_delete_anon on public.materials rename to materials_delete_anon;

comment on table public.materials is 'Material line items; job-level and/or session-scoped (see parent columns + trigger).';

-- -----------------------------------------------------------------------------
-- job_activity_events — timeline / activity feed per job
-- -----------------------------------------------------------------------------

create table public.job_activity_events (
  id uuid primary key default gen_random_uuid (),
  job_id uuid not null references public.jobs (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now ()
);

comment on table public.job_activity_events is 'Append-only activity rows for job timeline UI; not session-level economics.';

create index job_activity_events_job_created_idx on public.job_activity_events (job_id, created_at desc);

alter table public.job_activity_events enable row level security;

create policy job_activity_events_owner_all on public.job_activity_events
  for all using (auth.uid () is not null and auth.uid () = user_id)
  with check (auth.uid () is not null and auth.uid () = user_id);

create policy job_activity_events_select_anon on public.job_activity_events for select to anon using (true);
create policy job_activity_events_insert_anon on public.job_activity_events for insert to anon with check (true);
create policy job_activity_events_update_anon on public.job_activity_events for update to anon using (true) with check (true);
create policy job_activity_events_delete_anon on public.job_activity_events for delete to anon using (true);
