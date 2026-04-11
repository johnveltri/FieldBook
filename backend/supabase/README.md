# Supabase (Fieldbook backend)

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
