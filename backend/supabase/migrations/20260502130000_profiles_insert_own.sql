-- Allow authenticated users to INSERT their own `public.profiles` row.
--
-- The original `profiles` migration (20260502120000) intentionally omitted
-- an INSERT policy because rows are normally created by the
-- `handle_new_user()` SECURITY DEFINER trigger on `auth.users` insert. That
-- works for new sign-ups, but it doesn't help the client perform an UPSERT
-- for two real cases:
--   1. Users created before that migration whose backfill row was rolled
--      back / never landed.
--   2. Any future moment where the trigger fails or the row is missing.
--
-- Postgres requires INSERT permission on every row touched by an
-- `INSERT ... ON CONFLICT DO UPDATE` statement (which is what
-- `supabase.from('profiles').upsert(...)` compiles to), so without an
-- INSERT policy even the UPDATE branch is blocked. This policy unblocks
-- it while keeping the same owner-only safety as the SELECT / UPDATE
-- policies: a user can only insert a row whose `id` matches their own
-- `auth.uid()`.

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);
