-- Profile rows for authenticated users — first/last name + multi-select trades.
-- Created automatically on auth.users insert via `public.handle_new_user()`,
-- and cascade-deleted when the user row is removed.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  trades text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at ();

alter table public.profiles enable row level security;

-- Owner-only SELECT / UPDATE. INSERT happens exclusively via the trigger
-- below (SECURITY DEFINER), so no INSERT policy exists for clients. DELETE
-- happens exclusively via the auth.users cascade.
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

-- Auto-provision a profile row for every new auth user. Reads first / last
-- name from `raw_user_meta_data` so the SignInScreen sign-up form can seed
-- them via `supabase.auth.signUp({ options: { data: { first_name, last_name } } })`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data->>'first_name', '')), ''),
    nullif(btrim(coalesce(new.raw_user_meta_data->>'last_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill profile rows for users that existed before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
