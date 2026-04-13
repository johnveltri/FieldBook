import { StyleSheet, Text, View } from 'react-native';
import { color, radius, space } from '@fieldbook/design-system/lib/tokens';
import type { JobDetailWorkStatus } from '@fieldbook/shared-types';

import type { TextStyles } from '../../theme/nativeTokens';

const PILL_LABEL: Record<JobDetailWorkStatus, string> = {
  paid: 'PAID',
  notStarted: 'NOT STARTED',
  inProgress: 'IN PROGRESS',
  completed: 'COMPLETED',
  onHold: 'ON HOLD',
  cancelled: 'CANCELLED',
};

function statusPillColors(kind: JobDetailWorkStatus): {
  bg: string;
  border: string;
  text: string;
} {
  switch (kind) {
    case 'paid':
      return {
        bg: color('Semantic/Status/Success/BG'),
        border: color('Semantic/Status/Success/Text'),
        text: color('Semantic/Status/Success/Text'),
      };
    case 'notStarted':
      return {
        bg: color('Semantic/Status/Neutral/BG'),
        border: color('Semantic/Status/Neutral/Text'),
        text: color('Semantic/Status/Neutral/Text'),
      };
    case 'inProgress':
      return {
        bg: color('Semantic/Status/Info/BG'),
        border: color('Semantic/Status/Info/Text'),
        text: color('Semantic/Status/Info/Text'),
      };
    case 'completed':
      return {
        bg: color('Semantic/Status/Warning/BG'),
        border: color('Semantic/Status/Warning/Stroke'),
        text: color('Semantic/Status/Warning/Label'),
      };
    case 'onHold':
      return {
        bg: color('Semantic/Status/Paused/BG'),
        border: color('Semantic/Status/Paused/Text'),
        text: color('Semantic/Status/Paused/Text'),
      };
    case 'cancelled':
      return {
        bg: color('Semantic/Status/Error/BG'),
        border: color('Semantic/Status/Error/Text'),
        text: color('Semantic/Status/Error/Text'),
      };
  }
}

export function JobDetailStatusPill({
  kind,
  typography,
}: {
  kind: JobDetailWorkStatus;
  typography: TextStyles;
}) {
  const c = statusPillColors(kind);
  return (
    <View style={[styles.pillOuter, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[typography.pillCompact, { color: c.text, textTransform: 'none' }]}>
        {PILL_LABEL[kind]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pillOuter: {
    borderWidth: 1,
    borderRadius: radius('Radius/Full'),
    paddingHorizontal: space('Spacing/8'),
    paddingVertical: space('Spacing/6'),
  },
});
