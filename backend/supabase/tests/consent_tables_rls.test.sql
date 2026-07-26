-- RLS regression tests for public.legal_acceptances and public.analytics_consent.
--
-- Verifies authenticated users can read/write only their own consent rows.
-- Runs inside a transaction rolled back at the end.

\set ON_ERROR_STOP on

begin;

create or replace function pg_temp.login_as(uid uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('role', 'authenticated', true);
end;
$$;

do $$
declare
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  visible_count int;
  insert_ok boolean;
begin
  insert into auth.users (id, email)
  values
    (user_a, 'consent-rls-a-' || user_a || '@example.com'),
    (user_b, 'consent-rls-b-' || user_b || '@example.com');

  insert into public.legal_acceptances
    (user_id, document_type, document_version, source)
  values
    (user_a, 'privacy_policy', '2026-07-03', 'test_seed'),
    (user_a, 'terms', '2026-07-03', 'test_seed'),
    (user_b, 'privacy_policy', '2026-07-03', 'test_seed');

  insert into public.analytics_consent (user_id, status)
  values
    (user_a, 'granted'),
    (user_b, 'withdrawn');

  -- User A sees only their legal acceptances.
  perform pg_temp.login_as(user_a);
  select count(*) into visible_count
    from public.legal_acceptances;
  if visible_count <> 2 then
    raise exception
      'user A should see 2 legal_acceptances rows, saw %', visible_count;
  end if;

  -- User A cannot read user B legal acceptances when filtered by user_id.
  select count(*) into visible_count
    from public.legal_acceptances
   where user_id = user_b;
  if visible_count <> 0 then
    raise exception
      'user A should not see user B legal_acceptances, saw %', visible_count;
  end if;

  -- User A can insert their own legal acceptance.
  insert into public.legal_acceptances
    (user_id, document_type, document_version, source)
  values
    (user_a, 'terms', '2026-07-04', 'test_insert_own');

  -- User A cannot insert for user B.
  begin
    insert into public.legal_acceptances
      (user_id, document_type, document_version, source)
    values
      (user_b, 'terms', '2026-07-04', 'test_insert_other');
    raise exception 'user A should not insert legal_acceptances for user B';
  exception
    when insufficient_privilege then
      null;
    when check_violation then
      null;
  end;

  -- User A sees only their analytics consent row.
  select count(*) into visible_count
    from public.analytics_consent;
  if visible_count <> 1 then
    raise exception
      'user A should see 1 analytics_consent row, saw %', visible_count;
  end if;

  select count(*) into visible_count
    from public.analytics_consent
   where user_id = user_b;
  if visible_count <> 0 then
    raise exception
      'user A should not see user B analytics_consent, saw %', visible_count;
  end if;

  update public.analytics_consent
     set status = 'withdrawn',
         updated_at = now()
   where user_id = user_a;

  -- Match the supabase-js upsert used by the mobile consent prompt. It includes
  -- user_id in the conflict update even though ownership is unchanged.
  insert into public.analytics_consent (user_id, status, updated_at)
  values (user_a, 'granted', now())
  on conflict (user_id) do update
    set user_id = excluded.user_id,
        status = excluded.status,
        updated_at = excluded.updated_at;

  begin
    update public.analytics_consent
       set status = 'granted',
           updated_at = now()
     where user_id = user_b;
    if found then
      raise exception 'user A should not update user B analytics_consent';
    end if;
  exception
    when insufficient_privilege then
      null;
  end;

  -- Reset role for seeding a second user insert attempt.
  reset role;

  perform pg_temp.login_as(user_b);
  begin
    insert into public.analytics_consent (user_id, status)
    values (user_a, 'granted');
    raise exception 'user B should not insert analytics_consent for user A';
  exception
    when unique_violation then
      null;
    when insufficient_privilege then
      null;
    when check_violation then
      null;
  end;
end;
$$;

rollback;

select 'consent_tables_rls.test.sql PASSED' as result;
