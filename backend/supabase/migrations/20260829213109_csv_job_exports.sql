-- Private, one-year Job Summary CSV exports. Client roles never receive table
-- or Storage policies for these artifacts; Edge Functions use the service key.

create extension if not exists pgmq;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

alter table public.jobs
  add column if not exists completed_at timestamptz,
  add column if not exists paid_at timestamptz;

-- Approved one-time launch policy: existing completed and paid jobs use the
-- last recorded work timestamp. Preserve updated_at so this migration does not
-- reorder users' job lists merely because export metadata was introduced.
alter table public.jobs disable trigger set_jobs_updated_at;
update public.jobs
set
  completed_at = case
    when job_work_status = 'completed' and completed_at is null
      then last_worked_at
    else completed_at
  end,
  paid_at = case
    when job_payment_state = 'paid' and paid_at is null
      then last_worked_at
    else paid_at
  end
where last_worked_at is not null
  and (
    (job_work_status = 'completed' and completed_at is null)
    or (job_payment_state = 'paid' and paid_at is null)
  );
alter table public.jobs enable trigger set_jobs_updated_at;

do $$
begin
  if exists (
    select 1 from public.jobs
    where job_work_status = 'completed'
      and last_worked_at is not null
      and completed_at is null
  ) then
    raise exception 'completed job timestamp backfill was incomplete';
  end if;
  if exists (
    select 1 from public.jobs
    where job_payment_state = 'paid'
      and last_worked_at is not null
      and paid_at is null
  ) then
    raise exception 'paid job timestamp backfill was incomplete';
  end if;
end;
$$;

comment on column public.jobs.completed_at is
  'Set when the job enters completed; retained if it later leaves completed. Launch-era completed rows were backfilled from last_worked_at.';
comment on column public.jobs.paid_at is
  'Set when the derived payment state enters paid; retained if it later becomes unpaid or partially paid. Launch-era paid rows were backfilled from last_worked_at.';

create or replace function private.set_job_export_state_timestamps()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.job_work_status = 'completed' then
      new.completed_at := now();
    end if;
    if coalesce(new.revenue_cents, 0) > 0 and new.collected_cents >= new.revenue_cents then
      new.paid_at := now();
    end if;
  else
    if new.job_work_status = 'completed' and old.job_work_status is distinct from 'completed' then
      new.completed_at := now();
    end if;

    -- This trigger sorts after jobs_sync_collection_on_revenue_change, so the
    -- payment calculation sees the synchronized collection values.
    if coalesce(new.revenue_cents, 0) > 0
      and new.collected_cents >= new.revenue_cents
      and old.job_payment_state is distinct from 'paid' then
      new.paid_at := now();
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function private.set_job_export_state_timestamps()
  from public, anon, authenticated, service_role;

drop trigger if exists jobs_zzz_set_export_state_timestamps on public.jobs;
create trigger jobs_zzz_set_export_state_timestamps
before insert or update of job_work_status, revenue_cents, collected_cents on public.jobs
for each row execute function private.set_job_export_state_timestamps();

create index if not exists jobs_export_completed_owner_idx
  on public.jobs (user_id, completed_at desc, created_at desc, id)
  where deleted_at is null
    and job_work_status = 'completed'
    and completed_at is not null;

create index if not exists job_costs_export_job_active_idx
  on public.job_costs (job_id, id)
  where deleted_at is null and job_id is not null;
create index if not exists job_costs_export_session_active_idx
  on public.job_costs (session_id, id)
  where deleted_at is null and session_id is not null;

create table if not exists public.job_export_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reporting_year integer not null check (reporting_year between 2000 and 2200),
  reporting_time_zone text not null,
  recipient_email text not null,
  generation_state text not null default 'queued'
    check (generation_state in ('queued', 'processing', 'ready', 'failed', 'deleted')),
  delivery_state text not null default 'pending'
    check (delivery_state in ('pending', 'processing', 'sent', 'failed', 'revoked', 'expired')),
  object_path text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  generated_at timestamptz,
  token_hash text,
  expires_at timestamptz,
  resend_message_id text,
  first_send_at timestamptz,
  sent_at timestamptz,
  generation_attempts integer not null default 0 check (generation_attempts >= 0),
  delivery_attempts integer not null default 0 check (delivery_attempts >= 0),
  next_retry_at timestamptz,
  failure_code text,
  scrubbed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint job_export_token_shape check (
    token_hash is null or token_hash ~ '^[0-9a-f]{64}$'
  )
);

comment on table public.job_export_requests is
  'Server-only Job Summary CSV export requests. Recipient and token data are scrubbed after object deletion.';

alter table public.job_export_requests enable row level security;
revoke all on table public.job_export_requests from anon, authenticated;

create index if not exists job_export_requests_user_created_idx
  on public.job_export_requests (user_id, created_at desc);
create index if not exists job_export_requests_expiry_cleanup_idx
  on public.job_export_requests (expires_at)
  where expires_at is not null and object_path is not null;
create unique index if not exists job_export_requests_token_hash_idx
  on public.job_export_requests (token_hash)
  where token_hash is not null;
-- Active-request deduplication depends on expiry and therefore cannot be a
-- PostgreSQL partial unique index (partial predicates must be immutable). The
-- per-user advisory lock in accept_job_export_request is authoritative.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-exports', 'job-exports', false, 26214400, array['text/csv'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

select pgmq.create('job_exports')
where not exists (
  select 1 from pgmq.list_queues() where queue_name = 'job_exports'
);

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
      or (r.delivery_state = 'sent' and r.expires_at > now())
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

  select min(created_at) + interval '1 hour' into v_retry_at
  from (
    select created_at from public.job_export_requests
    where user_id = v_user_id and created_at > now() - interval '1 hour'
    order by created_at asc limit 3
  ) recent;
  if (select count(*) from public.job_export_requests
      where user_id = v_user_id and created_at > now() - interval '1 hour') >= 3 then
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

create or replace function public.claim_job_export_queue_messages(p_quantity integer default 1)
returns table (message_id bigint, request_id uuid, read_count integer)
language sql
security definer
set search_path = ''
as $$
  select m.msg_id, (m.message ->> 'request_id')::uuid, m.read_ct
  from pgmq.read('job_exports', 900, greatest(1, least(coalesce(p_quantity, 1), 10))) m;
$$;

create or replace function public.ack_job_export_queue_message(p_message_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$ select pgmq.delete('job_exports', p_message_id); $$;

create or replace function public.retry_job_export_queue_message(
  p_message_id bigint,
  p_delay_seconds integer
)
returns void
language sql
security definer
set search_path = ''
as $$ select pgmq.set_vt('job_exports', p_message_id, greatest(1, p_delay_seconds)); $$;

create or replace function public.job_export_rows(
  p_request_id uuid,
  p_before_completed_at timestamptz default null,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 500
)
returns table (
  job_id uuid, job_description text, customer_name text, service_address text,
  work_status text, payment_status text, created_at timestamptz,
  last_worked_at timestamptz, completed_at timestamptz, paid_at timestamptz,
  revenue_cents bigint, material_cost bigint, helper_labor_cost bigint,
  equipment_rental_cost bigint, permit_cost bigint, disposal_cost bigint,
  travel_parking_cost bigint, other_cost bigint
)
language sql
security definer
set search_path = ''
as $$
  with request as (
    select user_id, reporting_year, reporting_time_zone
    from public.job_export_requests where id = p_request_id
  ), jobs as (
    select j.* from public.jobs j cross join request r
    where j.user_id = r.user_id and j.deleted_at is null
      and j.job_work_status = 'completed'
      and j.completed_at >= make_timestamptz(r.reporting_year, 1, 1, 0, 0, 0, r.reporting_time_zone)
      and j.completed_at < make_timestamptz(r.reporting_year + 1, 1, 1, 0, 0, 0, r.reporting_time_zone)
      and (
        p_before_completed_at is null
        or j.completed_at < p_before_completed_at
        or (
          j.completed_at = p_before_completed_at
          and j.created_at < p_before_created_at
        )
        or (
          j.completed_at = p_before_completed_at
          and j.created_at = p_before_created_at
          and j.id > p_before_id
        )
      )
    order by j.completed_at desc, j.created_at desc, j.id asc
    limit greatest(1, least(coalesce(p_limit, 500), 500))
  ), cost_links as (
    select j.id as job_id, c.id as cost_id, c.cost_type, c.total_cost_cents
    from jobs j join public.job_costs c on c.job_id = j.id
    where c.deleted_at is null
    union
    select j.id, c.id, c.cost_type, c.total_cost_cents
    from jobs j join public.sessions s on s.job_id = j.id
      and s.deleted_at is null and s.session_status <> 'deleted'
      join public.job_costs c on c.session_id = s.id
    where c.deleted_at is null
  ), costs as (
    select distinct on (job_id, cost_id) job_id, cost_type, total_cost_cents
    from cost_links order by job_id, cost_id
  ), totals as (
    select job_id,
      coalesce(sum(total_cost_cents) filter (where cost_type = 'material'), 0)::bigint as material_cost,
      coalesce(sum(total_cost_cents) filter (where cost_type = 'helper_labor'), 0)::bigint as helper_labor_cost,
      coalesce(sum(total_cost_cents) filter (where cost_type = 'equipment_rental'), 0)::bigint as equipment_rental_cost,
      coalesce(sum(total_cost_cents) filter (where cost_type = 'permit'), 0)::bigint as permit_cost,
      coalesce(sum(total_cost_cents) filter (where cost_type = 'disposal'), 0)::bigint as disposal_cost,
      coalesce(sum(total_cost_cents) filter (where cost_type = 'travel_parking'), 0)::bigint as travel_parking_cost,
      coalesce(sum(total_cost_cents) filter (where cost_type = 'other'), 0)::bigint as other_cost
    from costs group by job_id
  )
  select j.id, j.short_description, j.customer_name, j.service_address,
    j.job_work_status::text, j.job_payment_state, j.created_at, j.last_worked_at,
    j.completed_at, j.paid_at, j.revenue_cents,
    coalesce(t.material_cost, 0), coalesce(t.helper_labor_cost, 0),
    coalesce(t.equipment_rental_cost, 0), coalesce(t.permit_cost, 0),
    coalesce(t.disposal_cost, 0), coalesce(t.travel_parking_cost, 0), coalesce(t.other_cost, 0)
  from jobs j left join totals t on t.job_id = j.id
  order by j.completed_at desc, j.created_at desc, j.id asc;
$$;

revoke execute on function public.accept_job_export_request(integer, text) from public, anon;
revoke execute on function public.claim_job_export_queue_messages(integer) from public, anon, authenticated;
revoke execute on function public.ack_job_export_queue_message(bigint) from public, anon, authenticated;
revoke execute on function public.retry_job_export_queue_message(bigint, integer) from public, anon, authenticated;
revoke execute on function public.job_export_rows(uuid, timestamptz, timestamptz, uuid, integer) from public, anon, authenticated;
grant execute on function public.accept_job_export_request(integer, text) to authenticated;
grant execute on function public.claim_job_export_queue_messages(integer) to service_role;
grant execute on function public.ack_job_export_queue_message(bigint) to service_role;
grant execute on function public.retry_job_export_queue_message(bigint, integer) to service_role;
grant execute on function public.job_export_rows(uuid, timestamptz, timestamptz, uuid, integer) to service_role;

-- Vault entries are intentionally manual (documented in README):
-- export_project_url and export_worker_secret. The schedule reads them at run
-- time so URLs and credentials are never written into migration history.
do $$
begin
  perform cron.schedule(
    'process_job_exports', '* * * * *',
    $cron$select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'export_project_url') || '/functions/v1/process-job-exports',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-export-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'export_worker_secret')),
      body := '{}'::jsonb,
      timeout_milliseconds := 150000
    );$cron$
  );
  perform cron.schedule(
    'cleanup_job_exports', '0 0 * * *',
    $cron$select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'export_project_url') || '/functions/v1/cleanup-job-exports',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-export-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'export_worker_secret')),
      body := '{}'::jsonb,
      timeout_milliseconds := 150000
    );$cron$
  );
exception when undefined_function or undefined_table then
  raise notice 'pg_cron, pg_net, or Vault is unavailable; export schedules must be created after these extensions are enabled';
end;
$$;
