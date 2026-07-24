import { describe, expect, it } from '@jest/globals';

import {
  CONTENT_COLUMN_MAX_WIDTH,
  CONTENT_GUTTER_COMPACT,
  CONTENT_GUTTER_DEFAULT,
  contentColumnMetrics,
  contentGutter,
  fabRightInset,
  scrollBottomInsetForFab,
} from '@fieldsolo/design-system/lib/responsiveLayout';

import { contentColumnStyleRn } from './nativeTokens';

describe('responsive content column', () => {
  it('uses a 16 pt gutter below 360 pt width', () => {
    expect(contentGutter(320)).toBe(CONTENT_GUTTER_COMPACT);
    expect(contentGutter(359)).toBe(CONTENT_GUTTER_COMPACT);
  });

  it('uses a 20 pt gutter at 360 pt and above', () => {
    expect(contentGutter(360)).toBe(CONTENT_GUTTER_DEFAULT);
    expect(contentGutter(440)).toBe(CONTENT_GUTTER_DEFAULT);
  });

  it('fills the phone width with gutters and no side centering inset', () => {
    const m = contentColumnMetrics(320);
    expect(m.sideInset).toBe(0);
    expect(m.columnWidth).toBe(320);
    expect(m.contentWidth).toBe(320 - CONTENT_GUTTER_COMPACT * 2);
    expect(m.gutter).toBe(CONTENT_GUTTER_COMPACT);
  });

  it('centers a 640 pt column on wide / landscape widths', () => {
    const m = contentColumnMetrics(956);
    expect(m.columnWidth).toBe(CONTENT_COLUMN_MAX_WIDTH);
    expect(m.sideInset).toBe((956 - CONTENT_COLUMN_MAX_WIDTH) / 2);
    expect(m.contentWidth).toBe(CONTENT_COLUMN_MAX_WIDTH - CONTENT_GUTTER_DEFAULT * 2);
  });

  it('keeps FAB right inset inside the content column edge', () => {
    expect(fabRightInset(320)).toBe(CONTENT_GUTTER_COMPACT);
    expect(fabRightInset(440)).toBe(CONTENT_GUTTER_DEFAULT);
    expect(fabRightInset(956)).toBe((956 - CONTENT_COLUMN_MAX_WIDTH) / 2 + CONTENT_GUTTER_DEFAULT);
  });

  it('reserves scroll space below content for the FAB', () => {
    expect(scrollBottomInsetForFab(40, 56)).toBe(40 + 56 + 12);
  });

  it('builds RN column styles from window width', () => {
    expect(contentColumnStyleRn(320)).toEqual({
      width: '100%',
      maxWidth: CONTENT_COLUMN_MAX_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: CONTENT_GUTTER_COMPACT,
    });
    expect(contentColumnStyleRn(440).paddingHorizontal).toBe(CONTENT_GUTTER_DEFAULT);
  });
});
