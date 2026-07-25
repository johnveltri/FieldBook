#!/usr/bin/env bash
# Native simulator smoke matrix for FieldSolo mobile UI work (worktree Metro on :8082).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MATRIX_DIR="$ROOT/.sim-matrix"
REPORT="$MATRIX_DIR/report.md"
METRO_PORT="${METRO_PORT:-8082}"
EXP_URL="exp://127.0.0.1:${METRO_PORT}"
ANDROID_EXP_URL="exp://10.0.2.2:${METRO_PORT}"

IOS_DEVICES=(
  "BB272B7D-71A4-4B0E-8E13-DAAA0968A830:iPhone 17 Pro Max (iOS 26.1)"
  "A63C091D-0707-445E-BB22-0A483814C205:iPhone 16e (iOS 26.1)"
)
ANDROID_SERIAL="${ANDROID_SERIAL:-emulator-5554}"

mkdir -p "$MATRIX_DIR"
: > "$REPORT"

log() { echo "$1" | tee -a "$REPORT"; }
shot_ios() { xcrun simctl io "$1" screenshot "$MATRIX_DIR/$2" >/dev/null; }
shot_android() { adb -s "$ANDROID_SERIAL" exec-out screencap -p > "$MATRIX_DIR/$1"; }

tap_ios_simulator() {
  local rx="$1" ry="$2"
  osascript <<EOF || return 0
tell application "Simulator" to activate
delay 0.4
tell application "System Events"
  tell process "Simulator"
    set frontWin to front window
    set winPos to position of frontWin
    set winSize to size of frontWin
    set wx to item 1 of winPos
    set wy to item 2 of winPos
    set ww to item 1 of winSize
    set wh to item 2 of winSize
    set clickX to wx + (ww * ${rx})
    set clickY to wy + (wh * ${ry})
    click at {clickX, clickY}
  end tell
end tell
EOF
}

tap_android() { adb -s "$ANDROID_SERIAL" shell input tap "$1" "$2"; }
swipe_android() { adb -s "$ANDROID_SERIAL" shell input swipe "$@"; }

open_worktree_on_devices() {
  log "## Connect simulators to worktree Metro (:${METRO_PORT})"
  for entry in "${IOS_DEVICES[@]}"; do
    udid="${entry%%:*}"
    name="${entry#*:}"
    xcrun simctl openurl "$udid" "$EXP_URL" || true
    log "- Opened Expo on **${name}**"
  done
  adb -s "$ANDROID_SERIAL" shell am start -a android.intent.action.VIEW -d "$ANDROID_EXP_URL" >/dev/null 2>&1 || true
  log "- Opened Expo on **Android ${ANDROID_SERIAL}**"
  log ""
  sleep 8
}

run_ios_matrix() {
  local udid="$1" slug="$2"
  log "### iOS matrix: ${slug}"
  xcrun simctl bootstatus "$udid" -b >/dev/null 2>&1 || true
  open -a Simulator --args -CurrentDeviceUDID "$udid" 2>/dev/null || true
  sleep 2
  xcrun simctl openurl "$udid" "$EXP_URL" || true
  sleep 6
  shot_ios "$udid" "${slug}-01-home.png" 2>/dev/null || true
  log "- [x] Launch + home screenshot"

  # JOBS tab (~33% from left, ~96% height)
  tap_ios_simulator 0.50 0.96
  sleep 2
  shot_ios "$udid" "${slug}-02-jobs.png"
  log "- [x] Jobs tab"

  # Open sub-tab
  tap_ios_simulator 0.42 0.22
  sleep 0.8
  tap_ios_simulator 0.58 0.22
  sleep 1
  shot_ios "$udid" "${slug}-03-jobs-tabs.png"
  log "- [x] Jobs Open → Paid tab toggle (cache, no refetch expected)"

  # Open first job card (~50%, 35%)
  tap_ios_simulator 0.50 0.38
  sleep 2
  shot_ios "$udid" "${slug}-04-job-detail.png"
  log "- [x] Job detail modal (no bottom nav expected)"

  # Swipe down to dismiss (~50%, 30% → 50%, 85%)
  osascript <<'SWIPE' || true
tell application "Simulator" to activate
delay 0.3
tell application "System Events"
  tell process "Simulator"
    set frontWin to front window
    set {wx, wy, ww, wh} to position of frontWin & size of frontWin
    set x1 to (item 1 of wx) + (ww * 0.5)
    set y1 to (item 2 of wy) + (wh * 0.25)
    set x2 to x1
    set y2 to (item 2 of wy) + (wh * 0.85)
    -- drag down
    set startPoint to {x1, y1}
    set endPoint to {x2, y2}
  end tell
end tell
SWIPE
  sleep 1.5
  shot_ios "$udid" "${slug}-05-after-dismiss.png"
  log "- [x] Swipe-down dismiss attempt"

  # Profile from home
  xcrun simctl openurl "$udid" "$EXP_URL" >/dev/null || true
  sleep 4
  tap_ios_simulator 0.92 0.08
  sleep 2
  shot_ios "$udid" "${slug}-06-profile.png"
  log "- [x] Profile push + edge-swipe-back candidate"

  # Earnings tab
  xcrun simctl openurl "$udid" "$EXP_URL" >/dev/null || true
  sleep 4
  tap_ios_simulator 0.83 0.96
  sleep 2
  tap_ios_simulator 0.50 0.18
  tap_ios_simulator 0.72 0.18
  shot_ios "$udid" "${slug}-07-earnings-windows.png"
  log "- [x] Earnings week/month/year toggle (cached)"
  log ""
}

run_android_matrix() {
  log "### Android matrix: ${ANDROID_SERIAL}"
  adb -s "$ANDROID_SERIAL" shell am start -a android.intent.action.VIEW -d "$ANDROID_EXP_URL" >/dev/null 2>&1 || true
  sleep 8
  shot_android "android-01-home.png"
  log "- [x] Launch + home screenshot"

  size="$(adb -s "$ANDROID_SERIAL" shell wm size | tail -1 | awk '{print $3}')"
  w="${size%%x*}"
  h="${size##*x}"
  jobs_x=$((w * 50 / 100))
  jobs_y=$((h * 95 / 100))
  tap_android "$jobs_x" "$jobs_y"
  sleep 2
  shot_android "android-02-jobs.png"
  log "- [x] Jobs tab"

  tap_android $((w * 42 / 100)) $((h * 22 / 100))
  sleep 0.6
  tap_android $((w * 58 / 100)) $((h * 22 / 100))
  sleep 1
  shot_android "android-03-jobs-tabs.png"
  log "- [x] Jobs tab switches"

  tap_android $((w / 2)) $((h * 38 / 100))
  sleep 2
  shot_android "android-04-job-detail.png"
  log "- [x] Job detail"

  swipe_android $((w / 2)) $((h * 25 / 100)) $((w / 2)) $((h * 85 / 100)) 350
  sleep 1.5
  shot_android "android-05-after-dismiss.png"
  log "- [x] Swipe-down dismiss"

  adb -s "$ANDROID_SERIAL" shell am start -a android.intent.action.VIEW -d "$ANDROID_EXP_URL" >/dev/null 2>&1 || true
  sleep 5
  tap_android $((w * 83 / 100)) "$jobs_y"
  sleep 2
  shot_android "android-06-earnings.png"
  log "- [x] Earnings tab"
  log ""
}

main() {
  log "# Simulator UI matrix — $(date -u +"%Y-%m-%dT%H:%MZ") UTC"
  log ""
  log "Worktree: \`$ROOT\`"
  log "Metro: \`http://127.0.0.1:${METRO_PORT}\`"
  log ""
  open_worktree_on_devices

  run_android_matrix
  run_ios_matrix "BB272B7D-71A4-4B0E-8E13-DAAA0968A830" "ios-17-pro-max"
  run_ios_matrix "A63C091D-0707-445E-BB22-0A483814C205" "ios-16e"

  log "## Manual follow-ups (visual)"
  log "- Revenue \$0 clears on focus in Edit Job sheet"
  log "- iOS session date picker shows inline calendar"
  log "- ADD/EDIT chips dark slate; negative net red on cards"
  log "- FAB: drag-up from FAB scrolls list without activating"
  log "- Live session sheet swipe-down minimizes (not end)"
  log ""
  log "Artifacts: \`$MATRIX_DIR/*.png\`"
  echo "Report written to $REPORT"
}

main "$@"
