import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { radius, space } from '@fieldsolo/design-system/lib/tokens';
import type { JobDetailWorkStatus } from '@fieldsolo/shared-types';

import { dynamicTypeTextStyle } from '../../theme/dynamicTypeText';
import { bg, cardShadowRn } from '../../theme/nativeTokens';
import type { TextStyles } from '../../theme/nativeTokens';
import { jobDetailCtaConfig } from './jobDetailCtaConfig';

export function JobDetailCtaRow({
  workStatus,
  typography,
  onPrimaryPress,
  onMorePress,
  MoreIcon,
  primaryDisabled,
  moreDisabled,
}: {
  workStatus: JobDetailWorkStatus;
  typography: TextStyles;
  onPrimaryPress: () => void;
  onMorePress: () => void;
  MoreIcon: ReactElement<{ color: string }>;
  primaryDisabled?: boolean;
  moreDisabled?: boolean;
}) {
  const { fontScale } = useWindowDimensions();
  const cta = useMemo(() => jobDetailCtaConfig(workStatus), [workStatus]);
  const ctaLabelType = dynamicTypeTextStyle(typography.ctaPrimaryLabel, fontScale, {
    letterSpacingUntilScale: 99,
    padRatio: 0.12,
  });

  return (
    <View style={styles.ctaRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cta.label}
        disabled={primaryDisabled}
        onPress={onPrimaryPress}
        style={({ pressed }) => [
          styles.ctaPrimary,
          {
            backgroundColor: cta.backgroundColor,
            opacity: primaryDisabled ? 0.5 : pressed ? 0.92 : 1,
            borderWidth: cta.borderWidth ?? 0,
            borderColor: cta.borderColor ?? 'transparent',
          },
        ]}
      >
        <Text style={[ctaLabelType, { color: cta.labelColor, textAlign: 'center' }]}>
          {cta.label}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change job status"
        accessibilityState={{ disabled: moreDisabled }}
        disabled={moreDisabled}
        onPress={onMorePress}
        style={({ pressed }) => [
          styles.ctaMore,
          pressed && !moreDisabled && styles.pressed,
          moreDisabled && { opacity: 0.5 },
        ]}
      >
        {MoreIcon}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/12'),
    width: '100%',
  },
  ctaPrimary: {
    ...cardShadowRn,
    flex: 1,
    minWidth: 0,
    minHeight: space('Spacing/50'),
    borderRadius: radius('Radius/12'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space('Spacing/16'),
    paddingVertical: space('Spacing/12'),
  },
  ctaMore: {
    flexShrink: 0,
    width: space('Spacing/50'),
    minHeight: space('Spacing/50'),
    borderRadius: radius('Radius/12'),
    backgroundColor: bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadowRn,
  },
  pressed: { opacity: 0.75 },
});
