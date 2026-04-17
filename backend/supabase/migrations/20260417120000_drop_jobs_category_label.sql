-- Remove deprecated category display column; job_type is the canonical label.
alter table public.jobs drop column if exists category_label;
