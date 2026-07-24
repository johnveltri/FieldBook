import type { TextStyle } from 'react-native';

type DynamicTypeTextOptions = {
  /** Keep token letter-spacing below this fontScale (default 1.35). */
  letterSpacingUntilScale?: number;
  /** Extra vertical padding multiplier (default 0.08 × fontSize × effectiveScale). */
  padRatio?: number;
  /**
   * Cap the scale used for lineHeight / padding (and for matching
   * `maxFontSizeMultiplier` on the Text). Default: no cap.
   */
  maxScale?: number;
};

/**
 * Text style safe for iOS Accessibility / Android large font scales.
 *
 * Custom fonts (Ubuntu Mono / PT Serif) clip when token `lineHeight` is an
 * absolute px value: RN scales `fontSize` with Dynamic Type but does **not**
 * scale `lineHeight`. Multiply lineHeight by fontScale, drop tracking at high
 * scale, and add light padding so glyphs aren’t flush to the clip edge.
 */
export function dynamicTypeTextStyle(
  base: TextStyle | null | undefined,
  fontScale: number,
  options: DynamicTypeTextOptions = {},
): TextStyle {
  if (base == null) return {};

  const { lineHeight: tokenLh, letterSpacing: tokenTracking, ...rest } = base;
  const size = typeof base.fontSize === 'number' ? base.fontSize : 14;
  const rawScale = Math.max(1, fontScale);
  const scale =
    typeof options.maxScale === 'number' ? Math.min(rawScale, Math.max(1, options.maxScale)) : rawScale;
  const letterSpacingUntil = options.letterSpacingUntilScale ?? 1.35;
  const padRatio = options.padRatio ?? 0.08;
  const pad = Math.max(1, Math.ceil(size * scale * padRatio));
  const baseLh = typeof tokenLh === 'number' && tokenLh > 0 ? tokenLh : Math.round(size * 1.35);

  return {
    ...rest,
    // Keep line box proportional to the scaled font (RN does not auto-scale lineHeight).
    lineHeight: Math.ceil(baseLh * scale),
    letterSpacing: scale > letterSpacingUntil ? 0 : tokenTracking,
    paddingTop: pad,
    paddingBottom: pad,
  };
}

/** Minimum layout height for a single line of `fontSize` at the current scale. */
export function dynamicTypeLineMinHeight(
  fontSize: number,
  fontScale: number,
  ratio = 1.5,
  maxScale?: number,
): number {
  const raw = Math.max(1, fontScale);
  const scale = typeof maxScale === 'number' ? Math.min(raw, Math.max(1, maxScale)) : raw;
  return Math.ceil(fontSize * scale * ratio);
}
