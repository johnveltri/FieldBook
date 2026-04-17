-- When a session is discarded, session-scoped notes/materials should remain
-- attached to the job but no longer attached to the session (unassigned bucket).

create or replace function public.unassign_children_for_discarded_session()
returns trigger
language plpgsql
as $$
begin
  if new.session_status = 'discarded'
     and old.session_status is distinct from 'discarded' then
    update public.notes n
    set
      job_id = coalesce(n.job_id, new.job_id),
      session_id = null
    where n.session_id = new.id;

    update public.materials m
    set
      job_id = coalesce(m.job_id, new.job_id),
      session_id = null
    where m.session_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists sessions_unassign_children_on_discard on public.sessions;
create trigger sessions_unassign_children_on_discard
after update on public.sessions
for each row execute function public.unassign_children_for_discarded_session();

-- Backfill existing discarded sessions so current data matches new behavior.
update public.notes n
set
  job_id = coalesce(n.job_id, s.job_id),
  session_id = null
from public.sessions s
where n.session_id = s.id
  and s.session_status = 'discarded';

update public.materials m
set
  job_id = coalesce(m.job_id, s.job_id),
  session_id = null
from public.sessions s
where m.session_id = s.id
  and s.session_status = 'discarded';
