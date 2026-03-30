import type { CSSProperties } from 'react';

/**
 * FAB + bottom tab bar geometry from Figma **Home / Default** (`12:9727`),
 * 393×852 frame: Bottom Nav `225:12089` at y=779 (73px tall); FAB `613:2` at
 * (309, 694), 56×56 → **28px** from the right screen edge, **29px** between
 * FAB bottom and the top of the nav.
 *
 * Use with {@link FloatingActionButton} when the tab bar is a sibling docked
 * to the viewport bottom (not inside the scroll region).
 */
export const BOTTOM_NAV_BAR_HEIGHT_PX = 73;

export const FAB_ICON_CIRCLE_SIZE_PX = 56;

/** Clearance from FAB bottom edge to top edge of the bottom nav. */
export const FAB_GAP_ABOVE_BOTTOM_NAV_PX = 29;

/** Inset from viewport right to FAB’s right edge (matches current Figma frame math). */
export const FAB_RIGHT_INSET_PX = 28;

/**
 * Suggested `padding-bottom` for the scrolling column when a fixed FAB is shown,
 * so the last block can scroll clear of the 56px control and the gap above the nav.
 */
export const SCROLL_BOTTOM_INSET_FOR_FAB_PX =
  FAB_GAP_ABOVE_BOTTOM_NAV_PX + FAB_ICON_CIRCLE_SIZE_PX + 16;

/**
 * `position: fixed` anchor so the FAB stays put while content scrolls, with safe
 * areas. Merge behind the button; do not duplicate width/height on the wrapper
 * if the FAB already sets them.
 */
export function fabFixedAboveBottomNavStyle(
  extra?: CSSProperties
): CSSProperties {
  return {
    position: 'fixed',
    right: `calc(${FAB_RIGHT_INSET_PX}px + env(safe-area-inset-right, 0px))`,
    bottom: `calc(${BOTTOM_NAV_BAR_HEIGHT_PX + FAB_GAP_ABOVE_BOTTOM_NAV_PX}px + env(safe-area-inset-bottom, 0px))`,
    zIndex: 40,
    ...extra,
  };
}
