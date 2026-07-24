import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { color, radius, space } from '@fieldsolo/design-system/lib/tokens';

import { dynamicTypeTextStyle } from '../../theme/dynamicTypeText';
import { cardShadowRn, type TextStyles } from '../../theme/nativeTokens';

export type IncompleteJobRowCardProps = {
  title: string;
  missingFields: string[];
  typography: TextStyles;
  onPress: () => void;
};

/**
 * “Needs attention” job row — warning surface (Figma `786:29` Incomplete Job variant).
 */
export function IncompleteJobRowCard({
  title,
  missingFields,
  typography,
  onPress,
}: IncompleteJobRowCardProps) {
  const { fontScale } = useWindowDimensions();
  const missingLine = missingFields.length > 0 ? missingFields.join(', ') : '—';
  const titleType = dynamicTypeTextStyle(typography.bodyBold, fontScale, {
    letterSpacingUntilScale: 99,
    padRatio: 0.1,
  });
  const bodyType = dynamicTypeTextStyle(typography.bodySmall, fontScale, {
    letterSpacingUntilScale: 99,
    padRatio: 0.08,
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. Missing ${missingLine}. Fix`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.main}>
        <View style={styles.titleStack}>
          <Text style={[titleType, styles.title]} numberOfLines={fontScale > 1.6 ? 3 : 2}>
            {title}
          </Text>
          <Text style={[bodyType, styles.missingText]} numberOfLines={fontScale > 1.6 ? 5 : 4}>
            {`Missing: ${missingLine}`}
          </Text>
        </View>
      </View>
      <View style={styles.trailing}>
        <Text style={[titleType, styles.fixLink]}>Fix →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: space('Spacing/20'),
    paddingVertical: space('Spacing/16'),
    backgroundColor: color('Semantic/Status/Warning/BG'),
    borderWidth: 1,
    borderColor: color('Semantic/Status/Warning/Stroke'),
    borderRadius: radius('Radius/16'),
    overflow: 'visible',
    ...cardShadowRn,
  },
  main: {
    flex: 1,
    minWidth: 0,
    marginRight: space('Spacing/8'),
  },
  titleStack: {
    gap: space('Spacing/4'),
    minWidth: 0,
  },
  title: {
    color: color('Foundation/Text/Primary'),
    flexShrink: 1,
    minWidth: 0,
  },
  missingText: {
    minWidth: 0,
    color: color('Semantic/Status/Error/Text'),
  },
  trailing: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  fixLink: {
    color: color('Semantic/Status/Error/Text'),
  },
  pressed: { opacity: 0.75 },
});
