-- Capture-now: partial sessions/materials/other costs; optional session calendar date.

alter table public.sessions
  add column if not exists calendar_date_explicit boolean not null default true;

comment on column public.sessions.calendar_date_explicit is
  'False when the user left session date empty on Edit; started_at is storage-only.';

alter table public.job_costs
  add column if not exists cost_type_explicit boolean not null default true;

comment on column public.job_costs.cost_type_explicit is
  'False when the user left other-cost type empty on Edit (storage uses other).';

revoke insert on public.sessions from authenticated;
grant insert (
  id, job_id, user_id, entry_mode, session_status,
  started_at, ended_at, deleted_at, started_tz,
  clock_times_explicit, clock_start_explicit, clock_end_explicit, calendar_date_explicit
) on public.sessions to authenticated;

revoke update on public.sessions from authenticated;
grant update (
  job_id, session_status, started_at, ended_at, deleted_at, started_tz,
  clock_times_explicit, clock_start_explicit, clock_end_explicit, calendar_date_explicit
) on public.sessions to authenticated;

create or replace function public.apply_job_detail_edit(
  p_job_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_job public.jobs%rowtype;
  v_job_patch jsonb;
  v_short_description text;
  v_revenue_cents bigint;
  v_item jsonb;
  v_id uuid;
  v_session_id uuid;
  v_started_at timestamptz;
  v_ended_at timestamptz;
  v_clock_explicit boolean;
  v_clock_start_explicit boolean;
  v_clock_end_explicit boolean;
  v_calendar_date_explicit boolean;
  v_started_tz text;
  v_entry_mode public.session_entry_mode_enum;
  v_qty numeric;
  v_unit_cost bigint;
  v_total bigint;
  v_cost_type text;
  v_cost_cents bigint;
  v_cost_type_explicit boolean;
  v_body text;
  v_description text;
begin
  if v_user_id is null then
    raise exception 'apply_job_detail_edit:unauthorized' using errcode = 'P0001';
  end if;

  select * into v_job
  from public.jobs j
  where j.id = p_job_id
    and j.user_id = v_user_id
    and j.deleted_at is null
  for update;

  if not found then
    raise exception 'apply_job_detail_edit:not_found' using errcode = 'P0001';
  end if;

  v_job_patch := p_payload -> 'job';
  if v_job_patch is null then
    raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
  end if;

  v_short_description := btrim(coalesce(v_job_patch ->> 'shortDescription', ''));
  if v_short_description = '' then
    raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
  end if;

  if v_job_patch ? 'revenueCents' and v_job_patch -> 'revenueCents' is not null then
    v_revenue_cents := (v_job_patch ->> 'revenueCents')::bigint;
    if v_revenue_cents < 0 then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;
  else
    v_revenue_cents := null;
  end if;

  update public.jobs
  set
    short_description = v_short_description,
    customer_name = nullif(btrim(coalesce(v_job_patch ->> 'customerName', '')), ''),
    service_address = nullif(btrim(coalesce(v_job_patch ->> 'serviceAddress', '')), ''),
    revenue_cents = v_revenue_cents
  where id = p_job_id;

  for v_id in
    select (value #>> '{}')::uuid
    from jsonb_array_elements(coalesce(p_payload #> '{sessions,deleteIds}', '[]'::jsonb))
  loop
    if exists (
      select 1 from public.sessions s
      where s.id = v_id
        and s.job_id = p_job_id
        and s.user_id = v_user_id
        and s.session_status = 'in_progress'
    ) then
      raise exception 'apply_job_detail_edit:conflict' using errcode = 'P0001';
    end if;

    update public.sessions
    set session_status = 'deleted',
        deleted_at = now(),
        ended_at = null
    where id = v_id
      and job_id = p_job_id
      and user_id = v_user_id
      and session_status = 'ended';

    if not found then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;
  end loop;

  for v_item in
    select * from jsonb_array_elements(coalesce(p_payload #> '{sessions,update}', '[]'::jsonb))
  loop
    v_id := (v_item ->> 'id')::uuid;
    v_started_at := (v_item ->> 'startedAt')::timestamptz;
    v_ended_at := (v_item ->> 'endedAt')::timestamptz;
    v_clock_start_explicit := coalesce((v_item ->> 'clockStartExplicit')::boolean, false);
    v_clock_end_explicit := coalesce((v_item ->> 'clockEndExplicit')::boolean, false);
    if v_item ? 'clockStartExplicit' or v_item ? 'clockEndExplicit' then
      v_clock_explicit := v_clock_start_explicit or v_clock_end_explicit;
    else
      v_clock_explicit := coalesce((v_item ->> 'clockTimesExplicit')::boolean, true);
      v_clock_start_explicit := v_clock_explicit;
      v_clock_end_explicit := v_clock_explicit;
    end if;
    v_calendar_date_explicit := coalesce((v_item ->> 'calendarDateExplicit')::boolean, true);
    v_started_tz := nullif(btrim(coalesce(v_item ->> 'startedTz', '')), '');

    if v_ended_at is null or v_ended_at < v_started_at then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    select entry_mode into v_entry_mode
    from public.sessions
    where id = v_id
      and job_id = p_job_id
      and user_id = v_user_id;

    if not found then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    if v_entry_mode = 'live' and v_clock_explicit = false then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    update public.sessions
    set started_at = v_started_at,
        ended_at = v_ended_at,
        clock_times_explicit = v_clock_explicit,
        clock_start_explicit = v_clock_start_explicit,
        clock_end_explicit = v_clock_end_explicit,
        calendar_date_explicit = v_calendar_date_explicit,
        started_tz = coalesce(v_started_tz, started_tz)
    where id = v_id
      and job_id = p_job_id
      and user_id = v_user_id
      and session_status = 'ended';

    if not found then
      if exists (
        select 1 from public.sessions s
        where s.id = v_id and s.session_status = 'in_progress'
      ) then
        raise exception 'apply_job_detail_edit:conflict' using errcode = 'P0001';
      end if;
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;
  end loop;

  for v_item in
    select * from jsonb_array_elements(coalesce(p_payload #> '{sessions,create}', '[]'::jsonb))
  loop
    v_id := (v_item ->> 'id')::uuid;
    v_started_at := (v_item ->> 'startedAt')::timestamptz;
    v_ended_at := (v_item ->> 'endedAt')::timestamptz;
    v_clock_start_explicit := coalesce((v_item ->> 'clockStartExplicit')::boolean, false);
    v_clock_end_explicit := coalesce((v_item ->> 'clockEndExplicit')::boolean, false);
    if v_item ? 'clockStartExplicit' or v_item ? 'clockEndExplicit' then
      v_clock_explicit := v_clock_start_explicit or v_clock_end_explicit;
    else
      v_clock_explicit := coalesce((v_item ->> 'clockTimesExplicit')::boolean, false);
      v_clock_start_explicit := v_clock_explicit;
      v_clock_end_explicit := v_clock_explicit;
    end if;
    v_calendar_date_explicit := coalesce((v_item ->> 'calendarDateExplicit')::boolean, true);
    v_started_tz := nullif(btrim(coalesce(v_item ->> 'startedTz', '')), '');

    if v_ended_at is null or v_ended_at < v_started_at then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    insert into public.sessions (
      id, job_id, user_id, entry_mode, session_status,
      started_at, ended_at, started_tz,
      clock_times_explicit, clock_start_explicit, clock_end_explicit, calendar_date_explicit
    ) values (
      v_id, p_job_id, v_user_id, 'manual', 'ended',
      v_started_at, v_ended_at, v_started_tz,
      v_clock_explicit, v_clock_start_explicit, v_clock_end_explicit, v_calendar_date_explicit
    );
  end loop;

  if exists (
    select 1 from jsonb_array_elements(coalesce(p_payload #> '{sessions,create}', '[]'::jsonb))
  ) then
    update public.jobs
    set job_work_status = 'in_progress'
    where id = p_job_id
      and job_work_status = 'not_started';
  end if;

  for v_id in
    select (value #>> '{}')::uuid
    from jsonb_array_elements(coalesce(p_payload #> '{notes,deleteIds}', '[]'::jsonb))
  loop
    update public.notes
    set deleted_at = now()
    where id = v_id
      and user_id = v_user_id
      and deleted_at is null
      and (
        job_id = p_job_id
        or session_id in (
          select s.id from public.sessions s
          where s.job_id = p_job_id and s.user_id = v_user_id
        )
      );

    if not found then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;
  end loop;

  for v_item in
    select * from jsonb_array_elements(coalesce(p_payload #> '{notes,update}', '[]'::jsonb))
  loop
    v_id := (v_item ->> 'id')::uuid;
    v_body := btrim(coalesce(v_item ->> 'body', ''));
    v_session_id := nullif(v_item ->> 'sessionId', '')::uuid;

    if v_body = '' then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    if v_session_id is not null and not exists (
      select 1 from public.sessions s
      where s.id = v_session_id
        and s.job_id = p_job_id
        and s.user_id = v_user_id
        and s.session_status = 'ended'
    ) then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    update public.notes
    set body = v_body,
        job_id = case when v_session_id is null then p_job_id else null end,
        session_id = v_session_id
    where id = v_id
      and user_id = v_user_id
      and deleted_at is null
      and (
        job_id = p_job_id
        or session_id in (
          select s.id from public.sessions s
          where s.job_id = p_job_id and s.user_id = v_user_id
        )
      );

    if not found then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;
  end loop;

  for v_item in
    select * from jsonb_array_elements(coalesce(p_payload #> '{notes,create}', '[]'::jsonb))
  loop
    v_id := (v_item ->> 'id')::uuid;
    v_body := btrim(coalesce(v_item ->> 'body', ''));
    v_session_id := nullif(v_item ->> 'sessionId', '')::uuid;

    if v_body = '' then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    if v_session_id is not null and not exists (
      select 1 from public.sessions s
      where s.id = v_session_id
        and s.job_id = p_job_id
        and s.user_id = v_user_id
        and s.session_status = 'ended'
    ) then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    insert into public.notes (id, user_id, job_id, session_id, body)
    values (
      v_id,
      v_user_id,
      case when v_session_id is null then p_job_id else null end,
      v_session_id,
      v_body
    );
  end loop;

  for v_id in
    select (value #>> '{}')::uuid
    from jsonb_array_elements(coalesce(p_payload #> '{materials,deleteIds}', '[]'::jsonb))
  loop
    update public.job_costs
    set deleted_at = now()
    where id = v_id
      and user_id = v_user_id
      and cost_type = 'material'
      and deleted_at is null
      and (
        job_id = p_job_id
        or session_id in (
          select s.id from public.sessions s
          where s.job_id = p_job_id and s.user_id = v_user_id
        )
      );

    if not found then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;
  end loop;

  for v_item in
    select * from jsonb_array_elements(coalesce(p_payload #> '{materials,update}', '[]'::jsonb))
  loop
    v_id := (v_item ->> 'id')::uuid;
    v_description := coalesce(v_item ->> 'description', '');
    v_qty := coalesce((v_item ->> 'quantity')::numeric, 0);
    v_unit_cost := coalesce((v_item ->> 'unitCostCents')::bigint, 0);
    v_session_id := nullif(v_item ->> 'sessionId', '')::uuid;
    v_total := round(v_unit_cost * v_qty);

    if v_qty < 0 or v_unit_cost < 0 then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    if v_session_id is not null and not exists (
      select 1 from public.sessions s
      where s.id = v_session_id
        and s.job_id = p_job_id
        and s.user_id = v_user_id
        and s.session_status = 'ended'
    ) then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    update public.job_costs
    set description = v_description,
        quantity = v_qty,
        unit = coalesce(nullif(btrim(v_item ->> 'unit'), ''), 'ea'),
        unit_cost_cents = v_unit_cost,
        total_cost_cents = v_total,
        job_id = case when v_session_id is null then p_job_id else null end,
        session_id = v_session_id
    where id = v_id
      and user_id = v_user_id
      and cost_type = 'material'
      and deleted_at is null
      and (
        job_id = p_job_id
        or session_id in (
          select s.id from public.sessions s
          where s.job_id = p_job_id and s.user_id = v_user_id
        )
      );

    if not found then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;
  end loop;

  for v_item in
    select * from jsonb_array_elements(coalesce(p_payload #> '{materials,create}', '[]'::jsonb))
  loop
    v_id := (v_item ->> 'id')::uuid;
    v_description := coalesce(v_item ->> 'description', '');
    v_qty := coalesce((v_item ->> 'quantity')::numeric, 0);
    v_unit_cost := coalesce((v_item ->> 'unitCostCents')::bigint, 0);
    v_session_id := nullif(v_item ->> 'sessionId', '')::uuid;
    v_total := round(v_unit_cost * v_qty);

    if v_qty < 0 or v_unit_cost < 0 then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    if v_session_id is not null and not exists (
      select 1 from public.sessions s
      where s.id = v_session_id
        and s.job_id = p_job_id
        and s.user_id = v_user_id
        and s.session_status = 'ended'
    ) then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    insert into public.job_costs (
      id, user_id, job_id, session_id, description, quantity, unit,
      unit_cost_cents, total_cost_cents, cost_type
    ) values (
      v_id,
      v_user_id,
      case when v_session_id is null then p_job_id else null end,
      v_session_id,
      v_description,
      v_qty,
      coalesce(nullif(btrim(v_item ->> 'unit'), ''), 'ea'),
      v_unit_cost,
      v_total,
      'material'
    );
  end loop;

  for v_id in
    select (value #>> '{}')::uuid
    from jsonb_array_elements(coalesce(p_payload #> '{otherCosts,deleteIds}', '[]'::jsonb))
  loop
    update public.job_costs
    set deleted_at = now()
    where id = v_id
      and user_id = v_user_id
      and cost_type <> 'material'
      and deleted_at is null
      and (
        job_id = p_job_id
        or session_id in (
          select s.id from public.sessions s
          where s.job_id = p_job_id and s.user_id = v_user_id
        )
      );

    if not found then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;
  end loop;

  for v_item in
    select * from jsonb_array_elements(coalesce(p_payload #> '{otherCosts,update}', '[]'::jsonb))
  loop
    v_id := (v_item ->> 'id')::uuid;
    v_cost_type := coalesce(nullif(btrim(v_item ->> 'costType'), ''), 'other');
    v_cost_type_explicit := coalesce((v_item ->> 'costTypeExplicit')::boolean, true);
    v_cost_cents := coalesce((v_item ->> 'costCents')::bigint, 0);
    v_description := coalesce(v_item ->> 'description', '');
    v_session_id := nullif(v_item ->> 'sessionId', '')::uuid;

    if v_cost_cents < 0 then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    if v_cost_type not in (
      'helper_labor', 'equipment_rental', 'permit', 'disposal', 'travel_parking', 'other'
    ) then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    if v_session_id is not null and not exists (
      select 1 from public.sessions s
      where s.id = v_session_id
        and s.job_id = p_job_id
        and s.user_id = v_user_id
        and s.session_status = 'ended'
    ) then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    update public.job_costs
    set cost_type = v_cost_type,
        cost_type_explicit = v_cost_type_explicit,
        description = nullif(btrim(v_description), ''),
        total_cost_cents = v_cost_cents,
        unit_cost_cents = v_cost_cents,
        quantity = 1,
        job_id = case when v_session_id is null then p_job_id else null end,
        session_id = v_session_id
    where id = v_id
      and user_id = v_user_id
      and cost_type <> 'material'
      and deleted_at is null
      and (
        job_id = p_job_id
        or session_id in (
          select s.id from public.sessions s
          where s.job_id = p_job_id and s.user_id = v_user_id
        )
      );

    if not found then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;
  end loop;

  for v_item in
    select * from jsonb_array_elements(coalesce(p_payload #> '{otherCosts,create}', '[]'::jsonb))
  loop
    v_id := (v_item ->> 'id')::uuid;
    v_cost_type := coalesce(nullif(btrim(v_item ->> 'costType'), ''), 'other');
    v_cost_type_explicit := coalesce((v_item ->> 'costTypeExplicit')::boolean, true);
    v_cost_cents := coalesce((v_item ->> 'costCents')::bigint, 0);
    v_description := coalesce(v_item ->> 'description', '');
    v_session_id := nullif(v_item ->> 'sessionId', '')::uuid;

    if v_cost_cents < 0 then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    if v_cost_type not in (
      'helper_labor', 'equipment_rental', 'permit', 'disposal', 'travel_parking', 'other'
    ) then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    if v_session_id is not null and not exists (
      select 1 from public.sessions s
      where s.id = v_session_id
        and s.job_id = p_job_id
        and s.user_id = v_user_id
        and s.session_status = 'ended'
    ) then
      raise exception 'apply_job_detail_edit:invalid' using errcode = 'P0001';
    end if;

    insert into public.job_costs (
      id, user_id, job_id, session_id, description, quantity, unit,
      unit_cost_cents, total_cost_cents, cost_type, cost_type_explicit
    ) values (
      v_id,
      v_user_id,
      case when v_session_id is null then p_job_id else null end,
      v_session_id,
      nullif(btrim(v_description), ''),
      1,
      'ea',
      v_cost_cents,
      v_cost_cents,
      v_cost_type,
      v_cost_type_explicit
    );
  end loop;

  return jsonb_build_object('status', 'ok');
end;
$$;
