-- Optional performance: session-scoped active rows by last update (attachment lists).
-- Partial indexes mirror soft-delete patterns used for created_at ordering.

create index if not exists notes_session_active_updated_idx
  on public.notes (session_id, updated_at desc)
  where session_id is not null and deleted_at is null;

create index if not exists materials_session_active_updated_idx
  on public.materials (session_id, updated_at desc)
  where session_id is not null and deleted_at is null;
