---
name: fieldsoli-feature-shaping
description: Shape a FieldSoli roadmap item into an approved decision packet, implementation contract, and build plan while minimizing owner attention. Use when selecting, defining, scoping, or preparing a FieldSoli feature for implementation; do not use for ordinary bug fixes or an already-approved implementation task.
---

# FieldSoli Feature Shaping

## Outcome

Move one roadmap item from an idea to **Ready for Implementation** with as little owner attention as practical.

Optimize for at most three owner checkpoints:

1. The owner selects the outcome or roadmap item.
2. The owner reviews one consolidated decision packet.
3. The owner approves the completed contract and plan.

Do not optimize for the shortest document. Optimize for fewer owner interruptions, fewer decisions discovered during implementation, and a contract that an implementation agent can execute without reconstructing product intent.

## Boundaries

- This skill shapes and plans work. It does not implement product code unless the user separately asks to begin implementation after readiness approval.
- Treat the [FieldSoli roadmap](https://docs.google.com/spreadsheets/d/1PAUmwmKZpo1RiDEYQnOE6cL0U62w_O9aooaywDr_Aig/edit?gid=0#gid=0) as the source of initiative status and priority. Read it when tools permit; otherwise ask for the selected row or use details the user supplied.
- Treat the roadmap as read-only unless the user explicitly asks to update it.
- Do not treat an existing template, prototype workflow, or planning document as adopted process merely because it exists. Prefer artifacts the user says are current or that recent work demonstrably uses.
- Preserve the user's approved wording and decisions. If new evidence conflicts with an approval, surface the conflict instead of silently changing the contract.
- Ask the owner only about decisions that cannot be resolved safely from product principles, repository evidence, authoritative research, or a clearly reversible default.
- Do not make production changes, deploy, purchase services, create external accounts, or send external communications while shaping.

## Source Order

Use the narrowest relevant sources in this order:

1. The user's current request and explicit approvals.
2. The selected roadmap row and its dependencies or rationale.
3. Current shipped behavior in `docs/product/current-product.html`, `README.md`, and the implementation.
4. Relevant schemas, migrations, tests, release configuration, and prior feature contracts under `docs/specs/`.
5. Current authoritative external sources when a platform, provider, legal, security, pricing, or policy fact could have changed.

Inspect only what the feature needs. Do not make the owner restate facts available in these sources.

## Calibrate the Process

Classify the feature before shaping:

- **Small and reversible:** Produce a compact brief containing the outcome, requirements, non-goals, acceptance checks, and implementation outline. Skip a separate decision packet when there are no consequential decisions.
- **Material or cross-cutting:** Use the full decision-packet, contract, plan, and readiness workflow below.
- **Coupled foundation:** If the feature constrains later roadmap items, first map the shared domain and lifecycle decisions. Customers, Estimates, Jobs, Invoices, and Payments are coupled until evidence shows otherwise.

Do not force large-feature ceremony onto a small change. Do not disguise an irreversible or cross-feature decision as an implementation detail to keep the packet short.

## Workflow

### 1. Frame the Outcome

Identify:

- the selected roadmap item;
- the user or business outcome;
- why it matters now;
- adjacent roadmap items it enables or constrains; and
- the smallest independently useful release.

If the desired outcome is genuinely unclear, ask one concise question. Otherwise begin discovery without a questionnaire.

### 2. Investigate Independently

Trace the relevant current product flow, source code, data model, tests, and release boundaries. Identify existing patterns worth reusing and current behavior that must remain compatible.

For complex features, investigate in independent lanes where helpful:

- product and UX behavior;
- domain/data architecture;
- security, privacy, legal, and provider constraints;
- implementation and migration constraints; and
- verification and release risk.

Synthesize the lanes before involving the owner. Do not forward raw research or a long list of unfiltered questions.

### 3. Build the Decision Inventory

Read [references/decision-policy.md](references/decision-policy.md) before classifying decisions.

Classify each material decision as:

- **Agent decides** — safe, reversible, and governed by existing evidence.
- **Agent recommends; owner approves** — meaningful product behavior with a strong recommended default.
- **Owner decides** — positioning, monetization, legal exposure, irreversible data semantics, major navigation, or a shared foundation that materially constrains later roadmap items.
- **Deferred** — intentionally outside the smallest useful release.

Resolve Agent-decides items before presenting the packet. Include them as assumptions only when visibility would help review.

### 4. Present One Decision Packet

Read [references/deliverables.md](references/deliverables.md) and use its decision-packet format.

Requirements:

- Lead with the proposed product direction and smallest useful release.
- Recommend one answer for every escalated decision.
- Explain the consequence of accepting the recommendation.
- Show alternatives only when they are genuinely viable.
- State downstream effects on roadmap items.
- Aim for no more than seven owner decisions and an estimated review time of fifteen minutes or less.

If more than seven consequential decisions remain, group them into a foundation decision followed by feature-level decisions, or split the feature into smaller releases. Do not drip questions across messages merely to stay below the limit.

Pause for the owner's consolidated response. Do not write the final contract while consequential decisions remain unresolved.

### 5. Write the Implementation Contract

After the owner responds, incorporate the decisions and write the contract using the format in [references/deliverables.md](references/deliverables.md).

Use the existing `docs/specs/<feature-slug>.md` convention when one file remains readable. For a complex feature that needs multiple maintained artifacts, use:

```text
docs/specs/<feature-slug>/
  spec.md
  plan.md
```

The contract must distinguish:

- approved behavior;
- agent-decided implementation assumptions;
- non-goals;
- deferred work; and
- unresolved blockers.

Do not add speculative states, data, endpoints, or extensibility solely for a possible future feature. Preserve explicit seams required by already-prioritized dependent roadmap items.

### 6. Produce the Build Plan

Create the plan only after the product contract is stable. The plan must include:

- the current-state implementation evidence;
- concrete files and systems expected to change;
- dependency-aware implementation order;
- migration and backward-compatibility strategy;
- automated test coverage mapped to requirements;
- manual device, provider, or release checks;
- documentation and product-context closeout; and
- separate deployment, submission, processing, and public-release gates when relevant.

An implementation agent should be able to execute the plan without asking the owner routine technical questions.

### 7. Run a Readiness Review

Review the roadmap intent, contract, plan, and verification matrix together. Look specifically for:

- contradictory requirements;
- unhandled loading, empty, error, interruption, retry, and recovery behavior;
- unclear data ownership or lifecycle semantics;
- cross-feature constraints hidden inside local implementation choices;
- privacy, security, accessibility, analytics, or release gaps;
- requirements without verification; and
- plan tasks without a corresponding requirement.

Use an isolated read-only reviewer when the environment supports it and the user has authorized delegation. Otherwise perform a separate review pass without extending the design.

Do not label the feature Ready for Implementation while a consequential product decision or safety-critical unknown remains.

## Completion

End with:

- `Readiness: Ready for Implementation` or `Readiness: Blocked`;
- the exact artifact paths created or updated;
- remaining owner decisions, if any;
- known deferred work;
- the verification expected before merge and before release; and
- the shaping-efficiency metrics from [references/deliverables.md](references/deliverables.md).

