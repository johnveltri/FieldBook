---
name: fieldsoli-ios-testflight-release
description: Build and submit the current FieldSoli production iOS app to TestFlight with the EAS production environment, then verify EAS and App Store Connect status. Use when asked to ship a new FieldSoli iOS/TestFlight build; do not use for Android releases or App Store production review submission.
---

# FieldSoli iOS TestFlight Release

## Outcome

Submit one new FieldSoli production iOS build to TestFlight without allowing the local development environment to override the production release configuration. Report the release as separate, evidence-backed gates:

1. source and local validation;
2. EAS build;
3. EAS submission to App Store Connect; and
4. Apple processing and TestFlight availability.

Do not call the release TestFlight-ready until the final gate is confirmed.

## Release Boundary

- Use this skill only in the FieldSoli repository, from a clean, intended source commit. A current `main` checkout is a valid release source; do not create a release branch or edit source merely to ship a build.
- The user must explicitly authorize the EAS build and App Store Connect upload. A request such as “push a new version to TestFlight” is authorization. Read-only release checks are always safe.
- Treat the production environment values as EAS-managed. Never copy their values into `.env` files, source code, terminal output, chat responses, or `EXPO_PUBLIC_*` local files.
- Current production identity: project `@veltrija/fieldsolo`, bundle ID `com.veltriventures.fieldsoli`, App Store Connect app ID `6795385466`. Re-check `apps/mobile-expo/eas.json` and `apps/mobile-expo/app.json` before releasing if either was changed.

## Preflight

From the repository root:

1. Inspect `git status --short --branch` and `git log -1 --oneline`. Stop for direction if the working tree has unrelated changes or the intended source is ambiguous.
2. Run `npm ci` only when dependencies are absent or the checkout is dependency-less. Then run:

   ```bash
   npm run test -w mobile-expo -- --runInBand
   ```

3. Confirm EAS authentication:

   ```bash
   cd apps/mobile-expo
   npx eas-cli@latest whoami
   ```

4. Validate the dynamic Expo config using the remote production environment, without creating local env files:

   ```bash
   npx eas-cli@latest env:exec production \
     "EXPO_PUBLIC_APP_ENV=production npx expo config --json >/dev/null" \
     --non-interactive
   ```

   `eas env:exec` loads values stored in the EAS environment, but does not load
   `eas.json` build-profile `env` values. `EXPO_PUBLIC_APP_ENV=production` is a
   non-secret production-profile setting needed only to make this local config
   evaluation follow the same environment branch as the remote build.

`release-env.js` deliberately rejects a local Supabase URL during production config evaluation. If an ordinary `eas build` fails with that error, do not weaken the guard or export secrets locally: use the production-environment wrapper below.

## Build and Submit

Run the repository helper from the root:

```bash
.agents/skills/fieldsoli-ios-testflight-release/scripts/submit-testflight.sh
```

It executes the build inside `eas env:exec production`, which makes the EAS-managed production Supabase and PostHog variables available for both dynamic config evaluation and the remote build. `eas.json` owns `EXPO_PUBLIC_APP_ENV=production` and remote build-number auto-increment.

Capture the exact EAS build and submission IDs printed by the command. Do not create another build while either remains queued or in progress.

## Verify Each Gate

From `apps/mobile-expo`, poll the exact IDs until terminal:

```bash
npx eas-cli@latest build:view <build-id> --json
npx eas-cli@latest submit:view <submission-id> --json
```

- `FINISHED` build plus `FINISHED` submission proves the IPA was uploaded to App Store Connect. It does not prove Apple processing or tester availability.
- Query App Store Connect through EAS after the submission finishes:

  ```bash
  npx eas-cli@latest submit:status --platform ios --profile production --json
  ```

  Confirm the submitted build number has an Apple/TestFlight state appropriate for testing, such as `VALID` or `IN_BETA_TESTING`. Report any remaining Apple processing separately.
- If EAS reports a queue/outage while the build is healthy, keep polling the same build ID. Do not create a duplicate.
- If a completed build’s submission fails, inspect its terminal error. Retry submission of that completed build before rebuilding:

  ```bash
  npx eas-cli@latest env:exec production "npx eas-cli@latest submit --platform ios --profile production --latest --non-interactive" --non-interactive
  ```

## Completion Report

State the source commit, app version/build number, test result, EAS build ID and terminal status, submission ID and terminal status, and Apple processing/TestFlight state. If Apple is still processing, say the release has been uploaded but is not yet confirmed available to testers.
