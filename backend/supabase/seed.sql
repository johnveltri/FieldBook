-- Loaded after migrations on `supabase db reset` (see config.toml [db.seed]).
-- Demo job graph for Job Detail (`00000000-0000-0000-0000-000000000001`).

insert into public.jobs (
  id,
  short_description,
  customer_name,
  updated_at,
  category_label,
  job_work_status,
  job_payment_state,
  revenue_cents,
  collected_cents
)
values (
  '00000000-0000-0000-0000-000000000001',
  'Kitchen remodel',
  'Rivera & Co.',
  now (),
  'Handyman / General Home Services',
  'in_progress',
  null,
  2_220_000,
  null
)
on conflict (id) do update
set
  short_description = excluded.short_description,
  customer_name = excluded.customer_name,
  updated_at = excluded.updated_at,
  category_label = excluded.category_label,
  job_work_status = excluded.job_work_status,
  job_payment_state = excluded.job_payment_state,
  revenue_cents = excluded.revenue_cents,
  collected_cents = excluded.collected_cents;

insert into public.sessions (
  id,
  job_id,
  user_id,
  entry_mode,
  session_status,
  started_at,
  ended_at
)
values (
  'a0000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  null,
  'manual',
  'ended',
  timestamptz '2026-03-25 21:00:00+00',
  timestamptz '2026-03-25 22:00:00+00'
)
on conflict (id) do nothing;

insert into public.materials (
  job_id,
  session_id,
  description,
  quantity,
  unit,
  total_cost_cents,
  user_id
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    null,
    'Moen Faucet',
    1,
    'ea',
    7_500,
    null
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Supply line kit',
    1,
    'ea',
    2_500,
    null
  );

insert into public.notes (job_id, session_id, body, user_id)
values
  (
    '00000000-0000-0000-0000-000000000001',
    null,
    'Client requested brushed nickel finish. Old valve was slightly corroded but salvageable.',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Picked up parts on the way.',
    null
  );

insert into public.job_activity_events (job_id, user_id, event_type, payload)
values (
  '00000000-0000-0000-0000-000000000001',
  null,
  'session_started',
  jsonb_build_object('session_id', 'a0000000-0000-4000-8000-000000000001')
);
