-- Phase 1 schema alignment: job = economic / payment object; session = work-log only.
-- Notes / material_entries / attachments: session-compatible; optional dual job_id + session_id
-- (no exactly-one-parent); integrity when both are set (job_id must match session's job).

-- -----------------------------------------------------------------------------
-- Jobs: primary economic fields; drop stored derived summaries for MVP
-- -----------------------------------------------------------------------------

alter table public.jobs drop constraint if exists jobs_materials_cents_nonnegative;
alter table public.jobs drop constraint if exists jobs_fees_cents_nonnegative;

alter table public.jobs
  drop column if exists materials_cents,
  drop column if exists fees_cents,
  drop column if exists net_earnings_cents;

alter table public.jobs
  add column collected_cents bigint;

comment on column public.jobs.revenue_cents is 'Primary invoiced / revenue amount for the job (cents).';
comment on column public.jobs.job_payment_state is 'Payment state on the job; separate from job_work_status. NULL = unset.';
comment on column public.jobs.collected_cents is 'Amount collected toward the job (cents), if tracked at job level for MVP.';

alter table public.jobs
  add constraint jobs_collected_cents_nonnegative check (collected_cents is null or collected_cents >= 0);

-- -----------------------------------------------------------------------------
-- Sessions: work-visit / time-log only — remove session-level money fields
-- -----------------------------------------------------------------------------

alter table public.sessions drop constraint if exists sessions_revenue_cents_nonnegative;
alter table public.sessions drop constraint if exists sessions_collected_cents_nonnegative;

alter table public.sessions
  drop column if exists revenue_cents,
  drop column if exists collected_cents,
  drop column if exists payment_state,
  drop column if exists payment_details;

-- -----------------------------------------------------------------------------
-- Notes & material_entries: allow job+session together; at least one anchor
-- -----------------------------------------------------------------------------

alter table public.notes drop constraint if exists notes_exactly_one_parent;

alter table public.notes
  add constraint notes_at_least_one_parent check (num_nonnulls (job_id, session_id) >= 1);

alter table public.material_entries drop constraint if exists material_entries_exactly_one_parent;

alter table public.material_entries
  add constraint material_entries_at_least_one_parent check (num_nonnulls (job_id, session_id) >= 1);

-- When both job_id and session_id are set, job_id must match the session's job.
create or replace function public.enforce_child_job_matches_session_job()
returns trigger
language plpgsql
as $$
declare
  expected_job uuid;
begin
  if new.session_id is null then
    return new;
  end if;
  select s.job_id into expected_job from public.sessions s where s.id = new.session_id;
  if not found then
    raise exception 'session_id does not reference a session';
  end if;
  if new.job_id is not null and new.job_id is distinct from expected_job then
    raise exception 'job_id must equal the session''s job_id when both are set';
  end if;
  return new;
end;
$$;

drop trigger if exists notes_enforce_job_session on public.notes;
create trigger notes_enforce_job_session
before insert or update on public.notes
for each row execute function public.enforce_child_job_matches_session_job ();

drop trigger if exists material_entries_enforce_job_session on public.material_entries;
create trigger material_entries_enforce_job_session
before insert or update on public.material_entries
for each row execute function public.enforce_child_job_matches_session_job ();

-- -----------------------------------------------------------------------------
-- Attachments (session-compatible; same parent pattern as notes / materials)
-- -----------------------------------------------------------------------------

create table public.attachments (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references auth.users (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  storage_bucket text not null default 'fieldbook',
  storage_object_key text not null,
  content_type text,
  byte_size bigint,
  original_filename text,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint attachments_at_least_one_parent check (num_nonnulls (job_id, session_id) >= 1),
  constraint attachments_byte_size_nonnegative check (byte_size is null or byte_size >= 0)
);

comment on table public.attachments is 'File metadata; optional job_id + session_id for session-scoped items (prototype pattern).';
comment on column public.attachments.storage_object_key is 'Path or key within storage_bucket (e.g. Supabase Storage object path).';

create index attachments_job_created_idx on public.attachments (job_id, created_at desc)
  where job_id is not null;
create index attachments_session_created_idx on public.attachments (session_id, created_at desc)
  where session_id is not null;

create trigger set_attachments_updated_at
before update on public.attachments
for each row execute function public.set_updated_at ();

drop trigger if exists attachments_enforce_job_session on public.attachments;
create trigger attachments_enforce_job_session
before insert or update on public.attachments
for each row execute function public.enforce_child_job_matches_session_job ();

alter table public.attachments enable row level security;

create policy attachments_owner_all on public.attachments
  for all using (auth.uid () is not null and auth.uid () = user_id)
  with check (auth.uid () is not null and auth.uid () = user_id);

create policy attachments_select_anon on public.attachments for select to anon using (true);
create policy attachments_insert_anon on public.attachments for insert to anon with check (true);
create policy attachments_update_anon on public.attachments for update to anon using (true) with check (true);
create policy attachments_delete_anon on public.attachments for delete to anon using (true);
