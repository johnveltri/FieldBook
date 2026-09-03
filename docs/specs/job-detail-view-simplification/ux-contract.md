# Job Detail View UX Contract

## User and context

Scan a job’s health and contents; read without editing; act (status, complete, Edit). Live Session stays the current FAB + overlay this phase.

## Primary journeys


| Step | Surface | Action                                 | Response                                                    |
| ---- | ------- | -------------------------------------- | ----------------------------------------------------------- |
| 1    | View    | Open job                               | Shared X + **EDIT**; body is View; `Missing:` if incomplete |
| 2    | View    | Tap **EDIT**                           | Body fades to Edit; **Done** in the pill slot; X stays      |
| 3    | View    | Chevron on session/note                | Expand read content                                         |
| 4    | View    | Edit control / material row / customer | Fade to Edit, focused                                       |
| 5    | View    | Complete                               | Minimum-info → Edit or none-gate                            |


Live Session start from View and expanded live capture (add note/material, start time) are Phase 3. FAB Live Session and today’s overlay remain.

## Chrome and motion

- Header matches Edit: left `PlatformHeaderAction` X (`accessibilityLabel` **Close** — same as current Edit implementation), right pill **EDIT** (`Brand/Primary` or current EDIT styling) vs Edit’s **Done**.
- **Shared header**; View and Edit bodies crossfade (~200–300ms, respect reduced motion → hard cut).
- X never changes meaning: View X closes job detail; Edit X/Back behavior stays Phase 1 **discard** (implementation today labels it Close and calls `onBack`). Do not close the job when discarding Edit.



## Expand vs Edit (read vs mutate)


| Card                  | Collapsed                       | Expand                 | Mutate                                                                     |
| --------------------- | ------------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| Session               | Date, duration, missing line    | Attachment list (read) | `Edit` in expanded panel **or** tap row body → job Edit focused on session |
| Note                  | Excerpt                         | Full body              | If not truncated, tap → Edit. If expanded, `Edit` → Edit focused on note   |
| Material / other cost | Name, amount, missing line      | None                   | Whole row → Edit                                                           |
| Customer              | Name in header, service address | None                   | Tap name → Edit customer                                                   |
| Earnings / metrics    | Cards                           | None                   | Tap earnings → Edit revenue                                                |


No ADD tiles in View expand. No session EDIT pill on the collapsed row.

## Health

- Below the job header (title/status/customer), if pills nonempty: `Missing: ${pills.join(', ')}` — same style intent as Job Card incomplete line.
- Row missing: one secondary line, not a blocking modal.



## Actions (clear)

- Close job, **EDIT**, status primary + more, Complete (via status), Edit-on-item, Complete none-gate.
- Live Session: FAB + existing overlay only this phase. No dedicated View start tile.
- **Not this phase:** Share, invoice, receipt — CTA row may remain as today; do not add fake buttons.



## Empty and Complete copy

Keep UX-V01..V17 from the prior packet **except** the dedicated Live start tile (`Live Session` / `Start a timer now` on View). Keep empty lists, minimum-info, and none-gates. Live start-tile copy is Phase 3 (with REQ-V06).

Add:


| ID     | Surface               | Exact text                                               |
| ------ | --------------------- | -------------------------------------------------------- |
| UX-V18 | Job health            | `Missing: {list}` |
| UX-V20 | Expanded session/note | `Edit`            |

UX-V19 (`{n} notes · {m} materials` on the collapsed session) is **withdrawn**. Counts are not shown until expand, where the attachment list is the content.


UX-V21 `Add note` and UX-V22 `Add material` on the live overlay are Phase 3.

## Inbox, Quick capture, New job, Live Session (not this phase — Phase 3)

- Inbox is a View of unassigned captures: tap = edit; **Add to job** is explicit; delete is swipe or overflow.
- New job is Todoist-style: title is enough to save; more fields are opt-in (Job Edit).
- Quick Note / Quick Material stay Inbox-bound (no job picker). Save on the minimum (note body; material description + total); more fields are opt-in.
- Live Session: View start tile when this job has no in-progress session; expanded overlay is the capture surface (start time in place, Edit-style add-rows, immediate persist, End Session, no nested job Edit / Done). Item tap may keep existing live note/material sheets unless inline edit is cheaper.



## Accessibility

- Chevron: expand/collapse. Row Edit: `Edit session` / `Edit note`.
- Fade: not the only cue; Edit still has Done.
- Reduced motion: skip crossfade.



## Visual quality

- View stays a **composed** layout (header card, earnings, metrics, lists) — not Edit’s field rows.



## Analytics

- `job_edit_opened` sources: `header`, `view_row`, `view_empty`, `complete_wizard`, `customer`.
- Existing live start/end/note/material events stay; no new live-capture events this phase.



## Verification

TEST-V02, TEST-V05, TEST-V11–V15.