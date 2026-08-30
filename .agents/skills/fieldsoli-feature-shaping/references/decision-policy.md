# FieldSoli Decision Policy

Use this policy to minimize combined PM and agent elapsed time without inventing product strategy.

If current user direction or current shipped-product evidence conflicts with this reference, follow the current evidence and call out the conflict.

## Durable Product Direction

- Preserve the exact product name **FieldSoli**.
- Design first for solo tradespeople using the product in interrupted, mobile, field conditions.
- Keep the job and its economics as the central record.
- Prefer fast capture followed by later refinement over forcing complete entry up front.
- Preserve trustworthy financial history and clear ownership of user data.
- Do not turn FieldSoli into heavy dispatch, crew-management, CRM, or accounting software by accident.
- Keep the free core useful; escalate decisions that change monetization boundaries.
- Prefer architectures and dependencies that remain within free tiers for as long as practical. Modest additional engineering is acceptable when it materially extends free-tier runway without compromising reliability, privacy, or maintainability.
- Hold user-facing work to the brand promise of field-speed simplicity and a clear, modern, consumer-grade experience. Existing components are evidence, not an automatic quality bar.
- Prefer active product data and terminology over speculative concepts or dormant fields.
- Favor the smallest useful release and reversible choices, while preserving necessary seams for dependent features the PM has identified.
- Default development to local data and deliberate production changes; implementation plans must keep release gates distinct.

Read `docs/product/brand-strategy.md` before making material product, UX, or copy recommendations. Current PM direction wins if it conflicts with that document.

## Time-First Question Routing

The fastest responsible source should answer each question:

- Ask the PM now for intent, taste, priority, scope, and preferences already in their head.
- Let the agent inspect code, schema, tests, runtime state, provider documentation, pricing, quotas, licensing, security, and legal constraints.
- If a PM answer likely takes seconds and agent inference takes minutes, ask—even when the choice is reversible.
- If the PM would need to research the answer too, the agent researches it and returns the useful conclusion.
- Ask early when an answer can eliminate a branch of work. Do not complete avoidable research merely to present a recommendation.

## Decision Authority

### Agent Decides

Decide when repository evidence supports a clear choice, the decision is reversible, and agent resolution is faster than PM review. Examples include:

- internal file organization and helper boundaries;
- reusing an established component or repository pattern;
- test placement and ordinary test-data construction;
- conventional retry, loading, or error mechanics that do not change approved copy or business semantics;
- implementation sequencing inside an approved contract; and
- technical naming that is not user-facing or externally persisted.

Record decisions that materially affect implementation. Do not ask merely to transfer responsibility, but do ask when a quick PM answer is the faster route.

### Research, Then Recommend

Research objective evidence and provide a default with concise rationale when the evidence materially improves the choice. Typical cases include:

- ordinary user-flow choices with more than one credible option;
- whether information is required, optional, or captured later;
- user-visible empty, error, and recovery behavior;
- scope boundaries for the smallest useful release;
- migration behavior visible to existing users; and
- tradeoffs between field speed and richer record keeping.

### PM Decides

Escalate:

- product positioning or a change to what FieldSoli fundamentally is;
- free versus paid capability boundaries, pricing, fees, or monetization;
- legal, tax, financial, or compliance claims;
- destructive or irreversible user-data semantics;
- canonical financial lifecycle meaning, such as what counts as invoiced, paid, refunded, or earned;
- provider commitments that create material cost, lock-in, or external operating obligations;
- any move from a free tier to a paid tier or dependency whose likely usage will require payment;
- major navigation or information-architecture changes;
- collection or sharing of new sensitive data; and
- shared domain choices that materially constrain multiple known features.

Recommendations are helpful, not mandatory. Ask a bounded question without one when the answer is primarily PM intent or forming a responsible recommendation would take longer than getting the answer.

### Deferred

Defer functionality when it is not required for the smallest useful release and adding it now would increase product, data, or operational complexity. State the seam that preserves future work only when the PM has identified a plausible dependent feature.

## Reversibility Test

Before escalating, ask:

1. Can this choice be changed later without migrating persisted user data?
2. Would changing it alter user expectations, legal obligations, or money movement?
3. Does it constrain another known dependent feature?
4. Is there a current repository pattern that already answers it?
5. Can the PM answer from intent materially faster than the agent can infer it?

If the choice is reversible, internal, pattern-backed, and faster for the agent to resolve, the agent should usually decide it. Otherwise use the time-first routing policy.

## Free-Tier-First Architecture

For Supabase and every new or expanded third-party dependency:

- verify current limits and pricing from authoritative sources when the decision depends on them;
- estimate which quotas the feature consumes, such as database size, egress, storage, function execution, auth, email, realtime, or scheduled work;
- identify the expected upgrade trigger and the behavior when a limit is approached;
- prefer a credible free or open-source option when quality and operational risk remain acceptable;
- disclose extra code, monitoring, maintenance, or migration cost introduced to stay free; and
- escalate paid-tier commitments, material lock-in, or ongoing operating obligations to the PM.

Free-tier longevity does not justify unsafe security, unreliable data handling, inaccessible UX, or brittle complexity whose maintenance cost exceeds the savings.

## Consumer-Grade UX Gate

Do not assume an existing FieldSoli component is polished enough because it already exists. For material user-facing interactions, evaluate:

- clarity, hierarchy, visual finish, and brand fit;
- speed in interrupted mobile field use;
- loading, empty, error, offline, retry, interruption, and recovery behavior;
- keyboard, safe-area, orientation, responsive, touch-target, and platform-native behavior;
- accessibility, reduced motion, and assistive technology;
- animation and feedback where they improve comprehension; and
- cross-platform consistency without suppressing useful native conventions.

When component quality matters, compare current design-system reuse, native/platform primitives, a reputable library, and custom implementation. Consider accessibility, visual quality, bundle impact, maintenance activity, licensing, free availability, and consistency with the rest of FieldSoli. Ask the PM a fast taste or interaction question when it is quicker than exploring alternatives; prototype or research only when it reduces combined time or supplies evidence the PM cannot provide directly.

## Coupled Commercial Workflow

Treat Customers, Estimates, Jobs, Invoices, and Payments as a connected domain during shaping when the supplied feature touches that chain.

For a feature in this chain, inspect at minimum:

- entity ownership and identity;
- lifecycle transitions and immutable history;
- relationships between records;
- conversion or derivation boundaries;
- amounts, adjustments, partial states, and deletion behavior;
- backward compatibility with existing jobs and payment status; and
- which future behavior is intentionally deferred.

Do not inspect the roadmap or fully design every later feature. Do prevent the current feature from silently making a consequential downstream decision already identified by the PM or repository evidence.

## Question Discipline

- Ask high-leverage PM questions before avoidable research.
- Use small batches for independent questions and sequential questions when one answer changes the next.
- Prefer yes/no, bounded choices, or short free-text prompts.
- Include a recommendation first when one is already supported or quick to form.
- Explain why the answer matters and the cost of the choice, not the history of the investigation.
- Ask rather than infer when a preference is not actually settled by current PM direction or FieldSoli principles.
- Do not cap question count. Group questions for fast comprehension, and never hide a consequential choice to make the packet shorter.
