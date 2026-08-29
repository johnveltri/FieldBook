# Estimated Tax Set-Aside

**Status:** Draft for review

**Version:** V1 proposal

**Last updated:** 2026-08-23

**Planning source:** [CSV Product Requirements Planning](chatgpt-conversation://6a7e4870-6908-83ea-906a-d191af6e810d)

## Summary

FieldSoli should let a solo contractor choose an estimated percentage of positive earnings after direct costs to reserve for taxes. When enabled, the Earnings experience adds two clearly labeled planning values:

- **Estimated tax set-aside**
- **Estimated take-home**

The set-aside is a user-controlled planning assumption. It is not a direct job cost, tax withholding, tax liability, tax payment, or accounting transaction. It does not change FieldSoli's existing revenue, cost, or earnings calculations.

This capability is independent of the Job Summary CSV Export. The rate and calculated estimates are not included in that CSV because they are derived planning assumptions rather than source business records.

## User value

Solo contractors often need a practical answer to a question that job earnings alone do not answer:

> How much of these earnings should I treat as available to spend?

The feature helps a user reserve part of positive earnings without claiming to calculate their real tax obligation.

## Goals

- Let the user choose their own estimated set-aside percentage.
- Keep direct costs and earnings after direct costs economically precise and unchanged.
- Show the set-aside as a separate layer below earnings.
- Show an estimated take-home value after the set-aside.
- Use clear language that distinguishes an estimate from withholding or tax owed.
- Work consistently for a single job and for aggregate Earnings reporting windows.

## Non-goals

V1 does not:

- recommend a tax rate;
- calculate federal, state, local, payroll, self-employment, or sales tax;
- account for deductions, credits, filing status, other income, loss carryovers, or quarterly payment history;
- make estimated tax payments;
- track money in a bank account or reserve account;
- treat the set-aside as a deductible job cost;
- change the meaning of earnings after direct costs;
- include the estimate in the Job Summary CSV;
- provide tax advice, tax filing, or a tax-liability guarantee; or
- support different rates by job, customer, trade, jurisdiction, or year.

## Terminology

Use **Estimated tax set-aside**, not **tax withholding**.

“Withholding” usually describes money another party removes from a payment before the worker receives it. FieldSoli is instead helping a self-employed user plan how much of received earnings to reserve.

Use **Estimated take-home** for the downstream value. Do not label it net income, profit, after-tax income, disposable income, or tax-adjusted earnings.

## Setting

### Placement

Recommended V1 placement:

1. The user opens **Profile**.
2. The user opens a new **Business settings** screen.
3. The user opens **Estimated tax set-aside**.

The setting belongs with business and earnings preferences, not with direct job costs or CSV export controls.

### Default

- The feature defaults to unset/off for all new and existing users.
- FieldSoli must not preselect or recommend a percentage.
- An unset setting hides the set-aside and estimated take-home metrics.
- A saved value of `0%` is allowed and remains visibly enabled so it is distinguishable from unset.

### Input rules

- Accept values from `0%` through `100%`, inclusive.
- Support at least one decimal place, for example `27.5%`.
- Trim whitespace and reject non-numeric, negative, over-100, NaN, and infinite values.
- Do not silently clamp an invalid value.
- Let the user turn the feature off without deleting or modifying job data.

Recommended helper copy:

> Set aside a percentage of earnings after direct costs. This is an estimate, not tax advice.

Recommended validation copy:

> Enter a percentage from 0 to 100.

## Calculations

### Single job

```text
earnings_after_direct_costs = revenue - total_direct_costs
estimated_tax_set_aside = max(earnings_after_direct_costs, 0) × set_aside_rate
estimated_take_home = earnings_after_direct_costs - estimated_tax_set_aside
```

Example with a 30% set-aside:

```text
Revenue                              $500.00
Direct costs                        -$100.00
Earnings after direct costs          $400.00
Estimated tax set-aside (30%)       -$120.00
Estimated take-home                  $280.00
```

### Aggregate Earnings window

Apply the rate to aggregate earnings for the selected reporting window:

```text
aggregate_earnings_after_direct_costs = aggregate_revenue - aggregate_direct_costs
estimated_tax_set_aside = max(aggregate_earnings_after_direct_costs, 0) × set_aside_rate
estimated_take_home = aggregate_earnings_after_direct_costs - estimated_tax_set_aside
```

V1 does not sum individually floored positive-job estimates. This lets negative jobs reduce positive jobs within the same reporting window, matching the aggregate earnings value already presented on the screen.

### Calculation rules

- The set-aside does not change revenue, any cost category, total direct costs, or earnings after direct costs.
- Zero or negative earnings produce a zero set-aside; FieldSoli does not estimate a tax benefit.
- When earnings are negative, estimated take-home equals the negative earnings amount.
- Perform calculations from integer cents and the persisted rate representation.
- Round only the final set-aside amount to the nearest cent using one documented money-rounding rule.
- Calculate estimated take-home by subtracting the rounded set-aside cents from earnings cents so displayed values reconcile exactly.

## Earnings experience

When the setting is enabled, the aggregate Earnings summary should show this hierarchy:

1. Revenue
2. Direct costs
3. Earnings after direct costs
4. Estimated tax set-aside, including the selected percentage
5. Estimated take-home

The existing earnings value remains the primary business-performance metric. The set-aside and take-home values sit below it as planning guidance.

Recommended display labels:

- `EST. TAX SET-ASIDE (30%)`
- `ESTIMATED TAKE-HOME`

Include nearby disclosure text:

> Planning estimate only. Your actual taxes may differ.

Per-job display is outside the minimum V1 UI. The domain calculation should support it so a later job-detail design can reuse the same rules.

## Persistence

Persist the preference per authenticated user with:

- an enabled/unset state; and
- a rate stored as an exact integer representation, such as basis points.

Recommended representation:

- `estimated_tax_set_aside_bps integer null`
- `null` means off/unset;
- `0` means enabled at 0%;
- `10000` means 100%; and
- a database constraint enforces `0 <= value <= 10000`.

The setting should follow the user across devices. It must not be stored only in local mobile state.

If the preference is stored in an exposed table, enable RLS and permit authenticated users to select and update only their own row. Updates must preserve ownership and validate the range at the database layer as well as in the client.

## Privacy and analytics

The selected rate may reveal personal financial planning behavior. Treat it as sensitive user preference data.

Do not send the exact percentage, set-aside amount, take-home amount, revenue, costs, or earnings to product analytics.

Acceptable coarse events may include:

- set-aside enabled;
- set-aside disabled;
- setting save succeeded or failed; and
- Earnings screen viewed with the feature enabled.

## Product language

Allowed positioning:

> Choose a percentage to estimate how much of your earnings to set aside for taxes.

Avoid claims such as:

- “This is what you owe in taxes.”
- “Your after-tax income.”
- “Recommended tax rate.”
- “Tax withholding.”
- “Tax-safe amount.”
- “IRS-calculated estimate.”

## Acceptance criteria

### Setting

- [ ] The feature is off by default and FieldSoli does not choose a rate.
- [ ] A user can enable and save any valid percentage from 0% through 100% with at least one decimal place.
- [ ] Invalid, negative, over-100, NaN, and infinite values are rejected without clamping.
- [ ] A saved 0% setting is distinguishable from an unset setting.
- [ ] The user can turn the feature off without changing any job or financial record.
- [ ] The saved preference follows the authenticated user across devices.
- [ ] Database constraints and ownership rules prevent invalid values and cross-user reads or writes.

### Calculations

- [ ] Positive earnings produce the correct estimated set-aside and estimated take-home to the cent.
- [ ] Zero earnings produce a zero set-aside and zero estimated take-home.
- [ ] Negative earnings produce a zero set-aside and estimated take-home equal to negative earnings.
- [ ] Aggregate reports apply the rate to aggregate earnings, not to each positive job separately.
- [ ] Displayed earnings, rounded set-aside, and estimated take-home reconcile exactly.
- [ ] Changing the rate never changes revenue, direct costs, or earnings after direct costs.

### UI and language

- [ ] When the feature is off, set-aside and estimated take-home values are hidden.
- [ ] When enabled, Earnings shows the selected percentage, set-aside, estimated take-home, and estimate disclosure.
- [ ] The UI uses **Estimated tax set-aside** and **Estimated take-home** consistently.
- [ ] No product copy presents the estimate as withholding, tax owed, tax advice, or guaranteed after-tax income.
- [ ] Exact financial values and the selected rate are excluded from analytics.
- [ ] The Job Summary CSV does not contain the rate or calculated estimates.

## Open review decisions

1. **Placement:** Confirm **Profile → Business settings → Estimated tax set-aside**.
2. **Aggregate rule:** Confirm applying the rate once to aggregate earnings for the active reporting window.
3. **Per-job display:** Keep it out of the first UI release, or show the estimate on completed job details as well.
4. **Rate precision:** Confirm one decimal place in the UI while persisting basis points for exact storage.
5. **Disclosure prominence:** Decide whether the estimate disclaimer is always visible or opens through an info action after first view.

## Follow-on candidates

- Different planning rates by tax year.
- Quarterly estimated-payment reminders.
- Manual tracking of estimated tax payments.
- A dedicated reserve account integration.
- Jurisdiction-aware education that remains clearly separate from tax advice.
- Per-job set-aside display.
