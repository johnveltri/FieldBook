# Job Detail Edit

**Status:** Approved product spec
**Feature source:** Job detail Edit page (Google Calendar edit-event layout), Phase 1 of job view/edit speed work
**Last updated:** 2026-09-01

## Outcome

A solo tradesperson can change everything that belongs on a job — identity, sessions, materials, other costs, and notes — on one fullscreen Edit page, then commit once with **Done** or throw the draft away with **Back**. That removes the current edit-save-edit-save loop of nested bottom sheets for the pencil path.

## Approved decisions

- Phase 1 is the **Edit page only**. View subtraction, Inspect, FAB Inbox-only capture, Todoist new job, Inbox swipe, and live-session overlay redesign are deferred.
- Edit is a **mode on the existing job-detail fullscreen**, not a second stacked modal and not `EditJobBottomSheet`.
- Layout follows **Google Calendar edit event** (hero title, icon rows, Add-rows, delete at bottom). Chrome is **not** Calendar’s X: **Back** on the left, **Done** on the right in the same slot as View’s **EDIT**, using brand primary red.
- All Edit-page field and list changes are an **in-memory draft until Done**. Back discards (with confirm if dirty). Process kill discards.
- **Duration-first** sessions: date defaults to today; duration is the primary input; start and end are optional. When clock times are omitted, View shows **date + duration only** (no invented clock range). Internal `started_at` / `ended_at` may still be synthesized so existing constraints stay intact.
- Materials fast path: **description + total cost**. Unit price and quantity are optional.
- **Delete job**: confirm, then delete immediately and leave job detail. Not part of the Done draft.
- Live Session is **not** on Edit. In-progress sessions are not in the draft and cannot be deleted from Edit.
- View **ADD pills and item sheets stay** for this release, including the mark-complete wizard. Pencil and `initialEditOpen` go to Edit mode instead of `EditJobBottomSheet`.
- After Done, View session rows with no explicit clock times hide the time range (minimal View display change required for honest duration-only sessions).

## Scope

- Smallest useful release: Job Detail Edit mode that can create, update, and delete job identity and child rows in one Done, with Back discarding, plus confirm-and-delete-job.
- Users and surfaces: authenticated mobile job detail (iOS Modal and Android overlay).
- Known dependent features: mark-complete wizard and Live Session keep current sheets; completeness rules and no-materials confirmation are unchanged; invoices/share are not in this release. A future **Customers** record (table, save-from-Edit, View Inspect) is identified but **out of this release** — see Deferred work.

## Product requirements

| ID | Requirement | Acceptance evidence |
|---|---|---|
| REQ-01 | Header **EDIT** / pencil and new-job `initialEditOpen` open Edit mode instead of `EditJobBottomSheet`. | TEST-01 |
| REQ-02 | Edit chrome is **Back** (left) and **Done** (right, View **EDIT** slot, brand primary). Layout matches [ux-contract.md](ux-contract.md). | TEST-02, TEST-20 |
| REQ-03 | Edit contains job title, customer, address, revenue, and editable lists for sessions, materials, other costs, and notes, including inline add. | TEST-02, TEST-03 |
| REQ-04 | List changes (add, edit, swipe-remove) stay in the draft until Done. Back with a dirty draft asks to discard; confirming discard restores last persisted job. | TEST-04, TEST-05 |
| REQ-05 | Done persists the draft in one transaction, refetches job detail, and returns to View. Failure keeps the draft and shows retry copy. | TEST-06, TEST-07 |
| REQ-06 | Blank new rows are omitted on Done. A partial invalid row (for example a cost with no description) blocks Done with inline error. Job title cannot be blank. Sessions may have a date without duration when attaching notes, materials, or other costs. | TEST-08 |
| REQ-07 | New session defaults to today with **no** duration until the user sets one. Duration is primary; start/end optional. Clock-less sessions store synthesized times with `clock_times_explicit = false` and View hides the clock range. | TEST-09, TEST-10 |
| REQ-08 | Material fast path is description + total (`quantity=1`, `unit=ea`, `unitCost=total`). Optional unit price and quantity recompute total. | TEST-11 |
| REQ-09 | Notes, materials, and other costs may optionally attach to an ended session on the Edit page via `ChooseSessionBottomSheet` (date + duration label per row). | TEST-12 |
| REQ-10 | Swipe-remove on a draft row hides it until Done (soft-delete) or Back (restore). | TEST-13 |
| REQ-11 | **Delete job** at the bottom confirms, then soft-deletes immediately and closes job detail. It does not wait for Done. | TEST-14 |
| REQ-12 | In-progress live sessions do not appear on Edit and cannot be deleted or rewritten by Done. | TEST-15 |
| REQ-13 | Process kill or force-quit while in Edit discards the draft. Reopening the job shows last persisted data. | TEST-16 |
| REQ-14 | View section ADD, row-tap sheets, Live Session, and mark-complete wizard keep current behavior in this release. | TEST-17 |
| REQ-15 | Done and Delete job honor job ownership (authenticated owner only). | TEST-18 |

## Artifact manifest

| Artifact | Applicability | Path or inline section | Rationale |
|---|---|---|---|
| State model | Required | [state-model.md](state-model.md) | In-memory draft, discard, save, and delete-job are a multi-step workflow with interruption rules. |
| Data contract | Required | [data-contract.md](data-contract.md) | New session flag, synthesized times, and a transactional apply RPC. |
| UX contract | Required | [ux-contract.md](ux-contract.md) | New surface, copy, gestures, and Calendar-style layout. |
| Test contract | Required | [test-contract.md](test-contract.md) | Proof spans UI, RPC, RLS, and device interruption. |

## Product constraints

- Brand and field-speed constraints: one mutation surface for the pencil path; capture-now still exists via View sheets and FAB (unchanged).
- Security, privacy, legal, or financial constraints: owner-only writes; soft-delete job and children; no change to paid/invoiced meaning; revenue still cents on `jobs`.
- Free-tier and dependency constraints: one RPC per Done (fewer round-trips than N sheet saves). No new paid vendor. Reuse `react-native-gesture-handler` `Swipeable`.
- Compatibility and release constraints: deploy the migration before the mobile build that calls the RPC. Old clients ignore `clock_times_explicit` and may show synthesized clock times for duration-only sessions created by new clients.

## Acceptance scenarios

- Given a loaded job, when the user taps **EDIT**, then they see Calendar-style Edit with current values and can change lists without those writes hitting the server until **Done**.
- Given a dirty Edit draft, when the user taps Back and confirms discard, then View shows the job as it was before Edit.
- Given a duration-only new session, when the user taps **Done**, then View shows the session’s date and duration and does not show a start–end clock range.
- Given Delete job, when the user confirms, then the job is gone from lists even if they never tapped **Done**.
- Given mark-complete still needs a session, when the user uses the existing wizard, then the current session sheet still opens (not Edit mode).

## Agent-decided assumptions

- Default duration for a new session is **empty** (0h) until the user picks a preset, custom value, or explicit clock times.
- Synthesized clock when times are omitted: **09:00 local** on the session date, end = start + duration (0h when duration unset), `started_tz` = device IANA zone. These values are storage-only until both start and end clocks are explicit.
- Duration chips: **30m**, **1h**, **2h**, **4h**, **8h**, plus a numeric field. Picking a duration clears the end clock when a start clock was set; start clock is preserved.
- Apply payload is a **diff** (creates/updates/deletes), not a replace-all child list, so a live session that ends while Edit is open is not destroyed.
- RPC is `public.apply_job_detail_edit`, `SECURITY INVOKER`, owner RLS.
- Exact copy in the UX contract unless later overridden.

## Non-goals

- Removing View ADD/EDIT pills, session accordion, or no-materials confirmation cards.
- Inspect (full note / photo viewer).
- FAB Quick Note/Material skipping the job chooser.
- Todoist-style job create (no Untitled Job until named).
- Inbox swipe-to-delete.
- Live session overlay redesign.
- Autosave of the Edit draft to disk.
- Changing financial completeness rules.
- A `customers` table, linking a job to a customer id, creating a customer from Edit, or a customer Inspect/manage surface.

## Deferred work

- Phase 2 View subtraction and Inspect (notes/photos), with the seam that Edit is already the mutation surface for pencil.
- Phase 3 outside job detail (FAB, Inbox, Todoist, live overlay).
- Re-homing mark-complete gaps onto Edit after View sheets go away.
- **Customers (next iteration, not this RPC):** user-owned customer records; job points at a customer; Edit Customer row becomes search/select/create; View customer name becomes Inspect (full customer fields / manage). Preserved seams for this release:
  - Keep Customer as one Calendar-style **icon row** bound only to `jobs.customer_name` (plain text).
  - Do not add `customer_id` (or a customers payload key) to `apply_job_detail_edit`.
  - Do not invent a customer picker, “save as customer”, or View tap-to-Inspect on the name.
  - Address stays a **job** field (`jobs.service_address`), not a customer-owned address, until Customers is shaped.

## Open blockers

- None
