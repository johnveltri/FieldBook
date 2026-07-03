-- Duplicate-email resubmits refresh consent and profile fields via service role.
grant update on table public.waitlist_signups to service_role;
