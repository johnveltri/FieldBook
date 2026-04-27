-- User can confirm "no materials used" on a job; counts toward financial completeness
-- alongside having at least one material line.

alter table public.jobs
  add column if not exists no_materials_confirmed boolean not null default false;

comment on column public.jobs.no_materials_confirmed is
  'When true, the job is treated as having satisfied the materials requirement for is_financially_complete even with zero material lines. Cleared when a material row is inserted for this job.';

create or replace function public.refresh_job_financial_completeness (p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.jobs j
  set is_financially_complete =
    btrim(j.short_description) <> ''
    and btrim(j.short_description) <> 'Untitled Job'
    and coalesce(j.revenue_cents, 0) > 0
    and exists (
      select 1
      from public.sessions s
      where s.job_id = p_job_id
        and s.session_status <> 'deleted'
    )
    and (
      j.no_materials_confirmed
      or exists (
        select 1
        from public.materials m
        where m.deleted_at is null
          and (
            m.job_id = p_job_id
            or exists (
              select 1
              from public.sessions s
              where s.id = m.session_id
                and s.job_id = p_job_id
                and s.session_status <> 'deleted'
            )
          )
      )
    )
  where j.id = p_job_id;
end;
$$;

comment on function public.refresh_job_financial_completeness (uuid) is
  'Recomputes jobs.is_financially_complete from description, revenue, live sessions, and (live materials or no_materials_confirmed).';

drop trigger if exists jobs_refresh_financial_completeness on public.jobs;
create trigger jobs_refresh_financial_completeness
after insert or update of short_description, revenue_cents, no_materials_confirmed on public.jobs
for each row execute function public.jobs_refresh_financial_completeness ();

create or replace function public.materials_refresh_job_financial_completeness ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_job_id uuid;
  new_job_id uuid;
begin
  if tg_op = 'DELETE' then
    old_job_id := old.job_id;
    if old_job_id is null and old.session_id is not null then
      select s.job_id into old_job_id
      from public.sessions s
      where s.id = old.session_id;
    end if;
    if old_job_id is not null then
      perform public.refresh_job_financial_completeness (old_job_id);
    end if;
    return old;
  end if;

  new_job_id := new.job_id;
  if new_job_id is null and new.session_id is not null then
    select s.job_id into new_job_id
    from public.sessions s
    where s.id = new.session_id;
  end if;

  if tg_op = 'INSERT' and new_job_id is not null then
    update public.jobs
    set no_materials_confirmed = false
    where id = new_job_id;
  end if;

  if tg_op = 'UPDATE' then
    old_job_id := old.job_id;
    if old_job_id is null and old.session_id is not null then
      select s.job_id into old_job_id
      from public.sessions s
      where s.id = old.session_id;
    end if;
    if old_job_id is not null and old_job_id is distinct from new_job_id then
      perform public.refresh_job_financial_completeness (old_job_id);
    end if;
  end if;

  if new_job_id is not null then
    perform public.refresh_job_financial_completeness (new_job_id);
  end if;
  return new;
end;
$$;

comment on column public.jobs.is_financially_complete is
  'True when short_description is not blank/default, revenue_cents > 0, the job has at least one non-deleted session, and either no_materials_confirmed or at least one non-deleted material line for the job.';

update public.jobs j
set is_financially_complete =
  btrim(j.short_description) <> ''
  and btrim(j.short_description) <> 'Untitled Job'
  and coalesce(j.revenue_cents, 0) > 0
  and exists (
    select 1
    from public.sessions s
    where s.job_id = j.id
      and s.session_status <> 'deleted'
  )
  and (
    j.no_materials_confirmed
    or exists (
      select 1
      from public.materials m
      where m.deleted_at is null
        and (
          m.job_id = j.id
          or exists (
            select 1
            from public.sessions s
            where s.id = m.session_id
              and s.job_id = j.id
              and s.session_status <> 'deleted'
          )
        )
    )
  )
where j.is_financially_complete is distinct from (
  btrim(j.short_description) <> ''
  and btrim(j.short_description) <> 'Untitled Job'
  and coalesce(j.revenue_cents, 0) > 0
  and exists (
    select 1
    from public.sessions s
    where s.job_id = j.id
      and s.session_status <> 'deleted'
  )
  and (
    j.no_materials_confirmed
    or exists (
      select 1
      from public.materials m
      where m.deleted_at is null
        and (
          m.job_id = j.id
          or exists (
            select 1
            from public.sessions s
            where s.id = m.session_id
              and s.job_id = j.id
              and s.session_status <> 'deleted'
          )
        )
    )
  )
);
