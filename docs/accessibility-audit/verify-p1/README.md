# P1 native verification matrix

Captured 2026-07-23 against worktree `p1g8` (tokens + flat canvas + touch targets + XXXL reflow), Expo Go on Metro `:8083`.

## Devices

| Device | Role |
| --- | --- |
| iPhone 17 Pro Max (iOS 26.1) | Default + Accessibility XXXL |
| iPhone 16e | Compact width |
| Android emulator (`sdk_gphone16k_arm64`, 1080×2424) | Font scale 100% / 135% / 200% |

## Screenshots

| File | Condition |
| --- | --- |
| `01-iphone17promax-default.png` | Home, default Dynamic Type (pre-touch) |
| `01b-iphone17promax-default-after-touch-fix.png` | Home default after 44pt + reflow |
| `02-iphone16e-compact.png` | Home, compact |
| `03-iphone17promax-a11y-xxxL-home.png` | Home XXXL before reflow (clipped) |
| `03b-iphone17promax-a11y-xxxL-home-after-fix.png` | Home XXXL after reflow |
| `04-…-landscape-attempt-portrait-locked.png` | Landscape attempt — app `orientation: portrait` |
| `05-iphone17promax-jobs.png` | Jobs / Job Detail, default |
| `06-iphone17promax-earnings.png` | Earnings, default |
| `07-iphone16e-home-recheck.png` | Compact home recheck |
| `10/11/12-android-font-*-home.png` | Home at 100 / 135 / 200% |
| `13-android-jobs.png` | Jobs @ 100% |
| `14-android-earnings.png` | Earnings @ 100% |
| `16-android-job-detail.png` | Job Detail @ 100% |

## Results vs P1 acceptance

Pass:
- Flat warm canvas (no ruled lines)
- AA contrast tokens + larger type at default size
- Compact iPhone 16e intact
- Android 100/135/200 matrix (200% wraps / shortens labels)
- Touch targets ≥44pt (tabs, inputs, icon hits)
- XXXL mid-glyph clipping fixed for section titles / metric labels (`03` → `03b`); content grows and scrolls instead of slicing letters

N/A / remaining:
- Landscape: app locks portrait in `app.json`
- Sign In not re-captured (authenticated session)
- At XXXL, metric value / Needs Attention sit below the fold (scroll) — expected with larger type

## Reset after run

- iOS content size → `large`
- Android `font_scale` → `1.0`
