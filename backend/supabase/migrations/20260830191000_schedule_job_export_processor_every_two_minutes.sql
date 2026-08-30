-- Keep the established worker request intact while reducing idle polling. The
-- named cron job was created by the CSV export migration and must already
-- exist in each environment where this migration is applied.
do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname = 'process_job_exports';
  if v_job_id is null then
    raise exception 'process_job_exports cron job is missing';
  end if;
  perform cron.alter_job(v_job_id, schedule => '*/2 * * * *');
end;
$$;
