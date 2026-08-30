# FieldSoli Decision Policy

Use this policy to reduce owner questions without inventing product strategy.

If current user direction or current shipped-product evidence conflicts with this reference, follow the current evidence and call out the conflict.

## Durable Product Direction

- Preserve the exact product name **FieldSoli**.
- Design first for solo tradespeople using the product in interrupted, mobile, field conditions.
- Keep the job and its economics as the central record.
- Prefer fast capture followed by later refinement over forcing complete entry up front.
- Preserve trustworthy financial history and clear ownership of user data.
- Do not turn FieldSoli into heavy dispatch, crew-management, CRM, or accounting software by accident.
- Keep the free core useful; escalate decisions that change monetization boundaries.
- Prefer active product data and terminology over speculative concepts or dormant fields.
- Favor the smallest useful release and reversible choices, while preserving necessary seams for prioritized dependent features.
- Default development to local data and deliberate production changes; implementation plans must keep release gates distinct.

## Decision Authority

### Agent Decides

Decide without interrupting the owner when repository evidence supports a clear choice and the decision is reversible. Examples include:

- internal file organization and helper boundaries;
- reusing an established component or repository pattern;
- test placement and ordinary test-data construction;
- conventional retry, loading, or error mechanics that do not change approved copy or business semantics;
- implementation sequencing inside an approved contract; and
- technical naming that is not user-facing or externally persisted.

Record decisions that materially affect implementation, but do not ask for approval merely to transfer responsibility.

### Agent Recommends; Owner Approves

Provide a default and concise rationale for:

- ordinary user-flow choices with more than one credible option;
- whether information is required, optional, or captured later;
- user-visible empty, error, and recovery behavior;
- scope boundaries for the smallest useful release;
- migration behavior visible to existing users; and
- tradeoffs between field speed and richer record keeping.

### Owner Decides

Escalate:

- product positioning or a change to what FieldSoli fundamentally is;
- free versus paid capability boundaries, pricing, fees, or monetization;
- legal, tax, financial, or compliance claims;
- destructive or irreversible user-data semantics;
- canonical financial lifecycle meaning, such as what counts as invoiced, paid, refunded, or earned;
- provider commitments that create material cost, lock-in, or external operating obligations;
- major navigation or information-architecture changes;
- collection or sharing of new sensitive data; and
- shared domain choices that materially constrain multiple prioritized roadmap initiatives.

Do not escalate a question without a recommendation unless evidence is genuinely insufficient to form one.

### Deferred

Defer functionality when it is not required for the smallest useful release and adding it now would increase product, data, or operational complexity. State the seam that preserves future work only when the dependent roadmap item is already plausible and prioritized.

## Reversibility Test

Before escalating, ask:

1. Can this choice be changed later without migrating persisted user data?
2. Would changing it alter user expectations, legal obligations, or money movement?
3. Does it constrain another prioritized roadmap item?
4. Is there a current repository pattern that already answers it?

If the choice is reversible, internal, and pattern-backed, the agent should usually decide it.

## Coupled Commercial Workflow

Treat Customers, Estimates, Jobs, Invoices, and Payments as a connected domain during shaping.

For a feature in this chain, inspect at minimum:

- entity ownership and identity;
- lifecycle transitions and immutable history;
- relationships between records;
- conversion or derivation boundaries;
- amounts, adjustments, partial states, and deletion behavior;
- backward compatibility with existing jobs and payment status; and
- which future behavior is intentionally deferred.

Do not fully design every later feature. Do prevent the current feature from silently making a consequential downstream decision.

## Question Discipline

- Batch owner questions into one decision packet.
- Ask only after completing available repository and external research.
- Put the recommendation first.
- Explain the cost of the choice, not the history of the investigation.
- Avoid preference questions when existing FieldSoli principles already determine the answer.
- If the packet exceeds seven owner decisions, split the scope or resolve lower-risk choices independently.

