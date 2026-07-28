/**
 * Shared responsive content-column geometry for FieldSoli (web + mobile).
 *
 * Phone: full width with a 16 pt gutter below 360 pt width, 20 pt at 360+.
 * Large / landscape: one centered column capped at {@link CONTENT_COLUMN_MAX_WIDTH}.
 * Sheets and screen content share this cap.
 */

/** Centered content + sheet column max width (pt / CSS px). */
export const CONTENT_COLUMN_MAX_WIDTH = 640;

/** Horizontal gutter when window width is below {@link COMPACT_WIDTH_BREAKPOINT}. */
export const CONTENT_GUTTER_COMPACT = 16;

/** Horizontal gutter when window width is at/above {@link COMPACT_WIDTH_BREAKPOINT}. */
export const CONTENT_GUTTER_DEFAULT = 20;

/** Width below which the compact gutter applies. */
export const COMPACT_WIDTH_BREAKPOINT = 360;

/** Default FAB diameter used for scroll clearance (matches product FAB). */
export const FAB_SIZE = 56;

/** Gap between FAB and the nearest content / nav chrome. */
export const FAB_CONTENT_GAP = 12;

export type ContentColumnMetrics = {
  windowWidth: number;
  /** Left/right inset from the screen edge to the content column box. */
  sideInset: number;
  /** Horizontal padding inside the content column (phone gutters). */
  gutter: number;
  /** Outer width of the content column box (before inner gutter padding). */
  columnWidth: number;
  /** Inner width available to cards after gutters. */
  contentWidth: number;
};

/**
 * Gutter for a given window width.
 * 16 pt at 320–359, 20 pt at 360+.
 */
export function contentGutter(windowWidth: number): number {
  if (windowWidth < COMPACT_WIDTH_BREAKPOINT) return CONTENT_GUTTER_COMPACT;
  return CONTENT_GUTTER_DEFAULT;
}

/**
 * Metrics for the shared responsive content column.
 *
 * - Phone (`windowWidth <= 640`): column is full width; `sideInset` is 0 and
 *   `gutter` provides the edge inset via horizontal padding.
 * - Large screens: column is 640 pt centered; `sideInset` is the centering margin;
 *   `gutter` still pads inside the column so cards are not flush to the cap edge.
 */
export function contentColumnMetrics(windowWidth: number): ContentColumnMetrics {
  const width = Math.max(0, windowWidth);
  const gutter = contentGutter(width);
  const columnWidth = Math.min(width, CONTENT_COLUMN_MAX_WIDTH);
  const sideInset = Math.max(0, (width - columnWidth) / 2);
  const contentWidth = Math.max(0, columnWidth - gutter * 2);

  return {
    windowWidth: width,
    sideInset,
    gutter,
    columnWidth,
    contentWidth,
  };
}

/**
 * Right inset for a FAB that stays inside the content column’s right edge
 * (plus optional safe-area inset).
 */
export function fabRightInset(windowWidth: number, safeAreaRight = 0): number {
  const { sideInset, gutter } = contentColumnMetrics(windowWidth);
  return sideInset + gutter + safeAreaRight;
}

/** Bottom scroll padding so the last row can clear a fixed FAB. */
export function scrollBottomInsetForFab(fabBottomOffset: number, fabSize: number = FAB_SIZE): number {
  return fabBottomOffset + fabSize + FAB_CONTENT_GAP;
}

/**
 * Layout values for a content column container:
 * `width: 100%`, `maxWidth: 640`, centered, with responsive horizontal padding.
 */
export function contentColumnContainerStyle(windowWidth: number): {
  width: '100%';
  maxWidth: number;
  alignSelf: 'center';
  paddingHorizontal: number;
  boxSizing: 'border-box';
} {
  const { gutter } = contentColumnMetrics(windowWidth);
  return {
    width: '100%',
    maxWidth: CONTENT_COLUMN_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: gutter,
    boxSizing: 'border-box',
  };
}
