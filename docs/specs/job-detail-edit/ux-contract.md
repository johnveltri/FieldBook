# Job Detail Edit UX Contract

## User and context

- Primary user and job to be done: Solo tradesperson correcting or filling a job record quickly.
- Field context, interruption risk, and speed target: One page, one Done; kill loses the draft (approved).
- Entry points: Job detail header control (current EDIT pill / pencil) and `initialEditOpen` after blank job create.
- Successful exit: View of the saved job, or View of the prior job after discard, or job list after delete.

## Primary journey

| Step | Surface | User action | System response | Next state/surface |
|---:|---|---|---|---|
| 1 | Job View | Tap **EDIT** | Snapshot job; show Edit mode | STATE-02 |
| 2 | Edit | Change title, rows, add/swipe | Draft updates | STATE-03 |
| 3 | Edit | Tap **Done** | Validate; RPC; refetch | View (success) or Edit + error |
| 4a | Edit | Tap **Back** while dirty | Discard dialog | STATE-04 |
| 4b | Discard dialog | **Discard** | Drop draft | View |
| 5 | Edit | Tap **Delete job** → confirm | Immediate soft-delete; close job | Left job |

## Surface-state matrix

| Surface | Loading | Empty | Ready | Saving/processing | Success | Error/retry | Offline/interrupted |
|---|---|---|---|---|---|---|---|
| Edit page | Entering Edit uses already-loaded job; no extra spinner required | Lists show only **Add …** rows | Scrollable Calendar-style form | Done shows spinner; Done, Back, hardware/system Back, and Delete job are disabled or ignored | Return to View | Banner or alert UX-12; Stay on Edit | Same as error; kill discards |
| Discard dialog | — | — | UX-04..06 | — | View | — | — |
| Delete job dialog | — | — | UX-07..10 | Disable confirm while in flight | Job detail closes | UX-13 | Same as error |
| View session row | — | Missing date/duration use honest placeholder copy | Date + duration; **no** invented clock range | — | — | — | — |

## Interaction rules

- Primary action: **Done** (trailing header pill, View **EDIT** position, `Brand/Primary` fill). Secondary: **Back** (leading chevron + label, same family as other job sheets). Destructive: **Delete job** at bottom, then swipe-remove on rows.
- Validation: Done is disabled only while the title is blank or a save is running. Completely empty brand-new rows are ignored; non-empty partial rows are valid capture-now data. Disabled Done stays in the same slot (dimmed), not moved.
- Back: pristine → View. Dirty → discard dialog. Hardware/system Back matches **Back**.
- Swipe-remove: left swipe on session/material/note/other-cost rows; does not fight job-detail vertical dismiss (Edit should not use the View swipe-to-close dismiss, or should lock it while Edit is open).
- Saving lock: repeated Done, Back, hardware/system Back, and Delete job are ignored while Saving; no discard or destructive dialog can open until the apply attempt finishes.
- Keyboard: sheet/page lifts with keyboard; hero title and trailing fields remain tappable; safe-area below Delete job.
- Optional session attach: trailing control on note/material/other-cost opens `ChooseSessionBottomSheet` to pick among **ended** sessions on this job, or none.
- Session start and end clocks are always visible on each session row (no collapsed reveal).
- Material total is the primary field. Unit price, quantity, and UOM are always visible optional fields. Quantity and unit price show independently captured values; when both are present, their product updates total. With only one present, total is preserved and the other stays empty after reopen.
- Live Session control is not present on Edit.
- Customer is a **plain text** trailing field on the Customer icon row (UX-03). No typeahead, no “Add customer”, no nested customer form. A later Customers iteration may replace this control with search/select/create on the **same row**, still committing on Done; View may later Inspect the customer. Do not make the row a dead-end unlabeled input that cannot become a picker.

## Navigation and continuity

- `initialEditOpen`: after create, land in Edit (replaces auto-open `EditJobBottomSheet`).
- Backgrounding: draft remains until process death.
- Termination: draft gone (REQ-13).
- Mark-complete wizard, View ADD, and row taps: unchanged sheets (REQ-14).
- FAB Quick Note and Quick Material skip job/session selection, open the capture form directly, and save to Inbox.

## Responsive and platform behavior

- Phone portrait is primary. Tablet: same single column, existing job-detail max width.
- Safe areas: Back/Done use the same top inset and trailing slot as the current job-detail **Close** / **EDIT** header.
- Keyboard: `KeyboardAvoidingView` / sheet already used on job detail; Edit mode must keep Delete job reachable.
- iOS: job remains the existing fullscreen Modal; Edit is a mode inside it.
- Android: existing vertical overlay; system Back = Edit **Back** (discard rules apply).
- Android while Saving: system Back is consumed without leaving Edit or opening discard confirmation.
- Reduced motion: skip non-essential swipe bounce; keep swipe-to-remove.

## Accessibility

- Back: `accessibilityLabel` **Back**. Done: **Done**. Delete job: **Delete job**.
- Add rows: labels UX-18..21.
- Swipe-remove: also expose a delete accessibility action on the row (not swipe-only).
- Hero title is an editable text field; placeholder UX-14.
- Focus order: Back, Done, title, identity rows, sections top to bottom, Delete job.
- Dynamic Type: hero and rows use existing `dynamicTypeTextStyle` patterns; no clipped glyphs at Accessibility XXXL.
- Non-color: swipe reveal uses label **Delete**, not color alone.

## Visual and component quality

- Brand: field-speed, consumer-grade; Calendar **body** structure; FieldSoli header. **Done** is a pill in the View **EDIT** slot with `Brand/Primary` background and on-primary label (same compact pill type as **EDIT** / section **ADD**), not Google blue and not a text-only trailing link.
- Assessed existing: `EditJobBottomSheet` (labeled stacked inputs), `ProfileRowsCard` (settings card), `SheetPrimaryDeleteActions` (save+trash footer), section ADD pills, job-detail **EDIT** pill. Reuse **EDIT** pill geometry and ADD/brand fill for **Done**; leading control is sheet-style **Back**, not the View X.
- Alternatives: native grouped `UITableView` (iOS-only), extra form library (bundle/lock-in). Rejected.
- Selected: custom Expo primitives (header, hero title, icon field row, add row, swipeable row) using design-system color/type/space.
- Motion: Edit replaces View in place (no extra modal slide). Done/Back are immediate mode switches after confirm/save.

## Content and copy

| ID | Surface/state | Purpose | Exact text | Variables/fallback | Accessibility or truncation note |
|---|---|---|---|---|---|
| UX-01 | Edit header | Commit | `Done` | — | Trailing pill; `Brand/Primary` fill; same slot as View **EDIT** |
| UX-02 | Edit header | Leave Edit | `Back` | — | Leading control; chevron + this label |
| UX-03 | Edit identity | Customer row | `Customer` | — | — |
| UX-04 | Discard dialog | Title | `Discard changes?` | — | — |
| UX-05 | Discard dialog | Keep | `Keep editing` | — | — |
| UX-06 | Discard dialog | Confirm | `Discard` | — | Destructive |
| UX-07 | Delete dialog | Title | `Delete this job?` | — | — |
| UX-08 | Delete dialog | Body | `This cannot be undone.` | — | — |
| UX-09 | Delete dialog | Cancel | `Cancel` | — | — |
| UX-10 | Delete dialog | Confirm | `Delete job` | — | Destructive |
| UX-11 | Edit footer | Delete affordance | `Delete job` | — | — |
| UX-12 | Save error | Retry | `Couldn't save this job. Try again.` | — | Alert or inline; no stack traces |
| UX-13 | Delete error | Retry | `Couldn't delete this job. Try again.` | — | — |
| UX-14 | Hero title | Placeholder | `Job title` | — | Unlabeled field; placeholder is the name |
| UX-15 | Revenue row | Label | `Revenue` | `$` prefix in field as today | — |
| UX-16 | Session | Start clock | `Start` | — | Always visible on session row |
| UX-17 | Material | Breakdown fields | `Qty`, `UOM`, `@ unit price` | — | Always visible on material row |
| UX-18 | Sessions | Add | `Add session` | — | — |
| UX-19 | Materials | Add | `Add material` | — | — |
| UX-20 | Other costs | Add | `Add other cost` | — | — |
| UX-21 | Notes | Add | `Add note` | — | — |
| UX-22 | Address row | Label | `Address` | — | — |
| UX-23 | Session duration chips | Shortcuts | `30m`, `1h`, `2h`, `4h`, `8h` | — | Picking a chip clears end clock only when start was set |
| UX-24 | Section titles | Sections | `Sessions`, `Materials`, `Other costs`, `Notes` | — | Heading |

- Canonical nouns: Job, Session, Material, Other cost, Note, Done, Back, Discard.
- Terms to avoid: Save changes, Close (on Edit chrome), Confirm no materials, Live Session (on this page), Google Calendar in UI copy.
- Error → recovery: UX-12 / UX-13 → user retries. Invalid row → stay; Done remains disabled until fixed.

## Analytics and observability

- Keep `job_edit_opened` (source `job_detail` or create `initialEditOpen` source already used).
- On successful Done: `job_saved` (extend `changed_fields` with child list keys when cheap: `sessions`, `materials`, `notes`, `otherCosts`).
- On RPC failure: `job_save_failed`.
- On confirmed delete: existing `job_deleted` / `job_delete_failed`.
- Do not add an event for every keystroke. Discard need not have a dedicated event.

## Verification obligations

- Copy exactness for UX-01, UX-02, UX-04..12, UX-18..21 (TEST-19).
- Keyboard + safe area + Dynamic Type (TEST-20).
- Swipe vs job dismiss (TEST-13, TEST-20).
- Duration-only View row has no clock range (TEST-10).
