import type { ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { color } from '@fieldsolo/design-system/lib/tokens';

import {
  dynamicTypeLineMinHeight,
  dynamicTypeTextStyle,
} from '../../theme/dynamicTypeText';
import { fg, space, type TextStyles } from '../../theme/nativeTokens';

export type SectionHeaderTone = 'neutral' | 'accent';

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  leadingIcon?: ReactNode;
  tone: SectionHeaderTone;
  typography: TextStyles;
  /**
   * Horizontal inset inside the parent column. Default `Spacing/20`.
   * Pass `0` when the parent already applies the shared responsive gutter.
   */
  contentInset?: number;
};

/**
 * Home / section title row — Figma Home `1933:1403`, `810:612`, `1931:2187`.
 */
export function SectionHeader({
  title,
  subtitle,
  leadingIcon,
  tone,
  typography,
  contentInset = space('Spacing/20'),
}: SectionHeaderProps) {
  const { fontScale } = useWindowDimensions();
  const titleColor = tone === 'accent' ? color('Brand/Accent') : fg.primary;
  const titleSize = typography.titleH3.fontSize ?? 20;
  // Title-H3 (PT Serif 20) for section headers — follows OS Dynamic Type uncapped.
  const titleStyle = dynamicTypeTextStyle(typography.titleH3, fontScale, {
    padRatio: 0.1,
  });
  const subtitleStyle = dynamicTypeTextStyle(typography.bodySmall, fontScale, {
    letterSpacingUntilScale: 99,
    padRatio: 0.08,
  });
  // Tighter than the old 36pt chrome gap — Title-H3 reads as content, not a sparse label.
  const padTop = fontScale > 1.6 ? space('Spacing/12') : space('Spacing/16');
  const padBottom = fontScale > 1.6 ? space('Spacing/8') : space('Spacing/12');

  return (
    <View
      style={[
        styles.root,
        { paddingHorizontal: contentInset, paddingTop: padTop, paddingBottom: padBottom },
      ]}
      accessibilityRole="header"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    >
      <View style={styles.headingRow}>
        {leadingIcon != null ? <View style={styles.leadingSlot}>{leadingIcon}</View> : null}
        <View
          style={[
            styles.titleFlex,
            { minHeight: dynamicTypeLineMinHeight(titleSize, fontScale, 1.2) },
          ]}
        >
          <Text style={[titleStyle, { color: titleColor }]}>{title}</Text>
        </View>
      </View>
      {subtitle != null && subtitle !== '' ? (
        <View style={[styles.subtitleBlock, leadingIcon != null && styles.subtitleWithIcon]}>
          <Text style={[subtitleStyle, { color: fg.secondary }]}>{subtitle}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: 4,
    overflow: 'visible',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space('Spacing/8'),
    width: '100%',
    overflow: 'visible',
  },
  leadingSlot: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  titleFlex: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    overflow: 'visible',
  },
  subtitleBlock: {
    paddingVertical: 1,
  },
  subtitleWithIcon: {
    paddingLeft: 24,
  },
});
