import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space } from '@fieldsolo/design-system/lib/tokens';

import { bg, cardShadowRn, fg } from '../../theme/nativeTokens';
import type { TextStyles } from '../../theme/nativeTokens';
import { SessionSheetBackIcon } from '../figma-icons/JobDetailScreenIcons';
import { BottomSheetShell } from './BottomSheetShell';
import { screenHeaderA11y } from '../../lib/accessibility';

type ConfirmMinimumInfoBottomSheetProps = {
  typography: TextStyles;
  visible: boolean;
  onClose?: () => void;
  onClosed?: () => void;
  onConfirmPress?: () => void;
};

/**
 * Gate sheet before the mark-complete financial completeness wizard.
 */
export function ConfirmMinimumInfoBottomSheet({
  typography,
  visible,
  onClose,
  onClosed,
  onConfirmPress,
}: ConfirmMinimumInfoBottomSheetProps) {
  const accent = color('Semantic/Status/Warning/Text');

  return (
    <BottomSheetShell visible={visible} onClose={onClose} onClosed={onClosed}>
      <View style={styles.body}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onClose}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <SessionSheetBackIcon color={fg.secondary} />
          <Text style={[typography.bodyBold, { color: fg.secondary }]}>Back</Text>
        </Pressable>

        <Text {...screenHeaderA11y()} style={[typography.titleH3, { color: fg.primary }]}>
          Confirm minimum info before marking complete
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Confirm Info"
          onPress={onConfirmPress}
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: accent, shadowColor: accent },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[typography.ctaPrimaryLabel, styles.primaryLabel]}>Confirm Info</Text>
        </Pressable>
      </View>
    </BottomSheetShell>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: space('Spacing/16'),
    width: '100%',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/4'),
    alignSelf: 'flex-start',
  },
  primary: {
    minHeight: space('Spacing/50'),
    borderRadius: radius('Radius/12'),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space('Spacing/8'),
    ...cardShadowRn,
  },
  primaryLabel: {
    color: color('Foundation/Surface/White'),
  },
  pressed: {
    opacity: 0.85,
  },
});
