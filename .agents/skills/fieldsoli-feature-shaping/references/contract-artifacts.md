# FieldSoli Contract Artifacts

Use these contracts to make implementation-critical behavior explicit without duplicating the product spec. A contract is required when its subject changes; do not create an empty file solely to complete the directory.

## Shared Rules

- The product spec declares each artifact `Required`, `Inlined`, or `Not applicable`, with a one-sentence rationale.
- Separate files are the default for material and cross-cutting features. Inline only a genuinely small contract that remains easy to review and reference.
- For material features, give enforceable rules stable identifiers: `STATE-*`, `DATA-*`, `UX-*`, and `TEST-*`. Use those identifiers across the plan and test traceability matrix.
- A test contract is always required. It may be inlined for a small low-risk feature, but it is never `Not applicable`.
- Record observable behavior and durable semantics, not speculative implementation code.
- Link to the owning rule instead of copying it. If a summary is useful, label it as a summary and keep one authoritative location.
- Mark an unresolved rule as a blocker. Do not fill gaps with an implementation-time guess.

## State Model

Create `state-model.md` when the feature introduces or changes meaningful domain status, multi-step workflow, asynchronous processing, interruption, retry, recovery, or terminal behavior.

Keep domain/process states separate from transient presentation states. The UX contract may describe `loading` or `saving`; the state model should include them only when they affect durable behavior, legal transitions, recovery, or user expectations.

```markdown
# <Feature> State Model

## Scope

- Modeled entity or process: ...
- Source of truth for current state: ...
- Persisted states: ...
- Derived states: ...

## State definitions

| ID | State | Meaning | Persisted or derived | Entry condition | Exit condition | Terminal? |
|---|---|---|---|---|---|---|
| STATE-01 | ... | ... | ... | ... | ... | Yes/No |

## Events

| Event | Initiator | Preconditions | Payload or evidence | Idempotency rule |
|---|---|---|---|---|
| ... | User/System/Provider | ... | ... | ... |

## Transitions

| From | Event | Guard | To | Side effects | Failure result |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## Invalid, duplicate, and concurrent events

- <Events that must be rejected, ignored, deduplicated, or serialized>

## Interruption, retry, and recovery

- App termination or navigation away: ...
- Network loss or timeout: ...
- Retry ownership and limits: ...
- Stale or partially completed work: ...
- Reconciliation after conflicting local/provider state: ...

## Invariants

- <Rule that must hold across every transition>

## Verification obligations

- <Transition, invariant, race, retry, or recovery case that must be proven>
```

A diagram may supplement the tables when it makes branching or concurrency clearer, but it does not replace exact transitions and guards.

## Data Contract

Create `data-contract.md` when the feature reads or changes persisted, derived, imported, exported, queued, permissioned, provider-owned, or migrated data.

```markdown
# <Feature> Data Contract

## Scope and terminology

- Canonical business terms: ...
- Existing source of truth: ...
- New or changed data boundaries: ...

## Entities and ownership

| Entity | Meaning | Owner/tenant | Source of truth | Retention/deletion |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## Fields

| ID | Entity.field | Type/format | Required/default | Meaning and validation | Source | Sensitive? |
|---|---|---|---|---|---|---|
| DATA-01 | ... | ... | ... | ... | User/System/Derived/Provider | Yes/No |

## Relationships and lifecycle effects

| Relationship | Cardinality | Creation rule | Update rule | Delete/archive behavior |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## Invariants and calculations

- <Uniqueness, ownership, totals, rounding, time-zone, ordering, or derived-value rule>

## Interfaces

| Interface | Direction | Request/event/file shape | Response/result | Auth | Idempotency/versioning |
|---|---|---|---|---|---|
| API/RPC/Queue/File/Provider | ... | ... | ... | ... | ... |

## Authorization, privacy, and retention

- Authentication and ownership boundary: ...
- RLS/service-role or server-only behavior: ...
- Sensitive fields, logs, analytics, and redaction: ...
- Export, deletion, and retention obligations: ...

## Migration and compatibility

- Existing-row behavior and defaults: ...
- Backfill or lazy migration: ...
- Old-client compatibility: ...
- Rollback or forward-fix boundary: ...

## Cost and quota envelope

- Free-tier resources consumed: ...
- Expected usage and assumptions: ...
- Limit/upgrade trigger and degradation behavior: ...
- Lock-in, licensing, and migration considerations: ...

## Verification obligations

- <Schema, constraint, RLS, interface, migration, calculation, quota, or compatibility case>
```

Use real product terminology and active data. A data contract may reference planned tables or endpoints, but must define semantics independently of one implementation when a business rule is involved.

## UX Contract

Create `ux-contract.md` for every feature that changes a user-visible flow, surface, interaction, or feedback state.

The UX contract owns user-visible behavior and exact wording. Reference `STATE-*` entries for durable lifecycle state and keep copy attached to the surface and condition where it appears.

```markdown
# <Feature> UX Contract

## User and context

- Primary user and job to be done: ...
- Field context, interruption risk, and speed target: ...
- Entry points and prerequisites: ...
- Successful exit and return destination: ...

## Primary journey

| Step | Surface | User action | System response | Next state/surface |
|---:|---|---|---|---|
| 1 | ... | ... | ... | ... |

## Surface-state matrix

| Surface | Loading | Empty | Ready | Saving/processing | Success | Error/retry | Offline/interrupted |
|---|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... | ... |

## Interaction rules

- Primary and secondary actions: ...
- Validation timing and disabled states: ...
- Back, dismiss, cancel, and unsaved-change behavior: ...
- Destructive actions, confirmation, and undo: ...
- Repeated taps, duplicate submission, and optimistic behavior: ...
- Keyboard, focus, scrolling, sheets, and touch-through: ...

## Navigation and continuity

- Deep links or alternate entry: ...
- App backgrounding, termination, and restoration: ...
- Cross-device or stale-data behavior: ...

## Responsive and platform behavior

- Phone, tablet, portrait, landscape, and constrained layouts: ...
- Safe areas, keyboard, system Back, and platform conventions: ...
- Reduced motion and motion/feedback purpose: ...

## Accessibility

- Reading/focus order and screen-reader behavior: ...
- Labels, roles, state announcements, and dynamic updates: ...
- Touch targets, contrast, text scaling, and non-color cues: ...

## Visual and component quality

- Relevant brand pillars and intended feel: ...
- Existing design-system components assessed: ...
- Native primitive, external library, or custom alternatives considered: ...
- Selected approach and consumer-grade quality bar: ...
- Loading, transition, feedback, and motion polish required: ...

## Content and copy

| ID | Surface/state | Purpose | Exact text | Variables/fallback | Accessibility or truncation note |
|---|---|---|---|---|---|
| UX-... | ... | ... | “...” | ... | ... |

- Canonical nouns and verbs: ...
- Terms to avoid: ...
- Error condition to recovery-action mapping: ...
- Notification, email, share, generated-file, or export wording: ...

## Analytics and observability

- User outcomes or failures that must be observable: ...
- Events intentionally omitted: ...

## Verification obligations

- <Device, viewport, accessibility, interruption, recovery, visual, or interaction case>
```

Do not accept “match the existing component” as sufficient when the feature exposes a known quality weakness. State the interaction and finish expected.

Preserve PM-approved wording exactly. Never expose stack traces, provider internals, secrets, or sensitive data through user-visible errors.

## Test Contract

Create `test-contract.md` for every material or cross-cutting feature and whenever proof spans multiple layers, environments, providers, devices, migrations, security boundaries, or release gates. A small low-risk feature may inline this contract when a short traceability matrix fully describes the required proof.

The test contract defines what evidence is required for confidence. It consumes product, state, data, and UX rules; it must not invent behavior or implementation scope.

```markdown
# <Feature> Test Contract

## Quality objective and risk inventory

| Risk | Impact | Likelihood | Required proof |
|---|---|---|---|
| ... | High/Medium/Low | High/Medium/Low | ... |

## Traceability matrix

| ID | Source rules | Scenario | Expected result | Layer | Automated or manual | Environment |
|---|---|---|---|---|---|---|
| TEST-01 | REQ-*, STATE-*, DATA-*, UX-* | ... | ... | Unit/Component/DB/Integration/E2E/Manual | ... | ... |

## Test layers and boundaries

- Unit responsibilities and exclusions: ...
- Component responsibilities and exclusions: ...
- Database/RLS responsibilities and exclusions: ...
- Integration/provider responsibilities and exclusions: ...
- End-to-end responsibilities and exclusions: ...
- Manual/device/release responsibilities and why they are not automated: ...

## Fixtures and test data

- Deterministic seed or fixture source: ...
- Ownership/tenant isolation cases: ...
- Boundary, empty, legacy, malformed, and maximum-size data: ...
- Sensitive-data handling and cleanup: ...

## Lifecycle, failure, and concurrency coverage

- Every legal and illegal state transition: ...
- Retry, timeout, duplicate, idempotency, race, and stale-state cases: ...
- App interruption, process restart, and reconciliation cases: ...
- Partial failure and recovery evidence: ...

## Data, security, and migration coverage

- Schema constraints, calculations, and invariants: ...
- RLS, service-role, cross-tenant, and unauthorized access: ...
- Migration, existing-row, old-client, and forward-fix behavior: ...
- Export, retention, deletion, logging, and privacy boundaries: ...

## UX and accessibility coverage

- Loading, empty, ready, success, error, offline, interruption, and recovery states: ...
- Exact critical copy, variables, truncation, and fallback behavior: ...
- Keyboard, safe area, orientation, screen size, touch, focus, and system Back: ...
- Screen reader, text scaling, reduced motion, contrast, and non-color cues: ...
- Required device/OS matrix and visual evidence: ...

## External dependencies and environments

- Local, mocked, sandbox, preview, or production-safe environment per test: ...
- Provider failure simulation and webhook/event fixtures: ...
- Free-tier quota or resource-envelope checks: ...
- Secrets, accounts, clocks, network, and nondeterminism controls: ...

## Release gates and evidence

| Gate | Required checks | Evidence | Blocking failure |
|---|---|---|---|
| Before merge / Before deployment / Before submission / Before public release | ... | Command, report, screenshot, provider receipt, or manual record | ... |

## Deferred or intentionally untested

- <Scenario, rationale, risk accepted, and approving decision>
```

Prefer the cheapest reliable test layer. Do not use broad end-to-end tests when a lower layer proves the rule, but do not substitute mocks for a provider, database, platform, or release boundary whose real behavior is the risk. Manual checks require a stated reason and expected evidence.

## Cross-Artifact Review

Before planning, confirm:

- every product requirement in the product spec is implemented by at least one applicable contract or explicitly needs no supporting contract;
- every state transition has compatible data semantics and a user experience when user-visible;
- every persisted status is reachable, distinguishable, authorized, and recoverable as specified;
- every UX state has defined content, error/retry behavior, and an available recovery action where applicable;
- every `REQ-*`, `STATE-*`, `DATA-*`, and `UX-*` rule maps to `TEST-*` coverage or an explicit manual-evidence rationale;
- every `TEST-*` scenario traces back to an owning product or supporting-contract rule;
- real provider, database, device, security, migration, and release boundaries are exercised wherever mocking would hide the material risk; and
- no supporting contract expands scope beyond the product spec.
