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

## Product Spec

```markdown
# <Feature>

**Status:** Draft | Approved product spec
**Feature source:** <user-supplied name or brief>
**Last updated:** YYYY-MM-DD

## Outcome

<User and business outcome.>

## Approved decisions

- <Decision and resulting rule>

## Scope

- Smallest useful release: ...
- Users and surfaces included: ...
- Known dependent features or constraints: ...

## Product requirements

| ID | Requirement | Acceptance evidence |
|---|---|---|
| REQ-01 | ... | ... |

## Artifact manifest

| Artifact | Applicability | Path or inline section | Rationale |
|---|---|---|---|
| State model | Required / Inlined / Not applicable | ... | ... |
| Data contract | Required / Inlined / Not applicable | ... | ... |
| UX contract | Required / Inlined / Not applicable | ... | ... |
| Text contract | Required / Inlined / Not applicable | ... | ... |

## Product constraints

- Brand and field-speed constraints: ...
- Security, privacy, legal, or financial constraints: ...
- Free-tier and dependency constraints: ...
- Compatibility and release constraints: ...

## Acceptance scenarios

- Given ..., when ..., then ...

## Agent-decided assumptions

- <Reversible implementation assumption and evidence>

## Non-goals

- <Explicit exclusions>

## Deferred work

- <Later behavior and preserved seam, if any>

## Open blockers

- None, or the exact unresolved blocker
```

Use exact approved copy when the contract contains user-facing language. Avoid vague requirements such as “handle errors gracefully.”

The spec owns product scope and requirements; it does not replace the applicable supporting contracts. Read [contract-artifacts.md](contract-artifacts.md) for their applicability tests, ownership, and templates.

## Build Plan

For a one-file feature spec, save this beside it as `<feature-slug>.plan.md`. For a feature directory, use `plan.md`.

```markdown
# <Feature> Build Plan

## Readiness basis

- Approved product spec: <path>
- State model: <path, inlined, or not applicable>
- Data contract: <path, inlined, or not applicable>
- UX contract: <path, inlined, or not applicable>
- Text contract: <path, inlined, or not applicable>
- Source revision reviewed: <commit>
- Remaining blockers: None | <list>

## Current-state findings

- <Relevant implementation, schema, test, and release facts with paths>

## Change map

| Area | Expected files/systems | Requirement or contract rule |
|---|---|---|
| ... | ... | REQ-*, STATE-*, DATA-*, UX-*, TXT-* |

## Implementation sequence

1. <Small dependency-aware step>
   - Files/systems
   - Behavior produced
   - Verification

## Migration and compatibility

- <Additive rollout, backfill, old-client compatibility, rollback/forward-fix approach>

## Verification matrix

| Requirement or contract rule | Test layer | Planned evidence |
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
- Product requirements with planned verification: N/N
- State rules with planned verification: N/N or N/A
- Data rules with planned verification: N/N or N/A
- UX rules with planned verification: N/N or N/A
- Text rules with planned verification: N/N or N/A
- Unresolved PM decisions: N
- Unresolved technical blockers: N

### Cross-artifact review
- Contradictions: None | <list>
- Unplanned requirements or contract rules: None | <list>
- Plan tasks without requirements or contract rules: None | <list>
- Missing or unjustified contract artifacts: None | <list>
- State/data/UX/text mismatches: None | <list>

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
