-- Loaded after migrations on `supabase db reset` (see config.toml [db.seed]).
insert into public.jobs (id, title, customer_name, updated_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'Kitchen remodel',
  'Rivera & Co.',
  now()
);
