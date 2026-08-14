-- Preserve compatibility with iOS build 4, which still reads and writes the
-- pre-split costs_reviewed_at column. Newer builds use independent materials
-- and other-cost review timestamps.

alter table public.jobs
  add column costs_reviewed_at timestamptz;

comment on column public.jobs.costs_reviewed_at is
  'Legacy compatibility field for app builds predating the split cost-review timestamps. Mirrors materials_reviewed_at; legacy writes also confirm other costs.';

update public.jobs
set costs_reviewed_at = materials_reviewed_at;

grant update (costs_reviewed_at) on public.jobs to authenticated;

create or replace function private.sync_legacy_costs_reviewed_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.costs_reviewed_at is distinct from old.costs_reviewed_at then
    -- Legacy clients had a single review action. Treat it as confirmation of
    -- both review legs so their original completeness behavior is preserved.
    new.materials_reviewed_at := new.costs_reviewed_at;
    new.other_costs_reviewed_at := new.costs_reviewed_at;
  elsif new.materials_reviewed_at is distinct from old.materials_reviewed_at then
    -- Keep legacy reads aligned when current clients review or invalidate the
    -- materials leg. Other-cost-only changes do not alter the legacy field.
    new.costs_reviewed_at := new.materials_reviewed_at;
  end if;

  return new;
end;
$$;

revoke execute on function private.sync_legacy_costs_reviewed_at()
  from public, anon, authenticated;

drop trigger if exists jobs_sync_legacy_costs_reviewed_at on public.jobs;
create trigger jobs_sync_legacy_costs_reviewed_at
  before update of costs_reviewed_at, materials_reviewed_at
  on public.jobs
  for each row
  execute function private.sync_legacy_costs_reviewed_at();

-- UPDATE OF triggers match the columns named by the client, not additional
-- columns changed inside a BEFORE trigger. Include the legacy target so a
-- build-4-only update still recalculates completeness.
drop trigger if exists jobs_refresh_record_completeness on public.jobs;
create trigger jobs_refresh_record_completeness
  after insert or update of short_description, revenue_cents, costs_reviewed_at,
    materials_reviewed_at, other_costs_reviewed_at
  on public.jobs
  for each row
  execute function private.jobs_refresh_record_completeness();

notify pgrst, 'reload schema';
