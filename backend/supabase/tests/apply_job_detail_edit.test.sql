\set ON_ERROR_STOP on

begin;

do $$
declare
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  job_a uuid;
  session_ended uuid;
  session_live uuid;
  result jsonb;
begin
  insert into auth.users (id, email) values
    (user_a, 'edit-a-' || user_a || '@example.com'),
    (user_b, 'edit-b-' || user_b || '@example.com');

  perform set_config('request.jwt.claim.sub', user_a::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  insert into public.jobs (user_id, short_description, revenue_cents, materials_reviewed_at, other_costs_reviewed_at)
  values (user_a, 'Edit RPC job', 5000, now(), now()) returning id into job_a;

  insert into public.sessions (job_id, user_id, entry_mode, session_status, started_at, ended_at, clock_times_explicit)
  values (job_a, user_a, 'manual', 'ended', now() - interval '2 hours', now() - interval '1 hour', true)
  returning id into session_ended;

  insert into public.sessions (job_id, user_id, entry_mode, session_status, started_at, clock_times_explicit)
  values (job_a, user_a, 'live', 'in_progress', now() - interval '30 minutes', true)
  returning id into session_live;

  result := public.apply_job_detail_edit(job_a, jsonb_build_object(
    'job', jsonb_build_object(
      'shortDescription', 'Updated title',
      'customerName', 'Pat',
      'serviceAddress', '1 Main St',
      'revenueCents', 6000
    ),
    'sessions', jsonb_build_object(
      'create', jsonb_build_array(jsonb_build_object(
        'id', gen_random_uuid()::text,
        'startedAt', (now() - interval '1 day')::text,
        'endedAt', (now() - interval '23 hours')::text,
        'clockTimesExplicit', false,
        'startedTz', 'UTC'
      )),
      'update', '[]'::jsonb,
      'deleteIds', '[]'::jsonb
    ),
    'notes', jsonb_build_object('create', '[]'::jsonb, 'update', '[]'::jsonb, 'deleteIds', '[]'::jsonb),
    'materials', jsonb_build_object('create', '[]'::jsonb, 'update', '[]'::jsonb, 'deleteIds', '[]'::jsonb),
    'otherCosts', jsonb_build_object('create', '[]'::jsonb, 'update', '[]'::jsonb, 'deleteIds', '[]'::jsonb)
  ));

  if result ->> 'status' <> 'ok' then
    raise exception 'apply_job_detail_edit failed: %', result;
  end if;

  if (select short_description from public.jobs where id = job_a) <> 'Updated title' then
    raise exception 'job title not updated';
  end if;

  if not exists (
    select 1 from public.sessions
    where job_id = job_a and clock_times_explicit = false and session_status = 'ended'
  ) then
    raise exception 'duration-only session not created';
  end if;

  result := public.apply_job_detail_edit(job_a, jsonb_build_object(
    'job', jsonb_build_object('shortDescription', 'X', 'customerName', '', 'serviceAddress', '', 'revenueCents', null),
    'sessions', jsonb_build_object('create', '[]'::jsonb, 'update', '[]'::jsonb, 'deleteIds', jsonb_build_array(session_live::text)),
    'notes', jsonb_build_object('create', '[]'::jsonb, 'update', '[]'::jsonb, 'deleteIds', '[]'::jsonb),
    'materials', jsonb_build_object('create', '[]'::jsonb, 'update', '[]'::jsonb, 'deleteIds', '[]'::jsonb),
    'otherCosts', jsonb_build_object('create', '[]'::jsonb, 'update', '[]'::jsonb, 'deleteIds', '[]'::jsonb)
  ));

  if result ->> 'code' <> 'conflict' then
    raise exception 'expected conflict deleting in_progress session, got %', result;
  end if;

  perform set_config('request.jwt.claim.sub', user_b::text, true);
  result := public.apply_job_detail_edit(job_a, jsonb_build_object(
    'job', jsonb_build_object('shortDescription', 'Hack', 'customerName', '', 'serviceAddress', '', 'revenueCents', null),
    'sessions', jsonb_build_object('create', '[]'::jsonb, 'update', '[]'::jsonb, 'deleteIds', '[]'::jsonb),
    'notes', jsonb_build_object('create', '[]'::jsonb, 'update', '[]'::jsonb, 'deleteIds', '[]'::jsonb),
    'materials', jsonb_build_object('create', '[]'::jsonb, 'update', '[]'::jsonb, 'deleteIds', '[]'::jsonb),
    'otherCosts', jsonb_build_object('create', '[]'::jsonb, 'update', '[]'::jsonb, 'deleteIds', '[]'::jsonb)
  ));

  if result ->> 'code' not in ('not_found', 'unauthorized') then
    raise exception 'expected unauthorized/not_found for other user, got %', result;
  end if;
end;
$$;

rollback;
