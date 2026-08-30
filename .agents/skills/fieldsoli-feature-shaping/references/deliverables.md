# Feature-Shaping Deliverables

Use these structures as concise contracts, not as fill-in-the-blank bureaucracy. Omit sections that genuinely do not apply, but preserve explicit non-goals, verification, and unresolved blockers.

## Decision Packet

Present the packet in the conversation before writing the final contract.

```markdown
# <Feature> Decision Packet

## Proposed direction

<One short description of the user outcome and smallest useful release.>

## Why now

<Rationale, known dependencies, and what this enables.>

## Evidence considered

- <Current product/code/data evidence>
- <Relevant prior contract or decision>
- <Authoritative external constraint, if any>
- <Freshness status of current-product.html if it was used>

## Questions for PM

| # | Question | Why it matters | Options or short-answer prompt | Recommendation, if useful | Consequence |
|---:|---|---|---|---|---|
| 1 | ... | ... | ... | ... | ... |

## Decisions resolved by agent

- <Decision and evidence-backed default>

## Deferred

- <Explicitly excluded behavior and why it can wait>

## Risks or unknowns

- <Only unresolved material risks>

Fastest response format: <for example, "1A, 2 yes, 3 free text">
```

Prefer yes/no, bounded choices, or short free-text answers. There is no decision-count cap. Group questions by topic and dependency, and omit a recommendation when obtaining the PM's direct answer is faster than researching one. The PM must always be able to replace a recommendation with a different direction.

## Implementation Contract

```markdown
# <Feature>

**Status:** Draft | Approved implementation contract
**Feature source:** <user-supplied name or brief>
**Last updated:** YYYY-MM-DD

## Outcome

<User and business outcome.>

## Approved decisions

- <Decision and resulting rule>

## Product behavior

### Entry points
### Primary flow
### Loading and interruption
### Empty states
### Errors, retry, and recovery
### Completion and return behavior

## Data and lifecycle contract

- Ownership
- Relationships
- State transitions
- Deletion, archival, and historical behavior
- Migration and backward compatibility

## Security, privacy, and analytics

- Authorization boundary
- Sensitive data and retention
- Analytics events or explicit absence
- Provider or legal implications

## Cost and dependency contract

- Current free-tier limits and expected usage
- Upgrade or limit trigger
- Licensing, lock-in, and migration considerations
- Additional engineering or operations accepted to extend free-tier runway

## Consumer-grade UX, accessibility, and platform behavior

- Brand-strategy fit and field-speed behavior
- Visual and interaction quality bar
- Loading, empty, error, offline, retry, interruption, and completion feedback
- Relevant screen-size, input, keyboard, safe-area, orientation, assistive-technology, motion, and platform requirements
- Component approach: current design system, native primitive, external library, or custom implementation

## Verification contract

- Automated requirements and test layer
- Manual device or provider checks
- Release-specific checks

## Non-goals

- <Explicit exclusions>

## Deferred work

- <Later behavior and preserved seam, if any>

## Open blockers

- None, or the exact unresolved blocker
```

Use exact approved copy when the contract contains user-facing language. Avoid vague requirements such as “handle errors gracefully.”

## Build Plan

For a one-file feature contract, save this beside it as `<feature-slug>.plan.md`. For a feature directory, use `plan.md`.

```markdown
# <Feature> Build Plan

## Readiness basis

- Approved contract: <path>
- Source revision reviewed: <commit>
- Remaining blockers: None | <list>

## Current-state findings

- <Relevant implementation, schema, test, and release facts with paths>

## Change map

| Area | Expected files/systems | Contract requirement |
|---|---|---|
| ... | ... | ... |

## Implementation sequence

1. <Small dependency-aware step>
   - Files/systems
   - Behavior produced
   - Verification

## Migration and compatibility

- <Additive rollout, backfill, old-client compatibility, rollback/forward-fix approach>

## Verification matrix

| Requirement | Test layer | Planned evidence |
|---|---|---|
| ... | Unit, component, database, integration, E2E, or manual | ... |

## Release sequence

- Database
- Functions/providers
- Website
- Mobile build
- Submission and platform processing
- Public release

Include only applicable gates and keep them independently verifiable.

## Product-context closeout

- <Brand strategy, current-product, legal, store, analytics, support, or maintained-design updates actually required>
```

Do not turn the plan into speculative code. It should communicate exact change boundaries, order, and proof.

## Readiness Report

```markdown
## Readiness

**Verdict:** Ready for Implementation | Blocked

### Contract coverage
- Requirements with planned verification: N/N
- Unresolved owner decisions: N
- Unresolved technical blockers: N

### Cross-artifact review
- Contradictions: None | <list>
- Unplanned requirements: None | <list>
- Plan tasks without requirements: None | <list>

### Shaping throughput
- PM questions asked: N
- PM-agent decision rounds: N
- Fast PM answers used instead of agent research: N
- Material decisions resolved independently: N
- Consequential decisions reopened after approval: N
- Total elapsed shaping time: <measured value or Unknown>
- Active PM time: <measured or PM-provided value, otherwise Unknown>
- Active agent investigation time: <measured value or Unknown>

### Artifacts
- <path>
```

The throughput section measures the optimization target; it is not a performance claim. Never invent elapsed, active, or time-saved values. The quality guardrail is zero consequential product decisions discovered during implementation, not a low question count.
