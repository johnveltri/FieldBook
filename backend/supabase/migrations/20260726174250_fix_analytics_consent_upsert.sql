-- supabase-js upsert includes every payload column in ON CONFLICT DO UPDATE.
-- The consent payload includes user_id, so authenticated needs column-level
-- UPDATE on user_id even when the value is unchanged. The existing RLS policy
-- still requires both the old and new user_id to equal auth.uid(), preventing
-- ownership reassignment.
grant update (user_id) on public.analytics_consent to authenticated;
