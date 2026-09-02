# Job Detail Edit Build Plan

## Readiness basis

- Approved product spec: [spec.md](spec.md)
- State model: [state-model.md](state-model.md)
- Data contract: [data-contract.md](data-contract.md)
- UX contract: [ux-contract.md](ux-contract.md)
- Test contract: [test-contract.md](test-contract.md)
- Source revision reviewed: `4d988f8`
- Remaining blockers: None

## Current-state findings

- Job detail is a fullscreen Modal (iOS) / `OverlaySlideHost` (Android) in [`AuthenticatedAppChrome.tsx`](../../../apps/mobile-expo/src/shell/AuthenticatedAppChrome.tsx). Edit job is [`EditJobBottomSheet`](../../../apps/mobile-expo/src/components/ds/EditJobBottomSheet.tsx) from header EDIT and `initialEditOpen` ([`JobDetailScreen.tsx`](../../../apps/mobile-expo/src/screens/JobDetailScreen.tsx) `onEdit` ~563).
- Children mutate through separate flow machines and sheets (`EditSessionBottomSheet`, `EditMaterialBottomSheet`, `EditNoteBottomSheet`, `EditOtherCostBottomSheet`). Mark-complete wizard reuses those sheets ([`jobFinancialCompleteness.ts`](../../../apps/mobile-expo/src/lib/jobFinancialCompleteness.ts)).
- Sessions require `started_at`/`ended_at`; View always formats `timeRangeLabel` in [`jobDetail.ts` `mapSession`](../../../packages/api-client/src/jobDetail.ts).
- Column grants for sessions do not yet include a clock-times flag ([`20260726155058_harden_ownership_rls_and_privileges.sql`](../../../backend/supabase/migrations/20260726155058_harden_ownership_rls_and_privileges.sql)).
- No list swipe-to-delete; `react-native-gesture-handler` is already used for job dismiss.
- `feature/job-detail-edit` matches `main` at `4d988f8`.
- Customer is `jobs.customer_name` (string), not a customers table. A later Customers feature is deferred; this RPC must not add `customer_id`.

## Change map

| Area | Expected files/systems | Requirement or contract rule |
|---|---|---|
| Migration | `backend/supabase/migrations/*_sessions_clock_times_explicit_and_apply_job_detail_edit.sql` | DATA-06, apply RPC, grants |
| Types | `packages/api-client/src/database.types.ts`, `packages/shared-types/src/jobDetailView.ts` | DATA-06, TEST-10 |
| API | `packages/api-client/src/jobDetail.ts`, new `applyJobDetailEdit.ts`, tests | REQ-05, DATA interface, TEST-07, TEST-09, TEST-11, TEST-15, TEST-18 |
| Duration helper | `apps/mobile-expo/src/lib/sessionDurationDraft.ts` (or api-client) | DATA-05, TEST-09 |
| Draft hook | `apps/mobile-expo/src/screens/jobDetailEdit/useJobEditDraft.ts` | STATE-*, REQ-04, TEST-03, TEST-08 |
| UI primitives | `apps/mobile-expo/src/components/ds/edit-mode/*` | REQ-02, UX visual, TEST-02 |
| Edit mode | `apps/mobile-expo/src/screens/jobDetailEdit/JobDetailEditMode.tsx` | REQ-03..12, UX copy |
| Wire | `JobDetailScreen.tsx` mode view/edit; lock vertical dismiss while Edit | REQ-01, REQ-14, TEST-01, TEST-17 |
| View session row | `SessionCard` / session mapping | REQ-07, TEST-10 |
| Analytics | existing `job_saved` / `job_save_failed` | UX analytics |
| Tests | `JobDetailScreen.test.tsx`, RPC tests, synthesis unit tests | TEST-* |

## Implementation sequence

1. **Migration + generated types**
   - Files: new SQL migration; `database.types.ts`
   - Behavior: column default true; `apply_job_detail_edit`; grants including `clock_times_explicit` and child `id` inserts for client UUIDs
   - Verification: TEST-07, TEST-15, TEST-18 (SQL)

2. **api-client: mapSession flag + apply wrapper + synthesis helper**
   - Files: `jobDetail.ts`, `applyJobDetailEdit.ts`, tests
   - Behavior: `clockTimesExplicit` on `JobDetailSession`; hide time range in mapper or screen
   - Verification: TEST-09, TEST-10, TEST-11

3. **Draft hook**
   - Files: `useJobEditDraft.ts` + unit tests
   - Behavior: snapshot, mutate, diff, skip empty rows, duration defaults
   - Verification: TEST-03, TEST-08, TEST-09 (unit)

4. **Edit UI primitives + JobDetailEditMode**
   - Files: header, hero, icon row, add row, swipeable row, section editors
   - Behavior: Calendar layout, copy, optional times/qty, delete job dialog
   - Verification: TEST-02, TEST-04, TEST-13, TEST-14, TEST-19

5. **Wire JobDetailScreen**
   - Files: `JobDetailScreen.tsx`; keep existing sheets for View/wizard
   - Behavior: `mode === 'edit'`; pencil/`initialEditOpen`; Done/Back; lock job swipe-dismiss
   - Verification: TEST-01, TEST-05, TEST-06, TEST-17

6. **View duration-only display**
   - Files: `SessionCard` and/or `mapSession` consumers
   - Behavior: no `timeRangeLabel` when not explicit
   - Verification: TEST-10

7. **Manual device pass**
   - Verification: TEST-16, TEST-20

## Migration and compatibility

- Additive column + RPC. Old app keeps using sheets and `updateJobById`; ignores new column (defaults true).
- New app requires RPC; deploy database before the mobile release that calls it.
- Rollback: revert mobile first; RPC can remain unused.

## Test execution map

| Test contract rules | Implementation step or gate | Planned evidence |
|---|---|---|
| TEST-07, 15, 18 | Step 1 | SQL/RPC tests |
| TEST-09, 10, 11 | Steps 2–3, 6 | Unit + mapper tests |
| TEST-01..06, 08, 12..14, 17, 19 | Steps 4–5 | Jest screen tests |
| TEST-16, 20 | Step 7 / before submission | Manual record |

## Release sequence

- Database: apply migration to local, then hosted project used by the app.
- Functions/providers: none (RPC in Postgres, not Edge).
- Website: none.
- Mobile build: Expo app with Edit mode.
- Submission and platform processing: after TEST-20.
- Public release: after store processing.

## Product-context closeout

- Specs in `docs/specs/job-detail-edit/` are the contract; do not treat `docs/product/current-product.html` as updated until a later product-context pass (file freshness not relied on here).
- No legal/store copy change.
- Analytics: existing job edit/save/delete events only.
- Customers table / Edit create-customer / View customer Inspect: out of this build; seams recorded in spec Deferred work.
