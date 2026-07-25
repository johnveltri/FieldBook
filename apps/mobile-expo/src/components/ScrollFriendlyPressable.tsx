import { useRef, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

const SCROLL_CANCEL_PX = 10;

type ScrollFriendlyPressableProps = Omit<PressableProps, 'onPress'> & {
  onPress?: () => void;
  /**
   * Finger movement after scroll-intent is detected (pageY delta; up is negative).
   * Parent should apply `-dy` to its scroll offset so a drag that starts on the
   * FAB still scrolls the page and never fires `onPress`.
   */
  onScrollDelta?: (dy: number) => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Ignores a tap when the finger moves vertically (scroll intent) before release,
 * and optionally forwards that drag to the parent scroller (FAB is a sibling of
 * the ScrollView, so canceling press alone does not scroll).
 */
export function ScrollFriendlyPressable({
  onPress,
  onScrollDelta,
  children,
  ...rest
}: ScrollFriendlyPressableProps) {
  const startY = useRef(0);
  const lastY = useRef(0);
  const cancelled = useRef(false);

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        cancelled.current = false;
        startY.current = e.nativeEvent.pageY;
        lastY.current = e.nativeEvent.pageY;
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        rest.onPressOut?.(e);
      }}
      onPress={() => {
        if (cancelled.current) return;
        onPress?.();
      }}
      onTouchMove={(e) => {
        const pageY = e.nativeEvent.pageY;
        if (!cancelled.current) {
          if (Math.abs(pageY - startY.current) > SCROLL_CANCEL_PX) {
            cancelled.current = true;
            const dy = pageY - lastY.current;
            lastY.current = pageY;
            if (dy !== 0) onScrollDelta?.(dy);
          }
        } else {
          const dy = pageY - lastY.current;
          lastY.current = pageY;
          if (dy !== 0) onScrollDelta?.(dy);
        }
        rest.onTouchMove?.(e);
      }}
    >
      {children}
    </Pressable>
  );
}
