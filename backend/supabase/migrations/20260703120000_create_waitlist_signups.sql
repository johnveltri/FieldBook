-- Marketing waitlist signups — service-role inserts only (no RLS policies).
-- Manage signups via Supabase Studio (view, filter, export, update status).

create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  email text not null,
  trades text[] not null default '{}',
  uses_software boolean not null,
  tracking_tools text[] not null default '{}',
  job_sources text[] not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create unique index waitlist_signups_email_key on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;
