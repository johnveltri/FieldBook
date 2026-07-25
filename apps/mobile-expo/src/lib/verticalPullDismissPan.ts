import { PanResponder, Platform, type PanResponderGestureState } from 'react-native';

const SCROLL_TOP_EPSILON = 4;

/** True when the user is pulling down while the scroll surface is at the top. */
export function shouldTakeVerticalPullDismiss(
  scrollOffsetY: number,
  gesture: PanResponderGestureState,
): boolean {
  if (gesture.dy <= 0) return false;
  if (scrollOffsetY > SCROLL_TOP_EPSILON) return false;
  return gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 0.85;
}

type VerticalPullDismissPanOptions = {
  scrollOffsetY: () => number;
  onPullMove?: (dy: number) => void;
  onPullRelease: (gesture: PanResponderGestureState) => void;
  onPullTerminate?: () => void;
};

/** Pan handlers for swipe-down dismiss when content is scrolled to the top (Android-friendly). */
export function createVerticalPullDismissPan({
  scrollOffsetY,
  onPullMove,
  onPullRelease,
  onPullTerminate,
}: VerticalPullDismissPanOptions) {
  const shouldTake = (_e: unknown, gesture: PanResponderGestureState) =>
    shouldTakeVerticalPullDismiss(scrollOffsetY(), gesture);

  return PanResponder.create({
    onMoveShouldSetPanResponder: shouldTake,
    onMoveShouldSetPanResponderCapture:
      Platform.OS === 'android' ? shouldTake : () => false,
    onPanResponderMove: (_evt, gesture) => {
      if (gesture.dy > 0) onPullMove?.(gesture.dy);
    },
    onPanResponderRelease: (_evt, gesture) => {
      onPullRelease(gesture);
    },
    onPanResponderTerminate: () => {
      onPullTerminate?.();
    },
  }).panHandlers;
}
