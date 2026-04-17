# Phase 1 schema alignment (MVP)

Migration file: [`migrations/20260413120000_phase1_job_economic_session_worklog.sql`](./migrations/20260413120000_phase1_job_economic_session_worklog.sql).

## A. Summary of changes

| Area | Change |
|------|--------|
| **`jobs`** | **Keeps** `revenue_cents`, `job_payment_state`. **Adds** `collected_cents`. **Removes** `materials_cents`, `fees_cents`, `net_earnings_cents` (no stored derived totals for MVP). |
| **`sessions`** | **Removes** `revenue_cents`, `collected_cents`, `payment_state`, `payment_details`. Session remains time/status/log only. |
| **`notes` / `materials`** (renamed from `material_entries`) | Drops XOR parent rule. **Requires** at least one of `job_id`, `session_id`. Session-scoped rows may set **both** `job_id` and `session_id`; trigger enforces `job_id` = that session’s job when both are set. |
| **`attachments`** | **New** table: same parent pattern + `storage_bucket` / `storage_object_key` (+ optional metadata). Initial migrations mirrored the same RLS/anon dev pattern as notes/materials; later migrations remove shared anon table access by default. |
| **Enums** | `job_work_status_enum` unchanged — **no** `paid` value; “Paid” in UI is derived from `job_payment_state` + work status. |

## B. SQL migration

Applied by Supabase CLI as the next migration after `20260412200412_init_field_book_phase1.sql`. See the linked file.

## C. Data migration / backfill

- **Dropped columns:** Any data in `materials_cents`, `fees_cents`, `net_earnings_cents`, or session-level money fields is **not** migrated. Export first if you need it in non-dev environments.
- **`collected_cents`:** New column, default `NULL`. Backfill manually if you had collection amounts elsewhere.
- **Session financials:** If you relied on session `revenue_cents` / `payment_state`, move that logic to **`jobs`** before or after applying this migration.

## D. Follow-up (types / app)

- **Done:** [`packages/shared-types`](../packages/shared-types/src/index.ts) `Job` + `JobPaymentState`; [`packages/api-client`](../packages/api-client/src/jobs.ts) selects economic columns.
- **Still on you:** Regenerate Supabase TypeScript types when you adopt `Database` generics. **Job Detail UI** (`earnings.materialsCents`, fees, net): treat as **computed** from **`materials`** (and future fee rules), not as stored job columns. **Attachments:** wire uploads to Storage and insert rows into `attachments`.
