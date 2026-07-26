-- Enforce ownership below RLS and replace blanket Data API privileges with an
-- explicit allowlist matching the checked-in clients.

do $$
begin
  if exists (select 1 from public.jobs where user_id is null)
    or exists (select 1 from public.sessions where user_id is null)
    or exists (select 1 from public.notes where user_id is null)
    or exists (select 1 from public.job_costs where user_id is null)
    or exists (select 1 from public.attachments where user_id is null)
    or exists (select 1 from public.job_activity_events where user_id is null)
  then
    raise exception 'Ownership hardening aborted: null owner rows exist';
  end if;

  if exists (
    select 1 from public.sessions s
    join public.jobs j on j.id = s.job_id
    where s.user_id <> j.user_id
  ) or exists (
    select 1 from public.notes n
    join public.jobs j on j.id = n.job_id
    where n.user_id <> j.user_id
  ) or exists (
    select 1 from public.notes n
    join public.sessions s on s.id = n.session_id
    where n.user_id <> s.user_id
  ) or exists (
    select 1 from public.job_costs c
    join public.jobs j on j.id = c.job_id
    where c.user_id <> j.user_id
  ) or exists (
    select 1 from public.job_costs c
    join public.sessions s on s.id = c.session_id
    where c.user_id <> s.user_id
  ) or exists (
    select 1 from public.attachments a
    join public.jobs j on j.id = a.job_id
    where a.user_id <> j.user_id
  ) or exists (
    select 1 from public.attachments a
    join public.sessions s on s.id = a.session_id
    where a.user_id <> s.user_id
  ) or exists (
    select 1 from public.job_activity_events e
    join public.jobs j on j.id = e.job_id
    where e.user_id <> j.user_id
  ) then
    raise exception 'Ownership hardening aborted: cross-owner relationships exist';
  end if;
end;
$$;

alter table public.jobs alter column user_id set not null;
alter table public.sessions alter column user_id set not null;
alter table public.notes alter column user_id set not null;
alter table public.job_costs alter column user_id set not null;
alter table public.attachments alter column user_id set not null;
alter table public.job_activity_events alter column user_id set not null;

alter table public.jobs add constraint jobs_id_user_id_key unique (id, user_id);
alter table public.sessions add constraint sessions_id_user_id_key unique (id, user_id);

alter table public.sessions
  add constraint sessions_job_owner_fkey
  foreign key (job_id, user_id) references public.jobs (id, user_id) on delete cascade;

alter table public.notes
  add constraint notes_job_owner_fkey
    foreign key (job_id, user_id) references public.jobs (id, user_id) on delete cascade,
  add constraint notes_session_owner_fkey
    foreign key (session_id, user_id) references public.sessions (id, user_id) on delete cascade;

alter table public.job_costs
  add constraint job_costs_job_owner_fkey
    foreign key (job_id, user_id) references public.jobs (id, user_id) on delete cascade,
  add constraint job_costs_session_owner_fkey
    foreign key (session_id, user_id) references public.sessions (id, user_id) on delete cascade;

alter table public.attachments
  add constraint attachments_job_owner_fkey
    foreign key (job_id, user_id) references public.jobs (id, user_id) on delete cascade,
  add constraint attachments_session_owner_fkey
    foreign key (session_id, user_id) references public.sessions (id, user_id) on delete cascade;

alter table public.job_activity_events
  drop constraint if exists job_activity_events_user_id_fkey,
  add constraint job_activity_events_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade,
  add constraint job_activity_events_job_owner_fkey
    foreign key (job_id, user_id) references public.jobs (id, user_id) on delete cascade;

alter table public.legal_acceptances
  add constraint legal_acceptances_user_document_version_key
  unique (user_id, document_type, document_version);

create index if not exists notes_user_id_idx on public.notes (user_id);
create index if not exists job_costs_user_id_idx on public.job_costs (user_id);
create index if not exists attachments_user_id_idx on public.attachments (user_id);
create index if not exists job_activity_events_user_id_idx on public.job_activity_events (user_id);

create or replace function private.enforce_user_id_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function private.enforce_user_id_immutable()
  from public, anon, authenticated, service_role;

create trigger jobs_owner_immutable before update on public.jobs
for each row execute function private.enforce_user_id_immutable();
create trigger sessions_owner_immutable before update on public.sessions
for each row execute function private.enforce_user_id_immutable();
create trigger notes_owner_immutable before update on public.notes
for each row execute function private.enforce_user_id_immutable();
create trigger job_costs_owner_immutable before update on public.job_costs
for each row execute function private.enforce_user_id_immutable();
create trigger attachments_owner_immutable before update on public.attachments
for each row execute function private.enforce_user_id_immutable();
create trigger job_activity_events_owner_immutable before update on public.job_activity_events
for each row execute function private.enforce_user_id_immutable();

-- Remove old policies, including hard-delete and dormant-table access.
drop policy if exists "jobs_select_own" on public.jobs;
drop policy if exists "jobs_insert_own" on public.jobs;
drop policy if exists "jobs_update_own" on public.jobs;
drop policy if exists "jobs_delete_own" on public.jobs;
drop policy if exists "sessions_select_own" on public.sessions;
drop policy if exists "sessions_insert_own" on public.sessions;
drop policy if exists "sessions_update_own" on public.sessions;
drop policy if exists "sessions_delete_own" on public.sessions;
drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;
drop policy if exists "materials_select_own" on public.job_costs;
drop policy if exists "materials_insert_own" on public.job_costs;
drop policy if exists "materials_update_own" on public.job_costs;
drop policy if exists "materials_delete_own" on public.job_costs;
drop policy if exists "attachments_select_own" on public.attachments;
drop policy if exists "attachments_insert_own" on public.attachments;
drop policy if exists "attachments_update_own" on public.attachments;
drop policy if exists "attachments_delete_own" on public.attachments;
drop policy if exists "job_activity_events_select_own" on public.job_activity_events;
drop policy if exists "job_activity_events_insert_own" on public.job_activity_events;
drop policy if exists "job_activity_events_update_own" on public.job_activity_events;
drop policy if exists "job_activity_events_delete_own" on public.job_activity_events;

create policy jobs_select_own on public.jobs for select to authenticated
using (user_id = (select auth.uid()));
create policy jobs_insert_own on public.jobs for insert to authenticated
with check (user_id = (select auth.uid()));
create policy jobs_update_own on public.jobs for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy sessions_select_own on public.sessions for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.jobs j
    where j.id = sessions.job_id and j.user_id = (select auth.uid())
  )
);
create policy sessions_insert_own on public.sessions for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.jobs j
    where j.id = sessions.job_id
      and j.user_id = (select auth.uid())
      and j.deleted_at is null
  )
);
create policy sessions_update_own on public.sessions for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.jobs j
    where j.id = sessions.job_id
      and j.user_id = (select auth.uid())
      and j.deleted_at is null
  )
);

create policy notes_select_own on public.notes for select to authenticated
using (
  user_id = (select auth.uid())
  and (
    (job_id is null and session_id is null)
    or exists (select 1 from public.jobs j where j.id = notes.job_id and j.user_id = (select auth.uid()))
    or exists (select 1 from public.sessions s where s.id = notes.session_id and s.user_id = (select auth.uid()))
  )
);
create policy notes_insert_own on public.notes for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    (job_id is null and session_id is null)
    or exists (select 1 from public.jobs j where j.id = notes.job_id and j.user_id = (select auth.uid()) and j.deleted_at is null)
    or exists (select 1 from public.sessions s where s.id = notes.session_id and s.user_id = (select auth.uid()) and s.session_status <> 'deleted')
  )
);
create policy notes_update_own on public.notes for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    (job_id is null and session_id is null)
    or exists (select 1 from public.jobs j where j.id = notes.job_id and j.user_id = (select auth.uid()) and j.deleted_at is null)
    or exists (select 1 from public.sessions s where s.id = notes.session_id and s.user_id = (select auth.uid()) and s.session_status <> 'deleted')
  )
);

create policy job_costs_select_own on public.job_costs for select to authenticated
using (
  user_id = (select auth.uid())
  and (
    (job_id is null and session_id is null)
    or exists (select 1 from public.jobs j where j.id = job_costs.job_id and j.user_id = (select auth.uid()))
    or exists (select 1 from public.sessions s where s.id = job_costs.session_id and s.user_id = (select auth.uid()))
  )
);
create policy job_costs_insert_own on public.job_costs for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    (job_id is null and session_id is null)
    or exists (select 1 from public.jobs j where j.id = job_costs.job_id and j.user_id = (select auth.uid()) and j.deleted_at is null)
    or exists (select 1 from public.sessions s where s.id = job_costs.session_id and s.user_id = (select auth.uid()) and s.session_status <> 'deleted')
  )
);
create policy job_costs_update_own on public.job_costs for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    (job_id is null and session_id is null)
    or exists (select 1 from public.jobs j where j.id = job_costs.job_id and j.user_id = (select auth.uid()) and j.deleted_at is null)
    or exists (select 1 from public.sessions s where s.id = job_costs.session_id and s.user_id = (select auth.uid()) and s.session_status <> 'deleted')
  )
);

drop policy if exists legal_acceptances_select_own on public.legal_acceptances;
drop policy if exists legal_acceptances_insert_own on public.legal_acceptances;
create policy legal_acceptances_select_own on public.legal_acceptances for select to authenticated
using (user_id = (select auth.uid()));
create policy legal_acceptances_insert_own on public.legal_acceptances for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists analytics_consent_select_own on public.analytics_consent;
drop policy if exists analytics_consent_insert_own on public.analytics_consent;
drop policy if exists analytics_consent_update_own on public.analytics_consent;
create policy analytics_consent_select_own on public.analytics_consent for select to authenticated
using (user_id = (select auth.uid()));
create policy analytics_consent_insert_own on public.analytics_consent for insert to authenticated
with check (user_id = (select auth.uid()));
create policy analytics_consent_update_own on public.analytics_consent for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Existing projects granted app roles every privilege by default. Start from
-- zero, then expose only checked-in client operations.
revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;

grant select on public.jobs to authenticated;
grant insert (user_id, short_description, customer_name, created_via, job_type, service_address, job_work_status, revenue_cents, collected_cents)
  on public.jobs to authenticated;
grant update (short_description, customer_name, job_type, service_address, job_work_status, revenue_cents, collected_cents, deleted_at, costs_reviewed_at)
  on public.jobs to authenticated;

grant select on public.sessions to authenticated;
grant insert (job_id, user_id, entry_mode, session_status, started_at, ended_at, deleted_at, started_tz)
  on public.sessions to authenticated;
grant update (job_id, session_status, started_at, ended_at, deleted_at, started_tz)
  on public.sessions to authenticated;

grant select on public.notes to authenticated;
grant insert (user_id, job_id, session_id, body) on public.notes to authenticated;
grant update (job_id, session_id, body, deleted_at) on public.notes to authenticated;

grant select on public.job_costs to authenticated;
grant insert (user_id, job_id, session_id, description, quantity, unit, unit_cost_cents, total_cost_cents, incurred_on, cost_type)
  on public.job_costs to authenticated;
grant update (job_id, session_id, description, quantity, unit, unit_cost_cents, total_cost_cents, incurred_on, cost_type, deleted_at)
  on public.job_costs to authenticated;

grant select on public.profiles to authenticated;
grant insert (id, first_name, last_name, trades) on public.profiles to authenticated;
grant update (first_name, last_name, trades) on public.profiles to authenticated;

grant select on public.legal_acceptances to authenticated;
grant insert (user_id, document_type, document_version, source, app_version, platform)
  on public.legal_acceptances to authenticated;

grant select on public.analytics_consent to authenticated;
grant insert (user_id, status, updated_at) on public.analytics_consent to authenticated;
grant update (status, updated_at) on public.analytics_consent to authenticated;

-- Preserve the one intentional server-only RPC and waitlist writes.
grant execute on function public.consume_waitlist_rate_limit(text, integer) to service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger on tables
  from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
