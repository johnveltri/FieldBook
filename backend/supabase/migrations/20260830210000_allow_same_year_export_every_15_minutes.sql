-- Same-year Job Summary exports may be requested again while an earlier
-- download link is still valid. In-flight work stays idempotent; a new
-- accept for that year is allowed every 15 minutes.
create or replace function public.accept_job_export_request(
  p_year integer,
  p_time_zone text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_user auth.users%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_existing public.job_export_requests%rowtype;
  v_request_id uuid;
  v_retry_at timestamptz;
begin
  if v_user_id is null then
    return jsonb_build_object('status', 'unauthorized');
  end if;
  if p_time_zone is null or not exists (
    select 1 from pg_timezone_names where name = p_time_zone
  ) then
    return jsonb_build_object('status', 'invalid_time_zone');
  end if;

  select * into v_user from auth.users where id = v_user_id;
  if not found or v_user.email is null or v_user.email_confirmed_at is null then
    return jsonb_build_object('status', 'unverified_email');
  end if;
  if p_year < extract(year from v_user.created_at at time zone p_time_zone)::integer
    or p_year > extract(year from now() at time zone p_time_zone)::integer then
    return jsonb_build_object('status', 'invalid_year');
  end if;

  v_start := make_timestamptz(p_year, 1, 1, 0, 0, 0, p_time_zone);
  v_end := make_timestamptz(p_year + 1, 1, 1, 0, 0, 0, p_time_zone);
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select * into v_existing
  from public.job_export_requests r
  where r.user_id = v_user_id
    and r.reporting_year = p_year
    and (
      r.generation_state in ('queued', 'processing')
      or (r.generation_state = 'ready' and r.delivery_state in ('pending', 'processing'))
    )
  order by r.created_at desc
  limit 1;
  if found then
    return jsonb_build_object(
      'status', 'confirmed', 'request_id', v_existing.id,
      'recipient_email', v_existing.recipient_email, 'deduplicated', true
    );
  end if;

  if not exists (
    select 1 from public.jobs j
    where j.user_id = v_user_id
      and j.deleted_at is null
      and j.job_work_status = 'completed'
      and j.completed_at >= v_start and j.completed_at < v_end
  ) then
    return jsonb_build_object('status', 'no_eligible_jobs');
  end if;

  select r.created_at + interval '15 minutes' into v_retry_at
  from public.job_export_requests r
  where r.user_id = v_user_id
    and r.reporting_year = p_year
  order by r.created_at desc
  limit 1;
  if v_retry_at is not null and v_retry_at > now() then
    return jsonb_build_object('status', 'rate_limited', 'retry_at', v_retry_at);
  end if;

  insert into public.job_export_requests (
    user_id, reporting_year, reporting_time_zone, recipient_email
  ) values (v_user_id, p_year, p_time_zone, v_user.email)
  returning id into v_request_id;
  perform pgmq.send('job_exports', jsonb_build_object('request_id', v_request_id));
  return jsonb_build_object(
    'status', 'confirmed', 'request_id', v_request_id,
    'recipient_email', v_user.email, 'deduplicated', false
  );
end;
$$;
