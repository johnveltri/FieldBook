import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';

import { colorWithAlpha } from '@fieldbook/design-system/lib/tokens';

import { bg } from '../theme/nativeTokens';

/**
 * Lined notebook paper over canvas — Figma Job Detail (`1836:1875`).
 *
 * We do **not** use `Image` + `resizeMode="repeat"` here: on iOS that path is unreliable
 * (tiling often fails or disappears with `absoluteFill` + low opacity). Instead we draw
 * the same 28px rhythm as Figma’s `background-size: 200px 28px` tile with hairline rows.
 *
 * Asset `assets/images/canvas-lined-tile.png` remains available if we later adopt
 * `expo-image` or a native tiled layer.
 */
const ROW_HEIGHT = 28;

type CanvasTiledBackgroundProps = {
  /**
   * Scroll offset for pages using scroll views.
   * Pass Animated scroll Y to make ruled lines move with content.
   */
  scrollY?: Animated.Value;
};

export function CanvasTiledBackground({ scrollY }: CanvasTiledBackgroundProps = {}) {
  const { width, height } = useWindowDimensions();
  const rows = Math.ceil(height / ROW_HEIGHT) + 2;
  /** Lined texture — 15% primary (was 20%; −0.05 opacity vs prior). */
  const lineColor = colorWithAlpha('Foundation/Text/Primary', 0.15);

  return (
    <Animated.View
      style={[
        styles.layer,
        { width, height },
        scrollY ? { transform: [{ translateY: Animated.multiply(scrollY, -1) }] } : null,
      ]}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bg.canvasWarm }]} />
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            width,
            top: i * ROW_HEIGHT,
            height: ROW_HEIGHT,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: lineColor,
          }}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
