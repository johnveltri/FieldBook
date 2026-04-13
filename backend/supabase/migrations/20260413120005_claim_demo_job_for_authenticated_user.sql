-- Optional RPC for manual/SQL use. The mobile app does not call this; it only loads jobs
-- visible to the authenticated user via RLS.
-- Attach seeded demo job rows to the current user so RLS "own row" policies apply.
-- Updates bypass RLS via SECURITY DEFINER (authenticated users cannot PATCH rows with NULL user_id).

create or replace function public.claim_demo_job ()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  demo_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  uid uuid := auth.uid ();
begin
  if uid is null then
    return;
  end if;

  update public.jobs
  set user_id = uid
  where id = demo_id and user_id is null;

  update public.sessions
  set user_id = uid
  where job_id = demo_id and user_id is null;

  update public.notes
  set user_id = uid
  where user_id is null
    and (
      job_id = demo_id
      or session_id in (select s.id from public.sessions s where s.job_id = demo_id)
    );

  update public.materials
  set user_id = uid
  where user_id is null
    and (
      job_id = demo_id
      or session_id in (select s.id from public.sessions s where s.job_id = demo_id)
    );

  update public.job_activity_events
  set user_id = uid
  where job_id = demo_id and user_id is null;
end;
$$;

grant execute on function public.claim_demo_job () to authenticated;
