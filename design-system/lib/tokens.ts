import type { CSSProperties } from 'react';
import colorsJson from '../tokens/colors.json';
import spacingJson from '../tokens/spacing.json';
import typographyJson from '../tokens/typography.json';

export type ColorToken = keyof typeof colorsJson;

const colors = colorsJson as Record<string, string>;
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
  }
>;

export function color(token: string): string {
  const value = colors[token];
  if (value === undefined) throw new Error(`Unknown color token: ${token}`);
  return value;
}

export function space(token: string): number {
  const value = spacing[token];
  if (value === undefined) throw new Error(`Unknown spacing token: ${token}`);
  return value;
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
  return {
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
}

export function typographyDisplayH1Style(): CSSProperties {
  return {
    ...typographyFromToken('Typography/Display-H1'),
    textTransform: 'uppercase',
  };
}

export function typographyBodyStyle(): CSSProperties {
  return typographyFromToken('Typography/Body');
}

export function typographyTitleH3Style(): CSSProperties {
  return typographyFromToken('Typography/Title-H3');
}

export function typographyBodySmallStyle(): CSSProperties {
  return typographyFromToken('Typography/Body-Small');
}

/** Same ramp as Body (14 SemiBold); use for job-card metric values and other dense numeric rows. */
export function typographyMetricSStyle(): CSSProperties {
  return typographyFromToken('Typography/Metric-S');
}

export function typographyMetricStyle(): CSSProperties {
  return typographyFromToken('Typography/Metric');
}

export function typographyMetricXLStyle(): CSSProperties {
  return typographyFromToken('Typography/Metric-XL');
}
