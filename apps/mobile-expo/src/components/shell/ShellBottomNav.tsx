/**
 * Scroll / FAB clearance helpers for the native tab bar + primary-action overlay.
 * The old Slack floating dock UI was removed; metrics live in `shellDockMetrics`.
 */
export type { ShellMainTab } from '../../shell/shellTabRoutes';

export {
  shellBottomNavBottomPadding,
  shellBottomNavOuterHeight,
  shellDockBottomPadding,
  shellDockOuterHeight,
  shellLiveSessionBarBottom,
  shellNativeTabBarHeight,
  shellPrimaryActionBottomOffset,
} from '../platform/shellDockMetrics';
