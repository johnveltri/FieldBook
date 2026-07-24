import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { radius, space } from '@fieldsolo/design-system/lib/tokens';
import type { JobDetailWorkStatus } from '@fieldsolo/shared-types';

import { dynamicTypeTextStyle } from '../../theme/dynamicTypeText';
import { bg, border } from '../../theme/nativeTokens';
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

  const ctaShadow: ViewStyle = useMemo(
    () =>
      cta.shadowOpacity > 0
        ? {
            shadowColor: cta.shadowColor,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: cta.shadowOpacity,
            shadowRadius: 2,
            elevation: cta.borderWidth ? 1 : 2,
          }
        : { elevation: 0 },
    [cta.shadowColor, cta.shadowOpacity, cta.borderWidth],
  );

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
          ctaShadow,
        ]}
      >
        <Text style={[ctaLabelType, { color: cta.labelColor, textAlign: 'center' }]}>
          {cta.label}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
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
    borderWidth: 1,
    borderColor: border.subtle,
    backgroundColor: bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
