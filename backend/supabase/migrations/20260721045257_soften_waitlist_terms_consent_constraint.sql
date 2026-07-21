-- Relax the terms requirement so waitlist inserts remain valid if the
-- marketing app has not yet started writing terms_* (migrate-first deploy).
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
      )
    );

alter table public.waitlist_signups
  drop constraint if exists waitlist_signups_terms_acceptance_pair;

alter table public.waitlist_signups
  add constraint waitlist_signups_terms_acceptance_pair
    check (
      (terms_version is null and terms_accepted_at is null)
      or (terms_version is not null and terms_accepted_at is not null)
    );
