-- Migration test for 20260422120000_materials_soft_delete.sql.
--
-- Verifies that the soft-delete migration landed correctly:
--   1. `public.materials.deleted_at` column exists and is nullable `timestamptz`.
--   2. Active-row partial indexes exist and are correctly scoped
--      (`deleted_at IS NULL`).
--   3. Rows with `deleted_at` stamped are excluded by the standard active-row
--      filter used by `fetchJobDetail` / api-client queries.
--
-- Runs inside a transaction that is rolled back at the end so it leaves no
-- residue in the local database. Wrap `psql` with `-v ON_ERROR_STOP=1` so any
-- RAISE EXCEPTION bubbles up as a non-zero exit code.
\set ON_ERROR_STOP on

begin;

-- 1. Column present with the expected shape.
do $$
declare
  col record;
begin
  select data_type, is_nullable
    into col
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'materials'
     and column_name = 'deleted_at';

  if not found then
    raise exception 'materials.deleted_at column is missing';
  end if;
  if col.data_type <> 'timestamp with time zone' then
    raise exception 'materials.deleted_at should be timestamptz, got %', col.data_type;
  end if;
  if col.is_nullable <> 'YES' then
    raise exception 'materials.deleted_at should be nullable';
  end if;
end
$$;

-- 2a. Job-scoped active-row partial index exists and filters deleted rows.
do $$
declare
  ix record;
begin
  select indexdef
    into ix
    from pg_indexes
   where schemaname = 'public'
     and tablename = 'materials'
     and indexname = 'materials_job_active_idx';

  if not found then
    raise exception 'materials_job_active_idx is missing';
  end if;
  if ix.indexdef not like '%deleted_at IS NULL%' then
    raise exception
      'materials_job_active_idx must filter deleted_at IS NULL, got: %',
      ix.indexdef;
  end if;
end
$$;

-- 2b. Session-scoped active-row partial index exists and filters deleted rows.
do $$
declare
  ix record;
begin
  select indexdef
    into ix
    from pg_indexes
   where schemaname = 'public'
     and tablename = 'materials'
     and indexname = 'materials_session_active_idx';

  if not found then
    raise exception 'materials_session_active_idx is missing';
  end if;
  if ix.indexdef not like '%deleted_at IS NULL%' then
    raise exception
      'materials_session_active_idx must filter deleted_at IS NULL, got: %',
      ix.indexdef;
  end if;
end
$$;

-- 3. Round-trip: soft-deleted rows are excluded by `deleted_at IS NULL`.
--    Seed a throwaway user + job + two materials (one soft-deleted) and
--    verify that a job-scoped query returns only the active row.
--
--    Bypass RLS by running the inserts with the local `postgres` superuser;
--    the filter being tested is the application-level predicate, not the
--    RLS policy.
do $$
declare
  v_user uuid := gen_random_uuid();
  v_job uuid;
  v_active_count int;
  v_total_count int;
begin
  insert into auth.users (id, email)
  values (v_user, 'mat-soft-delete-test-' || v_user || '@example.com');

  insert into public.jobs (user_id, short_description)
  values (v_user, 'Soft delete test job')
  returning id into v_job;

  insert into public.materials
    (user_id, job_id, description, quantity, unit, unit_cost_cents, total_cost_cents)
  values
    (v_user, v_job, 'Active row',  1, 'ea', 100, 100),
    (v_user, v_job, 'Deleted row', 1, 'ea', 100, 100);

  -- Soft-delete the second row.
  update public.materials
     set deleted_at = now()
   where job_id = v_job
     and description = 'Deleted row';

  select count(*) into v_active_count
    from public.materials
   where job_id = v_job
     and deleted_at is null;

  select count(*) into v_total_count
    from public.materials
   where job_id = v_job;

  if v_active_count <> 1 then
    raise exception
      'Expected 1 active material after soft-delete, got %', v_active_count;
  end if;
  if v_total_count <> 2 then
    raise exception
      'Expected both rows to still be physically present, got %', v_total_count;
  end if;
end
$$;

rollback;

-- Success marker — rolled back above, so this SELECT is the only visible
-- evidence that the tests completed.
select 'materials_soft_delete.test.sql PASSED' as result;
