-- iOS build 4 saves profiles with INSERT ... ON CONFLICT DO UPDATE and
-- includes the primary-key id in the update target. Preserve that request
-- shape while keeping profile ids immutable.

grant update (id) on public.profiles to authenticated;

create or replace function private.enforce_profile_id_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profiles.id is immutable' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function private.enforce_profile_id_immutable()
  from public, anon, authenticated;

drop trigger if exists profiles_id_immutable on public.profiles;
create trigger profiles_id_immutable
  before update of id
  on public.profiles
  for each row
  execute function private.enforce_profile_id_immutable();

notify pgrst, 'reload schema';
