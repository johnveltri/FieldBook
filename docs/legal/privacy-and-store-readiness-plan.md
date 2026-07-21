# FieldSolo Privacy Policy Revision & Maintenance Plan

**Status:** Proposed for approval — planning only. This revision does not change `privacy-policy.md`, the published website policy, app behavior, backend behavior, or store disclosures.

**Originally prepared:** June 21, 2026

**Updated:** July 20, 2026

## Purpose

This plan governs the next revision of FieldSolo's launch privacy policy and establishes the process for keeping the policy accurate as the product changes.

The central drafting rule is:

> The public privacy policy will describe FieldSolo's actual, approved data practices at the time it takes effect. Planned features will be managed through an internal privacy-review process and added to the policy before they introduce a materially different data practice.

The policy is not a product roadmap or advance permission for hypothetical collection. It should be specific enough to explain what FieldSolo currently does without needing revision for ordinary product changes that continue using the same data for the same disclosed purposes.

## Proposed decisions for approval

1. Use one policy for the FieldSolo website, waitlist, mobile application, account interactions, support communications, and other FieldSolo services that link to it.
2. Present this as FieldSolo's initial launch policy. Do not say it replaces or supersedes an earlier policy.
3. Identify **Veltri Ventures LLC** as the operator of FieldSolo. If confirmed against the company's formation record, it may be described as “an Illinois limited liability company.” Do not say FieldSolo or Veltri Ventures LLC is “licensed in Illinois” merely because the LLC was formed or registered there, and do not describe FieldSolo as a registered DBA.
4. Describe current production data practices, enabled vendors, permissions, and user controls. Do not list speculative Teams, GPS, mailbox, integration, payment, media, or AI features in the public policy.
5. Remove the current public-policy subsection titled **Optional and future features** and remove other references that imply unlaunched features already process personal information.
6. Keep future-feature planning in this internal document. Require privacy review before enabling a feature that changes collection, use, disclosure, retention, deletion, user visibility, or device permissions.
7. Treat voice dictation as a near-term launch gate. Include it in the privacy policy only after its technical design and provider data flow are known, and before it is enabled for users.
8. Keep account deletion operationally reasonable for a solo developer: requests may be fulfilled manually within the disclosed period, provided initiation is accessible, requests are acknowledged and tracked, identity is verified, and completion is documented.
9. Maintain versioned policies and acceptance records. Give additional notice for material changes and obtain affirmative consent when required by the nature of the change.
10. Have counsel review the drafted launch policy before final publication, with particular attention to customer data, deidentified benchmarking, retention commitments, and any imminent voice feature.

## Competitor-derived drafting approach

Use competitor policies as structural references, not as factual source text.

- **Joist:** use its contractor/end-customer distinction and its concept of feature-specific, just-in-time notices. Do not copy its broad amendment/continued-use language or treat mentions of future product development as permission for future data collection.
- **Jobber:** use its pattern of describing actual integrations, AI tools, recordings, location, and account roles specifically, followed by a commitment to update the policy before using information for an unidentified purpose.
- **ServiceTitan:** use only as a secondary reference for customer-versus-service-provider roles and mature team/account-administrator concepts when those features become real.
- **Housecall Pro:** do not copy its broad statutory data-category inventory; many listed categories reflect a much larger existing product and would be inaccurate for FieldSolo.

Reference policies:

- Joist: <https://www.joist.com/privacy-policy/>
- Jobber: <https://www.getjobber.com/privacy-policy/>
- ServiceTitan: <https://www.servicetitan.com/legal/privacy-policy>
- Housecall Pro: <https://www.housecallpro.com/privacy/>

## Drafting standard

Every described practice should connect:

> data category → source → purpose → recipient → retention/deletion rule → user control

Use `may` only for a practice that is currently possible within the covered Services or varies based on a choice the user can presently make. Do not use `may` solely because a feature might be built later.

Avoid:

- generic statements such as “for any business purpose”;
- data categories FieldSolo does not collect;
- vendors or provider categories not involved in the current service;
- claims that all information is anonymous when a provider receives IP addresses or other identifiers;
- absolute security promises;
- claims that publication or continued use alone establishes consent to every material future change;
- future-facing feature lists intended to avoid later policy maintenance; and
- retention periods that have not been confirmed against actual systems and vendors.

## Current product and data boundary

Before drafting, reverify this inventory against the release candidate, deployed marketing configuration, Supabase project configuration, and enabled environment variables. The policy must follow the shipping system, not merely the repository's possible code paths.

### Current website and waitlist practices

- Marketing-site traffic analytics through Vercel Web Analytics when enabled in the deployed Vercel project. The repository mounts `@vercel/analytics` globally. Vercel documents default page-view data such as timestamp, URL/route, filtered query parameters, referrer, city/region/country, device type, operating system, and browser, without retaining the visitor's IP address as an analytics data point. Confirm the deployed project setting before treating collection as active.
- Waitlist information: first name, email address, trade selections, whether the person currently uses software, current tracking tools, job-source selections, marketing consent, accepted policy version, acceptance timestamp, submission timestamp, and waitlist status. The current waitlist form does not collect a last name.
- Anti-abuse information: the waitlist endpoint derives an HMAC hash from the request IP address for hourly rate limiting. The rate-limit table retains the hash, window timestamp, and attempt count and deletes windows older than two days during subsequent rate-limit calls. Confirm whether hosting or security logs retain the underlying IP address separately.
- Marketing consent and unsubscribe behavior.
- Privacy, support, and account-deletion communications sent by email.
- Hosting, form-processing, database, analytics, and email providers actually used at launch.

Do not call website analytics “anonymous” unless the provider's collection and configuration support that statement. Prefer precise language such as aggregated website-usage statistics while acknowledging technical data actually received by FieldSolo or its provider.

### Current mobile and account practices

- **Authentication and account management:** email/password signup and sign-in through Supabase Auth; password changes; authentication/session tokens; sign-out; and account deletion.
- **Profile:** first name, last name, and one or more trade selections.
- **Legal and privacy controls:** required Privacy Policy and Terms acceptance at signup; policy/terms version, acceptance timestamp, source, app version, and platform; reacceptance when required versions change; analytics-consent status and update timestamp; and locally cached acceptance/consent state used for resilience.
- **Jobs:** job description, customer name, service address, creation source, work status, payment status, revenue, created/updated timestamps, last-worked time, deletion timestamp, and the user's no-materials confirmation. Job/customer search text is submitted to Supabase to filter the user's own records; analytics receives only a search-length bucket, not the search text.
- **Work sessions:** parent job, live or manual entry mode, status, start and end times, start timezone for live sessions, and deletion time. The app supports starting, resuming, editing, ending, and deleting live sessions and creating/editing/deleting manual sessions.
- **Notes:** free-text notes attached to a job or session, or captured without a parent in the Inbox; created/updated/deleted timestamps; and later assignment from the Inbox to a job.
- **Materials:** description, quantity, unit, unit cost, calculated total cost, job/session association or unassigned Inbox state, and created/updated/deleted timestamps.
- **Derived views and insights:** job duration, material totals, net earnings, net hourly rate, financial-completeness status, weekly/monthly/yearly earnings snapshots, outstanding payments, job rankings, recency groupings, and “needs attention” groupings calculated from the underlying records.
- **Product analytics:** only when PostHog is configured and the user affirmatively enables analytics. Current events cover screen and feature interactions, app/session/user or anonymous identifiers, email domain and authentication provider after identification, app/build/platform/environment fields, record identifiers, counts, statuses, coarse money/quantity/text-length/duration buckets, and coarse error categories. The release configuration must keep `EXPO_PUBLIC_ANALYTICS_DEBUG_RICH` disabled because debug-rich mode can include email, customer name, job description, material description, trades, and detailed error text.
- **Deletion:** the in-app Delete account action calls a Supabase Edge Function that verifies the authenticated user, requests PostHog person/event deletion when configured, deletes the Supabase Auth user, and relies on foreign-key cascades for owned database rows. The public deletion page also provides an email path when the app cannot be accessed.
- **Current user controls:** profile editing, password change, record editing/deletion, policy access, Privacy Choices, analytics opt-in/withdrawal, sign-out, and account deletion.

### Current exclusions to verify

At the time this plan was updated, the mobile app configuration did not request camera, microphone, photo-library, location, calendar, notification, payment, or contact permissions, and no voice-recording or transcription dependency was present.

The database contains dormant or currently unused fields and structures, including `jobs.job_type`, `jobs.collected_cents`, `materials.purchase_date`, an `attachments` metadata table, and a default Storage bucket name. Current job creation writes an empty job type, the job editor does not expose job type or amount collected, the material editor does not expose purchase date, and the mobile client does not implement file selection, media capture, file upload, or attachment-record creation. The UI uses the word “attachments” for notes/materials displayed within a work session, not uploaded files. A dormant schema capability is not a current collection practice and should not cause the launch policy to claim that FieldSolo collects job type, amount collected, material purchase date, files, or media.

The launch policy should not discuss the following as collected unless the final release audit shows otherwise:

- audio recordings, microphone data, or transcripts;
- precise GPS or background location;
- photo-library, camera, or video data;
- email inbox contents;
- contacts or calendar contents;
- bank-account or payment-card credentials;
- team membership, employee monitoring, roles, or shared-workspace activity;
- connected-service tokens or imported integration data; or
- AI prompts, AI outputs, or disclosure to an AI provider.

If useful for clarity, the policy may state a short set of especially important non-collection facts. Avoid a long negative roadmap list that will become stale.

## Illinois legal and entity-position plan

### Company description

Formation or registration of an LLC is not the same as a professional, occupational, or product license. The privacy policy does not need to claim that FieldSolo is “licensed in Illinois.”

Use one of the following only after confirming the Secretary of State record or formation documents:

- **Preferred if Veltri Ventures LLC was formed in Illinois:** “FieldSolo is operated by Veltri Ventures LLC, an Illinois limited liability company.”
- **If it was formed elsewhere but registered in Illinois:** identify Veltri Ventures LLC as the operator and, only if useful, say it is registered to do business in Illinois.
- **Minimum sufficient wording:** “FieldSolo is operated by Veltri Ventures LLC.”

Do not use “licensed,” “Illinois-licensed,” “incorporated,” or “registered DBA” unless that distinct statement is independently true. LLC formation state is an operator-identity fact, not a privacy right and not governing-law language.

### Illinois privacy-law treatment

Do not add a separate Illinois-residents section merely because Veltri Ventures LLC is based or formed in Illinois. As of July 20, 2026, Illinois has not enacted a general consumer privacy statute comparable to the comprehensive laws in several other states. SB 340 passed the Illinois Senate but remained pending in the House; other 2026 privacy proposals also had not become law. Monitor pending legislation before launch and during the recurring legal review.

The currently relevant Illinois requirements should shape operations and narrowly tailored policy language:

- **Personal Information Protection Act (PIPA), 815 ILCS 530:** maintain reasonable security for Illinois residents' personal information, require reasonable security in applicable disclosure contracts, securely dispose of personal information, and maintain a breach-notification process. These are principally security, vendor-contract, disposal, and incident-response obligations; they do not require FieldSolo to advertise itself as Illinois-licensed.
- **Biometric Information Privacy Act (BIPA), 740 ILCS 14:** ordinary voice dictation or a recording is not automatically a “voiceprint.” BIPA becomes a specific launch issue if FieldSolo collects or derives a voiceprint or another biometric identifier/information for identification. Do not add a biometric section for ordinary text entry, operating-system dictation where FieldSolo receives only text, or non-identification audio processing without a separate legal analysis.

The policy's measured security, retention/deletion, vendor-disclosure, and incident-response descriptions should be consistent with these Illinois obligations without implying that a policy paragraph by itself satisfies the operational requirements.

Primary references:

- Illinois Secretary of State Business Services: <https://www.ilsos.gov/departments/business-services.html>
- Illinois Personal Information Protection Act: <https://www.ilga.gov/Legislation/ILCS/Articles?ActID=2702&ChapterID=67>
- Illinois Biometric Information Privacy Act definition: <https://www.ilga.gov/documents/legislation/ilcs/documents/074000140k10.htm>
- SB 340 status: <https://www.ilga.gov/Legislation/BillStatus?DocNum=340&DocTypeID=SB&GAID=18&SessionID=114>

## Policy architecture and section-by-section plan

### 1. Title, effective date, and policy version

Include:

- **FieldSolo Privacy Policy**;
- the initial effective date;
- a machine-readable policy version that matches the app, website, and database acceptance record; and
- no statement about replacing a previous policy.

### 2. Operator and scope

State that FieldSolo is operated by Veltri Ventures LLC. If its Illinois formation is confirmed, use “an Illinois limited liability company,” not “licensed in Illinois.” Define the covered Services to include only current surfaces:

- `fieldsolo.com` and the waitlist;
- FieldSolo's iOS and Android applications;
- account, privacy, and customer-support interactions; and
- other current FieldSolo services that link directly to the policy.

Explain that third-party services have their own privacy practices when a user leaves FieldSolo or independently interacts with them.

### 3. User relationships and customer information

Use simple present-day definitions:

- **User:** the individual who creates and uses a FieldSolo account.
- **Customer Information:** information a user enters about the user's own customer or job.
- **User Content:** job records, notes, materials, and other content the user enters into FieldSolo.

Explain that:

- users choose what customer information to enter;
- FieldSolo processes it to provide the service to the user;
- users are responsible for having appropriate authority to provide it; and
- a tradesperson's customer should generally direct a privacy request first to the tradesperson, while FieldSolo may assist where appropriate.

Do not define Account Owners, administrators, Authorized Users, team workspaces, or employee roles until those relationships exist in the product.

### 4. Information collected

Organize current collection into specific categories:

1. Waitlist and marketing information.
2. Account, authentication, profile, consent, and policy-acceptance information.
3. Customer and job information entered by users, excluding dormant fields that the current UI does not collect.
4. Live/manual work-session timestamps and timezone information.
5. Job-, session-, and Inbox-scoped notes and material entries, including later Inbox assignment.
6. Payment-status, revenue, material-cost, and derived earnings/completeness information.
7. Support, privacy-request, and other direct communications.
8. Mobile product analytics and diagnostics when configured and enabled with consent.
9. Website usage and technical information actually collected by the deployed analytics and hosting stack.

For each category, state the source and representative examples. Do not include optional/future feature categories.

### 5. How information is used

Limit purposes to those supported at launch:

- create, authenticate, and administer accounts;
- provide job capture, live and manual work-session tracking, Inbox quick capture and assignment, material tracking, earnings insights, and payment-status functionality;
- store, organize, retrieve, and display User Content;
- operate the waitlist and send consented early-access or product communications;
- provide support and fulfill privacy requests;
- maintain reliability, diagnose errors, and improve usability;
- secure accounts, prevent misuse, and enforce terms;
- comply with law and protect legal rights; and
- create and use aggregated or deidentified information only as approved below.

Remove operational statements about processing content for AI-assisted actions unless such a feature is included in the release covered by the policy.

### 6. Aggregated and deidentified information

This is a data-use decision, not merely a future-feature decision. Before drafting, approve one of these positions:

- **Recommended if intended from launch:** FieldSolo may create aggregated or deidentified information from current job economics and service-use data for product analytics, product improvement, research, and sufficiently aggregated benchmarks. State that FieldSolo will not attempt to reidentify it.
- **More conservative if not currently practiced:** limit the launch policy to aggregated service analytics and add benchmarking through a later policy update before beginning that use.

If benchmarking is approved from launch, operationally exclude direct identifiers, exact addresses, free-text notes, raw attachments, raw communications, and cohorts small enough to expose an individual user, customer, or business. Do not describe deidentified data as derived from voice, inbox, integration, photo, or AI data that FieldSolo does not yet collect.

### 7. User Content and ownership

The Privacy Policy should explain how User Content is processed. The Terms of Service should remain the primary contractual source for ownership and the service license.

During drafting:

- preserve the statement that users retain ownership of their User Content;
- ensure the Privacy Policy and Terms describe consistent processing purposes;
- remove “AI-powered features” from the current policy's license/use explanation unless AI is included in the covered release; and
- ask counsel whether the full license needs to be repeated in the Privacy Policy or should be summarized there and retained in the Terms.

### 8. Disclosure of information

Describe current recipient categories only:

- cloud hosting, database, authentication, and storage providers;
- website hosting and analytics providers;
- optional in-app analytics providers when the user has consented;
- email or support providers actually used;
- professional advisers where necessary;
- legal authorities or other parties for law, safety, security, or enforcement;
- a successor in a merger, financing, acquisition, reorganization, bankruptcy, or asset sale; and
- other recipients specifically directed by the user.

Remove AI-provider, future-integration, future-export, and future-team-sharing examples until they exist. Verify important provider protections before promising equivalent safeguards.

### 9. Sale, targeted advertising, and marketing

If still accurate, state:

- FieldSolo does not sell personal information;
- FieldSolo does not share personal information for cross-context behavioral advertising;
- FieldSolo does not use Customer Information to market to a user's customers;
- users may unsubscribe from promotional email; and
- necessary transactional or service communications may continue while an account remains active.

Revisit this section before adding retargeting pixels, advertising networks, sponsored audiences, or other cross-service advertising activity.

### 10. Analytics choices

Clearly separate:

- website analytics needed to understand marketing-site traffic; and
- optional in-app product analytics that remains disabled until the user affirmatively agrees.

Explain how users withdraw in-app analytics consent and what withdrawal does. Confirm whether historical provider data is deleted, retained, or merely stops receiving new events before making a promise.

### 11. Retention and deletion

Use a mixture of category-specific periods and defensible criteria:

- account and job data retained while the account is active;
- active-system account and User Content deletion completed within 30 days of a verified deletion request;
- backup copies expiring through the confirmed provider backup cycle, with a 90-day maximum only if operationally verified;
- waitlist records removed after a verified request, subject to a minimal suppression or compliance record if needed;
- consent and legal-acceptance records retained as needed to document compliance;
- security, diagnostic, support, and legal records retained only for their justified period; and
- deidentified information retained only when it no longer reasonably identifies a person, customer, or business.

The deletion process may be manual. The operational requirements are a discoverable request path, prompt acknowledgment, identity verification, a tracked deadline, consistent deletion steps, and completion confirmation.

### 12. Privacy choices and rights

Continue offering a practical nationwide baseline, subject to verification and lawful exceptions:

- access;
- correction;
- deletion;
- export or portability of eligible information;
- analytics withdrawal;
- marketing withdrawal;
- authorized-agent requests where applicable; and
- appeal of a denied privacy request.

Explain the available in-app and external request paths. Avoid suggesting that every state statute applies to FieldSolo regardless of thresholds.

### 13. Cookies and website tracking

Identify the actual website analytics and hosting technology, the information it receives, its purpose, and available controls. Confirm whether cookies or similar identifiers are used.

Do not include reCAPTCHA or another anti-bot provider unless it is actually deployed. Do not promise support for Global Privacy Control or another signal unless FieldSolo detects and honors it as described.

### 14. Security

Use measured language describing reasonable administrative, technical, and organizational safeguards. Confirm any example before including it, such as:

- encryption in transit;
- authentication and access controls;
- row-level database authorization;
- restricted administrative or service-provider access; and
- backup or monitoring practices.

Do not claim that FieldSolo is completely secure or use undefined marketing phrases such as “bank-level security.”

### 15. Children

State that FieldSolo is business software for adults and is not directed to children. Align the minimum age and contract-capacity wording with the Terms of Service.

### 16. Changes to the policy

State that FieldSolo may update the policy as its practices, Services, and legal obligations change. The section should commit to:

- posting the new effective date and policy version;
- additional email, in-app, or similarly conspicuous notice for material changes;
- obtaining renewed or feature-specific consent when required; and
- applying new uses to previously collected information only after appropriate review and, where necessary, affirmative permission.

Do not rely solely on continued use as consent to a materially expanded data practice.

### 17. Contact information

Identify:

- Veltri Ventures LLC as the operator of FieldSolo;
- `privacy@fieldsolo.com` for privacy questions and requests; and
- a valid business mailing address if counsel determines it should appear in the public policy.

## Voice dictation launch gate

Voice dictation is the most likely near-term feature to require a targeted policy update. Do not add generic voice/AI language until the implementation answers the following questions.

### Design questions

1. Is dictation supplied entirely by the operating-system keyboard, with FieldSolo receiving only text?
2. Does FieldSolo itself request microphone permission or receive audio bytes?
3. Is processing performed on-device or transmitted to a transcription provider?
4. Which provider receives audio, transcripts, prompts, identifiers, or metadata?
5. Is raw audio stored by FieldSolo or the provider? If so, for how long?
6. Is the transcript stored as an ordinary job note or used only transiently?
7. Can provider personnel access content for support, abuse review, or quality assurance?
8. Can the provider use content to train or improve a general-purpose model?
9. Can users delete both the transcript and any retained audio?
10. Could the recording contain a customer's or bystander's voice, and what recording notice is needed?
11. Is any audio or derived representation used to identify a speaker? If so, stop and conduct a specific Illinois BIPA review before implementation.

### Policy outcome

- **Operating-system dictation only:** if FieldSolo receives only the resulting text and does not receive audio, describe the stored text under existing User Content. Do not claim that FieldSolo collects voice recordings merely because the system keyboard offers dictation.
- **FieldSolo-managed transcription:** before enabling the feature, add specific audio/transcript collection, purpose, provider disclosure, retention, deletion, security, and user-control language.
- **AI-assisted transformation beyond transcription:** additionally disclose what existing job/customer content is sent, how outputs are used, provider model-training terms, and whether a user must affirmatively invoke each action.

### Product and store requirements

If FieldSolo accesses the microphone or transmits audio:

- present a clear just-in-time explanation before the system permission request;
- request access only when the user starts dictation;
- show an unmistakable recording state and stop control;
- provide a non-voice entry path;
- update Apple App Privacy and Google Play Data Safety answers before release;
- update the policy before collection begins; and
- determine whether a policy-version notice, feature-specific consent, or both are appropriate.

## Future-feature release gates

These items stay in this internal plan until a release is being designed. They are not launch-policy content.

### Photos, camera, video, files, invoices, and receipts

- Select the minimum-access system picker where practical.
- Document file metadata, storage provider, human access, retention, deletion, and backup behavior.
- Extend account deletion to remove storage objects as well as database metadata.
- Update policy and store disclosures before release.

### Teams and shared workspaces

- Define Account Owner, administrator, and Authorized User roles only after the access model exists.
- Decide who owns, views, exports, and deletes workspace records.
- Explain what happens to contributed data when a person leaves a team.
- Review employee monitoring, session, earnings, and location visibility before enabling it.
- Update the Terms, Privacy Policy, permissions UX, and store disclosures together.

### Connected services and integrations

- Document data scopes, tokens, records imported or exported, synchronization behavior, recipient privacy terms, disconnection, and deletion.
- Use least-privilege OAuth scopes.
- Explain that disconnecting stops future access but may not delete already imported information.
- Review each integration rather than relying on a generic advance authorization.

### Email import

- Distinguish forwarding selected messages from granting mailbox access.
- Document message fields, attachment processing, search scope, storage, support access, retention, and deletion.
- Review Google or Microsoft restricted-use requirements before implementation.
- Do not use connected-mailbox data for unrelated benchmarking, advertising, or general-purpose AI training without separate legal and product review.

### Location and GPS

- Distinguish approximate, precise, foreground, and background location.
- Define the exact purpose and visibility to other users.
- Prefer foreground or one-time access unless background collection is essential.
- Provide a manual alternative where practical.
- Add prominent in-app disclosure and update policy/store declarations before release.

### AI features

- Identify each input, output, provider, purpose, retention term, human-review path, and model-training term.
- Require explicit user invocation for content-processing actions.
- Do not allow raw User Content to train a third party's general-purpose model without a separately reviewed disclosure and affirmative agreement.
- Do not treat a broad policy clause as a substitute for feature-level notice.

### Payments, banking, and subscriptions

- Distinguish job-economics information entered by the user from payment credentials or bank data handled by a processor.
- Document whether FieldSolo receives full credentials, tokens, balances, or transaction records.
- Review processor terms, financial-data requirements, retention, deletion, and store disclosures before launch.

## Policy-update workflow

Run this workflow before every release candidate.

### Step 1: Identify privacy-impacting changes

Review the product diff, SDK/dependency changes, app permissions, backend schema, storage, vendors, environment variables, website tags, and administrative workflows.

### Step 2: Complete a data-flow record

For every new or changed practice, record:

- data category;
- data subject: user, user's customer, employee/team member, or visitor;
- source;
- collection trigger;
- required or optional status;
- purpose;
- FieldSolo systems receiving it;
- external recipients;
- location of processing;
- retention and deletion;
- user controls;
- security/access model; and
- whether previously collected data will be used in the new way.

### Step 3: Classify the change

- **No policy change:** the feature uses already disclosed data for the same disclosed purpose, recipients, retention, and visibility.
- **Clarifying update:** wording becomes clearer without expanding collection, use, disclosure, or retention.
- **Prospective policy update:** a new feature collects a new category or uses/discloses data differently, but only after the new policy and notice take effect.
- **Material change:** the change is sensitive, unexpected, materially expands use or sharing, affects previously collected data, or changes user control. Provide conspicuous notice and obtain affirmative consent where required.
- **Legal-review trigger:** biometrics, background location, full mailbox access, financial-account data, targeted advertising, sale/sharing, general-purpose AI training, children's use, international expansion, or another high-risk category.

### Step 4: Update every disclosure surface

As applicable, update:

- `docs/legal/privacy-policy.md`;
- the published website privacy page;
- in-app privacy links and policy-version constants;
- signup or reacceptance records;
- feature-specific just-in-time notices;
- Apple App Privacy answers;
- Google Play Data Safety answers;
- permission descriptions;
- the service-provider inventory; and
- Terms of Service language where ownership, authority, or third-party services are affected.

### Step 5: Determine notice and consent

Choose deliberately among:

- no new notice for a non-substantive clarification;
- effective-date update and public posting;
- email or in-app notice;
- versioned policy reacceptance;
- feature-specific affirmative consent; and
- separate consent before applying a new use to previously collected data.

A feature-specific consent may be more appropriate than blocking all app access when the new practice is optional. A material change to core processing may justify policy reacceptance.

### Step 6: Verify before enabling the feature

Confirm that the shipping binary and deployed services match the approved data-flow record, policy, permission prompts, provider configuration, retention behavior, deletion path, and store declarations. Do not enable the feature flag or production integration until this verification passes.

### Step 7: Preserve an audit record

Archive:

- the prior and new policy versions;
- effective dates;
- approval and legal-review notes;
- notices delivered;
- consent or acceptance version;
- provider review; and
- release/version associated with the change.

## Initial revision deliverables after approval

Approval of this plan will authorize a documentation-only drafting pass unless the user separately approves implementation changes.

The next pass will:

1. Rewrite `docs/legal/privacy-policy.md` according to this plan.
2. Remove speculative future-feature and unlaunched AI language.
3. Preserve accurate current practices, nationwide user-request controls, account-deletion commitments, and measured security language.
4. Resolve the aggregated/deidentified benchmarking position selected during approval.
5. Leave the published website policy, mobile app, backend, Terms, store forms, and provider configuration unchanged until separately approved.
6. Provide a section-level summary of changes and flag any factual or legal questions that must be resolved before publication.

## Publication and implementation checklist

After the revised Markdown policy receives approval:

- synchronize the approved text to the website privacy page;
- update policy version and effective date consistently across Markdown, website, mobile app, tests, and consent records;
- verify the public privacy and account-deletion URLs;
- verify the deployed website analytics facts;
- confirm Supabase backup and deletion behavior before retaining the 90-day backup promise;
- confirm enabled analytics-provider configuration and deletion behavior;
- test signup acceptance, material-version reacceptance, analytics opt-in/withdrawal, policy links, and account deletion;
- review Apple App Privacy and Google Play Data Safety answers against the release candidate; and
- obtain counsel's final review before treating the policy as launch-ready.

## Approval checklist

Approve or revise these decisions before the policy drafting pass:

- [ ] Public policy describes current practices only.
- [ ] Operator wording says “Illinois limited liability company” only after the formation record is confirmed; it does not say “licensed in Illinois.”
- [ ] No separate Illinois-residents section is added solely because the operator is based or formed in Illinois; PIPA duties remain operational requirements and pending Illinois privacy legislation is monitored.
- [ ] Optional/future feature list is removed.
- [ ] Voice dictation is excluded until its data flow is finalized, unless it will ship in the same release as the initial policy.
- [ ] Teams, GPS, email import, integrations, media uploads, payments, and generalized AI remain internal release gates.
- [ ] User Content ownership remains explicit; counsel will decide whether the full service license belongs in both the Privacy Policy and Terms.
- [ ] Aggregated/deidentified use follows the approved launch position: current analytics/product improvement only, or analytics plus narrowly designed benchmarking.
- [ ] Manual deletion completed within 30 days remains the operational commitment.
- [ ] The 90-day backup-expiration commitment remains provisional until verified against the production provider configuration.
- [ ] Material changes receive additional notice and renewed or feature-specific consent when appropriate.
- [ ] The final data inventory covers the currently implemented Home, Jobs, Job Detail, live/manual Sessions, Notes, Materials, Inbox, Earnings, Profile, Privacy Choices, legal reacceptance, analytics-consent, and account-deletion flows.
- [ ] The dormant attachments schema is not described as current file/media collection unless an upload path is implemented before launch.
- [ ] The first post-approval change is limited to `docs/legal/privacy-policy.md` unless broader implementation is separately authorized.
