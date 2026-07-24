/** WCAG 2.x relative luminance and contrast for hex sRGB colors. */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.trim().replace(/^#/, '');
  if (normalized.length === 3) {
    const [r, g, b] = normalized.split('').map((part) => part + part);
    return {
      r: Number.parseInt(r, 16),
      g: Number.parseInt(g, 16),
      b: Number.parseInt(b, 16),
    };
  }
  if (normalized.length === 6) {
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }
  throw new Error(`Unsupported hex color value: ${hex}`);
}

function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const R = channelToLinear(r);
  const G = channelToLinear(g);
  const B = channelToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** Contrast ratio between two hex colors (order-independent). */
export function contrastRatio(foreground: string, background: string): number {
  const L1 = relativeLuminance(foreground);
  const L2 = relativeLuminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_AA_NORMAL_TEXT = 4.5;
export const WCAG_AA_LARGE_TEXT = 3;
