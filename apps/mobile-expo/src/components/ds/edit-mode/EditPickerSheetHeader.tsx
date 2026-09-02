import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, space } from '@fieldsolo/design-system/lib/tokens';

import { screenHeaderA11y } from '../../../lib/accessibility';
import { fg } from '../../../theme/nativeTokens';
import type { TextStyles } from '../../../theme/nativeTokens';

type EditPickerSheetHeaderProps = {
  typography: TextStyles;
  title?: string;
  /** Clears the field value; `onClose` runs afterward when provided. */
  onClear?: () => void;
  onClose?: () => void;
  onDone: () => void;
  doneLabel?: string;
};

/** Picker bottom sheet chrome — Clear left, Done upper right, optional centered title. */
export function EditPickerSheetHeader({
  typography,
  title,
  onClear,
  onClose,
  onDone,
  doneLabel = 'Done',
}: EditPickerSheetHeaderProps) {
  const handleClear = () => {
    onClear?.();
    onClose?.();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {onClear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear"
            onPress={handleClear}
            style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
          >
            <Text style={[typography.bodyBold, { color: fg.secondary }]}>Clear</Text>
          </Pressable>
        ) : (
          <View style={styles.clearSpacer} />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={doneLabel}
          onPress={onDone}
          style={({ pressed }) => [styles.done, pressed && styles.pressed]}
        >
          <Text style={[typography.bodyBold, { color: color('Brand/Primary') }]}>{doneLabel}</Text>
        </Pressable>
      </View>
      {title ? (
        <Text {...screenHeaderA11y()} style={[typography.titleH3, styles.title, { color: fg.primary }]}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: space('Spacing/8'),
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  clear: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: space('Spacing/12'),
  },
  clearSpacer: {
    width: 72,
  },
  done: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: space('Spacing/12'),
  },
  title: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
