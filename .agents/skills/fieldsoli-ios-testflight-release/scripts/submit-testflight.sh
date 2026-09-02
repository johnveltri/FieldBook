#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$repo_root/apps/mobile-expo"

# release-env.js validates hosted production Supabase and analytics settings.
# Running through env:exec supplies those EAS-managed values without writing
# them into the repository's local environment files.
exec npx eas-cli@latest env:exec production \
  "npx eas-cli@latest build --platform ios --profile production --submit --non-interactive" \
  --non-interactive
