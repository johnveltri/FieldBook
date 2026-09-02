# Job Detail Edit Build Plan

## Readiness basis

- Approved product spec: [spec.md](spec.md)
- State model: [state-model.md](state-model.md)
- Data contract: [data-contract.md](data-contract.md)
- UX contract: [ux-contract.md](ux-contract.md)
- Test contract: [test-contract.md](test-contract.md)
- Source revision reviewed: `4d988f8`
- Remaining blockers: TEST-16 interruption evidence and TEST-20 iOS/Android device evidence before submission; the automated gates in [test-contract.md](test-contract.md) pass locally.

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
| Migration | `backend/supabase/migrations/*job_detail_edit*.sql` | Session/material explicitness, derived-state qualification, idempotent apply RPC, grants |
| Types | `packages/api-client/src/database.types.ts`, `packages/shared-types/src/jobDetailView.ts` | Nullable revenue, session/material explicitness, TEST-10, TEST-21, TEST-22 |
| API | `packages/api-client/src/jobDetail.ts`, `applyJobDetailEdit.ts`, tests | REQ-05, REQ-18, DATA interface, TEST-07, TEST-09, TEST-11, TEST-15, TEST-18, TEST-26, TEST-28 |
| Duration helper | `apps/mobile-expo/src/lib/sessionDurationDraft.ts` (or api-client) | DATA-05, TEST-09 |
| Draft hook | `apps/mobile-expo/src/screens/jobDetailEdit/useJobEditDraft.ts` | STATE-*, partial round-trip, session-child unassignment, TEST-03, TEST-08, TEST-21, TEST-22, TEST-27, TEST-28 |
| UI primitives | `apps/mobile-expo/src/components/ds/edit-mode/*` | REQ-02, UX visual, TEST-02 |
| Edit mode | `apps/mobile-expo/src/screens/jobDetailEdit/JobDetailEditMode.tsx` | REQ-03..12, UX copy |
| Wire | `JobDetailScreen.tsx` mode view/edit, saving lock, vertical-dismiss lock | REQ-01, REQ-14, REQ-16, TEST-01, TEST-17, TEST-23 |
| View session row | `SessionCard` / session mapping | REQ-07, TEST-10 |
| Feature flag | `apps/mobile-expo/src/lib/featureFlags/*`, `JobDetailScreen.test.tsx` | UUID-only targeting, bounded fail-closed fallback, REQ-17, TEST-25 |
| FAB capture | `QuickActionsFlowContext.tsx` and focused tests | Direct Quick Note/Material to Inbox, REQ-14, TEST-24 |
| Analytics | existing `job_saved` / `job_save_failed` | UX analytics |
| Tests | `JobDetailScreen.test.tsx`, RPC tests, synthesis unit tests | TEST-* |

## Implementation sequence

1. **Migration + generated types**
   - Files: new SQL migration; `database.types.ts`
   - Behavior: session/material explicitness; meaningful-work derived-state predicates; owner-safe idempotent `apply_job_detail_edit`; authenticated-only execute; generated types from final schema
   - Verification: TEST-07, TEST-15, TEST-18, TEST-21, TEST-22, TEST-26, TEST-28 (SQL)

2. **api-client: mapSession flag + apply wrapper + synthesis helper**
   - Files: `jobDetail.ts`, `applyJobDetailEdit.ts`, tests
   - Behavior: nullable revenue; session and material explicitness; total-first material payload; honest missing-value mapping
   - Verification: TEST-09, TEST-10, TEST-11, TEST-21, TEST-22, TEST-28

3. **Draft hook**
   - Files: `useJobEditDraft.ts` + unit tests
   - Behavior: snapshot, mutate, diff, skip only completely empty rows, preserve partial values, unassign children on session removal
   - Verification: TEST-03, TEST-08, TEST-09, TEST-21, TEST-22, TEST-27, TEST-28 (unit)

4. **Edit UI primitives + JobDetailEditMode**
   - Files: header, hero, icon row, add row, swipeable row, section editors
   - Behavior: Calendar layout, copy, optional times/material breakdown, saving lock, delete job dialog
   - Verification: TEST-02, TEST-04, TEST-13, TEST-14, TEST-19, TEST-23

5. **Wire JobDetailScreen**
   - Files: `JobDetailScreen.tsx`; keep existing sheets for View/wizard
   - Behavior: `mode === 'edit'`; pencil/`initialEditOpen`; Done/Back; lock conflicting actions while Saving; lock job swipe-dismiss
   - Verification: TEST-01, TEST-05, TEST-06, TEST-17, TEST-23

6. **View duration-only display**
   - Files: `SessionCard` and/or `mapSession` consumers
   - Behavior: no `timeRangeLabel` when not explicit
   - Verification: TEST-10

7. **Feature-flag and FAB fallback paths**
   - Files: `featureFlags/*`, `JobDetailScreen.test.tsx`, `QuickActionsFlowContext.tsx`
   - Behavior: UUID-only bounded flag evaluation; disabled/unavailable fallback; direct Inbox Quick Note/Material
   - Verification: TEST-24, TEST-25

8. **Manual device pass**
   - Verification: TEST-16, TEST-20

## Migration and compatibility

- Additive explicitness columns + RPC. Old app keeps using sheets and `updateJobById`; new columns have compatibility defaults/backfills.
- New app requires RPC; deploy database before the mobile release that calls it.
- Rollback: revert mobile first; RPC can remain unused.

## Test execution map

| Test contract rules | Implementation step or gate | Planned evidence |
|---|---|---|
| TEST-07, 15, 18, 21, 22, 26, 28 | Step 1 | SQL/RPC tests |
| TEST-09, 10, 11, 21, 22, 27, 28 | Steps 2–3, 6 | Unit + mapper tests |
| TEST-01..06, 08, 12..14, 17, 19, 23 | Steps 4–5 | Jest screen tests |
| TEST-24, 25 | Step 7 | Jest flag/FAB tests |
| TEST-16, 20 | Step 8 / before submission | Manual record |

## Release sequence

- Database: apply migration to local, then hosted project used by the app.
- Functions/providers: none (RPC in Postgres, not Edge).
- Website: none.
- Mobile build: Expo app with Edit mode.
- Submission and platform processing: after TEST-20.
- Public release: after store processing.

## Product-context closeout

- Specs in `docs/specs/job-detail-edit/` are the contract; do not treat `docs/product/current-product.html` as updated until a later product-context pass (file freshness not relied on here).
- Privacy implementation aligns with existing legal copy: flag evaluation sends no full email.
- Analytics: existing job edit/save/delete events only.
- Customers table / Edit create-customer / View customer Inspect: out of this build; seams recorded in spec Deferred work.
