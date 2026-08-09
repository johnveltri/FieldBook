import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius } from '../../theme/nativeTokens';
import { PlatformFloatingSurface } from './PlatformFloatingSurface';
import { usePlatformGlass } from './usePlatformGlass';

type PlatformHeaderActionProps = {
  accessibilityLabel: string;
  onPress: () => void;
  children: ReactNode;
  /** Applied to the outer chrome (not the inner hit), so icons stay centered. */
  style?: StyleProp<ViewStyle>;
  /** When false, skip the floating chrome wrapper (icon-only hit target). */
  useFloatingChrome?: boolean;
};

const MIN_TOUCH = 44;

/**
 * Slack-like circular header chrome for Back / Close / Inbox / Profile.
 * iOS: Liquid Glass circle. Android: elevated white circle.
 */
export function PlatformHeaderAction({
  accessibilityLabel,
  onPress,
  children,
  style,
  useFloatingChrome = true,
}: PlatformHeaderActionProps) {
  const { useGlass } = usePlatformGlass();

  const hit = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        useFloatingChrome ? styles.hitFill : styles.hitStandalone,
        pressed && styles.pressed,
        !useFloatingChrome ? style : null,
      ]}
    >
      {children}
    </Pressable>
  );

  if (!useFloatingChrome) {
    return hit;
  }

  // Both platforms get floating circular chrome (Slack top-right capsule language).
  if (useGlass || Platform.OS === 'android') {
    return (
      <PlatformFloatingSurface interactive={useGlass} style={[styles.chromeWrap, style]}>
        {hit}
      </PlatformFloatingSurface>
    );
  }

  return hit;
}

const styles = StyleSheet.create({
  /** Fills the 44×44 chrome and keeps the glyph optically centered. */
  hitFill: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitStandalone: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius('Radius/Full'),
  },
  chromeWrap: {
    borderRadius: radius('Radius/Full'),
    width: MIN_TOUCH,
    height: MIN_TOUCH,
  },
  pressed: {
    opacity: 0.75,
  },
});
