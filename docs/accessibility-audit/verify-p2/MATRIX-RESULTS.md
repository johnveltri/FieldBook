# P2 native matrix results

Recorded: 2026-07-24 (post P2 semantics + follow-up truncation / font-scale-cap cleanup)

## Automated gate

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass (2026-07-24) |
| `npm run test:mobile` | pass — 126 tests (2026-07-24) |
| Design-system contrast tests | `packages/design-system/lib/contrast.test.ts` |

## Matrix cells

| ID | Platform | Device / settings | Evidence | P2 walk |
| --- | --- | --- | --- | --- |
| ios-default | iOS | iPhone 17 Pro Max (iOS 26.1), default text | [ios-default-home-smoke.png](./ios-default-home-smoke.png) | Smoke capture on booted simulator. **Release gate:** VoiceOver heading/sheet pass still required before ship. |
| ios-a11y | iOS | iPhone 17 Pro Max, Accessibility XXXL | pending dedicated capture | Enable Settings → Accessibility → Display & Text Size → Larger Text (XXXL); repeat screen checklist with VoiceOver. Font-scale caps removed so XXXL should grow uncapped. |
| ios-compact | iOS | iPhone 16e (iOS 26.1), default | [ios-compact-home-smoke.png](./ios-compact-home-smoke.png) | Smoke capture; VoiceOver spot-check on Auth + Jobs still required. |
| android-100 | Android | emulator-5554, 100% font scale | [android-100-home-smoke.png](./android-100-home-smoke.png), [android-100-home-uiautomator.xml](./android-100-home-uiautomator.xml) | UIAutomator dump confirms labeled controls (`Profile`, tabs, `Quick capture`, job row labels). **Release gate:** full TalkBack gesture walk still required. |
| android-200 | Android | emulator-5554, 200% font scale | [android-200-home-smoke.png](./android-200-home-smoke.png), [android-200-home-post-cap-cleanup.png](./android-200-home-post-cap-cleanup.png), [android-200-home-uiautomator.xml](./android-200-home-uiautomator.xml) | Font scale via `settings put system font_scale 2.0`; dump + screenshot after removing font-scale caps. **Release gate:** TalkBack walk still required. |

## Code-backed fixes in this build

- Screen titles expose `accessibilityRole="header"` (Home brand, tab screens, job detail title, auth).
- Job Detail **Change job status** control labeled; Quick Capture tiles labeled.
- Sign-up subtitle is mode-aware; auth errors call `AccessibilityInfo.announceForAccessibility`.
- Bottom sheets use `accessibilityViewIsModal` and optional open announcement via `accessibilityTitle`.
- Audit plan updated for portrait-only verification (landscape out of scope).
- Removed `maxFontSizeMultiplier` / `dynamicTypeTextStyle` `maxScale` caps (bottom nav, section headers, metric card, Home brand).
- Removed critical `numberOfLines={1}` truncation across sheet titles, chooser rows, attachment names (kept only Quick Capture tile tokens + metric currency value).
- Removed unused mobile `CONTENT_MAX_WIDTH` / `TOP_HEADER_MAX_WIDTH` exports.
- Help + Jobs/Inbox/Earnings empty/loading messages on CanvasWarm use primary text when they are the main message.

## VoiceOver / TalkBack checklist (manual — release gate)

Use [README.md](./README.md) acceptance bullets on each matrix cell before marking the cell **done**. This cannot be fully automated from the agent environment; mark each cell done only after a human (or instrumented) screen-reader walk.
