import { Pressable, StyleSheet, Text, View } from 'react-native';

import { color, colorWithAlpha, radius, space } from '@fieldsolo/design-system/lib/tokens';

import { cardShadowRn, fg, type TextStyles } from '../../theme/nativeTokens';

import {
  JOBS_OPEN_SECTION_COPY,
  JOBS_OPEN_SECTION_TITLE_COLORS,
  type JobsOpenSectionKind,
} from './JobsOpenStackSectionHeader';

export type JobsOpenSummaryCardProps = {
  kind: JobsOpenSectionKind;
  count: number;
  typography: TextStyles;
  onPress: () => void;
};

const SURFACE: Record<
  JobsOpenSectionKind,
  { backgroundColor: string; borderColor: string; badgeBackground: string; ctaColor: string }
> = {
  incomplete: {
    backgroundColor: color('Semantic/Status/Warning/BG'),
    borderColor: color('Semantic/Status/Warning/Stroke'),
    badgeBackground: color('Semantic/Status/Warning/Text'),
    ctaColor: color('Semantic/Status/Error/Text'),
  },
  inProgress: {
    backgroundColor: color('Semantic/Status/Info/BG'),
    borderColor: colorWithAlpha('Semantic/Status/Info/Text', 0.22),
    badgeBackground: color('Semantic/Status/Info/Text'),
    ctaColor: color('Semantic/Status/Info/Text'),
  },
  unpaid: {
    backgroundColor: color('Semantic/Status/Neutral/BG'),
    borderColor: colorWithAlpha('Foundation/Border/Default', 0.1),
    badgeBackground: color('Semantic/Status/Neutral/Text'),
    ctaColor: color('Semantic/Status/Neutral/Text'),
  },
};

function trailingLabelFor(kind: JobsOpenSectionKind): string {
  return kind === 'incomplete' ? 'Fix →' : 'Review →';
}

/**
 * Collapsed Open-tab section row for Home “Needs attention” (mirrors Earnings `OutstandingPaymentCard`).
 */
export function JobsOpenSummaryCard({ kind, count, typography, onPress }: JobsOpenSummaryCardProps) {
  const { titlePrefix, subtitle } = JOBS_OPEN_SECTION_COPY[kind];
  const titleColor = JOBS_OPEN_SECTION_TITLE_COLORS[kind];
  const surface = SURFACE[kind];
  const trailing = trailingLabelFor(kind);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titlePrefix}. ${count} jobs. ${subtitle}. ${trailing.replace(' →', '')}.`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: surface.backgroundColor,
          borderColor: surface.borderColor,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.main}>
        <View style={[styles.badge, { backgroundColor: surface.badgeBackground }]}>
          <Text style={[typography.metric, styles.badgeText, { color: fg.muted, textTransform: 'none' }]}>
            {count}
          </Text>
        </View>
        <View style={styles.titleStack}>
          <Text style={[typography.bodyBold, { color: fg.primary }]}>{titlePrefix}</Text>
          <Text style={[typography.bodySmall, { color: titleColor }]}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.trailing}>
        <Text style={[typography.bodyBold, { color: surface.ctaColor }]}>{trailing}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space('Spacing/20'),
    paddingVertical: space('Spacing/16'),
    borderWidth: 1,
    borderRadius: radius('Radius/16'),
    ...cardShadowRn,
  },
  main: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/12'),
    marginRight: space('Spacing/12'),
  },
  badge: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: radius('Radius/Full'),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    paddingHorizontal: space('Spacing/4'),
  },
  badgeText: {
    textAlign: 'center',
  },
  titleStack: {
    flex: 1,
    minWidth: 0,
    gap: space('Spacing/4'),
  },
  trailing: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
