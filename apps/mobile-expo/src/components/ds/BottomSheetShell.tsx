import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  type KeyboardEvent,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius, space } from '@fieldbook/design-system/lib/tokens';

import { bg, border } from '../../theme/nativeTokens';

type BottomSheetShellProps = {
  children: ReactNode;
  visible: boolean;
  extraBottomOffset?: number;
  onClose?: () => void;
  onClosed?: () => void;
};

/**
 * Reusable app-level bottom-sheet frame for edit/action flows.
 * Includes scrim, top rounded shell, drag handle, and safe-area bottom padding.
 */
export function BottomSheetShell({
  children,
  visible,
  extraBottomOffset = 0,
  onClose,
  onClosed,
}: BottomSheetShellProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(420)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const forcedOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scrimOpacity, {
          toValue: 0.3,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 420,
        duration: 210,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scrimOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClosed?.();
    });
  }, [onClosed, scrimOpacity, translateY, visible]);

  useEffect(() => {
    Animated.timing(forcedOffset, {
      toValue: Math.max(0, extraBottomOffset),
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [extraBottomOffset, forcedOffset]);

  useEffect(() => {
    const updateKeyboardOffset = (event: KeyboardEvent, show: boolean) => {
      const height = show
        ? Math.max(0, event.endCoordinates.height - insets.bottom)
        : 0;
      Animated.timing(keyboardOffset, {
        toValue: height,
        duration: event.duration ?? 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    };

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) =>
      updateKeyboardOffset(e, true),
    );
    const hideSub = Keyboard.addListener(hideEvent, (e) =>
      updateKeyboardOffset(e, false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, keyboardOffset]);

  // When the sheet is hidden we still keep the view tree mounted so the slide-down
  // animation can play, but taps must pass through to whatever is behind us —
  // otherwise stacking two sheets (e.g. chooser + edit) swallows the active sheet's
  // taps via the inactive sheet's scrim Pressable.
  return (
    <View
      style={styles.overlay}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close bottom sheet"
        onPress={onClose}
        style={StyleSheet.absoluteFillObject}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + space('Spacing/12'),
            transform: [
              {
                translateY: Animated.add(
                  translateY,
                  Animated.multiply(Animated.add(keyboardOffset, forcedOffset), -1),
                ),
              },
            ],
          },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <View style={styles.handle} />
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color('Foundation/Text/Primary'),
    opacity: 0.3,
  },
  sheet: {
    borderTopLeftRadius: radius('Radius/32'),
    borderTopRightRadius: radius('Radius/32'),
    borderTopWidth: 1,
    borderTopColor: border.subtle,
    backgroundColor: bg.canvasWarm,
    paddingTop: space('Spacing/16'),
    paddingHorizontal: space('Spacing/24'),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 6,
    borderRadius: radius('Radius/Full'),
    backgroundColor: color('Foundation/Text/Primary'),
    opacity: 0.2,
    marginBottom: space('Spacing/16'),
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 343,
  },
});
