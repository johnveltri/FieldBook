import { PixelRatio, Platform } from 'react-native';

import { FAB_SIZE, space } from '../../theme/nativeTokens';

/** Horizontal gap between the nav group and the primary action control. */
export const DOCK_PRIMARY_GAP = space('Spacing/12');

/** Inner padding for floating dock chrome. */
export const DOCK_FLOATING_PAD_H = space('Spacing/12');

/** Bottom inset above the home indicator / nav bar for the floating dock. */
export function shellDockBottomPadding(insetsBottom: number): number {
  // Floating dock: sit clearly above the system home indicator / gesture bar.
  return Math.max(space('Spacing/12'), insetsBottom + space('Spacing/8'));
}

/** Height of one row of floating dock controls (nav + primary action). */
export function shellDockRowHeight(fontScale: number = PixelRatio.getFontScale()): number {
  const scale = Math.max(1, fontScale);
  return Math.max(FAB_SIZE, Math.round(space('Spacing/64') * scale));
}

/** Height of the system native tab bar (labels + icons), excluding the FAB. */
export function shellNativeTabBarHeight(insetsBottom: number): number {
  if (Platform.OS === 'android') {
    return 80 + Math.max(insetsBottom, 0);
  }
  return 49 + insetsBottom;
}

/** Bottom offset so the floating + sits above the native tab bar. */
export function shellPrimaryActionBottomOffset(insetsBottom: number): number {
  return shellNativeTabBarHeight(insetsBottom) + space('Spacing/12');
}

/**
 * Reserved height from main content bottom to screen bottom for scroll insets.
 * Native tabs inset content for the system tab bar; this reserves the floating + control.
 */
export function shellBottomNavOuterHeight(
  insetsBottom: number,
  fontScale: number = PixelRatio.getFontScale(),
): number {
  const fab = shellDockRowHeight(fontScale);
  return shellNativeTabBarHeight(insetsBottom) + fab + space('Spacing/16');
}

/** Same as {@link shellBottomNavOuterHeight} for native tabs + FAB overlay. */
export function shellDockOuterHeight(
  insetsBottom: number,
  fontScale: number = PixelRatio.getFontScale(),
): number {
  return shellBottomNavOuterHeight(insetsBottom, fontScale);
}

/** Bottom offset for minimized live-session bar (above native tab bar + FAB). */
export function shellLiveSessionBarBottom(insetsBottom: number): number {
  return shellPrimaryActionBottomOffset(insetsBottom) + shellDockRowHeight() + space('Spacing/8');
}

/** @deprecated Use `shellDockBottomPadding`. */
export function shellBottomNavBottomPadding(insetsBottom: number): number {
  return shellDockBottomPadding(insetsBottom);
}
