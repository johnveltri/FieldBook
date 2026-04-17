-- For now, collected_cents must be either 0 or the full revenue amount.
-- Partial collections are intentionally disallowed until a later schema revision.

alter table public.jobs
  drop constraint if exists jobs_collected_cents_nonnegative;

alter table public.jobs
  add constraint jobs_collected_cents_full_or_zero check (
    collected_cents is null
    or collected_cents = 0
    or (revenue_cents is not null and collected_cents = revenue_cents)
  );
