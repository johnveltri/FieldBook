alter table public.waitlist_signups
  add column privacy_policy_version text,
  add column privacy_accepted_at timestamptz,
  add column marketing_consent boolean;

alter table public.waitlist_signups
  add constraint waitlist_signups_first_name_length
    check (char_length(first_name) between 1 and 100),
  add constraint waitlist_signups_email_length
    check (char_length(email) between 3 and 320),
  add constraint waitlist_signups_consent_complete
    check (
      marketing_consent is null
      or (
        marketing_consent = true
        and privacy_policy_version is not null
        and privacy_accepted_at is not null
      )
    );

create table public.waitlist_rate_limits (
  key_hash text not null,
  window_started_at timestamptz not null,
  attempts integer not null default 1 check (attempts > 0),
  primary key (key_hash, window_started_at)
);

alter table public.waitlist_rate_limits enable row level security;

revoke all on table public.waitlist_signups from anon, authenticated;
revoke all on table public.waitlist_rate_limits from anon, authenticated;

grant insert on table public.waitlist_signups to service_role;
grant select, insert, update, delete on table public.waitlist_rate_limits to service_role;

create function public.consume_waitlist_rate_limit(
  p_key_hash text,
  p_limit integer default 10
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_attempts integer;
  current_window timestamptz := date_trunc('hour', now());
begin
  if p_key_hash is null or char_length(p_key_hash) <> 64 then
    raise exception 'invalid rate-limit key';
  end if;

  if p_limit < 1 or p_limit > 100 then
    raise exception 'invalid rate limit';
  end if;

  insert into public.waitlist_rate_limits (key_hash, window_started_at, attempts)
  values (p_key_hash, current_window, 1)
  on conflict (key_hash, window_started_at)
  do update set attempts = public.waitlist_rate_limits.attempts + 1
  returning attempts into current_attempts;

  delete from public.waitlist_rate_limits
  where window_started_at < now() - interval '2 days';

  return current_attempts <= p_limit;
end;
$$;

revoke execute on function public.consume_waitlist_rate_limit(text, integer)
  from public, anon, authenticated;
grant execute on function public.consume_waitlist_rate_limit(text, integer)
  to service_role;
