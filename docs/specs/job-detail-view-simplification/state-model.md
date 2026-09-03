# Job Detail View State Model

## Scope

- Job View health/read/act, Complete wizard (flag on).
- Job Edit draft states remain in [`../job-detail-edit/state-model.md`](../job-detail-edit/state-model.md). Wizard **enters** those states with `wizardActive`.
- Live Session overlay lifecycle is **unchanged** this phase (existing `LiveSessionContext`). Phase 3 owns expanded capture writes and the View start tile.

## State definitions

| ID | State | Meaning | Persisted or derived | Terminal? |
|---|---|---|---|---|
| STATE-V01 | ViewReady | Flag-on View | Derived | No |
| STATE-V02 | MinimumInfoGate | Complete intro sheet | Derived | No |
| STATE-V03 | WizardEdit | Job Edit while wizard active | Derived | No |
| STATE-V04 | MaterialsNoneGate | Confirm-none / add materials | Derived | No |
| STATE-V05 | OtherCostsNoneGate | Confirm-none / add other costs | Derived | No |
| STATE-V06 | MarkingComplete | Status write in flight | Derived | No |

Expand/collapse of View rows is presentation only (not a durable state).

STATE-V07 LiveExpanded and STATE-V08 LiveMinimized remain existing product states; this phase does not change their transitions. Phase 3 will specify capture events on LiveExpanded.

## Events

| Event | Initiator | Preconditions | Idempotency |
|---|---|---|---|
| OpenEditFromView | User | ViewReady | — |
| ToggleReadExpand | User | ViewReady | Toggle |
| BeginComplete / ConfirmMinimumInfo / CancelWizard / WizardDone / ConfirmNoMaterials / ConfirmNoOtherCosts | User/System | As prior wizard packet | Same as previous spec |

StartLiveFromView, LiveAddNote, LiveAddMaterial, and LiveChangeStart are Phase 3.

## Transitions

Wizard transitions unchanged from the previous packet: MinimumInfo → WizardEdit or none-gate; Edit discard cancels wizard; none-gate confirm stamps reviewed_at.

ViewReady + OpenEditFromView → Phase 1 Edit (not wizard unless wizardActive).

## Interruption

- Kill in WizardEdit: Phase 1 draft lost; wizard flag lost.
- Confirm-none only from STATE-V04/V05.
- Kill during an existing live session: session remains on the server (current product). Unsaved overlay drafts stay as today.

## Invariants

- View expand never writes.
- Live overlay never uses `apply_job_detail_edit` (existing; do not change this phase).
- Job Edit Done is the only batch persist for job-owned lists.

## Verification

- TEST-V07, TEST-V08.
