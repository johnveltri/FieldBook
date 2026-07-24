import { Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { color, colorWithAlpha, radius, space } from '@fieldsolo/design-system/lib/tokens';

import { bg, cardShadowRn, type TextStyles } from '../../theme/nativeTokens';

export type MetricSnapshotCardProps = {
  label: string;
  value: string;
  valueTone: 'success' | 'neutral';
  typography: TextStyles;
  /** When provided, the card becomes a button that navigates on press. */
  onPress?: () => void;
};

/**
 * Home weekly snapshot — large NET EARNINGS card (Figma `1931:2046`).
 */
export function MetricSnapshotCard({
  label,
  value,
  valueTone,
  typography,
  onPress,
}: MetricSnapshotCardProps) {
  const valueColor =
    valueTone === 'success' ? color('Semantic/Status/Success/Text') : color('Foundation/Text/Primary');

  // Metric-XL uses 100% lineHeight which clips mono-bold glyphs; also drop it so
  // adjustsFontSizeToFit can shrink wide currency strings at accessibility sizes.
  const { lineHeight: _ignoredLineHeight, ...metricType } = typography.metricXL as TextStyle;

  const inner = (
    <View style={styles.primary}>
      <Text style={[typography.labelCaps, styles.label, { color: color('Foundation/Text/Secondary') }]}>
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.55}
        numberOfLines={1}
        style={[metricType, styles.value, { color: valueColor }]}
      >
        {value}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${value}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View style={styles.card} accessibilityRole="summary" accessibilityLabel={`${label} ${value}`}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: bg.surfaceWhite,
    borderWidth: 1,
    borderColor: colorWithAlpha('Foundation/Border/Default', 0.1),
    borderRadius: radius('Radius/24'),
    padding: space('Spacing/32'),
    overflow: 'visible',
    ...cardShadowRn,
  },
  primary: {
    alignItems: 'center',
    gap: space('Spacing/4'),
    width: '100%',
    overflow: 'visible',
  },
  label: {
    textAlign: 'center',
  },
  value: {
    textAlign: 'center',
    width: '100%',
    // Breathing room so adjustsFontSizeToFit glyphs aren't flush with the card edge.
    paddingVertical: space('Spacing/4'),
  },
  pressed: { opacity: 0.75 },
});
