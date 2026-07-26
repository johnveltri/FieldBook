# Supabase (FieldSolo backend)

This folder is the **source of truth** for schema and local tooling. Remote Supabase projects use the same migrations via `db push` / CI.

## Layout

- `config.toml` — local stack (API, DB, Studio ports, etc.).
- `migrations/` — ordered SQL migrations (apply to hosted project with `supabase db push` after linking).
- `seed.sql` — optional demo rows after `db reset`.

## CLI commands (from repo root)

Supabase CLI treats **`backend`** as the project root (the directory that contains this `supabase/` folder).

```bash
# Start local Postgres + API + Studio (requires Docker)
npx supabase start --workdir backend

# Stop local stack
npx supabase stop --workdir backend

# Reapply migrations + seed
npx supabase db reset --workdir backend
```

## Hosted project

1. Create a project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Link the CLI: `npx supabase link --workdir backend` (project ref + DB password).
3. Push schema: `npx supabase db push --workdir backend`.

## Env for `apps/mobile-expo`

Use the project **Project URL** and **anon public** key as:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Local defaults after `supabase start` are shown in the CLI output (`API URL` and `anon key`).

## Env for `apps/marketing`

The waitlist form submits through a server-side route handler using the **service role** key (never expose as `NEXT_PUBLIC`):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WAITLIST_RATE_LIMIT_SALT` (a random server-only secret used to hash IP addresses for abuse prevention)

See [`apps/marketing/.env.example`](../apps/marketing/.env.example). Local values come from `npx supabase status --workdir backend`.

## Waitlist signups

Marketing waitlist rows live in `public.waitlist_signups`. RLS is enabled with **no policies**, so anon/authenticated clients cannot read or write the table. Inserts happen only via the marketing app's `/api/waitlist` route (service role). The route uses a honeypot, same-origin checks, strict payload limits, and an atomic per-IP hash rate limit. View, filter, export, and update `status` (pending/invited/converted) in Supabase Studio.

The Expo app still uses the publishable anon key for Supabase Auth and session refresh. Shared
schema migrations no longer grant direct public-table access to the `anon` role.

## Storage buckets

New attachment rows default to the Supabase Storage bucket named `fieldsolo`. Existing attachment
rows can still reference their original bucket value. Before pushing the FieldSolo storage default
migration to a hosted project, create or confirm the `fieldsolo` bucket in Supabase Storage.

## Jobs in the app

Job Detail loads **`fetchFirstJobIdForCurrentUser`** → **`fetchJobDetail`**: only rows the **authenticated user** can see under RLS (typically **`jobs.user_id = auth.uid()`**). If none exist, the UI shows **no jobs**. `seed.sql` is intentionally empty by default; create real user-owned jobs in local dev.

For active client tables (`sessions`, `notes`, `job_costs`), authenticated reads/writes require both:
- row ownership (`user_id = auth.uid()`)
- parent ownership (referenced `job_id` / `session_id` resolves to rows owned by `auth.uid()`)

`job_costs` is the generalized storage table; the launch UI writes and displays only
`cost_type = 'material'`. Attachments and activity events remain inaccessible to app roles until
their features and policies are implemented. Client hard deletes are disabled; normal deletion is
performed through the existing soft-delete fields.

There is no seed-demo bypass policy or demo-claim RPC in the shared schema.

## Local-only open table access

Shared migrations are secure by default. If you need the old local debugging behavior where the
`anon` role can read/write public tables directly, apply
[`snippets/enable_local_anon_table_access.sql`](./snippets/enable_local_anon_table_access.sql)
manually in local Studio SQL or `psql`.

To revert to the secure default, reset the local database:

```bash
npx supabase db reset --workdir backend
```

## Authentication (email / password only)

**Local (`config.toml`):** SMS signup is off (`[auth.sms]` / `enable_signup = false`); OAuth blocks like `[auth.external.apple]` stay `enabled = false`. Email signup is on under `[auth.email]`. Confirmations default to off locally (`enable_confirmations = false`) so new users can sign in immediately—turn confirmations on for production-like testing if needed. Passwords must contain at least eight characters.

**Hosted:** In the [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Providers**, disable every provider except **Email** (disable Phone, Apple, Google, and any others you do not use). Under **Email**, enable “Email” / password sign-in as required by your app.

## Edge Function: `delete-account`

The mobile app calls `delete-account` to remove the authenticated user. When PostHog analytics is enabled in production, set these **function secrets** (Project Settings → Edge Functions → Secrets) so account deletion also queues PostHog person/event removal:

- `POSTHOG_PERSONAL_API_KEY` — personal API key with person delete scope (never ship to the client)
- `POSTHOG_PROJECT_ID` — numeric project id from PostHog project settings
- `POSTHOG_API_HOST` — optional; defaults to `https://us.posthog.com` (API host, not the capture/ingestion host)

If the PostHog secrets are absent, account deletion still succeeds; analytics cleanup is skipped locally.
