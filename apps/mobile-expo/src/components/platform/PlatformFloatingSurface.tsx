import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView } from 'expo-glass-effect';

import { color, colorWithAlpha } from '@fieldsolo/design-system/lib/tokens';
import { bg, radius } from '../../theme/nativeTokens';
import { usePlatformGlass } from './usePlatformGlass';

type PlatformFloatingSurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Pill / circle (default) vs rounded rect for menu rows. */
  shape?: 'pill' | 'rounded';
  /** Interactive glass responds to touch (FAB / menu rows). Prefer Pressable children for reliable presses. */
  interactive?: boolean;
  /**
   * `fab` — primary + circle: Liquid Glass tint on iOS, Material 3 brand FAB on Android.
   * `menu` — action pills: Liquid Glass on iOS, Material 3 elevated surface on Android.
   * `dock` — legacy floating chrome fallback (headers, etc.).
   */
  tone?: 'fab' | 'menu' | 'dock';
  testID?: string;
};

const brandPrimary = color('Brand/Primary');

/**
 * Floating chrome for FAB, quick-action pills, and related shell controls.
 */
export function PlatformFloatingSurface({
  children,
  style,
  shape = 'pill',
  interactive = false,
  tone = 'fab',
  testID,
}: PlatformFloatingSurfaceProps) {
  const { useGlass } = usePlatformGlass();
  const radiusStyle: ViewStyle =
    shape === 'pill'
      ? { borderRadius: radius('Radius/Full') }
      : { borderRadius: radius('Radius/16') };

  // Official iOS Liquid Glass — no custom dark rim / opaque underlay.
  if (useGlass && (tone === 'fab' || tone === 'menu')) {
    const isMenu = tone === 'menu';
    return (
      <GlassView
        testID={testID}
        style={[radiusStyle, styles.glassHost, style]}
        // Menu: regular glass + strong white tint so pills read closer to Android’s white surfaces.
        glassEffectStyle="regular"
        colorScheme="light"
        tintColor={
          isMenu ? colorWithAlpha('Foundation/Surface/White', 0.88) : brandPrimary
        }
        // Keep false so nested Pressables reliably receive taps (isInteractive can swallow them).
        isInteractive={false}
      >
        <View
          style={[
            isMenu ? styles.glassContentIntrinsic : styles.glassContentFixed,
            radiusStyle,
          ]}
          pointerEvents="box-none"
        >
          {children}
        </View>
      </GlassView>
    );
  }

  // Android Material 3 surfaces (and iOS reduce-transparency fallback).
  // FAB = opaque primary container; menu = translucent surface-container (not solid cards).
  if (tone === 'fab' || tone === 'menu') {
    return (
      <View
        testID={testID}
        style={[
          radiusStyle,
          tone === 'fab' ? styles.m3Fab : styles.m3Menu,
          Platform.OS === 'android'
            ? tone === 'fab'
              ? styles.m3FabElevation
              : styles.m3MenuElevation
            : styles.iosFallbackShadow,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Legacy dock / header chrome.
  if (useGlass) {
    return (
      <GlassView
        testID={testID}
        style={[radiusStyle, styles.glassHost, style]}
        glassEffectStyle="regular"
        colorScheme="light"
        isInteractive={interactive}
      >
        <View style={[styles.glassContentFixed, radiusStyle]} pointerEvents="box-none">
          {children}
        </View>
      </GlassView>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        radiusStyle,
        styles.fallbackSurface,
        Platform.OS === 'android' ? styles.m3FabElevation : styles.iosFallbackShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassHost: {
    overflow: 'hidden',
  },
  /** Circle FAB: fill the explicit width/height from the caller. */
  glassContentFixed: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * Menu pills: size to children. Forcing height:100% here collapses rows when the
   * GlassView has no intrinsic height (only one option appeared on iOS).
   */
  glassContentIntrinsic: {
    alignItems: 'stretch',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  /** Material 3 FAB — opaque primary container. */
  m3Fab: {
    overflow: 'hidden',
    backgroundColor: brandPrimary,
  },
  /**
   * Material 3 FAB-menu item: elevated surface-container (readable over the scrim).
   */
  m3Menu: {
    overflow: 'hidden',
    backgroundColor: colorWithAlpha('Foundation/Surface/White', 0.92),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colorWithAlpha('Foundation/Text/Primary', 0.08),
  },
  m3FabElevation: {
    elevation: 6,
  },
  m3MenuElevation: {
    elevation: 3,
  },
  fallbackSurface: {
    overflow: 'hidden',
    backgroundColor: bg.surfaceWhite,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(43, 52, 65, 0.16)',
  },
  iosFallbackShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
});
