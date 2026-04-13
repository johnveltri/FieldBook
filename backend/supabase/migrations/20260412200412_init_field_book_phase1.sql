-- Field Book Phase 1: enums, jobs expansion, sessions / notes / material_entries, RLS.
-- Prior migration renames `title` → `short_description`; adds `job_work_status` + `job_payment_state`.

create extension if not exists pgcrypto;

create type public.job_work_status_enum as enum (
  'not_started',
  'in_progress',
  'on_hold',
  'completed',
  'canceled'
);

create type public.payment_state_enum as enum ('pending', 'paid');

create type public.job_created_via_enum as enum ('session_start', 'add_job');

create type public.session_status_enum as enum ('in_progress', 'ended', 'discarded');

create type public.session_entry_mode_enum as enum ('live', 'manual');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.jobs rename column title to short_description;

alter table public.jobs
  add column user_id uuid references auth.users (id) on delete cascade,
  add column created_via public.job_created_via_enum not null default 'add_job',
  add column job_date date,
  add column job_type text,
  add column category_label text,
  add column service_address text,
  add column job_work_status public.job_work_status_enum not null default 'not_started',
  add column job_payment_state public.payment_state_enum,
  add column revenue_cents bigint,
  add column materials_cents bigint,
  add column fees_cents bigint,
  add column net_earnings_cents bigint,
  add column created_at timestamptz not null default now(),
  add column deleted_at timestamptz;

comment on column public.jobs.short_description is 'Job title / headline (was `title`).';
comment on column public.jobs.job_payment_state is 'NULL = unset; completed + paid drives Paid pill.';

alter table public.jobs
  add constraint jobs_revenue_cents_nonnegative check (revenue_cents is null or revenue_cents >= 0),
  add constraint jobs_materials_cents_nonnegative check (materials_cents is null or materials_cents >= 0),
  add constraint jobs_fees_cents_nonnegative check (fees_cents is null or fees_cents >= 0),
  add constraint jobs_short_description_not_blank check (btrim(short_description) <> '');

create index jobs_user_id_idx on public.jobs (user_id) where deleted_at is null;
create index jobs_user_date_idx on public.jobs (user_id, job_date desc) where deleted_at is null;
create index jobs_user_status_idx on public.jobs (user_id, job_work_status) where deleted_at is null;

create trigger set_jobs_updated_at
before update on public.jobs
for each row execute function public.set_updated_at ();

create table public.sessions (
  id uuid primary key default gen_random_uuid (),
  job_id uuid not null references public.jobs (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  entry_mode public.session_entry_mode_enum not null,
  session_status public.session_status_enum not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  discarded_at timestamptz,
  revenue_cents bigint,
  collected_cents bigint,
  payment_state public.payment_state_enum,
  payment_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_revenue_cents_nonnegative check (revenue_cents is null or revenue_cents >= 0),
  constraint sessions_collected_cents_nonnegative check (collected_cents is null or collected_cents >= 0),
  constraint sessions_status_timestamps_check check (
    (session_status = 'in_progress' and ended_at is null and discarded_at is null)
    or (session_status = 'ended' and ended_at is not null and discarded_at is null)
    or (session_status = 'discarded' and discarded_at is not null)
  ),
  constraint sessions_end_after_start_check check (ended_at is null or ended_at >= started_at)
);

create index sessions_job_started_idx on public.sessions (job_id, started_at desc);
create index sessions_user_started_idx on public.sessions (user_id, started_at desc);
create index sessions_job_status_idx on public.sessions (job_id, session_status);

create unique index sessions_one_active_per_job_idx on public.sessions (job_id)
  where session_status = 'in_progress' and discarded_at is null;

create trigger set_sessions_updated_at
before update on public.sessions
for each row execute function public.set_updated_at ();

create table public.notes (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references auth.users (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint notes_exactly_one_parent check (num_nonnulls (job_id, session_id) = 1),
  constraint notes_body_not_blank check (btrim(body) <> '')
);

create index notes_job_created_idx on public.notes (job_id, created_at desc) where job_id is not null;
create index notes_session_created_idx on public.notes (session_id, created_at desc)
  where session_id is not null;

create trigger set_notes_updated_at
before update on public.notes
for each row execute function public.set_updated_at ();

create table public.material_entries (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references auth.users (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  description text,
  quantity numeric(12, 3),
  unit text,
  unit_cost_cents bigint,
  total_cost_cents bigint not null,
  purchase_date date,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint material_entries_exactly_one_parent check (num_nonnulls (job_id, session_id) = 1),
  constraint material_entries_quantity_nonnegative check (quantity is null or quantity >= 0),
  constraint material_entries_unit_cost_nonnegative check (unit_cost_cents is null or unit_cost_cents >= 0),
  constraint material_entries_total_cost_nonnegative check (total_cost_cents >= 0),
  constraint material_entries_description_not_blank check (description is null or btrim(description) <> '')
);

create index material_entries_job_created_idx on public.material_entries (job_id, created_at desc)
  where job_id is not null;
create index material_entries_session_created_idx on public.material_entries (session_id, created_at desc)
  where session_id is not null;

create trigger set_material_entries_updated_at
before update on public.material_entries
for each row execute function public.set_updated_at ();

alter table public.sessions enable row level security;
alter table public.notes enable row level security;
alter table public.material_entries enable row level security;

create policy sessions_owner_all on public.sessions
  for all using (auth.uid () is not null and auth.uid () = user_id)
  with check (auth.uid () is not null and auth.uid () = user_id);

create policy notes_owner_all on public.notes
  for all using (auth.uid () is not null and auth.uid () = user_id)
  with check (auth.uid () is not null and auth.uid () = user_id);

create policy material_entries_owner_all on public.material_entries
  for all using (auth.uid () is not null and auth.uid () = user_id)
  with check (auth.uid () is not null and auth.uid () = user_id);

create policy sessions_select_anon on public.sessions for select to anon using (true);
create policy notes_select_anon on public.notes for select to anon using (true);
create policy material_entries_select_anon on public.material_entries for select to anon using (true);
create policy sessions_insert_anon on public.sessions for insert to anon with check (true);
create policy notes_insert_anon on public.notes for insert to anon with check (true);
create policy material_entries_insert_anon on public.material_entries for insert to anon with check (true);
create policy sessions_update_anon on public.sessions for update to anon using (true) with check (true);
create policy notes_update_anon on public.notes for update to anon using (true) with check (true);
create policy material_entries_update_anon on public.material_entries for update to anon using (true) with check (true);
create policy sessions_delete_anon on public.sessions for delete to anon using (true);
create policy notes_delete_anon on public.notes for delete to anon using (true);
create policy material_entries_delete_anon on public.material_entries for delete to anon using (true);
