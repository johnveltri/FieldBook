# P2 semantics verification — native simulator matrix

Portrait only. Run after P2 code changes land.

## Matrix

| ID | Platform | Device / settings | VoiceOver / TalkBack | Status |
| --- | --- | --- | --- | --- |
| ios-default | iOS | iPhone 17 Pro Max, default text | VoiceOver | smoke capture — see MATRIX-RESULTS.md |
| ios-a11y | iOS | iPhone 17 Pro Max, Accessibility XXXL | VoiceOver | pending VO walk |
| ios-compact | iOS | iPhone 16e (or SE-class), default | VoiceOver spot-check | smoke capture — see MATRIX-RESULTS.md |
| android-100 | Android | Pixel-class, 100% font scale | TalkBack | smoke capture — see MATRIX-RESULTS.md |
| android-200 | Android | Pixel-class, 200% font scale | TalkBack | smoke capture — see MATRIX-RESULTS.md |

## Walk order (each cell)

Auth → Home → Jobs → Job Detail → bottom sheets → Inbox → Earnings → Profile / Help / Privacy

## P2 acceptance checks

- Heading navigation finds the **screen title** before section headers (Home brand, JOBS, job title, etc.).
- Icon-only controls announce labels (Job Detail **Change job status**, Quick Capture tiles, Inbox, FAB).
- Status pills speak text labels, not color alone.
- Bottom sheets isolate background (`accessibilityViewIsModal`); scrim **Close bottom sheet** works.
- Keyboard-open sheets expose active field and Save/Cancel.
- Sign-up mode reads **Create an account with email and password**; validation errors are announced.
- Sign-in / sign-up mode toggle works under screen reader.

## Evidence

Add screenshots or screen recordings to this folder using the ID prefix, e.g. `ios-default-home-vo.png`.

## Automated gate (before native pass)

From repo root:

```bash
npm run typecheck
npm run test:mobile
```
