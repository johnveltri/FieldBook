import { describe, expect, it } from 'vitest';

import colorsJson from '../tokens/colors.json';
import { contrastRatio, WCAG_AA_NORMAL_TEXT } from './contrast';
import { color } from './tokens';

type ColorToken = keyof typeof colorsJson;

function pair(
  foregroundToken: ColorToken,
  backgroundToken: ColorToken,
  label?: string,
): { label: string; ratio: number } {
  const fg = color(foregroundToken);
  const bg = color(backgroundToken);
  return {
    label: label ?? `${foregroundToken} on ${backgroundToken}`,
    ratio: contrastRatio(fg, bg),
  };
}

const SURFACES: ColorToken[] = [
  'Foundation/Background/Default',
  'Foundation/Background/CanvasWarm',
  'Foundation/Surface/Default',
  'Foundation/Surface/Subtle',
];

describe('design-system token contrast (WCAG AA normal text)', () => {
  it('primary and secondary text on default surfaces', () => {
    const pairs = [
      ...SURFACES.flatMap((surface) => [
        pair('Foundation/Text/Primary', surface),
        pair('Foundation/Text/Secondary', surface),
      ]),
      pair('Brand/Accent', 'Foundation/Background/CanvasWarm'),
      pair('Brand/Accent', 'Foundation/Background/Default'),
      pair('Brand/Primary', 'Foundation/Background/CanvasWarm'),
    ];

    for (const { label, ratio } of pairs) {
      expect(ratio, label).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    }
  });

  it('semantic status text on matching backgrounds', () => {
    const pairs = [
      pair('Semantic/Status/Success/Text', 'Semantic/Status/Success/BG'),
      pair('Semantic/Status/Warning/Text', 'Semantic/Status/Warning/BG'),
      pair('Semantic/Status/Error/Text', 'Semantic/Status/Error/BG'),
      pair('Semantic/Status/Info/Text', 'Semantic/Status/Info/BG'),
      pair('Semantic/Status/Neutral/Text', 'Semantic/Status/Neutral/BG'),
      pair('Semantic/Status/Paused/Text', 'Semantic/Status/Paused/BG'),
    ];

    for (const { label, ratio } of pairs) {
      expect(ratio, label).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    }
  });

  it('financial values on light surfaces', () => {
    const pairs = [
      pair('Semantic/Financial/Positive', 'Foundation/Surface/Default'),
      pair('Semantic/Financial/Positive', 'Foundation/Background/Default'),
      pair('Semantic/Financial/Negative', 'Foundation/Surface/Default'),
      pair('Semantic/Financial/Negative', 'Foundation/Background/Default'),
    ];

    for (const { label, ratio } of pairs) {
      expect(ratio, label).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    }
  });

  it('on-fill text on solid brand and action fills', () => {
    const pairs = [
      pair('Foundation/Text/Muted', 'Semantic/Action/Primary'),
      pair('Foundation/Text/Muted', 'Brand/Primary'),
      pair('Foundation/Surface/White', 'Semantic/Action/Primary'),
      pair('Foundation/Surface/White', 'Brand/Primary'),
    ];

    for (const { label, ratio } of pairs) {
      expect(ratio, label).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    }
  });
});
