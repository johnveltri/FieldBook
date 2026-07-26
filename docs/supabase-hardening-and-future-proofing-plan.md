# FieldSolo Prelaunch Supabase Hardening and Future-Proofing

## Summary

Perform one coordinated prelaunch cleanup spanning the hosted database, API client, shared types, and Auth configuration.

The live audit confirms the earlier ChatGPT review:

- All current owner relationships are valid, so ownership constraints can be added without data repair.
- One paid job already has payment-state drift.
- `anon` and `authenticated` currently receive every table privilege on the main app tables.
- Eight `SECURITY DEFINER` maintenance functions are remotely executable.
- The client exclusively uses soft deletion, while hard-delete policies remain enabled.
- Attachments, activity events, and Storage are dormant and can remain private.

Success means the normal mobile flows still work, cross-account and hard-delete attempts fail at the database boundary, payment fields cannot disagree, Security Advisor warnings are either eliminated or explicitly allowlisted, and the resulting schema provides clean seams for costs, customers, quotes, invoices, payments, attachments, and subscriptions.

## Database and Security Changes

### API surface and privileged functions

- Adopt explicit Data API privileges now, ahead of Supabase’s October 30, 2026 default-privilege enforcement. Revoke future automatic table, sequence, and function grants, then grant only what each client flow uses. [Supabase Data API change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
- Create an unexposed `private` schema and relocate trigger, cron, ownership, timestamp, profile-provisioning, completeness, and recency functions there.
- Give every internal function an empty fixed `search_path` and fully qualified relation names. Retain `SECURITY DEFINER` only where column-level privileges or the `auth.users` trigger require it; use invoker security elsewhere.
- Repoint the cron job to `private.end_stale_live_sessions()` and verify it still runs as its database owner.
- Keep only `public.consume_waitlist_rate_limit(...)` as an intentional RPC, executable solely by `service_role`.
- Revoke `EXECUTE` on all other existing and future functions from `PUBLIC`, `anon`, and `authenticated`, following [Supabase function privilege guidance](https://supabase.com/docs/guides/database/functions#function-privileges).
- Disable `pg_graphql` and remove `graphql_public` from local exposed schemas because the repository has no GraphQL consumer. It can be re-enabled later through an explicit migration.

### Least-privilege table access

| Data area | Authenticated access | Explicitly prohibited |
|---|---|---|
| Jobs | Select, insert client-supplied creation fields, update editable/work/payment/soft-delete fields | Hard delete; changing owner, generated fields, timestamps, or derived completeness |
| Sessions | Select, insert, update lifecycle/time/soft-delete fields; reassign `job_id` to another active job owned by the same user | Hard delete; changing owner; clearing `job_id`; assigning another user’s job |
| Notes and job costs | Select, insert, update content, parent assignment, and `deleted_at` | Hard delete; changing owner |
| Profiles | Select, insert/upsert own profile, update profile fields | Delete or changing identity |
| Legal acceptances | Select and insert own rows | Update or delete |
| Analytics consent | Select, insert, update own status | Delete or changing owner |
| Attachments and activity events | No client access until implemented | All `anon` and authenticated access |
| Waitlist tables | Server-only | All `anon` and authenticated access |

- Remove authenticated `DELETE` policies from jobs, sessions, notes, and costs because the checked-in client uses updates for soft deletion.
- Remove all authenticated policies from dormant attachments and activity events. When activity events are activated, expose only select/insert so the table is genuinely append-only.
- Keep parent ownership predicates in RLS as defense in depth, and update consent policies to use `(select auth.uid())`.
- Add covering owner indexes for child foreign keys and RLS lookups. Preserve currently “unused” hot-path indexes because production volume is too small for those advisor statistics to be meaningful.

### Ownership and relational integrity

- Make `user_id` non-null on jobs, sessions, notes, job costs, attachments, and activity events.
- Replace permissive single-column child relationships with composite owner foreign keys so service-role scripts and imports cannot associate one user’s child row with another user’s job or session.
- Keep `sessions.job_id` non-null and preserve the current behavior where starting a live session creates a job automatically. Permit a session’s `job_id` to be reassigned only to another active job owned by the same user; never permit its owner to change. Recalculate recency and record-completeness fields for both the old and new jobs when reassignment occurs. Session-scoped notes and costs follow the session through `session_id`, while directly job-scoped records remain on their explicitly selected job.
- Preserve parentless notes and costs for Inbox capture, but require their non-null owner.
- Keep the job/session consistency check when both parent IDs are present.
- Change activity-event user deletion behavior from `SET NULL` to cascade so its non-null ownership invariant remains valid.
- Add a unique `(user_id, document_type, document_version)` legal-acceptance constraint and make client writes idempotent.

## Jobs, Costs, and Payment Model

### Generalized costs

- Rename `materials` to `job_costs` and `purchase_date` to `incurred_on`.
- Add `cost_type text not null default 'material'` with initial allowed values: `material`, `helper_labor`, `equipment_rental`, `permit`, `disposal`, `travel_parking`, and `other`.
- Backfill every existing row as `material`.
- Preserve current Materials screens and helper names, but have them read/write `job_costs` with `cost_type = 'material'`.
- Material-specific UI totals continue filtering to material rows; profit/net calculations sum every active job cost so later cost types work without rewriting economics.
- Rename `no_materials_confirmed` to nullable `costs_reviewed_at`. Backfill existing confirmations from the job’s current `updated_at`; the current “No materials” action stamps the timestamp because materials are the only launch cost type.
- Clear `costs_reviewed_at` whenever a new cost is added. If all costs are later deleted, the job becomes incomplete until the user reviews costs again.
- Rename `is_financially_complete` and its maintenance functions/types to `is_job_record_complete`. Its criteria remain: real description, positive revenue, at least one active session, and either an active cost or `costs_reviewed_at`.

### Amount-derived payments

- Make `collected_cents` non-null with a default of zero.
- Repair the existing paid-row drift by setting its collection to the job’s revenue, then convert remaining null collections to zero.
- Replace the writable payment enum with a stored generated `job_payment_state` text value:
  - No positive revenue: `NULL`
  - Zero collected: `unpaid`
  - More than zero but less than revenue: `partially_paid`
  - Equal to revenue: `paid`
- Enforce `0 <= collected_cents <= revenue_cents`; collections must be zero when revenue is unset or zero.
- When revenue changes on a fully paid job, move collection to the new revenue so the job remains paid. An unpaid job remains at zero collection. If an unexpected genuine partial collection exists, preserve it when it is at or below the new revenue; if the corrected revenue falls below it, clamp collection to the new revenue instead of rejecting the edit. This compatibility behavior prevents the current app from requiring a partial-payment workflow it does not provide.
- Update `JobPaymentState` to `unpaid | partially_paid | paid`.
- Preserve the launch UI’s simple unpaid/full-paid controls: marking paid sets collection equal to revenue; marking completed/unpaid sets it to zero. Partial amounts are supported by the schema but do not require a new payment editor in this release.
- Treat partial jobs as outstanding and calculate outstanding value as `revenue_cents - collected_cents`, not total revenue.
- Keep work status independent from collection state so future deposits and progress payments do not pollute the job lifecycle.

### Public code contracts

- Generate and commit Supabase `Database` types and parameterize the shared client with them.
- Remove legacy “column missing” fallbacks that currently mask migration drift.
- Add total-cost rollup fields while retaining material-only fields for the existing UI.
- Update queries, mocks, tests, and status mapping for the renamed cost/completeness fields and new payment states.

Future roadmap boundaries remain:

- Quotes, quote items, invoices, invoice items, and payments receive separate tables when built.
- Jobs later gain a nullable `customer_id`, while retaining name/address snapshots.
- Business identity, branding, tax, and template defaults belong in a future `businesses` table rather than `profiles`.
- RevenueCat uses dedicated entitlement/webhook tables.
- Search indexes wait for observed query patterns.
- Attachment metadata and the private bucket remain inaccessible until Storage RLS, upload authorization, quotas, MIME limits, signed URLs, and object deletion are implemented.

## Auth and Operational Hardening

- Keep email confirmation disabled for the selected low-friction launch flow.
- Raise the local and hosted password minimum to eight characters and update signup/change-password validation and copy.
- Enable secure password changes only after the app supports `reauthenticate()`, nonce entry, and retrying `updateUser`.
- Leaked-password protection is unavailable on the current Supabase Free plan; record it as an upgrade follow-up rather than a launch blocker. [Supabase password security](https://supabase.com/docs/guides/auth/password-security)
- Confirm the deployed delete-account function continues requiring JWT verification and that auth-user deletion cascades through the renamed cost and ownership relationships.
- Enable MFA on administrative Supabase and related platform accounts, review SSL enforcement and direct-database network restrictions, and retain the one-hour JWT lifetime. [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)

## Test and Rollout Plan

- Create ordered migrations with `supabase migration new`; do not patch production interactively.
- Add SQL regression tests for:
  - Null and cross-user owner rejection, including service-role-style writes.
  - Two-user RLS isolation for every exposed table.
  - Exact table/column/function grants.
  - Denial of authenticated hard deletes and internal RPC calls.
  - Cron execution, profile provisioning, timestamps, recency, and record-completeness triggers.
  - Parentless Inbox rows and valid note/cost assignment.
  - Required session parentage and valid session reassignment between active jobs owned by the same user, including old/new job rollup refreshes.
  - Cost-type filtering and all-cost profit aggregation.
  - Unpaid, partial, full, revenue-change, and invalid over-collection transitions, including paid-job revenue corrections and the compatibility clamp for unexpected partial rows.
  - Idempotent legal acceptance and account-deletion cascades.
- Update API-client, shared-type, mobile status/payment, Inbox, Materials, earnings, and Auth tests.
- Run local database reset/tests, package tests, mobile tests, typecheck, lint, build/export checks, generated-type verification, and `git diff --check`.
- Before production, run aggregate preflight assertions again and take a secure logical backup because downloadable managed backups are unavailable on the current Free plan.
- Verify migration alignment, run `supabase db push --dry-run`, apply the migrations, and immediately rerun Security and Performance Advisors.
- Acceptance target:
  - No `anon` privileges on private app data.
  - No authenticated access to dormant tables.
  - No exposed internal privileged functions.
  - No owner/null/payment-drift violations.
  - Consent RLS init-plan and missing-FK-index warnings resolved.
  - Only documented informational notices remain.
- Smoke-test the hosted project on a signed-in physical device: signup/profile creation, legal consent, create/edit/delete job, live/manual session, Inbox note/material reassignment, earnings/open/paid lists, payment transitions, password reauthentication, and account deletion.
- This is an intentionally coordinated breaking cutover with no compatibility view for `materials`; it assumes the current account is personal test data and no external users or older production clients must remain compatible.
