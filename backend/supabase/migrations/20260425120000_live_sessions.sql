-- Live Session feature:
--   1. Track the user's local timezone on each session so the server can
--      auto-end at the user's local 23:59:59 (rather than UTC midnight).
--   2. Enforce one in-progress session per user globally (the app surfaces a
--      single floating live-session bar / sheet, so concurrent in-progress
--      sessions on different jobs would break that UX).
--   3. Schedule a pg_cron job that, every 15 minutes, ends any in-progress
--      session whose local clock has rolled past midnight by setting
--      `ended_at = (start_local_date + 1 day) at 23:59:59` in `started_tz`.
--      Clients should refresh on foreground / app launch and then clear the
--      live-session UI when the row flips to `ended`.

-- 1. Per-session local timezone (IANA name, e.g. "America/Chicago").
alter table public.sessions
  add column if not exists started_tz text;

comment on column public.sessions.started_tz is
  'IANA timezone of the device when the session started. Used by the auto-end-at-midnight job so the cutoff is the user''s local 23:59:59 rather than UTC midnight.';

-- 2. Enforce one in-progress session per user globally.
create unique index if not exists sessions_one_active_per_user_idx
  on public.sessions (user_id)
  where session_status = 'in_progress' and deleted_at is null;

-- 3. Auto-end-at-midnight job.

-- pg_cron lives in the `extensions` schema in Supabase; create extension is
-- idempotent and safe to run on local + hosted projects.
create extension if not exists pg_cron with schema extensions;

create or replace function public.end_stale_live_sessions()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ended_count integer := 0;
  rec record;
  tz text;
  start_local_date date;
  now_local_date date;
  end_at timestamptz;
begin
  for rec in
    select id, started_at, started_tz
    from public.sessions
    where session_status = 'in_progress'
      and deleted_at is null
  loop
    -- Default to UTC when started_tz is missing (legacy rows).
    tz := coalesce(rec.started_tz, 'UTC');
    -- Some bad inputs may slip through; guard with a safe fallback so the
    -- cron job never throws and stops processing the rest.
    begin
      start_local_date := (rec.started_at at time zone tz)::date;
      now_local_date   := (now() at time zone tz)::date;
    exception when others then
      tz := 'UTC';
      start_local_date := (rec.started_at at time zone tz)::date;
      now_local_date   := (now() at time zone tz)::date;
    end;

    if now_local_date > start_local_date then
      -- 23:59:59 of the start's local day, converted back to timestamptz.
      end_at := ((start_local_date + interval '1 day' - interval '1 second')
                  at time zone tz);

      update public.sessions
         set session_status = 'ended',
             ended_at = end_at
       where id = rec.id
         and session_status = 'in_progress'
         and deleted_at is null;

      if found then
        ended_count := ended_count + 1;
      end if;
    end if;
  end loop;

  return ended_count;
end;
$$;

comment on function public.end_stale_live_sessions is
  'Ends any in-progress session whose started_tz local clock has rolled past midnight by setting ended_at to that day''s 23:59:59 local. Scheduled by pg_cron every 15 minutes.';

-- Schedule (or reschedule) the cron job. cron.schedule is idempotent on
-- jobname — calling it again returns the same job id.
do $$
begin
  perform cron.schedule(
    'end_stale_live_sessions',
    '*/15 * * * *',
    $cron$ select public.end_stale_live_sessions(); $cron$
  );
exception
  when undefined_function then
    -- pg_cron may be unavailable in some local images; do not fail the
    -- migration. Re-run after enabling the extension.
    raise notice 'pg_cron not available; skipping cron.schedule for end_stale_live_sessions';
end;
$$;
