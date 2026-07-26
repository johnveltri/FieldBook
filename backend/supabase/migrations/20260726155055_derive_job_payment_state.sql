-- Make amounts the payment source of truth while preserving the launch UI's
-- binary unpaid/paid controls.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Repair known drift before replacing the writable enum.
update public.jobs
set collected_cents = revenue_cents
where job_payment_state = 'paid'
  and revenue_cents is not null;

update public.jobs
set collected_cents = 0
where collected_cents is null
   or revenue_cents is null
   or revenue_cents = 0;

alter table public.jobs drop constraint if exists jobs_collected_cents_full_or_zero;
alter table public.jobs drop constraint if exists jobs_collected_cents_nonnegative;

alter table public.jobs
  alter column collected_cents set default 0,
  alter column collected_cents set not null;

-- Dropping the writable column also drops indexes that contain it. They are
-- recreated below after the generated replacement exists.
alter table public.jobs drop column job_payment_state;
drop type if exists public.payment_state_enum;

alter table public.jobs
  add column job_payment_state text generated always as (
    case
      when coalesce(revenue_cents, 0) <= 0 then null
      when collected_cents = 0 then 'unpaid'
      when collected_cents < revenue_cents then 'partially_paid'
      else 'paid'
    end
  ) stored,
  add constraint jobs_collected_cents_nonnegative check (collected_cents >= 0),
  add constraint jobs_collected_within_revenue check (
    (coalesce(revenue_cents, 0) = 0 and collected_cents = 0)
    or (revenue_cents > 0 and collected_cents <= revenue_cents)
  );

comment on column public.jobs.job_payment_state is
  'Generated from revenue_cents and collected_cents: NULL, unpaid, partially_paid, or paid.';

create or replace function private.sync_job_collection_on_revenue_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.revenue_cents is distinct from old.revenue_cents then
    if coalesce(new.revenue_cents, 0) = 0 then
      new.collected_cents := 0;
    elsif new.collected_cents is distinct from old.collected_cents then
      -- Respect an explicit simultaneous collection edit, but never allow it
      -- to exceed the corrected revenue.
      new.collected_cents := least(new.collected_cents, new.revenue_cents);
    elsif coalesce(old.revenue_cents, 0) > 0
      and old.collected_cents = old.revenue_cents then
      -- A fully paid job remains paid when its revenue is corrected.
      new.collected_cents := new.revenue_cents;
    else
      -- Compatibility path for an unexpected partial row. Preserve the
      -- collection unless the corrected revenue is lower, then clamp rather
      -- than blocking an edit the current UI cannot resolve.
      new.collected_cents := least(old.collected_cents, new.revenue_cents);
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function private.sync_job_collection_on_revenue_change()
  from public, anon, authenticated, service_role;

create trigger jobs_sync_collection_on_revenue_change
before update of revenue_cents, collected_cents on public.jobs
for each row execute function private.sync_job_collection_on_revenue_change();

create index jobs_user_open_stack_record_complete_idx
  on public.jobs (
    user_id,
    is_job_record_complete,
    job_work_status,
    job_payment_state,
    list_recency_at desc,
    id desc
  )
  where deleted_at is null;
