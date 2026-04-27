-- Denormalized last activity timestamp per job (max coalesce(ended_at, started_at)
-- over non-deleted sessions). Kept in sync via trigger; used for list sort and filters.

alter table public.jobs
  add column if not exists last_worked_at timestamptz;

comment on column public.jobs.last_worked_at is
  'Latest session activity: max(coalesce(ended_at, started_at)) over sessions where session_status <> ''deleted''.';

-- Backfill from existing sessions
update public.jobs j
set last_worked_at = sub.m
from (
  select
    s.job_id,
    max(coalesce(s.ended_at, s.started_at)) as m
  from public.sessions s
  where s.session_status <> 'deleted'
  group by s.job_id
) sub
where j.id = sub.job_id;

create index if not exists jobs_user_last_worked_active_idx
  on public.jobs (user_id, last_worked_at desc nulls last, id desc)
  where deleted_at is null;

create or replace function public.refresh_job_last_worked_at (p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.jobs j
  set last_worked_at = (
    select max(coalesce(s.ended_at, s.started_at))
    from public.sessions s
    where s.job_id = p_job_id
      and s.session_status <> 'deleted'
  )
  where j.id = p_job_id;
end;
$$;

comment on function public.refresh_job_last_worked_at (uuid) is
  'Recomputes jobs.last_worked_at from live sessions; SECURITY DEFINER so RLS does not block maintenance.';

create or replace function public.sessions_refresh_job_last_worked ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_job_last_worked_at (old.job_id);
    return old;
  elsif tg_op = 'UPDATE' then
    if old.job_id is distinct from new.job_id then
      perform public.refresh_job_last_worked_at (old.job_id);
    end if;
    perform public.refresh_job_last_worked_at (new.job_id);
    return new;
  else
    perform public.refresh_job_last_worked_at (new.job_id);
    return new;
  end if;
end;
$$;

drop trigger if exists sessions_refresh_job_last_worked on public.sessions;

create trigger sessions_refresh_job_last_worked
after insert or update or delete on public.sessions
for each row execute function public.sessions_refresh_job_last_worked ();
