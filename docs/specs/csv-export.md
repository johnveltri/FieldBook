# Job Summary CSV Export

**Status:** Draft for review

**Version:** V1 proposal

**Last updated:** 2026-08-23

**Planning source:** [CSV Product Requirements Planning](chatgpt-conversation://6a7e4870-6908-83ea-906a-d191af6e810d)

## Summary

FieldSoli should let an authenticated user request a CSV summary of completed jobs for a selected calendar year. FieldSoli generates the file on the server, stores it temporarily in a private Supabase Storage bucket, and emails a secure download link to the user's verified account email address.

The export service is frontend- and delivery-agnostic. Mobile is the V1 requesting client and email is the V1 delivery adapter, but CSV generation, private artifact storage, request status, rate limiting, and cleanup must not depend on a mobile runtime or on email-specific state. A future authenticated web client can request the same artifact and add direct browser delivery without rebuilding the export pipeline.

The emailed link expires 24 hours after the email is accepted by the transactional email provider. Expired links stop working immediately. A recurring cleanup process permanently deletes the underlying CSV through the Supabase Storage API as soon as practical after expiration.

V1 is a job summary, similar in spirit to a Joist job export. It is intended for spreadsheets, sharing job-level records with an accountant, and moving core business records out of FieldSoli. It is not a Schedule C, tax return, invoice export, transaction ledger, or full account backup.

Estimated Tax Set-Aside is specified separately in [estimated-tax-set-aside.md](./estimated-tax-set-aside.md). It is not part of this feature or its CSV schema.

## Goals

- Give every user a free, human-readable export of completed job records for a selected year.
- Include the job-level information needed to review revenue, direct costs, earnings after direct costs, completion, and payment state.
- Preserve separate created, completed, and paid dates without presenting FieldSoli as tax-accounting software.
- Include every currently supported direct-cost type in a predictable column.
- Deliver the export to the user's verified account email without asking them to enter a recipient address.
- Keep artifact generation independent from the requesting frontend and delivery method.
- Protect customer and financial data with authenticated export requests, private storage, expiring bearer links, rate limits, and prompt permanent deletion.
- Make the file straightforward to open in Excel, Numbers, and Google Sheets.

## Non-goals

V1 does not include:

- Schedule C generation or tax-category mapping.
- Tax advice or a claim that the export contains everything needed to file taxes.
- Cash-basis or accrual-basis reporting logic.
- Arbitrary start/end date filtering.
- Not-started, in-progress, on-hold, or cancelled jobs.
- Individual work sessions or cost line items.
- Notes, photos, attachments, or receipt images.
- Quotes, invoices, payment transactions, refunds, or customer sales tax as separate records.
- Partial-payment history.
- A separate customer export.
- A ZIP or multi-file account archive.
- Import into FieldSoli or another product.
- Immediate authenticated web download; email is the only V1 delivery adapter.

Customer, note, attachment, quote, invoice, and payment portability can be specified as those product areas mature. They should not expand or block this V1.

## Export eligibility and year filtering

### Job eligibility

The export includes one row for each active job where:

- `job_work_status = completed`;
- `deleted_at` is null; and
- the job falls within the selected reporting year under the rule below.

Payment state does not determine eligibility. Both unpaid and paid completed jobs are included. A completed job is not omitted merely because its paid date is blank.

### Reporting-year rule

V1 defines the selected year by **completion date**. For a selected year and IANA time zone, include jobs where `completed_at` falls from local January 1 at 00:00:00 inclusive through the following local January 1 at 00:00:00 exclusive.

Created date and paid date remain separate CSV columns but do not control inclusion. A job completed in December and paid the following January appears in the completion-year export. This avoids silently claiming cash-basis tax treatment.

The request records one validated IANA time zone and uses it consistently for:

- year-boundary filtering;
- all three exported calendar dates; and
- the expiration time shown in the email.

`created_at`, `completed_at`, and `paid_at` are timezone-aware database timestamps. The CSV derives each corresponding calendar-date column from its timestamp in the request's reporting time zone and formats it as `YYYY-MM-DD`; it does not expose a time of day.

V1 may use the authenticated client's current IANA time zone at request time. The server treats it as validated request data, not as a mobile-device assumption. The request and confirmation UI should disclose the time zone. A persisted business time zone is a follow-on candidate.

## User experience

### Entry point

Recommended V1 location:

1. The user opens **Profile**.
2. Under a new **Your data** section, the user selects **Export Jobs CSV**.

A dedicated section is preferred over placing the action among password and logout controls because future customer and attachment exports can use the same area.

### Request flow

1. The screen explains that the CSV will include completed jobs for the selected year, including customer name, service address, job details, revenue, and costs.
2. The user selects one available calendar year.
3. The client performs an owner-scoped eligibility check for jobs completed in the selected calendar year, using the selected IANA reporting time zone.
4. If jobs exist for that year, the Export Jobs screen displays the verified account email that will receive the link.
5. The user selects **Request Export**.
6. FieldSoli submits an authenticated request.
7. After the request records and queue message are durably committed, the client immediately shows the confirmation screen.
8. If the successful client eligibility check finds no jobs for that year, the client shows the **No eligible jobs** screen.

The recipient email is never editable in this flow. It is resolved server-side from the authenticated Supabase Auth user, not accepted from the request body or user metadata.

The client eligibility check is a UX optimization, not an authorization or data-integrity boundary. The authenticated request endpoint must repeat the same owner-scoped eligibility check against authoritative server data before consuming rate-limit allowance or enqueueing work. This protects against stale client state, modified requests, and eligibility changes between the client check and submission.

### Confirmation screen

Required content:

> Export requested
>
> Your 2026 job export has been requested. It will be delivered to **name@example.com** within 15 minutes. The download link expires within 24 hours from receipt.
>
> CTA: "Back to Home"

The screen must state:

- the selected year;
- the exact verified account email address;
- the promise that delivery will occur within 15 minutes; and
- that the link expires within 24 hours from receipt.

The confirmation means the request was authenticated, rate-limit approved, stored durably, and queued. It does not mean the CSV has already been generated or the email provider has accepted the message.

The 15-minute promise is a conservative allowance for the queue, CSV generation, private upload, transactional email handoff, and bounded retries. The user does not need to keep FieldSoli open or wait for another in-app state.

The **Back to Home** CTA returns the user to Home. After a request is accepted, the requesting client disables **Export Jobs CSV** until the server-provided `next_request_allowed_at` timestamp. For V1, that timestamp reflects the server-enforced 15-minute request cooldown. The client must not calculate an independent hardcoded cooldown, and the server remains authoritative if another client submits a request.

### No eligible jobs

If a successful client eligibility check or the authoritative server check determines that the selected year has no eligible jobs, the client shows a simple message:

> No completed jobs found for 2026.
>
> CTA Primary: "Back to Home"

The app will not let the user request an export with no jobs.

### Failure

- Do not email a link until the complete CSV is stored successfully.
- Do not show the confirmation screen unless the request records and queue message were committed successfully.
- If the client eligibility check fails, do not treat the result as an empty year. Show **Couldn’t check for completed jobs. Try again.** and allow the user to retry.
- Retry transient generation, Storage, and email-provider failures through the background job system.
- After the retry limit is exhausted, mark the request failed, delete any generated object, alert operational monitoring, and let the user submit a new request.
- V1 does not add a second in-app failure state after a request has been confirmed.
- Use specific copy for hourly rate limiting and include the server-provided retry time.
- For synchronous failures before durable acceptance, show **Couldn’t request your export. Try again later.**

## Filename and email

### Filename

`fieldsoli-job-summary-YYYY.csv`

The object path must use server-generated identifiers rather than customer data, the user's email address, or the filename alone.

Recommended private object path:

`<user_id>/<export_request_id>/job-summary.csv`

### Transactional email

Recommended subject:

> Your 2026 FieldSoli job export is ready

The email should include:

- the selected year;
- one **Download CSV** button and a plain-text fallback link;
- the exact expiration date and time with time-zone abbreviation;
- a warning that anyone with the link can download the file until it expires;
- a note to ignore the email if the user did not request it; and
- support contact information.

The email must not include job names, customer information, financial totals, or any CSV contents.

Use the existing verified `fieldsoli.com` Resend setup, but create a separate domain-restricted API key for export email and store it only as an Edge Function secret. Use the Resend HTTPS API from the server rather than Auth email templates or SMTP from any frontend client. The recommended sender is **FieldSoli** `<noreply@fieldsoli.com>`.

## CSV schema

Columns are fixed and ordered. A future cost type may add a new column in a later schema version, but columns must never depend on which cost types happen to exist in one user's data.

| # | Column | Source or calculation | Format and null behavior |
|---:|---|---|---|
| 1 | `job_id` | `jobs.id` | UUID; always present. This identifies the job and is distinct from future quote or invoice IDs. |
| 2 | `job_description` | `jobs.short_description` | Text; always present. |
| 3 | `customer_name` | `jobs.customer_name` | Text; blank when absent. |
| 4 | `service_address` | `jobs.service_address` | Current formatted address string; blank when absent. V1 does not remodel it into separate address fields. |
| 5 | `work_status` | `jobs.job_work_status` | `completed` for V1 rows. Retained for clarity and forward compatibility. |
| 6 | `payment_status` | `jobs.job_payment_state` | `unpaid`, `partially_paid`, or `paid`; blank only when the source is null. V1 UI is still full-paid or unpaid, but the export preserves a valid stored partial state. |
| 7 | `created_date` | `jobs.created_at` (`timestamptz`) | Calendar date derived as `YYYY-MM-DD` in the request's reporting time zone. |
| 8 | `completed_date` | `jobs.completed_at` (`timestamptz`, new) | Calendar date derived as `YYYY-MM-DD` in the reporting time zone; always present for an included yearly-export row. |
| 9 | `paid_date` | `jobs.paid_at` (`timestamptz`, new) | Calendar date derived as `YYYY-MM-DD` only when current payment status is `paid`; otherwise blank. |
| 10 | `revenue` | `jobs.revenue_cents` | Decimal currency amount with two places and no currency symbol or thousands separator; blank when source is null. |
| 11 | `material_cost` | Sum of active `job_costs` where `cost_type = material` | Decimal currency amount with two places; `0.00` when there are no matching costs. |
| 12 | `helper_labor_cost` | Sum where `cost_type = helper_labor` | Same currency format. |
| 13 | `equipment_rental_cost` | Sum where `cost_type = equipment_rental` | Same currency format. |
| 14 | `permit_cost` | Sum where `cost_type = permit` | Same currency format. |
| 15 | `disposal_cost` | Sum where `cost_type = disposal` | Same currency format. |
| 16 | `travel_parking_cost` | Sum where `cost_type = travel_parking` | Same currency format. This is the current travel cost; V1 does not calculate mileage. |
| 17 | `other_cost` | Sum where `cost_type = other` | Same currency format. |
| 18 | `total_costs` | Sum of all seven cost columns | Decimal currency amount with two places. |
| 19 | `net_earnings` | `revenue - total_costs` | Decimal currency amount with two places; may be negative; blank when revenue is null. |

### Currency

V1 assumes the product's current single-currency behavior. Currency symbols are omitted from amount cells so spreadsheet tools recognize them as numbers. Multi-currency support requires a future schema change that adds an explicit currency code.

### Direct-cost aggregation

For each eligible job, include active cost rows that are linked either:

- directly to the job through `job_costs.job_id`; or
- to one of the job's active sessions through `job_costs.session_id`.

Rules:

- Exclude cost rows where `job_costs.deleted_at` is not null.
- Exclude cost rows attached to a deleted session.
- Exclude Inbox/unassigned cost rows that are not linked to the exported job or one of its sessions.
- Count each `job_costs.id` once even if data retrieval paths overlap.
- Treat each stored `total_cost_cents` as authoritative; do not recalculate quantity times unit cost during export.
- Keep all amounts in integer cents until final CSV formatting.
- Treat a missing category total as zero, not blank.

## Status timestamp requirements

The current schema has `created_at timestamptz`, but not dedicated completion or paid timestamps. V1 requires two nullable timezone-aware timestamp fields:

- `jobs.completed_at timestamptz`
- `jobs.paid_at timestamptz`

Required semantics:

- When a job transitions from a non-completed work status into `completed`, set `completed_at` to the transition time.
- Changing payment state while the job remains completed must not change `completed_at`.
- If a job leaves `completed` and later re-enters it, overwrite `completed_at` with the latest completion transition.
- When collection changes from less than full revenue to full revenue, set `paid_at` to the transition time.
- If a job becomes not fully paid, retain the stored timestamp for lifecycle continuity but export a blank `paid_date` while its current state is not `paid`.
- If the job later becomes fully paid again, overwrite `paid_at` with that latest transition.
- Status timestamp writes should be enforced at the data layer so they remain correct across current and future clients.

Existing jobs are not backfilled from `updated_at`, `last_worked_at`, activity events, or other inferred data. Missing history is preferable to a fabricated date.

## Secure delivery architecture

### Architecture boundary

The system has three independent responsibilities:

```text
Authenticated FieldSoli client
            ↓
Export request and status API
            ↓
CSV generation → private export artifact
            ↓
Delivery adapter
   ├── Verified-account email link (V1)
   └── Authenticated web download (future)
```

Artifact generation must end in a delivery-neutral `ready` state. Email token creation and email-provider calls happen only after the artifact is ready and belong to the V1 email delivery adapter. The generator must not require an email address, download token, browser, mobile runtime, or email-provider dependency.

### 1. Authenticated request endpoint

Any authenticated FieldSoli client may invoke a `request-job-export` Edge Function with JWT verification enabled. The V1 mobile client sends only the selected year and current IANA time zone. The server must:

- verify the Supabase Auth access token;
- fetch or otherwise obtain a currently valid authenticated user identity;
- resolve and freeze the recipient from the current verified Auth user's email;
- require a confirmed email address before accepting the request;
- validate the selected year and IANA time zone;
- reject arbitrary recipient emails, user IDs, object paths, or filenames from the client;
- repeat the owner-scoped eligibility check against authoritative server data and return a typed `no_eligible_jobs` result without consuming rate-limit allowance when the year is empty;
- perform an atomic rate-limit check;
- create one `job_export_requests` row and one linked `job_export_deliveries` row with the server-controlled V1 method `email`;
- enqueue a durable background job in the same atomic operation; and
- return the request ID, confirmation state, server-resolved recipient email, and server-calculated `next_request_allowed_at` timestamp.

The V1 client does not poll for completion. A status endpoint or owner-scoped RLS projection may still support diagnostics and future clients, but the confirmation response is sufficient for the V1 UI.

Client-controlled `user_metadata` must never be used for authorization. The client cannot choose its user ID, delivery method, recipient, object path, or filename in V1.

### 2. Durable generation job

Use a durable Supabase Queue rather than relying only on an in-memory background promise. A worker Edge Function should:

1. Claim one queued request with a visibility timeout.
2. Load the export request by server-generated ID.
3. Query only records whose `user_id` matches the request owner, even though the worker uses server privileges.
4. Generate the CSV deterministically.
5. Upload it to the private export bucket without overwrite/upsert.
6. Record artifact metadata and mark generation `ready`.
7. Permanently delete the generation queue message after success; otherwise retry with bounded exponential backoff.

The generation worker must be idempotent. Retrying the same request must not create multiple objects. It emits no email and creates no public or bearer download credential.

### 3. Delivery adapters

#### V1 email adapter

After generation reaches `ready`, a separate delivery worker must:

1. Confirm that the request owner still exists and the export has not been revoked or deleted.
2. Use the verified recipient address frozen by the request endpoint.
3. Create the email bearer token and expiration record.
4. Send the transactional email with an idempotency key derived from the export request ID.
5. Mark delivery `sent` only after provider acceptance.
6. Retry transient failures with bounded exponential backoff without generating another CSV.

The adapter must be idempotent. Retrying the same delivery must not create multiple active tokens or send duplicate messages. If the account email changes after the request is confirmed, the already-confirmed export still goes to the verified address shown on the confirmation screen.

#### Future authenticated web adapter

A future web client may reuse a `ready` artifact without an email token. An authenticated download endpoint would verify the user's current JWT, request ownership, artifact state, expiration, and rate limits, then issue a Storage signed URL valid for no more than 60 seconds.

That future adapter must preserve the same private bucket, ownership checks, artifact lifecycle, audit controls, and generation rate limits. It is not required for V1 and must not weaken the emailed-link controls.

### 4. Private Storage bucket

Create a dedicated private bucket such as `job-exports` with:

- public access disabled;
- no direct `anon` or `authenticated` upload, list, update, or delete policies;
- CSV MIME type restriction;
- a conservative maximum file size; and
- all operations performed by server-side functions using secrets that never ship in a frontend client.

No mobile or web client receives a Storage service-role or secret key or uploads the generated CSV.

### 5. Emailed download link

Do not place the raw 24-hour Supabase Storage signed URL in the email. Email a FieldSoli download URL containing a cryptographically signed, random bearer token in the URL fragment:

`https://fieldsoli.com/exports/download#token=<opaque_token>`

Requirements:

- Generate at least 256 bits of randomness with a cryptographically secure generator.
- Sign a versioned token with a dedicated server-side export-link signing secret and use constant-time signature comparison.
- Include no email address, user ID, job data, or other readable personal data in the token.
- Store only a SHA-256 hash of the complete token in the database for lookup and revocation.
- Never log the raw token, URL fragment, redemption request body, or resulting signed Storage URL.
- Bind the token to one export request and one object path.
- Set `expires_at` to exactly 24 hours after the email provider accepts the message.
- Allow multiple downloads until expiry; one-time use is intentionally avoided because email security scanners can pre-open links.
- Support server-side revocation before expiry.
- Rate-limit repeated download attempts by token hash and coarse source signal without storing raw IP addresses.

The fragment is not sent in the initial HTTP request. The FieldSoli download page must contain no third-party scripts or analytics. Its first-party code reads the fragment, immediately removes it from browser history with `history.replaceState`, and sends the token in the body of a `POST` request to the public redemption endpoint.

The redemption endpoint must validate the token signature, token hash, request state, revocation state, and `expires_at` before every download. If valid, it generates a Supabase Storage signed URL valid for no more than 60 seconds with download disposition. The page immediately navigates to that short-lived URL so the CSV download begins without another user action.

Use HTTPS only and return a restrictive Content Security Policy plus `Cache-Control: private, no-store` and `Referrer-Policy: no-referrer` from both the download page and redemption endpoint. Upload the CSV with a no-store/zero browser cache policy. Expired, revoked, malformed, or deleted links should return the same generic unavailable response so the endpoint does not reveal which tokens once existed.

This is intentionally similar to password-recovery link security—high entropy, server validation, short lifetime, no secret stored in plaintext—but it is a separate download-token system and must not reuse Supabase Auth recovery tokens.

### 6. Expiration and permanent deletion

The bearer link becomes invalid as soon as `expires_at <= now()`, independent of whether cleanup has run.

Hosted Supabase Storage does not currently support S3 `PutBucketLifecycleConfiguration` or `GetBucketLifecycleConfiguration`. Therefore V1's lifecycle policy is application-enforced:

- Supabase Cron invokes a protected `cleanup-job-exports` worker every minute.
- The worker finds expired or terminally failed export artifacts in bounded batches.
- It permanently deletes each object through the Supabase Storage API, never by deleting directly from `storage.objects` with SQL.
- It marks the request `deleted` only after the Storage API confirms deletion or confirms the object is already absent.
- Failed deletions remain retryable and trigger monitoring after a bounded delay.

Operational target: delete an expired CSV within one minute of link expiration in normal operation and alert if any object remains more than five minutes after expiration. Account deletion and explicit revocation should enqueue immediate deletion rather than waiting for the recurring sweep.

If Supabase later supports native bucket lifecycle configuration, it may be added as defense in depth, but application-level expiry validation remains authoritative.

## Rate limits and abuse controls

Recommended V1 limits:

- Minimum **15 minutes between accepted new export requests per authenticated user**.
- Maximum **3 new export requests per authenticated user per rolling hour**.
- Maximum **1 active queued or processing request per user and selected year**.
- Duplicate submissions for the same active request return its existing request ID and do not enqueue another job.
- Empty-year checks do not consume the allowance.
- A conservative global queue/concurrency limit protects the database and email provider during spikes.
- Download attempts receive a separate, higher limit so legitimate email-link scanners and repeat downloads do not consume export-generation quota.

The cooldown and rolling request limit must be enforced atomically on the server, not with client state or a read-then-write counter. A successful request returns the server-calculated `next_request_allowed_at`. A rate-limited request returns HTTP `429` with a consistent `Retry-After` value and does not enqueue work.

Rate-limit storage should contain the authenticated user ID or a keyed hash appropriate to the purpose, the time window, and a count. Do not use the account email as the rate-limit key. Expire rate-limit records promptly after they are no longer needed.

Because an authenticated user can export only their own RLS-protected data, this limit primarily prevents resource abuse and repeated email generation. It is not a substitute for ownership checks on every query.

## Database records and access control

Add a `job_export_requests` record with, at minimum:

- server-generated request ID;
- authenticated owner user ID;
- selected year;
- reporting IANA time zone;
- generation status (`queued`, `processing`, `ready`, `failed`, `deleted`);
- private object path;
- artifact deletion deadline;
- requested, processing, artifact-ready, failure, and deletion timestamps; and
- coarse generation failure code safe to show or aggregate.

Add a separate `job_export_deliveries` record with, at minimum:

- server-generated delivery ID;
- export request ID;
- delivery method (`email` for V1; server controlled);
- delivery status (`pending`, `processing`, `sent`, `failed`, `revoked`, `expired`);
- server-resolved verified recipient email snapshot;
- token hash for bearer-link delivery;
- delivery-created, sent, expiration, revocation, and failure timestamps;
- coarse delivery failure code; and
- email provider message ID for idempotency and support diagnostics.

Artifact fields remain valid independently of delivery fields. A future authenticated web adapter can create its own delivery/audit record without changing the generator or adding web-specific columns to `job_export_requests`. The artifact deletion deadline must never be earlier than an active delivery's expiry and is recalculated when a delivery is revoked or expires.

Do not store CSV contents or the raw bearer token in Postgres. The recipient snapshot is required so the confirmation copy and actual delivery cannot diverge. Treat it as sensitive, exclude it from analytics and operational logs, expose it only to the owning user's confirmation response, and remove it when the delivery metadata reaches its retention deadline.

If either table is in an exposed schema:

- enable RLS;
- allow authenticated users to select only their own minimal request and delivery status fields through an ownership-preserving relationship;
- do not grant authenticated insert, update, or delete access;
- perform state changes only through server-side workers; and
- prevent object path, token hash, provider identifiers, and internal error details from being returned to any frontend client.

Internal rate-limit and queue tables/functions should remain unexposed or have all `anon` and `authenticated` privileges revoked.

## CSV file contract and safety

- Encode the file as UTF-8 in a form that opens correctly in current Excel, Numbers, and Google Sheets.
- Use a standards-compliant CSV writer; quote and escape commas, quotes, and line breaks correctly.
- Use one header row and no title, metadata, subtotal, or disclaimer rows before the data.
- Protect spreadsheet users from formula injection in user-entered text fields that begin with spreadsheet formula characters.
- Preserve line breaks inside quoted text rather than corrupting adjacent rows.
- Sort rows deterministically by `completed_at` descending, then `created_at` descending, then `job_id` ascending.
- Generate the file only from rows owned by the authenticated request owner.
- Do not write CSV contents or sensitive row values to logs, traces, analytics, or error messages.

## Privacy and product language

The pre-export screen must state that the file may contain customer names, addresses, and financial information and that FieldSoli will temporarily store it and email a 24-hour download link to the account email.

The export is intentionally sent through configured subprocessors: Supabase Storage/Edge Functions and the transactional email provider. Product privacy disclosures and the subprocessor inventory must accurately cover this processing before launch.

Allowed positioning:

> Export completed job records for your spreadsheet, accountant, or your own files.

Avoid claims such as:

- “Everything you need to file your taxes.”
- “Tax-ready Schedule C.”
- “IRS-compliant tax report.”
- “Accounting profit.”

The file reports **earnings after direct costs**, not accounting net income or taxable profit.

## Product analytics and operational logging

Acceptable product events may include:

- export requested;
- export email accepted;
- export failed with a coarse error category;
- download completed; and
- selected year category or job-count bucket rather than exact sensitive values.

Do not send filenames, links, tokens, job/customer identifiers, descriptions, addresses, exact dates, exact money amounts, exact job counts, email addresses, or CSV contents to product analytics.

Operational logs may include request IDs, state transitions, latency, retry count, provider response class, and object-deletion confirmation. Raw tokens, signed URLs, full request URLs, CSV contents, and customer/job data must never be logged.

Monitor and alert on:

- any confirmed request not handed off to the email provider within 15 minutes;
- queue age and terminal failure rate;
- email-provider rejection rate;
- rate-limit rejection spikes;
- download endpoint abuse;
- expired objects awaiting deletion; and
- any cross-user authorization test failure.

## Acceptance criteria

### Year selection and CSV contents

- [ ] An authenticated Free-plan user can select an available calendar year and request an export.
- [ ] The request uses a disclosed, validated IANA reporting time zone.
- [ ] Every active job completed in the selected year is included exactly once, including completed unpaid jobs.
- [ ] Jobs completed outside the selected year and jobs in every other work status are excluded.
- [ ] Soft-deleted jobs, costs, and sessions are excluded.
- [ ] Job-linked and session-linked costs are aggregated into the correct fixed cost-type columns without duplicates.
- [ ] Totals and earnings are mathematically correct to the cent, including negative earnings.
- [ ] Created, completed, and paid dates follow the defined semantics and reporting time zone.
- [ ] The CSV renders only `YYYY-MM-DD` calendar dates derived from stored timezone-aware timestamps; it does not expose times of day.
- [ ] A currently unpaid or partially paid job has a blank paid date.
- [ ] Null text fields and null revenue are blank; real zero cost totals are `0.00`.
- [ ] CSV-special characters, Unicode, multi-line text, and formula-like user input do not corrupt or endanger the spreadsheet.
- [ ] The result opens correctly in Excel, Numbers, and Google Sheets.
- [ ] Large eligible histories are not truncated by API pagination or list-screen limits.

### Request and email flow

- [ ] Mobile and future web clients use the same authenticated export-request contract.
- [ ] The request body accepts only the selected year and validated IANA time zone in V1; delivery method and recipient are server controlled.
- [ ] The client eligibility check uses the selected year and reporting time zone, and only a successful empty result opens the **No eligible jobs** screen.
- [ ] A failed client eligibility check shows a retryable error and is never interpreted as an empty year.
- [ ] The server repeats the owner-scoped eligibility check before consuming rate-limit allowance or enqueueing work, regardless of the client result.
- [ ] CSV generation reaches a delivery-neutral `ready` state before email token creation or provider calls begin.
- [ ] Generation can be retried without creating a duplicate artifact, token, or email.
- [ ] The server derives and freezes the recipient from the currently authenticated, confirmed Auth user and rejects client-supplied recipients.
- [ ] The request records and queue message are committed atomically before confirmation is returned.
- [ ] The confirmation screen immediately displays the selected year, exact frozen recipient email, the promise of delivery within 15 minutes, and link-expiration language.
- [ ] The confirmation copy matches the approved wording exactly except for dynamic year and email values.
- [ ] V1 has no preparing, sent, or long-running status screen and requires no client polling.
- [ ] The user can close the requesting client immediately after confirmation while the durable background job completes.
- [ ] An accepted response includes `next_request_allowed_at`, and the requesting client disables **Export Jobs CSV** until that server-provided timestamp.
- [ ] Duplicate taps do not create duplicate jobs, files, or emails.
- [ ] An empty year creates no file, sends no email, and does not consume the hourly allowance.
- [ ] Transient failures retry safely; terminal asynchronous failures delete any generated object, alert operations, and allow a new request.

### Secure download and storage

- [ ] Generated files exist only in the dedicated private bucket and are inaccessible through public URLs or client list operations.
- [ ] Raw download tokens and signed Storage URLs are never stored in the database or logs.
- [ ] The emailed bearer token is versioned, cryptographically signed, has at least 256 bits of entropy, and only its SHA-256 hash is persisted.
- [ ] The token travels in the email URL fragment, is removed from browser history immediately, and is redeemed only through a POST body.
- [ ] The download page contains no third-party scripts or analytics and enforces a restrictive Content Security Policy.
- [ ] The bearer token becomes invalid exactly 24 hours after provider acceptance.
- [ ] A valid bearer token produces a Storage signed URL valid for no more than 60 seconds.
- [ ] No frontend client receives a Storage service-role or secret key.
- [ ] Expired, revoked, malformed, or deleted tokens return the same generic unavailable response.
- [ ] Multiple downloads work before expiry without being broken by email link scanners.
- [ ] A user cannot request, observe, email, sign, or download another user's export through any authenticated endpoint.
- [ ] Account deletion and explicit revocation enqueue immediate artifact deletion.

### Deletion lifecycle

- [ ] Cleanup runs every minute and deletes objects only through the Storage API.
- [ ] An expired link is rejected even if object deletion is delayed.
- [ ] Normal-operation deletion occurs within one minute after expiration.
- [ ] Objects remaining more than five minutes after expiration alert and continue retrying.
- [ ] Cleanup is idempotent and treats an already-absent object as successful deletion.
- [ ] Tests prove that deleting only a `storage.objects` metadata row is never used as cleanup.

### Rate limiting and resilience

- [ ] The server atomically permits at most three new export requests per user per rolling hour.
- [ ] A fourth request returns `429` and a usable retry time without enqueuing work.
- [ ] Only one active request exists per user/year combination.
- [ ] Worker retries are bounded, idempotent, and cannot send duplicate emails.
- [ ] Global concurrency is bounded so exports cannot overload Postgres, Storage, or the email provider.

### Status timestamps

- [ ] First transition into Completed captures `completed_at`.
- [ ] Paid/unpaid changes while work remains completed do not modify `completed_at`.
- [ ] Leaving and re-entering Completed replaces `completed_at` with the latest transition.
- [ ] First transition to fully paid captures `paid_at`.
- [ ] Leaving and re-entering fully paid replaces `paid_at` with the latest paid transition.
- [ ] No migration invents timestamps for historical jobs.

## Open review decisions

1. **Year basis:** Confirm that completion date controls the selected year. Paid date remains visible but does not move the row into the paid year.
2. **Entry point:** Confirm the new **Profile → Your data → Export Jobs CSV** location.
3. **Time zone:** Accept the authenticated client's IANA time zone captured at request time for V1, or add a persisted business time zone first.
4. **Hours:** Confirm that total work hours stay out of V1. Detailed sessions are out of scope either way; a single `total_hours` summary column could be added if portability requires it.
5. **Generation rate:** Confirm three requests per rolling hour. This is intentionally low because the operation sends email and creates a sensitive temporary artifact.
6. **Undeliverable email:** Decide whether a confirmed but bounced account email should direct the user to support or to a future change-email flow.

## Follow-on candidates

- Persisted business time zone.
- Authenticated direct download from a FieldSoli web client using the same ready artifact and a short-lived Storage URL.
- Paid-year or custom date-range filtering with explicit accounting-basis language.
- Reusable customer CSV export.
- Notes export after note portability requirements are settled.
- Individual and bulk attachment downloads.
- Quote, invoice, payment, sales-tax, refund, and partial-payment exports.
- Mileage tracking and mileage-specific tax records.
- Multi-currency export.
- A full account archive or machine-oriented data export.

## Supabase implementation references

- [Private Storage buckets and access model](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Serving private files with signed URLs](https://supabase.com/docs/guides/storage/serving/downloads)
- [Storage signed URL JavaScript reference](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl)
- [Supabase Storage S3 compatibility and unsupported lifecycle endpoints](https://supabase.com/docs/guides/storage/s3/compatibility)
- [Deleting Storage objects through the API](https://supabase.com/docs/guides/storage/management/delete-objects)
- [Scheduling Edge Functions with Supabase Cron](https://supabase.com/docs/guides/functions/schedule-functions)
- [Supabase Queues](https://supabase.com/docs/guides/queues)
- [Securing Edge Functions with authorization headers](https://supabase.com/docs/guides/functions/auth-headers)
- [Sending transactional email from an Edge Function](https://supabase.com/docs/guides/functions/examples/send-emails)
- [Rate-limiting Edge Functions](https://supabase.com/docs/guides/functions/examples/rate-limiting)
