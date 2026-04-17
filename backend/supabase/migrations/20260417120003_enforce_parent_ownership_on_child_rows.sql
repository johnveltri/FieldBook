-- Tighten child-row ownership: authenticated access must satisfy both
-- row ownership (`user_id = auth.uid()`) and parent ownership.
--
-- This prevents a user from attaching their own child rows to another user's
-- jobs/sessions by guessing UUIDs.

-- sessions
drop policy if exists "sessions_select_own" on public.sessions;
drop policy if exists "sessions_insert_own" on public.sessions;
drop policy if exists "sessions_update_own" on public.sessions;
drop policy if exists "sessions_delete_own" on public.sessions;

create policy "sessions_select_own"
on public.sessions
for select
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = sessions.job_id
      and j.user_id = (select auth.uid())
  )
);

create policy "sessions_insert_own"
on public.sessions
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = sessions.job_id
      and j.user_id = (select auth.uid())
  )
);

create policy "sessions_update_own"
on public.sessions
for update
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = sessions.job_id
      and j.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = sessions.job_id
      and j.user_id = (select auth.uid())
  )
);

create policy "sessions_delete_own"
on public.sessions
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = sessions.job_id
      and j.user_id = (select auth.uid())
  )
);

-- notes
drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;

create policy "notes_select_own"
on public.notes
for select
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = notes.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = notes.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

create policy "notes_insert_own"
on public.notes
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = notes.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = notes.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

create policy "notes_update_own"
on public.notes
for update
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = notes.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = notes.session_id
        and s.user_id = (select auth.uid())
    )
  )
)
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = notes.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = notes.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

create policy "notes_delete_own"
on public.notes
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = notes.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = notes.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

-- materials
drop policy if exists "materials_select_own" on public.materials;
drop policy if exists "materials_insert_own" on public.materials;
drop policy if exists "materials_update_own" on public.materials;
drop policy if exists "materials_delete_own" on public.materials;

create policy "materials_select_own"
on public.materials
for select
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = materials.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = materials.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

create policy "materials_insert_own"
on public.materials
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = materials.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = materials.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

create policy "materials_update_own"
on public.materials
for update
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = materials.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = materials.session_id
        and s.user_id = (select auth.uid())
    )
  )
)
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = materials.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = materials.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

create policy "materials_delete_own"
on public.materials
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = materials.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = materials.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

-- attachments
drop policy if exists "attachments_select_own" on public.attachments;
drop policy if exists "attachments_insert_own" on public.attachments;
drop policy if exists "attachments_update_own" on public.attachments;
drop policy if exists "attachments_delete_own" on public.attachments;

create policy "attachments_select_own"
on public.attachments
for select
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = attachments.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = attachments.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

create policy "attachments_insert_own"
on public.attachments
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = attachments.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = attachments.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

create policy "attachments_update_own"
on public.attachments
for update
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = attachments.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = attachments.session_id
        and s.user_id = (select auth.uid())
    )
  )
)
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = attachments.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = attachments.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

create policy "attachments_delete_own"
on public.attachments
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.jobs j
      where j.id = attachments.job_id
        and j.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.sessions s
      where s.id = attachments.session_id
        and s.user_id = (select auth.uid())
    )
  )
);

-- job_activity_events
drop policy if exists "job_activity_events_select_own" on public.job_activity_events;
drop policy if exists "job_activity_events_insert_own" on public.job_activity_events;
drop policy if exists "job_activity_events_update_own" on public.job_activity_events;
drop policy if exists "job_activity_events_delete_own" on public.job_activity_events;

create policy "job_activity_events_select_own"
on public.job_activity_events
for select
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = job_activity_events.job_id
      and j.user_id = (select auth.uid())
  )
);

create policy "job_activity_events_insert_own"
on public.job_activity_events
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = job_activity_events.job_id
      and j.user_id = (select auth.uid())
  )
);

create policy "job_activity_events_update_own"
on public.job_activity_events
for update
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = job_activity_events.job_id
      and j.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = job_activity_events.job_id
      and j.user_id = (select auth.uid())
  )
);

create policy "job_activity_events_delete_own"
on public.job_activity_events
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.jobs j
    where j.id = job_activity_events.job_id
      and j.user_id = (select auth.uid())
  )
);
