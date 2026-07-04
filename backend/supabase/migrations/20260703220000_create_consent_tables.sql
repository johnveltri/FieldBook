-- Durable consent records for authenticated app users.
-- Waitlist consent remains on public.waitlist_signups (marketing only).

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_type text not null,
  document_version text not null,
  accepted_at timestamptz not null default now(),
  source text not null,
  app_version text,
  platform text,
  constraint legal_acceptances_document_type_check
    check (document_type in ('privacy_policy', 'terms')),
  constraint legal_acceptances_document_version_length
    check (char_length(document_version) between 1 and 32),
  constraint legal_acceptances_source_length
    check (char_length(source) between 1 and 64)
);

create index legal_acceptances_user_id_accepted_at_idx
  on public.legal_acceptances (user_id, accepted_at desc);

create index legal_acceptances_user_document_idx
  on public.legal_acceptances (user_id, document_type, accepted_at desc);

alter table public.legal_acceptances enable row level security;

create policy legal_acceptances_select_own
  on public.legal_acceptances
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy legal_acceptances_insert_own
  on public.legal_acceptances
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create table public.analytics_consent (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null,
  updated_at timestamptz not null default now(),
  constraint analytics_consent_status_check
    check (status in ('granted', 'withdrawn'))
);

alter table public.analytics_consent enable row level security;

create policy analytics_consent_select_own
  on public.analytics_consent
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy analytics_consent_insert_own
  on public.analytics_consent
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy analytics_consent_update_own
  on public.analytics_consent
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
