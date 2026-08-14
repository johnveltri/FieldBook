-- Regression coverage for the iOS build-4 profile upsert compatibility layer.
-- All seed data and writes are rolled back.
\set ON_ERROR_STOP on

begin;

do $$
declare
  trigger_definition text;
  function_is_security_definer boolean;
  function_config text[];
begin
  if not has_column_privilege(
    'authenticated',
    'public.profiles',
    'id',
    'update'
  ) then
    raise exception 'authenticated lacks profiles.id update compatibility grant';
  end if;

  select p.prosecdef, p.proconfig
  into function_is_security_definer, function_config
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'enforce_profile_id_immutable';

  if not found then
    raise exception 'profile id immutability function is missing';
  end if;
  if function_is_security_definer then
    raise exception 'profile id immutability function must be security invoker';
  end if;
  if function_config is distinct from array['search_path=""']::text[] then
    raise exception 'profile id immutability function has unsafe search_path';
  end if;
  if has_function_privilege(
    'authenticated',
    'private.enforce_profile_id_immutable()',
    'execute'
  ) then
    raise exception 'profile id immutability function is directly executable';
  end if;

  select pg_get_triggerdef(oid)
  into trigger_definition
  from pg_trigger
  where tgrelid = 'public.profiles'::regclass
    and tgname = 'profiles_id_immutable'
    and not tgisinternal;

  if trigger_definition not like '%BEFORE UPDATE OF id%' then
    raise exception 'profiles_id_immutable trigger is missing or malformed';
  end if;
end
$$;

select set_config('fieldsoli.profile_user_a', gen_random_uuid()::text, true);
select set_config('fieldsoli.profile_user_b', gen_random_uuid()::text, true);

insert into auth.users (id, email)
values
  (
    current_setting('fieldsoli.profile_user_a')::uuid,
    'profile-compat-a-' || current_setting('fieldsoli.profile_user_a') || '@example.com'
  ),
  (
    current_setting('fieldsoli.profile_user_b')::uuid,
    'profile-compat-b-' || current_setting('fieldsoli.profile_user_b') || '@example.com'
  );

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', current_setting('fieldsoli.profile_user_a'),
    'role', 'authenticated'
  )::text,
  true
);

set local role authenticated;

do $$
declare
  v_user_a uuid := current_setting('fieldsoli.profile_user_a')::uuid;
  v_user_b uuid := current_setting('fieldsoli.profile_user_b')::uuid;
  v_row public.profiles%rowtype;
begin
  -- Match build 4's PostgREST upsert, including id in the conflict update.
  insert into public.profiles (id, first_name, last_name, trades)
  values (v_user_a, 'Build', 'Four', array['Plumbing'])
  on conflict (id) do update
  set id = excluded.id,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      trades = excluded.trades
  returning * into strict v_row;

  if v_row.id is distinct from v_user_a
    or v_row.first_name is distinct from 'Build'
    or v_row.last_name is distinct from 'Four'
    or v_row.trades is distinct from array['Plumbing']::text[] then
    raise exception 'build-4-shaped profile upsert returned unexpected data';
  end if;

  -- Current clients still update only editable fields.
  update public.profiles
  set first_name = 'Current'
  where id = v_user_a
  returning * into strict v_row;

  if v_row.id is distinct from v_user_a
    or v_row.first_name is distinct from 'Current' then
    raise exception 'current profile update behavior regressed';
  end if;

  begin
    update public.profiles set id = v_user_b where id = v_user_a;
    raise exception 'profile id reassignment should fail';
  exception
    when insufficient_privilege then
      null;
  end;
end
$$;

rollback;

select 'legacy_profile_upsert_compat.test.sql PASSED' as result;
