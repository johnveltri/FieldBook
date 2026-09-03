# Job Detail View

**Status:** Approved product spec
**Feature source:** Phase 2 — make Job View a consumer-grade scan/read/act surface. (Replaces the subtraction-only draft of this folder.)
**Last updated:** 2026-09-02

## Outcome

Job View tells the truth about a job at a glance — status, what’s missing, what’s on it — and makes the next action obvious. Reading does not require Edit. Mutating job records still commits on Edit **Done**.

## Purpose (this page)

1. **Health** — not only the status pill. Same job-level `Missing:` line as Open Jobs incomplete cards, plus per-row missing when a session/material/other cost cannot count yet.
2. **Scan and read** — cards, metrics, profit snapshot, expandable read-more. Future insights/recos can join this column. Customer is an entry point (this phase: tap → Edit).
3. **Act** — financially complete, change status, whole-job Edit, edit an existing item. Invoice/receipt are reserved slots, not built here. Live Session start from View is **Phase 3**; FAB Live Session stays as today.
4. **Inbox, quick capture, Todoist job add, and Live Session** — same viewing/minimum-save and capture-while-running principles, **Phase 3** (not this phase).

## Approved decisions

- Shared **header chrome** with Edit: `PlatformHeaderAction` **X** (same slot as [`JobDetailEditMode.tsx`](../../../apps/mobile-expo/src/screens/jobDetailEdit/JobDetailEditMode.tsx)), trailing pill **EDIT** / **Done** in the same geometry. **Fade** View body ↔ Edit body under that chrome (X does not jump).
- **Expand is read, not mutate.** Collapsed rows stay scannable. Collapsed sessions show date, duration, and a missing line only — not note/material counts. Chevron (or equivalent) reveals extra read content: full note body; session attachment list. Expanded panels do **not** contain ADD tiles or an EDIT pill. Mutate via row **Edit** (see UX) or header **EDIT**.
- Customer card on View shows **name and service address** (`jobs.service_address`; omit the address line when blank). Tap name → Edit focused on customer (Customers table later).
- Remove section **ADD** pills and confirm-none **cards** from View (flag on). Confirm-none stays only on the Complete gate.
- Job-level `Missing: description, revenue, sessions, costs` uses the same pill vocabulary as [`incompletePillsFor`](../../../apps/mobile-expo/src/screens/JobsScreen.tsx).
- Row-level missing uses capture-now placeholders (no duration, no date, no material description, no total, no cost type/amount) so partial Phase 1 rows are honest.
- Live Session: **unchanged this phase.** FAB start and the existing overlay/sheets stay. Do **not** add a dedicated View start tile. Do **not** redesign expanded live capture (inline add note/material, start time in place). Flag on removes session ADD, so the New Session chooser’s Live tile is gone from View until Phase 3.
- Complete wizard: addable gaps → Edit focused; confirm-none on the gate only (prior Phase 2 call).
- Flag off: Phase 1 View + sheets unchanged (including session ADD → Live vs past chooser).
- Inbox edit/delete/assign, Todoist new job, Quick Note/Material UX, and Live Session View/overlay work are **out**; principles recorded under Deferred.

## Scope

- Surfaces: Job View (flag on), Complete gates.
- Depends on: Phase 1 Edit ([`../job-detail-edit/spec.md`](../job-detail-edit/spec.md)).
- Not in this release: Inbox, Live Session start tile or overlay redesign, invoices, customer records, insights copy, photo inspect.

## Product requirements

| ID | Requirement | Acceptance evidence |
|---|---|---|
| REQ-V01 | Flag on: no section ADD pills. | TEST-V01 |
| REQ-V02 | Flag on: session/note expand is read-only (full note, attachment list). Collapsed session has no note/material count. No expand EDIT pill, no add-to-session tiles on View. | TEST-V02 |
| REQ-V03 | Flag on: empty materials/other costs have no confirm/undo cards. | TEST-V03 |
| REQ-V04 | Flag on: View does not open job item add/edit sheets except Complete none-gates. | TEST-V04 |
| REQ-V05 | Mutate: header EDIT, customer card, earnings, empty section, material/other-cost row, session/note **Edit** control → Edit with `focusTarget`. Status CTA does not open Edit. Customer card shows name and service address. | TEST-V05 |
| REQ-V07 | Complete addable gaps open Edit after minimum-info confirm. Edit discard cancels wizard. | TEST-V07 |
| REQ-V08 | Materials/other-costs none-gate on Complete only; Add opens Edit. | TEST-V08 |
| REQ-V09 | Flag off: Phase 1 View unchanged. | TEST-V09 |
| REQ-V10 | `focusTarget` scrolls Edit to the section/row. | TEST-V10 |
| REQ-V11 | Shared X + trailing pill placement with Edit; View↔Edit **crossfade** of body (header stays). | TEST-V13 |
| REQ-V12 | Job View shows `Missing: …` when incomplete, same tokens as the Open Jobs card. | TEST-V14 |
| REQ-V13 | Rows that are not yet countable show a missing line (session date/duration; material description/total; other cost type/amount). | TEST-V15 |

REQ-V06 (View Live Session start tile) and REQ-V14 (live expanded capture) are reserved for Phase 3.

## Artifact manifest

| Artifact | Applicability | Path or inline section | Rationale |
|---|---|---|---|
| State model | Required | [state-model.md](state-model.md) | Wizard vs job Edit draft |
| Data contract | Required | [data-contract.md](data-contract.md) | Completeness display vs persist |
| UX contract | Required | [ux-contract.md](ux-contract.md) | Chrome, expand-to-read, health, actions |
| Test contract | Required | [test-contract.md](test-contract.md) | Flag, wizard, fade, health |

## Product constraints

- Completeness **formulas** unchanged. Display can highlight rows that do not count (Phase 1 partial sessions).
- Do not route Live Session writes through `apply_job_detail_edit`. Overlay capture stays on existing APIs, unchanged this phase.
- Fade/chrome are Expo animation; no new paid dependency (`Animated` already used).
- Invoice/receipt: leave space in the CTA story; do not build.

## Acceptance scenarios

- Given View and Edit, when the user taps EDIT then Done, then X stays put and the body fades.
- Given an incomplete job, when View opens, then `Missing: revenue, sessions` (example) matches the Open Jobs card.
- Given a session with notes/materials, when collapsed, then the row shows date, duration, and missing line only — not `N notes · M materials`. Expanding shows the attachment list without an EDIT pill.
- Given a job with a service address, when View opens, then the customer card shows the name and that address.
- Given a truncated note, when they expand it, then the full body is readable on View.
- Given flag on, when they want a live timer, then FAB Live Session still starts it; View has no new Live Session tile and the overlay is still today’s sheet.

## Agent-decided assumptions

- **Chevron expands; primary row / `Edit` opens job Edit** for sessions and truncated notes. Materials/other costs with nothing to disclose: whole row → Edit.
- Job `Missing:` copy: `Missing: ${pills.join(', ')}` with pills `description`, `revenue`, `costs`, `sessions` (existing).
- Row missing copy: reuse/adapt `JOB_DETAIL_EMPTY_LABELS` plus `No total` / `No amount` as needed.
- Shared header host in `JobDetailScreen`; do not animate X between two different layouts.
- Blank service address omits the address line (existing `JobDetailJobHeader`). Last-worked on the header stays as today.

## Non-goals

- Full-screen note/photo Inspect (expand-in-place is enough for notes now).
- Changing completeness SQL/formulas.
- Inbox, Todoist new job, Quick Note/Material **UX**, View Live Session start tile, and live overlay redesign (Phase 3 — see Deferred). Customers table, Share/invoice.
- View swipe-to-delete.
- Nested Edit mode on Live Session.

## Deferred work

- **Phase 3 — Inbox, quick capture, Todoist job add, and Live Session** (one spec, after this View phase). Same scan/act idea as Job View:
  - **Inbox:** viewing surface for unassigned captures. Tap = edit the note/material; **Add to job** is explicit; delete via swipe or overflow. Not “tap only assigns.”
  - **New job:** Todoist-style. Name is enough to save. Do not persist `Untitled Job` before they have a title. Optional control to add more (opens Job Edit / remaining fields). Abandoned empty drafts are not left on the jobs list.
  - **Quick Note / Quick Material:** keep direct Inbox save (no job chooser — already Phase 1). UX matches the same minimum-to-save rule: note body enough to save; material description + total enough to save; extra fields (session, qty, unit price) only if they choose to add more.
  - **Live Session:** dedicated View start tile when this job has no in-progress session (`Live Session` / `Start a timer now`; start uses existing path and closes job detail). Expanded live sheet is the capture surface: Edit-style `Add note` / `Add material` rows that persist immediately; start time editable in place; End Session remains; no nested job-Edit mode and no second Done. Writes use existing note/material create and start-time APIs, not `apply_job_detail_edit`.
- Customers Inspect; invoice/receipt actions in the CTA row.
- Insights/recos modules on View.
- Flag 100% / delete unused sheets.

## Open blockers

- None
