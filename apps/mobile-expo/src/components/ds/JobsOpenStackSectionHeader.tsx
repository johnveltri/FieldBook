import { View, Text, StyleSheet } from 'react-native';
import { color } from '@fieldsolo/design-system/lib/tokens';

import { type TextStyles, fg, space } from '../../theme/nativeTokens';

export const JOBS_OPEN_SECTION_KINDS = ['incomplete', 'inProgress', 'unpaid'] as const;
export type JobsOpenSectionKind = (typeof JOBS_OPEN_SECTION_KINDS)[number];

export const JOBS_OPEN_SECTION_COPY: Record<
  JobsOpenSectionKind,
  { titlePrefix: string; subtitle: string }
> = {
  incomplete: { titlePrefix: 'Incomplete', subtitle: 'Missing key info' },
  inProgress: { titlePrefix: 'In Progress', subtitle: 'Active work underway' },
  unpaid: { titlePrefix: 'Unpaid', subtitle: 'Completed but not paid' },
};

export const JOBS_OPEN_SECTION_TITLE_COLORS: Record<JobsOpenSectionKind, string> = {
  incomplete: color('Semantic/Status/Warning/Text'),
  inProgress: color('Semantic/Status/Info/Text'),
  unpaid: color('Semantic/Status/Neutral/Text'),
};

const COPY = JOBS_OPEN_SECTION_COPY;

/**
 * OPEN-tab list section header — Figma: Incomplete `443:2253`, In progress `1022:456`, Unpaid `1022:468`.
 * @see fieldsoli/packages/design-system/components/jobs-open-stack-section-header/spec.json
 */
export function JobsOpenStackSectionHeader({
  kind,
  count,
  typography,
  contentInset = space('Spacing/20'),
}: {
  kind: JobsOpenSectionKind;
  count: number;
  typography: TextStyles;
  /**
   * Horizontal inset inside the parent column. Default `Spacing/20`.
   * Pass `0` when the parent already applies the shared responsive gutter.
   */
  contentInset?: number;
}) {
  const { titlePrefix, subtitle } = COPY[kind];
  const titleLine = `${titlePrefix} (${count})`;

  return (
    <View
      style={[styles.root, { paddingHorizontal: contentInset }]}
      accessibilityRole="header"
      accessibilityLabel={`${titleLine}. ${subtitle}`}
    >
      <Text style={[typography.titleH3, styles.title, { color: fg.primary }]}>{titleLine}</Text>
      <View style={styles.subtitleBlock}>
        <Text style={[typography.bodySmall, { color: fg.secondary }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    paddingTop: space('Spacing/16'),
    paddingBottom: space('Spacing/12'),
    gap: 4,
  },
  title: {
    width: '100%',
  },
  subtitleBlock: {
    paddingVertical: 1,
  },
});
