# FieldSolo Terms of Service Revision Plan

**Status:** Proposed for approval — planning and research only. This document does not change `terms.md`, the published website Terms, app behavior, backend behavior, or app-store configuration.

**Prepared:** July 20, 2026

## Purpose

This plan governs a from-scratch revision of FieldSolo's launch Terms of Service. It incorporates the decisions already made for the Privacy Policy, current competitor research, Illinois considerations, nationwide contract issues, and a repository audit of the current FieldSolo app and website.

The central drafting rule is:

> The Terms will contract for the FieldSolo service that exists when the Terms take effect. Planned features will be handled through an internal legal-review gate and, when necessary, feature-specific or updated terms before launch.

The Terms should be durable enough to cover ordinary improvements to existing features, but they should not claim rights for hypothetical AI, voice, location, team, integration, payment, or benchmarking programs that FieldSolo has not launched.

This is a product-specific planning document, not legal advice. Counsel should review the drafted Terms, particularly the dispute-resolution, liability, indemnity, state-law, and app-store provisions, before publication.

## Recommended decisions for approval

1. **Use “FieldSolo Terms of Service” as the formal document title.** “Terms of Service,” “Terms and Conditions,” and “Terms of Use” do not have materially different legal status merely because of their names, but “Terms of Service” most clearly describes FieldSolo's ongoing SaaS relationship. Define the document as the “Terms.” Keep the canonical filename `docs/legal/terms.md` and public route `/terms`; full-title references should say “Terms of Service,” while compact links and buttons may say “Terms.”
2. **Use Joist as the primary structural model.** It is the closest contractor-focused SaaS analogue and has a practical sequence for service access, accounts, use restrictions, customer content, intellectual property, termination, disclaimers, liability, and general contract terms.
3. **Do not copy Joist verbatim.** Its subscriptions, payments, homeowner financing, rewards, integrations, AI, confidentiality, Canadian law, $1,000 cap, and six-month claim deadline do not match FieldSolo. Use its architecture, then rewrite each provision around FieldSolo's facts.
4. **Borrow targeted concepts from other competitors:**
   - Invoice2go for business-use language, authority to bind a business, customer-data permissions, and restrictions on highly sensitive data;
   - Jobber for versioned changes, notice, reacceptance, and responsibility for customer information;
   - Housecall Pro for a clear statement that FieldSolo is a software provider and is not the user's contractor, employer, agent, project manager, or partner;
   - ServiceTitan only for the architecture of a fee-based liability cap and jurisdictional savings language, not its attempt to limit liability for gross negligence or willful misconduct;
   - FieldPulse only as a checklist for mobile-app-store terms, not as a drafting base; and
   - Kickserv as a simplicity check because its shorter contractor-SaaS format confirms that FieldSolo does not need an enterprise-length agreement.
5. **Identify the operator as:** “FieldSolo is operated by Veltri Ventures LLC, an Illinois limited liability company.” Do not say the company or app is “licensed in Illinois.”
6. **Make the service business-use only.** FieldSolo is designed for independent tradespeople and small business operators, not personal, family, or household use. A person accepting for a company must represent that they have authority to bind it.
7. **Describe current functionality only.** Cover accounts, profiles, jobs, customer/worksite details, live and manual work sessions, Inbox notes and materials, payment status, revenue and material-cost entries, earnings calculations, optional consent-based analytics, support, the website, and the waitlist.
8. **Do not include current contractual rights for unlaunched features.** Exclude operational provisions for voice or other AI, photos/files, GPS, integrations or mailbox access, teams, payment processing, paid subscriptions, customer communications, invoicing, and pricing or industry benchmarking.
9. **Defer pricing and industry benchmarking.** The launch Terms may permit narrow aggregated or deidentified service-usage statistics for product analytics and product improvement, consistent with the approved Privacy Policy. They will not authorize pricing benchmarks, industry reports, commercialization of job economics, or generalized AI training.
10. **Give FieldSolo only the User Content license necessary to operate the current service.** Users retain ownership. The license should be non-exclusive and limited to hosting, storing, reproducing, processing, transmitting, and displaying content to provide, maintain, secure, and support FieldSolo and comply with law.
11. **Keep the current free-service posture simple.** State that FieldSolo is currently offered without a subscription fee and that no user will be charged without being shown and accepting separate or updated payment terms. Do not include auto-renewal, trial conversion, refund, tax, payment-card, app-store billing, or cancellation provisions until a paid offering is ready.
12. **Use measured beta and availability language.** If the release remains labeled beta at publication, explain that it may contain errors, change, or be discontinued and that FieldSolo provides no service-level agreement. Do not promise support hours or uptime.
13. **Replace Delaware law and venue with Illinois.** Subject to non-waivable law, use Illinois governing law and an Illinois forum that counsel confirms is appropriate, expected to be state and federal courts located in Cook County.
14. **Do not retain the current three-sentence arbitration clause.** It omits an administrator, rules, fees, procedure, notice, opt-out, and other mechanics. The recommended launch approach is Illinois courts after a short informal dispute process. If counsel prefers arbitration, use a separately reviewed, conspicuous, complete clause with an opt-out instead.
15. **Keep the current liability-cap structure, with better safeguards.** The recommended cap is the greater of fees paid in the preceding 12 months or $100, but the provision must preserve liabilities and remedies that cannot lawfully be limited and should not purport to excuse fraud, willful misconduct, or gross negligence.
16. **Narrow indemnification to third-party claims.** It should cover claims caused by the user's unlawful use, User Content, breach of customer-data permissions, violation of third-party rights, or material breach of the Terms. It should include notice, control-of-defense, cooperation, and settlement protections rather than a one-sentence unlimited obligation.
17. **Use affirmative clickwrap and versioned acceptance.** At signup, the user should affirmatively agree to the linked Terms. Material updates should receive conspicuous notice and reacceptance. Preserve the accepted version, user, timestamp, source, app version, and platform.
18. **Separate contractual assent from privacy notice.** Recommended signup language is “I agree to the Terms of Service and acknowledge the Privacy Policy.” Any consent that must be freely given, such as optional product analytics, remains a separate choice.
19. **Use Apple's Standard EULA for the iOS app license unless counsel deliberately chooses a custom EULA.** The FieldSolo Terms would govern the account and service and state that app use is also subject to applicable app-store terms. A custom Apple EULA would trigger Apple's minimum-term checklist, including a public legal address, telephone number, and email.

## Competitor research and recommendation

Competitor terms are useful as issue checklists and structural references. They are not evidence of what is enforceable for FieldSolo, and their wording should not be copied wholesale. Their products, corporate structures, pricing, dispute strategies, and legal jurisdictions differ materially.

| Competitor | Useful concepts | What FieldSolo should not copy | Recommendation |
| --- | --- | --- | --- |
| [Joist](https://www.joist.com/terms/) | Contractor-focused structure; limited service license; account security; use restrictions; customer-content ownership and operating license; maintenance; suspension; IP; termination; disclaimers; general provisions | Paid trials and subscriptions, auto-renewal, ACH/card terms, rewards, payments, financing, third-party integrations, AI, Canadian law, bilateral confidentiality, customer-logo publicity, $1,000 cap, prevailing-party fees, and a six-month claim deadline | **Primary structural model.** Rebuild each section with FieldSolo facts and remove more than half of Joist's substantive content. |
| [Jobber](https://www.getjobber.com/terms-of-service/) | Notice of material changes; possible reacceptance; authority to bind a business; user responsibility for personal information entered about customers | Teams and Account Owners, communications, payments, subscriptions, integrations, Canadian provisions, AI, and its perpetual/irrevocable license for market research, pricing benchmarks, and industry insights | Use the acceptance/update mechanics and customer-data responsibility. Explicitly reject its benchmark license for the launch Terms. |
| [ServiceTitan](https://www.servicetitan.com/legal/terms-of-use) | Thorough issue spotting; fee-based liability-cap architecture; state-law savings language; electronic notices; export-control checklist | Enterprise order forms, implementation services, employees, franchises, telecom, payments, hardware, integrations, AI, complex attachments, and liability language that expressly reaches gross negligence and willful misconduct | Secondary liability and boilerplate reference only. Do not use as the base. |
| [Housecall Pro](https://www.housecallpro.com/terms/) | Business-to-business framing; authority; strong separation between the software company and the tradesperson's customer work; customer-dispute indemnity concept | Teams, administrators, payments, websites, communications, AI, customer-logo publicity, extremely broad data-use rights, and enterprise-length arbitration | Borrow the independent-party concept and a carefully narrowed customer-claim provision. |
| [Invoice2go](https://invoice.2go.com/terms-of-service/) | Business-purpose statement; entity authority; scoped customer-data ownership/license; customer permissions; user recordkeeping; restriction of SSNs, credentials, payment data, health data, and other unnecessary sensitive data | Invoicing, money movement, bank/card products, lending, app subscriptions, international provisions, broad anonymous-data marketing rights, paid-plan mechanics, and publicity rights | Best secondary source for current User Content and responsibility sections. |
| [Kickserv](https://kickserv.zendesk.com/hc/en-us/articles/25906570185357-Terms-of-Service) | Short contractor-SaaS organization; concise account, restrictions, customer content, IP, termination, disclaimer, and general terms | Subscription and ACH terms, integrations, Colorado law, $1,000 cap, confidentiality, prevailing-party fees, and six-month claims limit | Use as a length and simplicity check, not as an independent source of FieldSolo rights. |
| [FieldPulse](https://www.fieldpulse.com/terms-of-service) | Mobile-license and Apple-specific issue checklist; eligibility and electronic-communications topics | Personal-use license inconsistent with its field-service product, teams, memberships, paid subscriptions, payments, broad DMCA/public-content provisions, extensive arbitration, stale “Android Market” terminology, and features FieldSolo does not have | Do not use as the base. Prefer Apple's current official terms over its app-store wording. |

### Recommended source hierarchy

1. **Joist** — section order and contractor-SaaS architecture.
2. **Invoice2go** — business-use, authority, customer data, sensitive-data restrictions, and user recordkeeping.
3. **Jobber** — changes, notice, affirmative reacceptance, and customer-information authority.
4. **Housecall Pro** — FieldSolo is independent from the user's trade business and customer engagements.
5. **ServiceTitan** — liability-cap format, jurisdictional savings, electronic-notice and general-contract checklist.
6. **Apple's official Standard EULA and minimum terms** — app-license strategy.
7. **Kickserv and FieldPulse** — completeness checks only.

### Content not to inherit from any competitor

Do not copy provisions merely because multiple competitors use them. In particular, exclude:

- automatic renewal, paid trials, billing authorization, refunds, chargebacks, taxes, financing, lending, or payment processing;
- Teams, administrators, employees, dispatch, monitoring, franchise, or shared-account controls;
- AI-generated content, AI training, voice processing, image analysis, or generalized assistant features;
- integrations, APIs, connected mailboxes, accounting systems, calendar/contact access, or data exports to third parties;
- exact-location, route, mileage, camera, photo, document, or audio provisions;
- pricing, market, or industry benchmarking rights;
- customer-logo or customer-name publicity rights;
- blanket confidentiality terms that FieldSolo is not operationally prepared to administer as an enterprise contract;
- DMCA repeat-infringer procedures for a service that does not publicly host or distribute user submissions;
- shortened six-month or one-year claim deadlines;
- blanket prevailing-party attorneys' fees;
- non-disparagement, review ownership, or restrictions on honest reviews; and
- foreign governing law, Delaware law, or another competitor's venue.

## Current FieldSolo product and contract boundary

The eventual Terms should be checked against the release candidate again immediately before publication. The current repository supports the following boundary.

### Current account and service features

- Email-and-password signup and sign-in through Supabase Auth.
- First name, last name, and one or more trade selections.
- Profile editing, password change, sign-out, and in-app account deletion.
- Versioned Privacy Policy and Terms acceptance at signup and required reacceptance after configured version changes.
- Legal-acceptance records containing document type and version, timestamp, source, app version, platform, and user ID, plus a local cache used for resilience.
- Optional in-app product analytics only after a separate affirmative choice, with an in-app withdrawal control.
- Jobs with a short description, customer name, service address, work status, payment status, revenue, timestamps, no-materials confirmation, and search.
- Live and manual work sessions with start/end times, entry mode, status, and a start timezone for live sessions.
- Notes associated with a job or session or held unassigned in the Inbox, including later Inbox assignment.
- Materials with description, quantity, unit, unit cost, calculated total, and job/session or Inbox association.
- Derived business-organizing views such as work duration, material totals, net earnings, net hourly rate, weekly/monthly/yearly summaries, outstanding payments, job rankings, recent work, and “needs attention” groupings.
- A marketing website, product information, support links, legal pages, and a waitlist form.
- A free beta posture and no current paid subscription or payment processing.

### Current user controls and deletion behavior

- Users can edit and soft-delete individual jobs, sessions, notes, and materials from normal app use.
- The account-deletion flow calls a backend function that verifies the authenticated user, deletes the Supabase Auth user, cascades owned database rows, and makes a best-effort PostHog deletion request when applicable.
- The Privacy Policy governs retention and deletion detail. The Terms should not repeat an unverified 90-day backup deadline or create a different deletion promise.
- The Terms should tell users to maintain independent copies of records they need for taxes, licenses, customer contracts, disputes, insurance, or other legal/business purposes. FieldSolo is not a statutory record archive.

### Current website and waitlist assent

- The waitlist form currently uses a required checkbox linking both the Privacy Policy and Terms and consenting to early-access/product communications.
- The backend currently records the Privacy Policy version and acceptance time, but not a separate Terms version.
- Before relying on the waitlist checkbox as strong evidence of assent to a particular Terms version, add a Terms-version record or an equivalent immutable record of the exact linked Terms. This is an implementation follow-up, not part of this planning-only change.
- Consider separating “I agree to the Terms and acknowledge the Privacy Policy” from marketing consent if future waitlist communications extend beyond the requested early-access relationship.

### Current exclusions

The Terms should not present these as usable features or grant feature-specific rights for them:

- voice capture, speech transcription, or AI processing;
- microphone, camera, photo-library, file-upload, location, contacts, calendar, or notification access;
- teams, roles, administrators, employee tracking, or shared workspaces;
- third-party integrations, email import, connected-service tokens, or synchronization;
- quotes, estimates, contracts, invoices, or messages sent to a user's customer;
- payment-card or bank-account collection, payment processing, subscriptions, paid trials, or auto-renewal; and
- pricing or industry benchmarking.

The visible **Photo** and **Voice** capture tiles are currently non-interactive design placeholders. The UI's use of “attachments” currently refers to note and material entries shown with a session, not uploaded files. Neither should expand the public Terms.

Dormant database columns or storage structures also do not make a capability current. The Terms should follow what a user can actually submit and use in the shipping app.

## Illinois company and law considerations

### Entity description

Veltri Ventures LLC's Illinois formation has been confirmed from its Articles of Organization. The correct operator language is:

> FieldSolo is operated by Veltri Ventures LLC, an Illinois limited liability company.

Do not say FieldSolo or Veltri Ventures LLC is “licensed in Illinois.” Formation creates an Illinois LLC; it is not an occupational, professional, contractor, or product license. The Terms also do not need an Illinois-resident rights section merely because the operator is an Illinois LLC.

### Governing law and forum

- Remove Delaware governing law, Delaware venue, and all Delaware references.
- Recommended launch position: Illinois law, excluding conflict-of-law rules, subject to non-waivable law that applies to the user.
- Recommended court forum if counsel confirms it: state and federal courts located in Cook County, Illinois.
- The venue provision should not claim to eliminate non-waivable rights or remedies available under another state's law.
- Do not publish a residential address merely to establish venue. Use the company's legal identity and an operational email in the service Terms. A physical address and telephone number become a separate issue if FieldSolo submits a custom Apple EULA or uses a dispute process that requires mailed notices.

### Electronic contracting

Illinois's Uniform Electronic Transactions Act recognizes electronic records, signatures, and contracts, but agreement and attributable action still matter. Federal E-SIGN likewise prevents a contract from being denied effect solely because it is electronic.

The practical contract-formation requirements are:

- present conspicuous notice of the Terms immediately next to the acceptance control;
- use an unchecked checkbox or a clearly labeled “I agree” action;
- keep the Terms link readable and available before acceptance;
- do not rely only on a footer link or passive website use for important liability or dispute provisions;
- record the exact document version and acceptance event;
- retain an immutable copy of every accepted version; and
- use separate, conspicuous reacceptance for material changes.

This approach also addresses the Seventh Circuit's warning in *Sgouros v. TransUnion* that an electronic button does not create assent when the page does not clearly tell the user that the action accepts the agreement.

### Illinois consumer-protection posture

Illinois's Consumer Fraud and Deceptive Business Practices Act should shape accurate descriptions, marketing, and limitations. It does not require an Illinois-specific Terms section, but FieldSolo should:

- avoid inaccurate feature, security, earnings, savings, or legal-compliance claims;
- avoid saying the Terms waive rights that cannot be waived;
- keep disclaimers consistent with actual product behavior;
- use conspicuous presentation for important restrictions; and
- preserve a general state-law savings clause.

Illinois's Automatic Contract Renewal Act is not relevant to the current free service. It becomes a launch requirement before any paid subscription, free-to-paid trial, or automatic renewal is offered.

## Nationwide operation considerations

A Terms document does not by itself make a product compliant in all 50 states. The agreement can allocate responsibilities and preserve non-waivable rights, but product operations, privacy, billing, marketing, accessibility, security, taxes, and app-store practices must independently comply.

### Business-purpose boundary

- State that FieldSolo is designed and provided for business purposes and not for personal, family, or household use.
- Define “you” as the individual accepting and, if applicable, the business on whose behalf the individual acts.
- Require authority to bind the business.
- Do not imply that labeling the relationship business-to-business eliminates every state consumer-protection law. Use “to the extent permitted by law” and preserve rights that cannot be waived.
- Have counsel decide whether a California Civil Code section 1789.3 notice or an express New Jersey savings paragraph is warranted even with the business-use restriction.

### User's trade and customer responsibilities

The Terms should establish that the user—not FieldSolo—is responsible for:

- the trade services the user offers or performs;
- business and occupational licenses, contractor registrations, permits, inspections, and bonding;
- customer contracts, estimates, change orders, cancellation notices, warranties, disclosures, and invoices required by applicable law;
- pricing, taxes, insurance, workplace safety, employment, and independent-contractor obligations;
- lien, recordkeeping, tax, and customer-dispute requirements;
- the accuracy and legality of job, customer, time, cost, payment-status, and revenue information entered into FieldSolo; and
- obtaining the rights, permissions, and notices required to enter information about customers and worksites.

The Terms should not suggest that FieldSolo verifies licenses, work quality, customer agreements, prices, safety, or legal compliance. Current FieldSolo records are internal business-organizing records; they are not a customer contract, invoice, tax return, payroll record, permit, safety system, or legal notice.

### Relationship of the parties

Adapt Housecall Pro's useful concept in shorter FieldSolo language:

- FieldSolo and the user are independent parties.
- FieldSolo is a software provider, not a party to agreements between the user and the user's customers.
- FieldSolo is not the user's general contractor, construction manager, project manager, employer, joint employer, agent, partner, joint venturer, accountant, tax adviser, insurer, payment processor, or legal adviser.
- Nothing in the Terms creates employment, agency, partnership, fiduciary, or joint-venture duties.

### Calculations and reliance

Because FieldSolo shows revenue, costs, net earnings, net hourly rates, outstanding payments, rankings, and time summaries, the Terms should clearly say:

- calculations depend on user-entered information and app logic;
- they may be incomplete, delayed, or inaccurate;
- they are estimates for business organization, not accounting, tax, legal, financial, insurance, payroll, wage, or pricing advice;
- they are not a guarantee of profit, collection, job performance, or compliance; and
- users should validate important results and maintain legally required records outside FieldSolo.

### Sensitive-data restrictions

Borrow Invoice2go's concept but tailor it to FieldSolo. Users should not enter information the app does not need, including:

- Social Security numbers, driver's-license numbers, or government identification numbers;
- full payment-card numbers, security codes, bank-account credentials, or account passwords;
- protected health information regulated by HIPAA;
- biometric identifiers, highly sensitive personal information, or information about children; or
- content whose storage would make FieldSolo subject to a specialized legal or security regime not supported by the product.

Do not overstate this as proof that FieldSolo could never receive such information in a free-text field. It is a contractual prohibition and product-risk control, not a factual privacy-policy assertion about every character a user might type.

### Honest reviews and feedback

The Consumer Review Fairness Act prohibits form-contract provisions that restrict honest reviews, penalize reviewers, or require people to surrender IP rights in reviews. Therefore:

- the feedback license should apply to suggestions deliberately submitted to FieldSolo for product development;
- it should expressly exclude public reviews and other content protected by applicable review-fairness law; and
- the Terms should contain no non-disparagement or negative-review penalty.

### Paid subscriptions as a future launch gate

Before charging users, conduct a new nationwide billing review and add accurate terms covering price, billing frequency, renewal, trial conversion, taxes, refunds, cancellation, app-store billing, and notice of price changes.

At minimum, future implementation must account for:

- the federal Restore Online Shoppers' Confidence Act requirement for clear material terms, express informed consent, and a simple cancellation mechanism;
- Illinois's Automatic Contract Renewal Act disclosures, acknowledgment, reminders in applicable cases, and online cancellation;
- California's current automatic-renewal consent, reminder, change-notice, and cancellation requirements;
- other state automatic-renewal laws; and
- then-current Apple and Google billing rules.

Do not try to satisfy those future requirements now with generic “we may charge you later” language.

### Arbitration and class-waiver decision

The Federal Arbitration Act generally recognizes written arbitration agreements involving commerce, subject to ordinary contract defenses. Enforceability still turns on assent, scope, fairness, and clause design.

**Option A — recommended for launch: (I'm aligned to option A for now)**

- a 30-day good-faith informal dispute process;
- Illinois governing law;
- small-claims court remains available;
- exclusive state and federal courts in Cook County for other disputes, subject to non-waivable law; and
- no mandatory arbitration or class-action waiver.

This is simpler for a solo developer and avoids administering arbitration, paying consumer-arbitration fees, and maintaining a complex clause before FieldSolo has paid plans or a large user base. The tradeoff is that disputes may proceed in court and potentially on a class basis where permitted.

**Option B — only if counsel affirmatively recommends arbitration: (keep in plan for future reference, but ignore for actual draft)**

- a conspicuous warning near the beginning of the Terms;
- the Federal Arbitration Act;
- a named administrator and current rules;
- an informal notice process and address;
- allocation of filing and hearing fees;
- hearing location or remote-hearing rules;
- small-claims, agency, and appropriate IP/injunctive carveouts;
- an individual-relief and class/jury waiver;
- a 30-day opt-out that can be completed by email or mail;
- delegation, severability, survival, and amendment rules; and
- counsel-reviewed treatment of coordinated or mass filings.

Do not add arbitration later through a quiet posting or ordinary continued-use clause. A later arbitration amendment should receive separate conspicuous notice and affirmative assent and should operate prospectively as counsel advises.

### Warranty and liability savings

The Terms may disclaim implied warranties and consequential damages to the maximum extent permitted by law, but should also state that:

- applicable law may not permit every exclusion;
- the Terms do not exclude warranties or rights that cannot be excluded;
- no limitation applies to the extent prohibited by law; and
- counsel must define the treatment of fraud, willful misconduct, gross negligence, personal injury, and other liabilities that may not be limited.

Do not copy ServiceTitan's language that expressly places gross negligence and willful misconduct inside the cap. Its New Jersey caveat is a useful reminder that state-specific enforceability varies, not a substitute for FieldSolo's own review.

### App-store and mobile-license strategy

Apple states that App Store apps are licensed, not sold, and applies its Standard EULA unless a custom EULA is provided. Recommended approach:

1. Do not submit the FieldSolo service Terms as a custom Apple EULA at launch.
2. Let Apple's Standard EULA govern the iOS application license.
3. Make FieldSolo's Terms govern the account, website, waitlist, and FieldSolo service relationship.
4. State that mobile-app use is also subject to applicable app-store terms and that those third parties are not responsible for FieldSolo's service except as their terms provide.
5. Avoid terms that conflict with the Apple Standard EULA.

If counsel instead wants one custom EULA, the final Terms must include Apple's current minimum provisions: Apple acknowledgment, license scope, maintenance/support, warranty allocation and refund language, product claims, IP claims, sanctions compliance, developer legal name/address/telephone/email, third-party terms, and Apple third-party-beneficiary rights.

Google Play does not justify copying FieldPulse's stale Android language. FieldSolo should separately keep its developer legal identity and contact details accurate in Play Console and comply with the current Developer Distribution Agreement and Developer Program Policies.

### Additional nationwide issues that do not need launch sections

- **DMCA:** no public user-content distribution or sharing feature currently warrants a detailed repeat-infringer/DMCA process.
- **Communications:** the app does not currently send user-directed SMS, emails, or calls to the user's customers, so do not include TCPA/CAN-SPAM customer-communication clauses. Marketing consent and unsubscribe operations remain separate compliance matters.
- **Export controls:** a short U.S. sanctions/export-compliance representation is appropriate for mobile distribution, especially if FieldSolo relies on or mirrors Apple's standard license terms.
- **Privacy and security:** detailed collection, disclosure, retention, deletion, and state privacy rights belong in the Privacy Policy and operations. The Terms should link to it and avoid contradictory promises.
- **Taxes and sales tax:** no service-fee tax clause is needed while FieldSolo is free. Users remain responsible for their own business and trade taxes.

## Section-by-section drafting plan

### 1. Title, effective date, and version

Include:

- **FieldSolo Terms of Service**;
- an effective date and a version identifier that match the app, website, and acceptance database;
- a conspicuous opening note if the final document contains arbitration or another significant waiver; and
- no statement that this launch version replaces a prior public contract unless publication timing makes that true.

### 2. Operator, agreement, and scope

- Identify Veltri Ventures LLC as an Illinois limited liability company operating FieldSolo.
- Define the covered “Services” as the current website, waitlist, iOS/Android app, account functions, support interactions, and other current FieldSolo services linking to the Terms.
- State that the Terms form a contract when affirmatively accepted or when another enforceable acceptance method is used.
- Do not rely on passive website browsing as the sole basis for important waivers.
- Link to the Privacy Policy as the explanation of data practices.

### 3. Eligibility, business purpose, and authority

- Users must be at least 18 and legally capable of contracting.
- FieldSolo is for business use by independent tradespeople and small operators, not personal/family/household use.
- A user accepting for a business represents they have authority to bind that business.
- “You” should mean both the accepting individual and the represented business where applicable.
- Do not define team administrators, Account Owners, or Authorized Users.

### 4. Current Services

Describe at a useful, non-promissory level:

- job and customer/worksite record organization;
- live and manual work-session tracking;
- Inbox notes and materials and later assignment;
- revenue, material cost, payment status, and earnings/time calculations;
- account, profile, legal, privacy, and deletion controls;
- the website, waitlist, and support; and
- optional in-app analytics subject to a separate choice and the Privacy Policy.

State that descriptions do not guarantee any particular feature, uptime, device compatibility, or continued availability.

### 5. Beta status, updates, and service availability

If “beta” remains accurate:

- identify the current service as beta;
- explain that beta features may be incomplete, change, or contain errors;
- permit software updates and reasonable service changes;
- permit suspension for maintenance, security, legal obligations, abuse, or risk; and
- provide advance notice of material discontinuation where reasonably practicable, without creating an SLA.

Ordinary changes within the existing service should remain governed by the Terms. New legal/data practices require the future-feature process below.

### 6. Limited license and ownership of the Services

- Grant a limited, revocable, non-exclusive, non-transferable, non-sublicensable right to access and use the Services for the user's internal business purposes during the agreement.
- State that the app and service are licensed, not sold.
- Reserve all FieldSolo and licensor rights not expressly granted.
- Cover software, interface, designs, documentation, branding, and trademarks.
- Make the license subject to applicable app-store terms.

### 7. Accounts and security

- Require accurate signup/profile information and reasonable updates.
- Keep credentials confidential and do not share accounts.
- Make the user responsible for activity under the account to the extent permitted by law.
- Require prompt notice of suspected unauthorized access through `support@fieldsolo.com` or the approved operational contact.
- Permit reasonable protective action, including session revocation or suspension.
- Do not add team-account or employee-access rules.

### 8. User business and customer responsibilities

- Make clear that users control their jobs and customer relationships.
- Users remain responsible for licenses, permits, contracts, notices, pricing, taxes, insurance, work quality, safety, and applicable law.
- FieldSolo does not verify the user or the user's work.
- Internal records in FieldSolo are not legal forms or required customer documents.
- Users should independently preserve records needed for legal and business purposes.
- Include the independent-party language described above.

### 9. Acceptable use and prohibited data

Retain and refine current restrictions against:

- illegal, fraudulent, harmful, abusive, defamatory, or rights-infringing use;
- malware, security probing, circumvention, disruption, credential misuse, or unauthorized access;
- scraping, automated access, reverse engineering, source-code extraction, resale, sublicensing, or competing use, subject to applicable-law exceptions;
- entering content the user has no right to provide;
- impersonation or misrepresentation;
- use for high-risk activities where service failure could cause death, injury, or serious property/environmental harm; and
- entering the unnecessary sensitive categories listed above.

Keep restrictions proportionate to a private business-record app. Do not import competitor restrictions tied to public social content, payments, messaging, or financial products.

### 10. User Content and customer information

Define **User Content** using current inputs only: job descriptions, customer names, service addresses, statuses, revenue, notes, material entries, work-session data, and other information a user currently enters.

State that:

- the user retains ownership as between the user and FieldSolo;
- the user is responsible for accuracy, legality, and appropriateness;
- the user has the rights, authority, notices, and permissions needed for FieldSolo to process customer and worksite information under the Terms and Privacy Policy;
- a user's customer is not a FieldSolo customer or contracting party merely because their information is entered; and
- FieldSolo may remove or restrict unlawful or prohibited content where reasonably necessary.

### 11. Limited User Content license

Grant FieldSolo a worldwide, non-exclusive, royalty-free license, only for as long and to the extent reasonably necessary, to:

- host, store, reproduce, process, transmit, and display User Content;
- provide the current features the user requests;
- maintain, secure, troubleshoot, and support the Services;
- use service providers acting for FieldSolo; and
- comply with law, enforce the Terms, and protect rights and safety.

Avoid “perpetual,” “irrevocable,” “for any business purpose,” public-display, marketing, AI-training, benchmark, industry-insight, data-sale, and customer-publicity rights.

The license may survive termination only for limited legal retention, backup expiration, security, dispute, and wind-down purposes described consistently with the Privacy Policy.

### 12. Aggregated and deidentified service data

Mirror the approved Privacy Policy:

- permit aggregated or deidentified **service-usage statistics** for product analytics and improvement;
- state that FieldSolo takes measures intended to prevent reasonable identification and does not attempt to reidentify the information;
- do not authorize pricing benchmarks, industry comparisons, commercial reports, generalized job-economics datasets, or AI training;
- do not use customer names, exact addresses, free-text User Content, or other direct identifiers as aggregate statistics; and
- do not characterize this as ownership of every derivative of User Content.

A future pricing or industry benchmarking program requires a Terms and Privacy Policy review and material reacceptance before it begins.

### 13. Privacy and product analytics

- Link to the current Privacy Policy.
- State that it explains personal-information handling and user choices.
- Describe in-app analytics only as optional and subject to a separate affirmative choice and withdrawal control.
- Avoid duplicating retention periods, provider lists, security details, or state privacy rights in the Terms.
- Do not say that accepting the Terms is consent to optional analytics.

### 14. Third-party infrastructure and links

- Explain that FieldSolo uses service providers and may contain links to third-party sites.
- Third-party services are governed by their own terms when users interact with them independently.
- FieldSolo is not responsible for third-party services it does not control, to the extent permitted by law.
- Do not describe optional user-connected integrations, because none currently exist.
- Do not name infrastructure providers in the Terms; the Privacy Policy supplies current provider detail and can be maintained more accurately.

### 15. Feedback and reviews

- Permit FieldSolo to use voluntarily submitted product ideas and suggestions without compensation or ownership claims by the submitter.
- Make clear that the feedback license does not claim ownership of public reviews or restrict honest opinions protected by law.
- Do not include customer-name or logo publicity rights.

### 16. Current price and future paid services

- State only that the current Services are offered without a subscription fee.
- FieldSolo may later offer paid services, but a user will not be charged unless the user is shown and accepts the applicable pricing and payment terms.
- Do not include billing authorization, auto-renewal, free-trial conversion, cancellation, refund, tax, delinquency, or app-store purchase mechanics.
- Treat any paid launch as a mandatory Terms, product-flow, state-law, tax, and app-store review.

### 17. Suspension, termination, and account deletion

- Users may stop using the Services and delete their account using current controls.
- FieldSolo may suspend or terminate for material breach, illegal activity, security risk, harm, non-cooperation with a security issue, legal requirement, or discontinuation.
- Give notice and an opportunity to cure where reasonably appropriate; allow immediate action for urgent security, legal, or abuse risks.
- Explain the effect: access and the service license end, while provisions that by nature survive remain effective.
- Link deletion and retention details to the Privacy Policy.
- Remove the current unverified 90-day backup promise.
- Do not promise data export or indefinite restoration.

### 18. Disclaimers and no professional advice

Include measured, conspicuous terms that the Services are provided “as is” and “as available” to the extent permitted by law and that FieldSolo does not guarantee:

- uninterrupted, timely, secure, compatible, complete, or error-free operation;
- preservation of every record;
- accuracy or completeness of user-entered data or derived calculations;
- payment collection, profit, customer outcomes, or business results; or
- compliance with a user's trade, licensing, tax, accounting, employment, safety, insurance, or customer-contract obligations.

Preserve non-waivable warranties and rights. Avoid “completely secure” or absolute disclaimer language.

### 19. Limitation of liability

Proposed structure for counsel review:

- exclusion of indirect, incidental, special, consequential, exemplary, and punitive damages and loss of profits, goodwill, or business opportunities, to the extent permitted by law;
- an aggregate direct-liability cap equal to the greater of fees paid to FieldSolo in the 12 months before the event or $100;
- application regardless of legal theory and even if a remedy fails of its essential purpose, only to the extent permitted by law;
- a statement that the allocation is part of the basis of the agreement; and
- explicit preservation of liability and remedies that applicable law does not allow FieldSolo to limit.

Counsel must approve the carveouts for fraud, willful misconduct, gross negligence, personal injury, confidentiality/privacy duties, and any statutory remedies. Do not copy a competitor's carveout choices without this review.

### 20. Indemnification

Limit the user's obligation to third-party claims arising from:

- User Content or the user's failure to have required rights/permissions;
- the user's trade services or dispute with the user's customer;
- unlawful or prohibited use of FieldSolo;
- infringement or violation of a third party's IP, privacy, publicity, or other rights; or
- the user's material breach of the Terms.

Include reasonable procedures: prompt notice, cooperation, control of defense, no settlement admitting FieldSolo fault or imposing obligations without consent, and reduction to the extent FieldSolo caused the claim. Counsel should decide whether a free individual-user product should impose a duty to defend or only indemnify.

### 21. Disputes, governing law, and venue

Draft the approved Option A or counsel-approved Option B. For the recommended court option:

- require written notice and 30 days of good-faith informal resolution before filing, except where urgent relief or a limitations deadline requires otherwise;
- preserve qualifying small-claims actions;
- use Illinois law, subject to non-waivable law;
- use state and federal courts in Cook County, if counsel confirms; and
- include consent to jurisdiction and venue without purporting to waive rights that cannot be waived.

Delete the current vague mandatory arbitration, class waiver, jury waiver, and Delaware-court fallback.

### 22. Changes to the Terms

- Maintain the effective date and version at the top.
- Non-material clarifications may take effect when posted.
- Give email, in-app, or similarly conspicuous notice before material changes take effect where reasonably practicable.
- Require affirmative reacceptance for material changes through the current versioned legal gate.
- If the user does not accept, the user's remedy is to stop using the Services and delete the account, subject to surviving obligations.
- Do not make material changes retroactive without a legally supportable basis.
- Treat dispute-resolution changes, paid terms, material User Content license expansion, and benchmarking as reacceptance triggers.

### 23. Electronic communications and records

- Consent to receive operational legal notices electronically at the account email or in the app.
- State that electronic records and notices satisfy writing requirements where permitted.
- Require the user to keep the account email current.
- Separate operational/legal notices from optional marketing consent.
- Do not add consent to autodialed calls, texts, prerecorded voice, or push notifications that FieldSolo does not currently use.

### 24. App-store terms

Under the recommended Standard EULA strategy:

- state that use of a downloaded mobile app is also subject to the applicable app store's terms;
- clarify that the FieldSolo service agreement is between the user and Veltri Ventures LLC;
- reference Apple's Standard EULA for the iOS application license rather than reproducing a custom-EULA addendum; and
- avoid describing Apple or Google as responsible for FieldSolo support, content, or claims beyond their own terms.

If App Store Connect is configured with a custom EULA, replace this approach with a complete Apple addendum that meets the official minimum terms.

### 25. General provisions

Include concise provisions for:

- entire agreement and order of precedence with any future feature-specific terms;
- assignment by the user only with consent and by FieldSolo in connection with a merger, financing, reorganization, or asset transfer;
- severability or reformation to the minimum extent necessary;
- waiver only when express;
- force majeure for events outside reasonable control;
- headings and interpretation;
- no third-party beneficiaries, except if an Apple custom-EULA strategy requires Apple beneficiary rights;
- survival of User Content responsibility, IP, disclaimers, liability, indemnity, disputes, and provisions that by nature survive; and
- U.S.-only availability and applicable export/sanctions compliance.

Avoid a unilateral right to assign to anyone for any purpose, customer publicity, bilateral enterprise confidentiality, and prevailing-party fees unless counsel specifically recommends them.

### 26. Contact

- Use the full operator name: Veltri Ventures LLC, operating FieldSolo.
- Use `support@fieldsolo.com` for general Terms and service questions unless `legal@fieldsolo.com` is created and monitored.
- Keep `privacy@fieldsolo.com` for privacy requests.
- If arbitration, formal mailed notice, or a custom Apple EULA is selected, approve an appropriate non-residential business or registered-agent mailing address and, for Apple, a telephone number before publication.

## Existing `terms.md` disposition

| Current provision | Planned treatment |
| --- | --- |
| Operator and scope | Rewrite to identify Veltri Ventures LLC as an Illinois LLC and distinguish the app, service, website, and waitlist. |
| Acceptance | Rewrite around affirmative clickwrap, authority, business use, and privacy acknowledgment. |
| Age 18+ | Retain and connect to legal capacity and entity authority. |
| Current service description | Retain but expand accurately to Inbox, current session controls, material entries, payment status, and derived estimates. |
| “Currently free” | Retain in narrow form; remove speculative payment mechanics. |
| Account and security | Retain and refine; use support contact, not privacy contact, for account security. |
| Acceptable use | Retain, refine, and add unnecessary sensitive-data/high-risk restrictions. |
| User responsibility for customer data | Expand using Jobber/Invoice2go concepts. |
| User Content ownership | Retain. |
| Broad User Content license | Narrow to current service operation, security, support, service providers, and law. |
| Benchmarking, industry insights, research, and AI rights | Remove. Pricing/industry benchmarking remains deferred until the program is designed and approved. |
| Future AI section | Remove. Voice/AI will use the future-feature gate. |
| Third-party services | Retain only for current infrastructure, independent links, and app-store terms; do not imply integrations. |
| Privacy and optional analytics | Retain but align to the approved Privacy Policy and separate analytics consent. |
| FieldSolo IP | Retain and add a clear limited app/service license. |
| Feedback license | Retain with a Consumer Review Fairness Act carveout. |
| Disclaimer/no professional advice | Retain and expand for current calculations and user recordkeeping. |
| Greater-of-fees-or-$100 liability cap | Retain as the recommended commercial position, with counsel-approved non-waivable carveouts. |
| One-sentence indemnity | Replace with a narrower third-party-claim clause and procedures. |
| Suspension and termination | Rewrite with reasons, notice where practical, effect, and current deletion controls. |
| 30-day production deletion and 90-day backups | Remove from the Terms. Refer to the Privacy Policy and do not repeat an unverified 90-day commitment. |
| Changes | Rewrite for versioned notice and affirmative material reacceptance. |
| Delaware law and courts | Remove and replace with approved Illinois law/forum. |
| Vague mandatory arbitration/class waiver | Remove. Use approved dispute Option A or a complete counsel-drafted Option B. |
| Contact | Split general support/legal contact from privacy requests and identify the Illinois LLC. |
| Missing general provisions | Add assignment, severability, waiver, force majeure, entire agreement, notices, survival, relationship, and export/app-store treatment. |

## Future-feature Terms review gates

The current-only Terms should be reviewed before enabling any of the following. A review does not always require a full rewrite; it determines whether current language, additional feature terms, a billing policy, or a material reacceptance is required.

### Voice dictation or AI

Before launch, determine:

- whether FieldSolo receives audio or only text returned by the operating system;
- whether an AI/transcription provider receives content;
- provider retention, training, human-review, and output terms;
- whether transcripts become User Content;
- whether generated output can affect financial or customer records; and
- what just-in-time permission and privacy notice is required.

If FieldSolo receives only user-approved text from operating-system dictation, the existing User Content framework may require only a narrow update. If FieldSolo records audio, sends content to an AI provider, or generates advice, update both the Privacy Policy and Terms before launch.

### Pricing or industry benchmarking

Before beginning a benchmark program:

- define the data set, exclusions, cohort minimums, geography, deidentification, outputs, recipients, and commercial use;
- amend the Privacy Policy and the User Content/deidentified-data terms;
- prohibit reidentification and exclude names, exact addresses, free text, and sensitive content;
- confirm state privacy-law treatment; and
- require material reacceptance before using existing identifiable or user-derived data for the new purpose as counsel advises.

### Teams or shared workspaces

Add terms for account owner, authorized users, administrator control, business ownership of workspace data, permissions, user removal, departure, disputes among owners, team-member visibility, seat limits, and responsibility for invited users.

### Integrations and email import

Add terms for user authorization, OAuth tokens, imported content, scopes, connected-service rules, disconnection, retained imports, exports, provider outages, and user responsibility. Mailbox access also requires a provider-policy and privacy review.

### Photos, files, location, contacts, or calendar

Add only the provisions needed for the actual permission and use. Terms changes may be modest, but Privacy Policy, permission strings, store disclosures, security/storage, deletion, and just-in-time notices must be ready first.

### Customer-facing documents or communications

Before FieldSolo sends quotes, estimates, invoices, contracts, emails, texts, or calls to a user's customer, add responsibility for content, recipients, consent, consumer-contract requirements, electronic communications, unsubscribe/opt-out where applicable, delivery, signatures, and recordkeeping. Make clear that templates are not legal advice.

### Payments, banking, subscriptions, or paid plans

Add separate and current terms for provider relationships, authorization, fees, taxes, refunds, disputes, chargebacks, renewals, cancellation, trials, app-store billing, and required state notices. Do not retrofit this with a generic clause after charging begins.

## Acceptance and publication workflow after plan approval

### Phase 1 — draft only `terms.md`

1. Resolve the approval decisions below.
2. Rewrite `docs/legal/terms.md` from scratch using this plan.
3. Cross-check every User Content, analytics, deletion, and provider statement against `docs/legal/privacy-policy.md`.
4. Review the liability, indemnity, disputes, state-law, and Apple strategy with counsel.
5. Do not update public pages, version constants, database behavior, or acceptance UI in this phase unless separately authorized.

### Phase 2 — publication implementation

After the final Terms text is approved:

1. Set one effective date and version in `docs/legal/consent-versions.md`.
2. Update the website Terms page from the canonical markdown.
3. Update the mobile `REQUIRED_TERMS_VERSION` and website constants.
4. Preserve the prior accepted version and final rendered copy.
5. Trigger the existing in-app reacceptance gate if any current users already accepted the earlier Terms.
6. Confirm signup uses conspicuous affirmative assent.
7. Add a versioned Terms-acceptance record to the waitlist workflow if the waitlist remains contractually subject to the Terms.
8. Change signup copy to “I agree to the Terms of Service and acknowledge the Privacy Policy.” Compact links and buttons may continue to say “Terms.”
9. Verify the website footer, app links, support contact, and app-store listing.
10. Confirm whether Apple Standard EULA or a custom EULA is configured in App Store Connect.

## Approval checklist

The following decisions should be explicitly approved before drafting `terms.md`:

- [x] Adopt **FieldSolo Terms of Service** as the formal title, define it as the “Terms,” and retain `docs/legal/terms.md` and `/terms` as the canonical file and route.
- [ ] Use Joist as the primary structural model and the source hierarchy in this plan.
- [ ] Make FieldSolo business-use only and require authority to bind a business.
- [ ] Describe current features only; exclude planned voice/AI, media, GPS, integrations, teams, payments, and paid subscriptions.
- [ ] Defer pricing and industry benchmarking and authorize only narrow aggregated/deidentified service-usage analytics and product improvement.
- [ ] Use a narrow current-service User Content license with no perpetual benchmark, AI-training, marketing, or publicity rights.
- [ ] Keep the service free in the launch Terms and gate all future billing language.
- [ ] If still accurate at publication, identify FieldSolo as beta and disclaim an SLA.
- [ ] Use Illinois governing law and, subject to counsel confirmation, Cook County courts.
- [ ] Select dispute **Option A (recommended court process)** or **Option B (counsel-drafted arbitration)**.
- [ ] Use the greater-of-prior-12-month-fees-or-$100 liability cap with counsel-approved carveouts.
- [ ] Use a narrowed, procedure-based indemnity for third-party claims.
- [ ] Rely on Apple's Standard EULA rather than submit these service Terms as a custom EULA.
- [ ] Use `support@fieldsolo.com` for Terms questions unless a monitored `legal@fieldsolo.com` address is created.
- [ ] After Terms approval, separately approve version/acceptance/publication implementation changes.

## Primary legal and platform references

- [Illinois Uniform Electronic Transactions Act, 815 ILCS 333](https://www.ilga.gov/Legislation/ILCS/Articles?ActID=4165&ChapterID=67)
- [Federal E-SIGN Act, 15 U.S.C. § 7001](https://www.law.cornell.edu/uscode/text/15/7001)
- [*Sgouros v. TransUnion Corp.*, Seventh Circuit](https://media.ca7.uscourts.gov/cgi-bin/rssExec.pl?Path=Y2016/D03-25/C:15-1371:J:Wood:aut:T:fnOp:N:1726817:S:0&Submit=Display)
- [Illinois Consumer Fraud and Deceptive Business Practices Act, 815 ILCS 505](https://www.ilga.gov/Legislation/ILCS/Articles?ActID=2356&ChapterID=67)
- [Illinois Automatic Contract Renewal Act, 815 ILCS 601](https://www.ilga.gov/Legislation/ILCS/Articles?ActID=2363&ChapterID=67)
- [Federal Arbitration Act, 9 U.S.C. § 2](https://www.law.cornell.edu/uscode/text/9/2)
- [Restore Online Shoppers' Confidence Act, 15 U.S.C. § 8403](https://www.law.cornell.edu/uscode/text/15/8403)
- [California Attorney General automatic-renewal guidance](https://oag.ca.gov/news/press-releases/attorney-general-bonta-issues-consumer-alert-california%E2%80%99s-automatic-renewal-law)
- [FTC Consumer Review Fairness Act guidance](https://www.ftc.gov/business-guidance/resources/consumer-review-fairness-act-what-businesses-need-know)
- [Apple Standard Licensed Application EULA](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/)
- [Apple minimum terms for a custom developer EULA](https://www.apple.com/legal/internet-services/itunes/dev/minterms/)
- [Google Play Developer Program Policies](https://support.google.com/googleplay/android-developer/answer/17105854)

## Maintenance process

Review the Terms:

- before each release that crosses a future-feature gate;
- before introducing any fee, trial, renewal, customer communication, integration, AI provider, or benchmark use;
- whenever the Privacy Policy changes materially;
- when app-store distribution or EULA configuration changes;
- after a material complaint or dispute exposes an unclear allocation of responsibility;
- at least annually; and
- when counsel or a material change in federal or state law warrants review.

For each review, record:

- feature or legal change;
- current behavior and data flow;
- affected Terms sections;
- affected Privacy Policy and store disclosures;
- whether additional terms or material reacceptance are required;
- approved effective date and version; and
- the implementation owner and completion evidence.
