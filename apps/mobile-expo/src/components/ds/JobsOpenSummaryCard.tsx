import { Pressable, StyleSheet, Text, View } from 'react-native';

import { color, radius, space } from '@fieldsolo/design-system/lib/tokens';

import { cardShadowRn, fg, type TextStyles } from '../../theme/nativeTokens';

import { HomeSummaryCardArrowIcon } from '../figma-icons/HomeSectionIcons';
import {
  JOBS_OPEN_SECTION_COPY,
  type JobsOpenSectionKind,
} from './JobsOpenStackSectionHeader';

export type JobsOpenSummaryCardProps = {
  kind: JobsOpenSectionKind;
  count: number;
  /** Optional pre-formatted metric shown before the navigation affordance. */
  trailingValue?: string;
  typography: TextStyles;
  onPress: () => void;
};

const CARD_SURFACE = {
  backgroundColor: color('Foundation/Surface/White'),
  borderColor: color('Foundation/Border/Subtle'),
} as const;

const ACCENT: Record<JobsOpenSectionKind, string> = {
  incomplete: color('Semantic/Status/Warning/Text'),
  inProgress: color('Semantic/Status/Info/Text'),
  unpaid: color('Semantic/Status/Neutral/Text'),
};

/**
 * Collapsed Open-tab section row for Home “Needs attention” and Earnings outstanding.
 */
export function JobsOpenSummaryCard({
  kind,
  count,
  trailingValue,
  typography,
  onPress,
}: JobsOpenSummaryCardProps) {
  const { titlePrefix, subtitle } = JOBS_OPEN_SECTION_COPY[kind];
  const accentColor = ACCENT[kind];
  const titleLine = `${titlePrefix} (${count})`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titleLine}. ${subtitle}.${trailingValue ? ` ${trailingValue}.` : ''}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: CARD_SURFACE.backgroundColor,
          borderColor: CARD_SURFACE.borderColor,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.main}>
        <Text style={[typography.titleH3, styles.title, { color: fg.primary }]}>{titleLine}</Text>
        <Text style={[typography.bodySmall, { color: fg.secondary }]}>{subtitle}</Text>
      </View>
      <View style={styles.trailing}>
        {trailingValue ? (
          <Text style={[typography.metric, styles.trailingValue, { color: accentColor }]}>
            {trailingValue}
          </Text>
        ) : null}
        <HomeSummaryCardArrowIcon
          backgroundColor={accentColor}
          arrowColor={fg.muted}
        />
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
    gap: space('Spacing/4'),
    marginRight: space('Spacing/12'),
  },
  title: {
    width: '100%',
  },
  trailing: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space('Spacing/12'),
  },
  trailingValue: {
    textTransform: 'none',
    fontVariant: ['tabular-nums'],
  },
  pressed: { opacity: 0.75 },
});
