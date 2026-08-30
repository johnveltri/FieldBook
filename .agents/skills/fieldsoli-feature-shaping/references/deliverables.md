# Feature-Shaping Deliverables

Use these structures as concise contracts, not as fill-in-the-blank bureaucracy. Omit sections that genuinely do not apply, but preserve explicit non-goals, verification, and unresolved blockers.

## Decision Packet

Present the packet in the conversation before writing the final contract.

```markdown
# <Feature> Decision Packet

## Proposed direction

<One short description of the user outcome and smallest useful release.>

## Why now

<Roadmap rationale, dependencies, and what this enables.>

## Evidence considered

- <Current product/code/data evidence>
- <Relevant prior contract or decision>
- <Authoritative external constraint, if any>

## Decisions for owner

| # | Decision | Recommendation | Consequence | Viable alternative | Downstream effect |
|---:|---|---|---|---|---|
| 1 | ... | ... | ... | ... | ... |

## Decisions resolved by agent

- <Decision and evidence-backed default>

## Deferred

- <Explicitly excluded behavior and why it can wait>

## Risks or unknowns

- <Only unresolved material risks>

Estimated owner review time: <N> minutes
```

Prefer yes/no or bounded-choice approvals. The owner must always be able to replace the recommendation with a different direction.

## Implementation Contract

```markdown
# <Feature>

**Status:** Draft | Approved implementation contract
**Roadmap item:** <name and link>
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

## Accessibility and platform behavior

- Relevant screen-size, input, keyboard, assistive-technology, and platform requirements

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

- <Current-product, legal, store, analytics, support, or maintained-design updates actually required>
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

### Owner attention
- Owner checkpoints used: N
- Decisions escalated to owner: N
- Material decisions resolved independently: N
- Estimated owner review time: N minutes
- Actual active owner time: Unknown unless the owner provides it

### Artifacts
- <path>
```

The owner-attention section is a process metric, not a performance claim. Never invent actual elapsed or active time.
