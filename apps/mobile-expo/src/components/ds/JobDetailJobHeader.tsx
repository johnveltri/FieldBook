import { StyleSheet, Text, View } from 'react-native';
import { radius, space } from '@fieldsolo/design-system/lib/tokens';
import type { JobDetailWorkStatus } from '@fieldsolo/shared-types';

import type { TextStyles } from '../../theme/nativeTokens';
import { screenHeaderA11y } from '../../lib/accessibility';
import { JobDetailStatusPill } from './JobDetailStatusPill';

export function JobDetailJobHeader({
  title,
  customerName,
  serviceAddress,
  lastWorkedLabel,
  workStatus,
  typography,
}: {
  title: string;
  customerName: string;
  serviceAddress: string;
  lastWorkedLabel: string;
  workStatus: JobDetailWorkStatus;
  typography: TextStyles;
}) {
  const customerLabel = customerName.trim().length > 0 ? customerName.trim() : 'No Customer';
  const serviceAddressLabel = serviceAddress.trim();

  return (
    <View style={styles.jobCardShell}>
      <View style={styles.jobCardContent}>
        <View style={styles.jobTitlePillRow}>
          <View style={styles.jobTitleWrap}>
            <Text
              {...screenHeaderA11y(title)}
              style={[typography.displayH1, styles.jobTitle]}
            >
              {title}
            </Text>
          </View>
          <View style={styles.statusPillAlign}>
            <JobDetailStatusPill kind={workStatus} typography={typography} />
          </View>
        </View>
        <Text style={typography.jobDetailSubtitle}>
          <Text>{customerLabel}</Text>
          <Text>{` • `}</Text>
          <Text>{lastWorkedLabel}</Text>
        </Text>
        {serviceAddressLabel.length > 0 ? (
          <Text style={typography.jobDetailSubtitle}>{serviceAddressLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  jobCardShell: {
    width: '100%',
    borderRadius: radius('Radius/16'),
  },
  jobCardContent: {
    paddingTop: space('Spacing/8'),
    paddingBottom: space('Spacing/12'),
    gap: space('Spacing/8'),
  },
  jobTitlePillRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space('Spacing/8'),
    width: '100%',
  },
  jobTitleWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  jobTitle: {
    // Display-H1 is uppercase by default; job titles are sentence case.
    textTransform: 'none',
  },
  statusPillAlign: {
    flexShrink: 0,
    alignItems: 'flex-end',
    marginTop: space('Spacing/16'),
  },
});
