-- Regression coverage for the iOS build-4 costs_reviewed_at compatibility
-- layer. All seed data and writes are rolled back.
\set ON_ERROR_STOP on

begin;

do $$
declare
  col record;
  trigger_definition text;
begin
  select data_type, is_nullable
  into col
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'jobs'
    and column_name = 'costs_reviewed_at';

  if not found then
    raise exception 'jobs.costs_reviewed_at compatibility column is missing';
  end if;
  if col.data_type <> 'timestamp with time zone' or col.is_nullable <> 'YES' then
    raise exception 'jobs.costs_reviewed_at must be a nullable timestamptz';
  end if;

  if not has_column_privilege(
    'authenticated',
    'public.jobs',
    'costs_reviewed_at',
    'select'
  ) or not has_column_privilege(
    'authenticated',
    'public.jobs',
    'costs_reviewed_at',
    'update'
  ) then
    raise exception 'authenticated lacks legacy select/update privileges';
  end if;

  if has_function_privilege(
    'authenticated',
    'private.sync_legacy_costs_reviewed_at()',
    'execute'
  ) then
    raise exception 'legacy sync trigger function is directly executable';
  end if;

  select pg_get_triggerdef(oid)
  into trigger_definition
  from pg_trigger
  where tgrelid = 'public.jobs'::regclass
    and tgname = 'jobs_refresh_record_completeness'
    and not tgisinternal;

  if trigger_definition not like '%costs_reviewed_at%' then
    raise exception 'completeness trigger does not include legacy updates';
  end if;
end
$$;

select set_config('fieldsoli.test_user_id', gen_random_uuid()::text, true);
select set_config('fieldsoli.test_job_id', gen_random_uuid()::text, true);

insert into auth.users (id, email)
values (
  current_setting('fieldsoli.test_user_id')::uuid,
  'legacy-cost-review-' || current_setting('fieldsoli.test_user_id') || '@example.com'
);

insert into public.jobs (id, user_id, short_description)
values (
  current_setting('fieldsoli.test_job_id')::uuid,
  current_setting('fieldsoli.test_user_id')::uuid,
  'Legacy cost review compatibility test'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', current_setting('fieldsoli.test_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

set local role authenticated;

do $$
declare
  v_job_id uuid := current_setting('fieldsoli.test_job_id')::uuid;
  v_row public.jobs%rowtype;
  v_legacy timestamptz := '2030-01-02 03:04:05+00';
  v_materials timestamptz := '2031-02-03 04:05:06+00';
  v_other timestamptz := '2032-03-04 05:06:07+00';
begin
  select * into strict v_row from public.jobs where id = v_job_id;

  update public.jobs
  set costs_reviewed_at = v_legacy
  where id = v_job_id
  returning * into strict v_row;

  if v_row.costs_reviewed_at is distinct from v_legacy
    or v_row.materials_reviewed_at is distinct from v_legacy
    or v_row.other_costs_reviewed_at is distinct from v_legacy then
    raise exception 'legacy write did not synchronize both current review fields';
  end if;

  update public.jobs
  set materials_reviewed_at = v_materials
  where id = v_job_id
  returning * into strict v_row;

  if v_row.costs_reviewed_at is distinct from v_materials
    or v_row.materials_reviewed_at is distinct from v_materials
    or v_row.other_costs_reviewed_at is distinct from v_legacy then
    raise exception 'materials write did not mirror only to the legacy field';
  end if;

  update public.jobs
  set other_costs_reviewed_at = v_other
  where id = v_job_id
  returning * into strict v_row;

  if v_row.costs_reviewed_at is distinct from v_materials
    or v_row.materials_reviewed_at is distinct from v_materials
    or v_row.other_costs_reviewed_at is distinct from v_other then
    raise exception 'other-cost write unexpectedly changed the legacy field';
  end if;

  update public.jobs
  set costs_reviewed_at = null
  where id = v_job_id
  returning * into strict v_row;

  if v_row.costs_reviewed_at is not null
    or v_row.materials_reviewed_at is not null
    or v_row.other_costs_reviewed_at is not null then
    raise exception 'legacy clear did not clear both current review fields';
  end if;
end
$$;

rollback;

select 'legacy_costs_reviewed_at_compat.test.sql PASSED' as result;
