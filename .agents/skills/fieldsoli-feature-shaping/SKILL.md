---
name: fieldsoli-feature-shaping
description: Shape a FieldSoli feature into an approved product spec, applicable state/data/UX/test contracts, and build plan while minimizing combined PM and agent elapsed time. Use when defining, scoping, or preparing a FieldSoli feature for implementation; do not use for ordinary bug fixes or an already-approved implementation task.
---

# FieldSoli Feature Shaping

## Outcome

Move one feature from an idea to **Ready for Implementation** in the least combined elapsed time across the PM and agent.

PM attention is not the scarce resource by default. Ask a quick question when the PM can answer from intent or preference faster than the agent can investigate or infer it. Ten seconds of PM input is better than two minutes of agent research. Optimize for:

1. shortest reliable time to a build-ready contract;
2. no consequential product decisions discovered during implementation; and
3. enough evidence to prevent avoidable rework.

Do not impose a question, decision, checkpoint, or review-time cap. More purposeful questions are preferable to slow research that spends many tokens, hidden assumptions, or a shorter but incomplete packet.

## Boundaries

- This skill shapes and plans work. It does not implement product code unless the user separately asks to begin implementation after readiness approval.
- Shape the feature the user brings into the conversation. Do not fetch, inspect, or update the FieldSoli roadmap unless the user explicitly asks.
- Do not treat an existing template, prototype workflow, or planning document as adopted process merely because it exists. Prefer artifacts the user says are current or that recent work demonstrably uses.
- Preserve the user's approved wording and decisions. If new evidence conflicts with an approval, surface the conflict instead of silently changing the contract.
- Follow `docs/product/brand-strategy.md` for product, UX, and copy direction. Current user instructions override the document when they conflict.
- Do not use `docs/product/current-product.html` as current-product evidence until its freshness has been checked against recent implementation and release history.
- Do not make production changes, deploy, purchase services, create external accounts, or send external communications while shaping.

## Source Order

Use the narrowest relevant sources in this order:

1. The user's current request and explicit approvals.
2. `docs/product/brand-strategy.md` for durable brand and experience direction.
3. Current behavior in the implementation, schemas, migrations, tests, fixtures, and release configuration.
4. Relevant prior feature contracts under `docs/specs/` and repository guidance such as `README.md`.
5. `docs/product/current-product.html` only after checking its embedded version/date and file history against relevant recent product and release changes. If it is stale or uncertain, use it only as a clue, label it as unverified, and prefer runtime evidence.
6. Current authoritative external sources when a platform, provider, legal, security, pricing, or policy fact could have changed.

Inspect only what the feature needs. Do not make the PM investigate code, runtime, policy, or provider facts that the agent can verify more quickly and reliably.

## Route Questions by Total Time

Before researching or inferring an unresolved point, compare the likely combined elapsed time of asking versus investigating.

Ask the PM immediately when:

- the answer is product intent, taste, priority, scope, or a preference already in the PM's head;
- a short answer is likely to take under a minute while agent research would take several minutes;
- the answer unlocks or eliminates a substantial branch of investigation; or
- a plausible inference could create product rework.

Investigate independently when:

- the answer depends on current code, schema, runtime behavior, tests, or release state;
- an external fact must be current and authoritative, including security, legal, provider, pricing, quota, or licensing constraints;
- the PM would have to perform the same research to answer; or
- one evidence pass resolves several decisions and is faster overall.

Use a reversible assumption only when it is both safe and faster than asking. A question does not need an agent recommendation when producing a responsible recommendation would take longer than receiving the PM's answer. Briefly explain why the answer is needed and make the response easy: yes/no, bounded choices, or a short free-text answer.

## Calibrate the Process

Classify the feature before shaping:

- **Small and reversible:** Produce a compact spec containing the outcome, requirements, non-goals, acceptance checks, contract-applicability manifest, and implementation outline. Inline a small applicable contract only when it remains unambiguous. Skip a separate decision packet when there are no consequential decisions.
- **Material or cross-cutting:** Use the full decision-packet, product spec, applicable contract artifacts, plan, and readiness workflow below. Separate contract files are the default.
- **Coupled foundation:** If the feature constrains known dependent features, first map the shared domain and lifecycle decisions. Customers, Estimates, Jobs, Invoices, and Payments are coupled until evidence shows otherwise.

Do not force large-feature ceremony onto a small change. Do not disguise an irreversible or cross-feature decision as an implementation detail to keep the packet short.

## Workflow

### 1. Frame the Outcome

Identify from the user's prompt and fast follow-up questions:

- the feature;
- the user or business outcome;
- why it matters now;
- known adjacent features it enables or constrains; and
- the smallest independently useful release.

Ask as many purposeful questions as needed. Start with the highest-leverage questions whose answers change the investigation path. Use a small batch when the questions are independent; ask sequentially when one answer determines the next question.

### 2. Investigate Independently

Trace the relevant current product flow, source code, data model, tests, and release boundaries. Identify existing patterns worth reusing and current behavior that must remain compatible.

For complex features, investigate in independent lanes where helpful:

- product and UX behavior;
- domain/data architecture;
- security, privacy, legal, and provider constraints;
- implementation and migration constraints; and
- verification and release risk.

Do not research PM preferences. Ask fast product questions as soon as they would save combined time, then investigate the objective facts needed to support the remaining decisions. Do not forward raw research or questions that repository evidence can answer faster.

### 3. Build the Decision Inventory

Read [references/decision-policy.md](references/decision-policy.md) before classifying decisions.

Classify each material decision as:

- **Ask PM now** — product intent or preference the PM can answer faster than the agent can responsibly infer.
- **Agent decides** — safe, reversible, evidence-backed, and faster for the agent to resolve.
- **Research, then recommend** — objective evidence is needed before a meaningful choice can be presented.
- **PM decides after evidence** — positioning, monetization, legal exposure, irreversible data semantics, major navigation, provider commitment, or a shared foundation that materially constrains later features.
- **Deferred** — intentionally outside the smallest useful release.

Resolve Agent-decides items before presenting the packet. Ask PM-now items without waiting for unrelated research. Include resolved implementation decisions as assumptions only when visibility would help review.

### 4. Resolve the Decision Packet

Read [references/deliverables.md](references/deliverables.md) and use its decision-packet format.

Requirements:

- Lead with the proposed product direction and smallest useful release.
- Include a recommendation when current evidence makes one cheap and useful; otherwise ask the bounded question directly.
- Explain the consequence of each consequential choice.
- Show alternatives only when they are genuinely viable.
- State downstream effects on known adjacent features.

There is no maximum number of PM decisions. Group questions by topic and dependency so they are quick to answer. If the list is long, use multiple short rounds when that shortens total time; do not silently decide, defer, or split scope merely to keep the packet small.

Do not write the final spec and contract set while consequential decisions remain unresolved.

### 5. Write the Product Spec and Contract Set

After the PM responds, incorporate the decisions and write the product spec using [references/deliverables.md](references/deliverables.md). Read [references/contract-artifacts.md](references/contract-artifacts.md) and create every applicable supporting contract.

For a small feature, use the existing `docs/specs/<feature-slug>.md` convention when the spec and any inlined contract remain readable. For a material or cross-cutting feature, use:

```text
docs/specs/<feature-slug>/
  spec.md
  state-model.md
  data-contract.md
  ux-contract.md
  test-contract.md
  plan.md
```

Create only applicable supporting files, but record every artifact as `Required`, `Inlined`, or `Not applicable` with a rationale in the spec's artifact manifest. Applicability is based on behavior and verification risk, not a desire to minimize file count:

- `state-model.md` for meaningful lifecycle, workflow, asynchronous, interruption, recovery, or status behavior;
- `data-contract.md` for persisted, derived, imported/exported, queued, provider, permissioned, or migrated data;
- `ux-contract.md` for any user-visible flow or interaction change; and
- a test contract for every implementation feature. Use separate `test-contract.md` for material or cross-cutting work, or whenever proof spans multiple test layers, environments, providers, devices, migrations, security boundaries, or release gates. A small low-risk feature may inline a compact test contract, but may not mark it `Not applicable`.

The spec and contracts together must distinguish:

- approved behavior;
- agent-decided implementation assumptions;
- non-goals;
- deferred work; and
- unresolved blockers.

Do not add speculative states, data, endpoints, or extensibility solely for a possible future feature. Preserve explicit seams required by dependent features the PM has identified.

Keep ownership clear:

- `spec.md` owns outcome, scope, product requirements, acceptance criteria, decisions, non-goals, and the artifact manifest;
- `state-model.md` owns states, events, guards, transitions, terminal behavior, interruption, retry, and recovery;
- `data-contract.md` owns data meaning, ownership, invariants, relationships, interfaces, authorization, migration, retention, and quota implications;
- `ux-contract.md` owns journeys, screen/surface behavior, interaction rules, exact user-visible copy, platform behavior, accessibility, and consumer-grade quality;
- `test-contract.md` owns quality risks, test scenarios, traceability, layers, fixtures, environments, automation/manual boundaries, and required evidence; and
- `plan.md` owns implementation order, file/system changes, migration mechanics, execution sequencing, and release sequencing.

Cross-reference instead of duplicating rules. If two artifacts disagree, the feature is not ready; resolve the conflict rather than inventing precedence.

### 6. Produce the Build Plan

Create the plan only after the spec and applicable contract artifacts are stable. The plan must include:

- the current-state implementation evidence;
- concrete files and systems expected to change;
- dependency-aware implementation order;
- migration and backward-compatibility strategy;
- implementation and evidence steps mapped to `TEST-*` scenarios;
- automated coverage and justified manual device, provider, or release checks;
- documentation and product-context closeout; and
- separate deployment, submission, processing, and public-release gates when relevant.

An implementation agent should be able to execute the plan without asking the PM routine technical questions.

For material features, use stable identifiers across the contracts, plan, and test traceability matrix, such as `REQ-*`, `STATE-*`, `DATA-*`, `UX-*`, and `TEST-*`. Every applicable product rule must map to an implementation step and `TEST-*` coverage or an explicit manual-evidence rationale; the plan must not introduce new product behavior or verification requirements.

For any new or expanded third-party dependency, document the current free-tier limits, expected usage, overage or upgrade trigger, lock-in, licensing, and a no-cost alternative when credible. Prefer staying within free tiers for as long as practical, even when that justifies modest additional engineering, but make the maintenance tradeoff visible.

For user-facing work, explicitly compare reuse of current components, platform/native primitives, reputable open-source libraries, and custom implementation when component quality is material. Consumer-grade UX, accessibility, field-speed simplicity, brand fit, maintenance burden, and free-tier or licensing impact are acceptance concerns—not post-build polish.

### 7. Run a Readiness Review

Review the supplied feature intent, spec, applicable contracts, plan, and test execution map together. Look specifically for:

- contradictory requirements;
- unhandled loading, empty, error, interruption, retry, and recovery behavior;
- unclear data ownership or lifecycle semantics;
- cross-feature constraints hidden inside local implementation choices;
- privacy, security, accessibility, analytics, or release gaps;
- free-tier quota, cost-escalation, licensing, or vendor-lock-in gaps;
- UI that is merely functional rather than consumer-grade, including weak loading, empty, error, motion, keyboard, safe-area, or platform behavior;
- requirements without verification;
- plan tasks without a corresponding requirement or contract rule;
- lifecycle states without data or UX representation where one is required;
- data states the lifecycle cannot produce or recover from;
- UX states without approved copy or recovery behavior;
- product, state, data, or UX rules without `TEST-*` coverage or justified manual evidence; and
- test cases that invent behavior absent from the product, state, data, or UX contracts.

Use an isolated read-only reviewer when the environment supports it and the user has authorized delegation. Otherwise perform a separate review pass without extending the design.

Do not label the feature Ready for Implementation while a consequential product decision or safety-critical unknown remains.

## Completion

End with:

- `Readiness: Ready for Implementation` or `Readiness: Blocked`;
- the exact artifact paths created or updated;
- the applicability status of `state-model.md`, `data-contract.md`, `ux-contract.md`, and `test-contract.md`;
- remaining PM decisions, if any;
- known deferred work;
- the verification expected before merge and before release; and
- the shaping-throughput metrics from [references/deliverables.md](references/deliverables.md).
