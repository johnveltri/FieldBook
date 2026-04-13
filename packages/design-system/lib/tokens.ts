import type { CSSProperties } from 'react';
import colorsJson from '../tokens/colors.json';
import radiusJson from '../tokens/radius.json';
import shadowsJson from '../tokens/shadows.json';
import spacingJson from '../tokens/spacing.json';
import typographyJson from '../tokens/typography.json';

/** Raw typography tokens (JSON) — use for React Native `TextStyle` mapping alongside loaded font families. */
export { typographyJson };
export type TypographyTokenName = keyof typeof typographyJson;

export type ColorToken = keyof typeof colorsJson;

const colors = colorsJson as Record<string, string>;
const radii = radiusJson as Record<string, number>;
const shadows = shadowsJson as Record<string, string>;
const spacing = spacingJson as Record<string, number>;
const typography = typographyJson as Record<
  string,
  {
    family: string;
    style: string;
    size: number;
    weight: number;
    lineHeight: number;
    letterSpacing: number;
    textTransform?: 'uppercase' | 'none';
  }
>;

export function color(token: string): string {
  const value = colors[token];
  if (value === undefined) throw new Error(`Unknown color token: ${token}`);
  return value;
}

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

export function colorWithAlpha(token: string, alpha: number): string {
  const { r, g, b } = hexToRgb(color(token));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function space(token: string): number {
  const value = spacing[token];
  if (value === undefined) throw new Error(`Unknown spacing token: ${token}`);
  return value;
}

export function radius(token: string): number {
  const value = radii[token];
  if (value === undefined) throw new Error(`Unknown radius token: ${token}`);
  return value;
}

export function shadow(token: string): string {
  const value = shadows[token];
  if (value === undefined) throw new Error(`Unknown shadow token: ${token}`);
  return value;
}

export function shadowFromColor(colorValue: string, spec = '0px 1px 2px'): string {
  return `${spec} ${colorValue}`;
}

/** Typography/LABEL → React/CSS-friendly text style (Figma: lineHeight 100 = auto; letterSpacing % of font size). */
export function typographyLabelStyle(): CSSProperties {
  const t = typography['Typography/LABEL'];
  return {
    fontFamily: `"${t.family}", ui-monospace, monospace`,
    fontSize: t.size,
    fontWeight: t.weight,
    fontStyle: t.style === 'Italic' ? 'italic' : 'normal',
    lineHeight: t.lineHeight === 100 ? 'normal' : `${t.lineHeight}%`,
    letterSpacing: `${t.letterSpacing / 100}em`,
    textTransform: 'uppercase',
  };
}

function typographyFromToken(token: keyof typeof typography): CSSProperties {
  const t = typography[token];
  const out: CSSProperties = {
    fontFamily:
      t.family === 'PT Serif'
        ? `"${t.family}", Georgia, "Times New Roman", serif`
        : `"${t.family}", ui-monospace, monospace`,
    fontSize: t.size,
    fontWeight: t.weight,
    fontStyle: t.style === 'Italic' ? 'italic' : 'normal',
    lineHeight: t.lineHeight === 100 ? 'normal' : `${t.lineHeight}%`,
    letterSpacing:
      t.letterSpacing === 0 ? 'normal' : `${t.letterSpacing / 100}em`,
  };
  if (t.textTransform === 'uppercase') {
    out.textTransform = 'uppercase';
  }
  return out;
}

export function typographyDisplayH1Style(): CSSProperties {
  return typographyFromToken('Typography/Display-H1');
}

/** Typography/Body — 14 Regular (Figma variable `Typography/Body`). */
export function typographyBodyStyle(): CSSProperties {
  return typographyFromToken('Typography/Body');
}

/** Typography/Body Bold — 14 SemiBold (Figma `Typography/Body Bold`). */
export function typographyBodyBoldStyle(): CSSProperties {
  return typographyFromToken('Typography/Body-Bold');
}

export function typographyTitleH3Style(): CSSProperties {
  return typographyFromToken('Typography/Title-H3');
}

/** Typography/Heading-H2 — 24 Bold (Figma `Typography/Heading-H2`). */
export function typographyHeadingH2Style(): CSSProperties {
  return typographyFromToken('Typography/Heading-H2');
}

export function typographyBodySmallStyle(): CSSProperties {
  return typographyFromToken('Typography/Body-Small');
}

/** Typography/Input — form fields, 14 Regular (Figma Text Styles, `790:268` / `Typography/Input`). */
export function typographyInputStyle(): CSSProperties {
  return typographyFromToken('Typography/Input');
}

/** Typography/Input-Small — dense inputs, 10 Regular (Figma `790:270` / `Typography/Input Small`). */
export function typographyInputSmallStyle(): CSSProperties {
  return typographyFromToken('Typography/Input-Small');
}

/** Metric-S (14 SemiBold, uppercase per token); block buttons and dense labels. */
export function typographyMetricSStyle(): CSSProperties {
  return typographyFromToken('Typography/Metric-S');
}

export function typographyMetricStyle(): CSSProperties {
  return typographyFromToken('Typography/Metric');
}

export function typographyMetricXLStyle(): CSSProperties {
  return typographyFromToken('Typography/Metric-XL');
}
