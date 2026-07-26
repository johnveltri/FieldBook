-- Keep internal trigger and cron helpers out of the exposed public schema.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.enforce_child_job_matches_session_job()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare expected_job uuid;
begin
  if new.session_id is null then return new; end if;
  select s.job_id into expected_job from public.sessions s where s.id = new.session_id;
  if not found then raise exception 'session_id does not reference a session'; end if;
  if new.job_id is not null and new.job_id is distinct from expected_job then
    raise exception 'job_id must equal the session''s job_id when both are set';
  end if;
  return new;
end;
$$;

create or replace function private.unassign_children_for_deleted_session()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.session_status = 'deleted' and old.session_status is distinct from 'deleted' then
    update public.notes
    set job_id = coalesce(job_id, new.job_id), session_id = null
    where session_id = new.id;

    update public.job_costs
    set job_id = coalesce(job_id, new.job_id), session_id = null
    where session_id = new.id;
  end if;
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data->>'first_name', '')), ''),
    nullif(btrim(coalesce(new.raw_user_meta_data->>'last_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.refresh_job_last_worked_at(p_job_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.jobs j
  set last_worked_at = (
    select max(coalesce(s.ended_at, s.started_at))
    from public.sessions s
    where s.job_id = p_job_id and s.session_status <> 'deleted'
  )
  where j.id = p_job_id;
$$;

create or replace function private.sessions_refresh_job_last_worked()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_job_last_worked_at(old.job_id);
    return old;
  end if;
  if tg_op = 'UPDATE' and old.job_id is distinct from new.job_id then
    perform private.refresh_job_last_worked_at(old.job_id);
  end if;
  perform private.refresh_job_last_worked_at(new.job_id);
  return new;
end;
$$;

create or replace function private.refresh_job_record_completeness(p_job_id uuid)
returns void language sql security definer set search_path = '' as $$
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
      j.costs_reviewed_at is not null
      or exists (
        select 1 from public.job_costs c
        where c.deleted_at is null
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

create or replace function private.jobs_refresh_record_completeness()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.refresh_job_record_completeness(new.id);
  return new;
end;
$$;

create or replace function private.sessions_refresh_job_record_completeness()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_job_record_completeness(old.job_id);
    return old;
  end if;
  if tg_op = 'UPDATE' and old.job_id is distinct from new.job_id then
    perform private.refresh_job_record_completeness(old.job_id);
  end if;
  perform private.refresh_job_record_completeness(new.job_id);
  return new;
end;
$$;

create or replace function private.job_costs_refresh_job_record_completeness()
returns trigger language plpgsql security definer set search_path = '' as $$
declare old_job_id uuid; new_job_id uuid;
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
        update public.jobs set costs_reviewed_at = null where id = new_job_id;
      end if;
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

create or replace function private.end_stale_live_sessions()
returns integer language plpgsql security definer set search_path = '' as $$
declare ended_count integer := 0; rec record; tz text; start_local_date date; now_local_date date; end_at timestamptz;
begin
  for rec in
    select id, started_at, started_tz from public.sessions
    where session_status = 'in_progress' and deleted_at is null
  loop
    tz := coalesce(rec.started_tz, 'UTC');
    begin
      start_local_date := (rec.started_at at time zone tz)::date;
      now_local_date := (now() at time zone tz)::date;
    exception when others then
      tz := 'UTC';
      start_local_date := (rec.started_at at time zone tz)::date;
      now_local_date := (now() at time zone tz)::date;
    end;
    if now_local_date > start_local_date then
      end_at := ((start_local_date + interval '1 day' - interval '1 second') at time zone tz);
      update public.sessions set session_status = 'ended', ended_at = end_at
      where id = rec.id and session_status = 'in_progress' and deleted_at is null;
      if found then ended_count := ended_count + 1; end if;
    end if;
  end loop;
  return ended_count;
end;
$$;

-- Repoint every trigger before removing the exposed helpers.
drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at before update on public.jobs for each row execute function private.set_updated_at();
drop trigger if exists set_sessions_updated_at on public.sessions;
create trigger set_sessions_updated_at before update on public.sessions for each row execute function private.set_updated_at();
drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at before update on public.notes for each row execute function private.set_updated_at();
drop trigger if exists set_job_costs_updated_at on public.job_costs;
create trigger set_job_costs_updated_at before update on public.job_costs for each row execute function private.set_updated_at();
drop trigger if exists set_attachments_updated_at on public.attachments;
create trigger set_attachments_updated_at before update on public.attachments for each row execute function private.set_updated_at();
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();

drop trigger if exists notes_enforce_job_session on public.notes;
create trigger notes_enforce_job_session before insert or update on public.notes for each row execute function private.enforce_child_job_matches_session_job();
drop trigger if exists job_costs_enforce_job_session on public.job_costs;
create trigger job_costs_enforce_job_session before insert or update on public.job_costs for each row execute function private.enforce_child_job_matches_session_job();
drop trigger if exists attachments_enforce_job_session on public.attachments;
create trigger attachments_enforce_job_session before insert or update on public.attachments for each row execute function private.enforce_child_job_matches_session_job();

drop trigger if exists sessions_unassign_children_on_delete on public.sessions;
create trigger sessions_unassign_children_on_delete after update on public.sessions for each row execute function private.unassign_children_for_deleted_session();
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

drop trigger if exists sessions_refresh_job_last_worked on public.sessions;
create trigger sessions_refresh_job_last_worked after insert or update or delete on public.sessions for each row execute function private.sessions_refresh_job_last_worked();
drop trigger if exists jobs_refresh_record_completeness on public.jobs;
create trigger jobs_refresh_record_completeness after insert or update of short_description, revenue_cents, costs_reviewed_at on public.jobs for each row execute function private.jobs_refresh_record_completeness();
drop trigger if exists sessions_refresh_job_record_completeness on public.sessions;
create trigger sessions_refresh_job_record_completeness after insert or update or delete on public.sessions for each row execute function private.sessions_refresh_job_record_completeness();
drop trigger if exists job_costs_refresh_job_record_completeness on public.job_costs;
create trigger job_costs_refresh_job_record_completeness after insert or update or delete on public.job_costs for each row execute function private.job_costs_refresh_job_record_completeness();

-- Initial recomputation after the trigger cutover.
do $$ declare job_record record; begin
  for job_record in select id from public.jobs loop
    perform private.refresh_job_last_worked_at(job_record.id);
    perform private.refresh_job_record_completeness(job_record.id);
  end loop;
end $$;

-- Replace the cron command with its unexposed implementation.
do $$
begin
  perform cron.schedule(
    'end_stale_live_sessions',
    '*/15 * * * *',
    $cron$ select private.end_stale_live_sessions(); $cron$
  );
exception when undefined_function then
  raise notice 'pg_cron not available; skipping cron.schedule for end_stale_live_sessions';
end;
$$;

drop function if exists public.set_updated_at();
drop function if exists public.enforce_child_job_matches_session_job();
drop function if exists public.unassign_children_for_deleted_session();
drop function if exists public.handle_new_user();
drop function if exists public.refresh_job_last_worked_at(uuid);
drop function if exists public.sessions_refresh_job_last_worked();
drop function if exists public.end_stale_live_sessions();

revoke execute on all functions in schema private from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema private revoke execute on functions from public;

-- The repository has no GraphQL consumer. REST remains exposed through public.
drop extension if exists pg_graphql;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.consume_waitlist_rate_limit(text, integer) to service_role;
