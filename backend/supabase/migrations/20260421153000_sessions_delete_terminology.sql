-- Standardize session soft-delete terminology from "discard" -> "delete".
-- This migration updates the current schema language without rewriting
-- historical migrations.

alter type public.session_status_enum
  rename value 'discarded' to 'deleted';

alter table public.sessions
  rename column discarded_at to deleted_at;

alter table public.sessions
  drop constraint if exists sessions_status_timestamps_check;

alter table public.sessions
  add constraint sessions_status_timestamps_check check (
    (session_status = 'in_progress' and ended_at is null and deleted_at is null)
    or (session_status = 'ended' and ended_at is not null and deleted_at is null)
    or (session_status = 'deleted' and deleted_at is not null)
  );

create or replace function public.unassign_children_for_deleted_session()
returns trigger
language plpgsql
as $$
begin
  if new.session_status = 'deleted'
     and old.session_status is distinct from 'deleted' then
    update public.notes
       set job_id = coalesce(job_id, new.job_id),
           session_id = null
     where session_id = new.id;

    update public.materials
       set job_id = coalesce(job_id, new.job_id),
           session_id = null
     where session_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists sessions_unassign_children_on_discard on public.sessions;
drop trigger if exists sessions_unassign_children_on_delete on public.sessions;

create trigger sessions_unassign_children_on_delete
after update on public.sessions
for each row execute function public.unassign_children_for_deleted_session();

drop function if exists public.unassign_children_for_discarded_session();
