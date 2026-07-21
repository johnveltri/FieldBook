alter table public.waitlist_signups
  add column terms_version text,
  add column terms_accepted_at timestamptz;

-- Existing consented rows were submitted through the same required checkbox
-- that linked both documents. Reconstruct the deployed Terms version from the
-- Privacy Policy version that the route recorded at that acceptance event.
update public.waitlist_signups
set
  terms_version = case
    when privacy_policy_version = '2026-07-20' then '2026-07-20'
    else '2026-07-03'
  end,
  terms_accepted_at = privacy_accepted_at
where marketing_consent = true
  and privacy_policy_version is not null
  and privacy_accepted_at is not null;

alter table public.waitlist_signups
  drop constraint waitlist_signups_consent_complete;

alter table public.waitlist_signups
  add constraint waitlist_signups_consent_complete
    check (
      marketing_consent is null
      or (
        marketing_consent = true
        and privacy_policy_version is not null
        and privacy_accepted_at is not null
        and terms_version is not null
        and terms_accepted_at is not null
      )
    );
