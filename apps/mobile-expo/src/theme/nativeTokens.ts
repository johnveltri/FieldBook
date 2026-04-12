import type { TextStyle, ViewStyle } from 'react-native';
import { color, radius, space } from '@fieldbook/design-system/lib/tokens';

/** Matches design-system `TopHeader` max width (`231:817`). */
export const TOP_HEADER_MAX_WIDTH = 393;

/** Matches `JobSummaryCard` / list cards (`353` max in DS). */
export const CONTENT_MAX_WIDTH = 353;

export const bg = {
  canvas: color('Foundation/Background/Default'),
  surface: color('Foundation/Surface/Default'),
  surfaceWhite: color('Foundation/Surface/White'),
  subtle: color('Foundation/Surface/Subtle'),
} as const;

export const fg = {
  primary: color('Foundation/Text/Primary'),
  secondary: color('Foundation/Text/Secondary'),
  muted: color('Foundation/Text/Muted'),
} as const;

export const border = {
  subtle: color('Foundation/Border/Subtle'),
  default: color('Foundation/Border/Default'),
} as const;

/** RN shadow approximating `Shadow/Card/Default` (web `box-shadow`). */
export const cardShadowRn: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 2,
};

export function padScreenHorizontal(): number {
  return space('Spacing/20');
}

export { color, radius, space };

export type LoadedFonts = {
  serifBold: string;
  mono: string;
  monoSemi: string;
  monoBold: string;
};

/** Typography mapped to loaded Expo Google Font family names. */
export function createTextStyles(f: LoadedFonts) {
  /** Weight comes from the font file — omit `fontWeight` to avoid Android double-bold. */
  const displayH1: TextStyle = {
    fontFamily: f.serifBold,
    fontSize: 28,
    color: fg.primary,
  };

  const titleH3: TextStyle = {
    fontFamily: f.serifBold,
    fontSize: 20,
    color: fg.primary,
  };

  /** `Typography/Heading-H2` — Job Card header without card (`1836:2829`). */
  const headingH2: TextStyle = {
    fontFamily: f.serifBold,
    fontSize: 24,
    lineHeight: 28,
    color: fg.primary,
  };

  /** `Typography/Body` — 14 Regular. */
  const body: TextStyle = {
    fontFamily: f.mono,
    fontSize: 14,
    color: fg.primary,
  };

  const bodySecondary: TextStyle = {
    ...body,
    color: fg.secondary,
  };

  /** `Typography/Body-Bold` — 14 SemiBold. */
  const bodyBold: TextStyle = {
    fontFamily: f.monoSemi,
    fontSize: 14,
    color: fg.primary,
  };

  /** `Typography/Body-Small` — 10 Regular. */
  const bodySmall: TextStyle = {
    fontFamily: f.mono,
    fontSize: 10,
    color: fg.secondary,
  };

  /** `Typography/LABEL` — 10 Bold, +0.1em letter-spacing when uppercase. */
  const labelCaps: TextStyle = {
    fontFamily: f.monoBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: fg.muted,
  };

  /** Uppercase mono label — **Foundation/Text/Secondary** (optional card section titles). */
  const labelHeadingSecondary: TextStyle = {
    fontFamily: f.monoBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: fg.secondary,
  };

  /** `Typography/Metric` — 18 Bold. */
  const metric: TextStyle = {
    fontFamily: f.monoBold,
    fontSize: 18,
    color: fg.primary,
  };

  /** `Typography/Metric-S` — section titles (`371:2179`). */
  const metricS: TextStyle = {
    fontFamily: f.monoSemi,
    fontSize: 14,
    letterSpacing: 0,
    textTransform: 'uppercase',
    color: color('Brand/Accent'),
  };

  /** Session time range — `ViewSessionCard` secondary line (~20px line box). */
  const sessionTimeRange: TextStyle = {
    fontFamily: f.mono,
    fontSize: 14,
    lineHeight: 20,
    color: fg.secondary,
  };

  return {
    displayH1,
    titleH3,
    headingH2,
    body,
    bodySecondary,
    bodyBold,
    bodySmall,
    labelCaps,
    labelHeadingSecondary,
    metric,
    metricS,
    sessionTimeRange,
  };
}

export type TextStyles = ReturnType<typeof createTextStyles>;
