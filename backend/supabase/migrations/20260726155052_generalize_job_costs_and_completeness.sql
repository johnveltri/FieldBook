-- Generalize materials into all job costs and rename the persisted
-- completeness signal before external users depend on the old contracts.

-- The existing completeness functions reference public.materials by name.
-- Pause their triggers while the table/columns are renamed; the final
-- hardening migration recreates them in the unexposed private schema.
drop trigger if exists jobs_refresh_financial_completeness on public.jobs;
drop trigger if exists sessions_refresh_job_financial_completeness on public.sessions;
drop trigger if exists materials_refresh_job_financial_completeness on public.materials;

drop function if exists public.jobs_refresh_financial_completeness();
drop function if exists public.sessions_refresh_job_financial_completeness();
drop function if exists public.materials_refresh_job_financial_completeness();
drop function if exists public.refresh_job_financial_completeness(uuid);

alter table public.materials rename to job_costs;
alter table public.job_costs rename column purchase_date to incurred_on;

alter index if exists public.materials_job_created_idx rename to job_costs_job_created_idx;
alter index if exists public.materials_session_created_idx rename to job_costs_session_created_idx;
alter index if exists public.materials_job_active_idx rename to job_costs_job_active_idx;
alter index if exists public.materials_session_active_idx rename to job_costs_session_active_idx;
alter index if exists public.materials_session_active_updated_idx rename to job_costs_session_active_updated_idx;

alter trigger set_materials_updated_at on public.job_costs rename to set_job_costs_updated_at;
alter trigger materials_enforce_job_session on public.job_costs rename to job_costs_enforce_job_session;

alter table public.job_costs rename constraint materials_quantity_nonnegative to job_costs_quantity_nonnegative;
alter table public.job_costs rename constraint materials_unit_cost_nonnegative to job_costs_unit_cost_nonnegative;
alter table public.job_costs rename constraint materials_total_cost_nonnegative to job_costs_total_cost_nonnegative;
alter table public.job_costs rename constraint materials_description_not_blank to job_costs_description_not_blank;

alter table public.job_costs
  add column cost_type text not null default 'material',
  add constraint job_costs_type_check check (
    cost_type in (
      'material',
      'helper_labor',
      'equipment_rental',
      'permit',
      'disposal',
      'travel_parking',
      'other'
    )
  );

comment on table public.job_costs is
  'All costs attributable to a job, a session, or the Inbox. The launch Materials UI writes cost_type=material.';
comment on column public.job_costs.cost_type is
  'Constrained category used for material-only UI and all-cost profit rollups.';
comment on column public.job_costs.incurred_on is
  'Date the cost was incurred; formerly materials.purchase_date.';

alter table public.jobs
  add column costs_reviewed_at timestamptz;

update public.jobs
set costs_reviewed_at = updated_at
where no_materials_confirmed;

alter table public.jobs drop column no_materials_confirmed;
alter table public.jobs rename column is_financially_complete to is_job_record_complete;

comment on column public.jobs.costs_reviewed_at is
  'Last time the user confirmed the job cost record was reviewed. Cleared when a new active cost is added.';
comment on column public.jobs.is_job_record_complete is
  'True when the job has a real description, positive revenue, an active session, and an active cost or costs_reviewed_at.';

alter index if exists public.jobs_user_open_stack_active_idx
  rename to jobs_user_open_stack_record_complete_idx;
