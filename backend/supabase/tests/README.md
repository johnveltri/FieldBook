# Supabase DB tests

Lightweight migration / schema regression tests that run against the **local**
Supabase stack (not the remote project). Each test wraps its work in
`BEGIN … ROLLBACK` so it leaves no residue in the local database.

## Running a single test

With the local stack running (`npx supabase start --workdir backend`):

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -v ON_ERROR_STOP=1 \
  -f backend/supabase/tests/materials_soft_delete.test.sql
```

Each test prints a final `*.test.sql PASSED` row on success. Any failed
`do $$ … raise exception … $$` inside the file causes `psql` to exit
non-zero because of the `-v ON_ERROR_STOP=1` flag.

## Conventions

- One `.test.sql` file per migration / schema concern.
- Tests wrap all seed data in a top-level `begin; … rollback;` so they do
  not interfere with developer data in the shared local DB.
- Prefer `information_schema` / `pg_indexes` assertions over brittle error
  matching. When a test needs rows, insert them as the local `postgres`
  superuser (RLS is bypassed intentionally — the filter under test is the
  application-level `deleted_at IS NULL`, not the RLS policy).
