import { StyleSheet, Text, View } from 'react-native';
import { radius, space } from '@fieldbook/design-system/lib/tokens';
import type { JobDetailWorkStatus } from '@fieldbook/shared-types';

import { CONTENT_MAX_WIDTH } from '../../theme/nativeTokens';
import type { TextStyles } from '../../theme/nativeTokens';
import { JobDetailCategoryChip } from './JobDetailCategoryChip';
import { JobDetailStatusPill } from './JobDetailStatusPill';

export function JobDetailJobHeader({
  title,
  customerName,
  lastWorkedLabel,
  categoryLabelUppercase,
  workStatus,
  typography,
}: {
  title: string;
  customerName: string;
  lastWorkedLabel: string;
  categoryLabelUppercase: string;
  workStatus: JobDetailWorkStatus;
  typography: TextStyles;
}) {
  return (
    <View style={styles.jobCardShell}>
      <View style={styles.jobCardContent}>
        <View style={styles.jobTitlePillRow}>
          <Text style={[typography.headingH2, styles.jobTitleFlex]} numberOfLines={3}>
            {title}
          </Text>
          <View style={styles.statusPillAlign}>
            <JobDetailStatusPill kind={workStatus} typography={typography} />
          </View>
        </View>
        <Text style={typography.jobDetailSubtitle}>
          <Text>{customerName}</Text>
          <Text>{` • `}</Text>
          <Text>{lastWorkedLabel}</Text>
        </Text>
        <JobDetailCategoryChip
          labelUppercase={categoryLabelUppercase}
          typography={typography}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  jobCardShell: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    borderRadius: radius('Radius/16'),
  },
  jobCardContent: {
    paddingVertical: space('Spacing/16'),
    gap: space('Spacing/8'),
  },
  jobTitlePillRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space('Spacing/8'),
    width: '100%',
  },
  jobTitleFlex: {
    flex: 1,
    minWidth: 0,
  },
  statusPillAlign: {
    marginTop: space('Spacing/3'),
    flexShrink: 0,
  },
});
