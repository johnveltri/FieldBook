-- Denormalized financial completeness per job.
--
-- A job is financially complete when it has a real description, revenue, at
-- least one live session, and at least one live material line attributed either
-- directly to the job or through one of its live sessions. The jobs list uses
-- this as a server-side filter so paginated Open-tab results do not drop rows
-- after fetch.

alter table public.jobs
  add column if not exists is_financially_complete boolean not null default false;

comment on column public.jobs.is_financially_complete is
  'True when short_description is not blank/default, revenue_cents > 0, and the job has at least one non-deleted session and one non-deleted material line.';

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
    and exists (
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
  where j.id = p_job_id;
end;
$$;

comment on function public.refresh_job_financial_completeness (uuid) is
  'Recomputes jobs.is_financially_complete from description, revenue, live sessions, and live materials.';

create or replace function public.jobs_refresh_financial_completeness ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_job_financial_completeness (new.id);
  return new;
end;
$$;

create or replace function public.sessions_refresh_job_financial_completeness ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_job_financial_completeness (old.job_id);
    return old;
  elsif tg_op = 'UPDATE' then
    if old.job_id is distinct from new.job_id then
      perform public.refresh_job_financial_completeness (old.job_id);
    end if;
    perform public.refresh_job_financial_completeness (new.job_id);
    return new;
  else
    perform public.refresh_job_financial_completeness (new.job_id);
    return new;
  end if;
end;
$$;

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

drop trigger if exists jobs_refresh_financial_completeness on public.jobs;
create trigger jobs_refresh_financial_completeness
after insert or update of short_description, revenue_cents on public.jobs
for each row execute function public.jobs_refresh_financial_completeness ();

drop trigger if exists sessions_refresh_job_financial_completeness on public.sessions;
create trigger sessions_refresh_job_financial_completeness
after insert or update or delete on public.sessions
for each row execute function public.sessions_refresh_job_financial_completeness ();

drop trigger if exists materials_refresh_job_financial_completeness on public.materials;
create trigger materials_refresh_job_financial_completeness
after insert or update or delete on public.materials
for each row execute function public.materials_refresh_job_financial_completeness ();

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
  and exists (
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
  and exists (
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
);

create index if not exists jobs_user_open_stack_active_idx
  on public.jobs (user_id, is_financially_complete, job_work_status, job_payment_state, list_recency_at desc, id desc)
  where deleted_at is null;
