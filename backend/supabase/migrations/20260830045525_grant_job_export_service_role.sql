-- Edge Functions access this server-only table through PostgREST with the
-- service role. Grant only the operations used by processing, redemption,
-- cleanup, and account deletion; request creation remains behind the
-- security-definer accept_job_export_request RPC.
revoke all privileges on table public.job_export_requests from service_role;
grant select, update, delete on table public.job_export_requests to service_role;
