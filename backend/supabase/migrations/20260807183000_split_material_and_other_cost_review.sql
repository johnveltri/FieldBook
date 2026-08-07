-- Split unified costs_reviewed_at into independent materials vs other-costs
-- review timestamps, and align is_job_record_complete with mobile completeness.

alter table public.jobs
  rename column costs_reviewed_at to materials_reviewed_at;

alter table public.jobs
  add column other_costs_reviewed_at timestamptz;

comment on column public.jobs.materials_reviewed_at is
  'User confirmed the materials leg was reviewed. Cleared when a new active material cost is added.';
comment on column public.jobs.other_costs_reviewed_at is
  'User confirmed the other-costs leg was reviewed. Cleared when a new active non-material cost is added.';
comment on column public.jobs.is_job_record_complete is
  'True when the job has a real description, positive revenue, a session, and both cost legs satisfied (lines or review timestamps).';

grant update (other_costs_reviewed_at) on public.jobs to authenticated;

create or replace function private.job_cost_is_material(p_cost_type text)
returns boolean
language sql
immutable
as $$
  select p_cost_type is null or p_cost_type = 'material';
$$;

create or replace function private.refresh_job_record_completeness(p_job_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.jobs j
  set is_job_record_complete =
    btrim(j.short_description) <> ''
    and btrim(j.short_description) <> 'Untitled Job'
    and coalesce(j.revenue_cents, 0) > 0
    and exists (
      select 1 from public.sessions s
      where s.job_id = p_job_id and s.session_status <> 'deleted'
    )
    and (
      j.materials_reviewed_at is not null
      or exists (
        select 1 from public.job_costs c
        where c.deleted_at is null
          and private.job_cost_is_material(c.cost_type)
          and (
            c.job_id = p_job_id
            or exists (
              select 1 from public.sessions s
              where s.id = c.session_id
                and s.job_id = p_job_id
                and s.session_status <> 'deleted'
            )
          )
      )
    )
    and (
      j.other_costs_reviewed_at is not null
      or exists (
        select 1 from public.job_costs c
        where c.deleted_at is null
          and not private.job_cost_is_material(c.cost_type)
          and (
            c.job_id = p_job_id
            or exists (
              select 1 from public.sessions s
              where s.id = c.session_id
                and s.job_id = p_job_id
                and s.session_status <> 'deleted'
            )
          )
      )
    )
  where j.id = p_job_id;
$$;

create or replace function private.job_costs_refresh_job_record_completeness()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_job_id uuid;
  new_job_id uuid;
  clear_materials_review boolean := false;
  clear_other_costs_review boolean := false;
begin
  if tg_op = 'DELETE' or tg_op = 'UPDATE' then
    old_job_id := old.job_id;
    if old_job_id is null and old.session_id is not null then
      select s.job_id into old_job_id from public.sessions s where s.id = old.session_id;
    end if;
  end if;

  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    new_job_id := new.job_id;
    if new_job_id is null and new.session_id is not null then
      select s.job_id into new_job_id from public.sessions s where s.id = new.session_id;
    end if;

    if new_job_id is not null and new.deleted_at is null then
      if tg_op = 'INSERT'
        or old.deleted_at is not null
        or old_job_id is distinct from new_job_id then
        if private.job_cost_is_material(new.cost_type) then
          clear_materials_review := true;
        else
          clear_other_costs_review := true;
        end if;
      end if;
    end if;

    if clear_materials_review then
      update public.jobs set materials_reviewed_at = null where id = new_job_id;
    elsif clear_other_costs_review then
      update public.jobs set other_costs_reviewed_at = null where id = new_job_id;
    end if;
  end if;

  if old_job_id is not null and old_job_id is distinct from new_job_id then
    perform private.refresh_job_record_completeness(old_job_id);
  end if;
  if new_job_id is not null then
    perform private.refresh_job_record_completeness(new_job_id);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_refresh_record_completeness on public.jobs;
create trigger jobs_refresh_record_completeness
  after insert or update of short_description, revenue_cents, materials_reviewed_at, other_costs_reviewed_at
  on public.jobs
  for each row
  execute function private.jobs_refresh_record_completeness();

-- Recompute completeness for all jobs after rule change.
do $$
declare
  job_record record;
begin
  for job_record in select id from public.jobs where deleted_at is null loop
    perform private.refresh_job_record_completeness(job_record.id);
  end loop;
end;
$$;
