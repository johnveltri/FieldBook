# Job Detail View Data Contract

## Scope and terminology

- **Job health** — list-level incomplete pills (`description`, `revenue`, `costs`, `sessions`).
- **Row health** — a persisted child that is not yet countable / is missing required capture fields.
- **Read expand** — UI only.
- Confirm-none timestamps unchanged; writers restricted when flag on.

No new tables. No new RPC for View. Live Session create/start APIs are unchanged this phase; Phase 3 will use existing create note/material and update start APIs for expanded capture.

## Fields

| ID | Field | Meaning | Source |
|---|---|---|---|
| DATA-V01 | jobs.materials_reviewed_at | Confirm-none from Complete gate only (flag on) | User |
| DATA-V02 | jobs.other_costs_reviewed_at | Same for other costs | User |
| DATA-V03 | focusTarget | Client-only Edit scroll target | Client |
| DATA-V04 | Job `Missing:` pills | Same rules as `incompletePillsFor` on Open Jobs | Derived |
| DATA-V05 | Session row missing | No explicit calendar date and/or no countable duration (Phase 1 flags / empty labels) | Derived |
| DATA-V06 | Material row missing | Missing description and/or missing total (0 with no captured total) | Derived |
| DATA-V07 | Other cost row missing | Missing explicit cost type and/or amount ≤ 0 | Derived |
| DATA-V08 | View customer card | `jobs.customer_name` and `jobs.service_address` (omit address when blank) | Persisted; display only |

Job completeness formulas in `jobFinancialCompleteness.ts` and DB integrity for which sessions count are **not** changed here. Row health **displays** Phase 1 partial rows.

## Relationships

- View expand does not attach/detach children.

## Invariants

- Flag on View empty cards do not write reviewed_at.
- `apply_job_detail_edit` is not used from Live Session capture (existing overlay; Phase 3 keeps this).
- Customer tap does not create a customers row.

## Interfaces

Existing: `fetchJobDetail`, `apply_job_detail_edit`, reviewed-at APIs, PostHog flag.

Live Session `createNote`, `createMaterial`, `updateLiveSessionStart` / equivalent, and `startLiveSession` stay as today; Phase 3 will bind new UX to them.

## Migration

None. Flag-off compatibility: old View.

## Verification

TEST-V03, TEST-V05, TEST-V08, TEST-V14, TEST-V15.
