import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';

import { bg } from '../theme/nativeTokens';

const absoluteFill = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

type CanvasTiledBackgroundProps = {
  /**
   * Scroll offset for pages using scroll views.
   * Pass Animated scroll Y so the warm canvas layer moves with content.
   */
  scrollY?: Animated.Value;
  /**
   * Total scrollable content height (typically reported via the scroll
   * view's `onContentSizeChange`). When provided, the layer is sized to
   * cover the entire scrollable area on long screens. Falls back to the
   * viewport height when omitted.
   */
  contentHeight?: number;
};

/** Flat warm-paper canvas behind scrollable screens (no ruled lines). */
export function CanvasTiledBackground({
  scrollY,
  contentHeight,
}: CanvasTiledBackgroundProps = {}) {
  const { width, height: windowHeight } = useWindowDimensions();
  const layerHeight = Math.max(windowHeight, contentHeight ?? 0);

  return (
    <Animated.View
      style={[
        styles.layer,
        { width, height: layerHeight },
        scrollY ? { transform: [{ translateY: Animated.multiply(scrollY, -1) }] } : null,
      ]}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bg.canvasWarm }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...absoluteFill,
    zIndex: 0,
    elevation: 0,
  },
});
