-- Capture-now: allow saving materials before a description is entered.
-- The legacy check rejected '' but allowed NULL; partial saves use ''.

alter table public.job_costs
  drop constraint if exists job_costs_description_not_blank;
