import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type LayoutChangeEvent,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_COLUMN_MAX_WIDTH, contentGutter } from '@fieldsolo/design-system/lib/responsiveLayout';
import { color, radius, space } from '@fieldsolo/design-system/lib/tokens';

import { useBottomSheetStackWriters } from '../../context/BottomSheetStackContext';
import { announceAccessibilityMessage } from '../../lib/accessibility';
import { bg, border } from '../../theme/nativeTokens';
import {
  PanGestureHandler,
  State,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import {
  BottomSheetScrollProvider,
  BottomSheetScrollView,
} from './bottomSheetScrollContext';

const absoluteFill = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

type BottomSheetShellVariant =
  | 'standard'
  | /**
     * No outer cream shell, drag handle, or top corner radius. Children own
     * the entire visual frame (header, body, padding). Used by the Live
     * Session sheet which paints its own dark `live-session-header` slab.
     */
    'fullbleedDark';

type BottomSheetShellProps = {
  children: ReactNode;
  visible: boolean;
  extraBottomOffset?: number;
  onClose?: () => void;
  onClosed?: () => void;
  /**
   * Visual variant of the outer shell. Defaults to `'standard'` (cream
   * rounded surface + drag handle).
   */
  variant?: BottomSheetShellVariant;
  /**
   * Cap the sheet height at `fraction * window.height` and make the inner
   * content area vertically scrollable past that. The default is unset
   * (sheet grows with its children — same as before this prop existed).
   *
   * Used by the Live Session sheet which can extend essentially to the top
   * of the screen if its content requires it, and only scrolls once it
   * has reached its max height.
   */
  autoSizeUpToFraction?: number;
  /**
   * Whether this sheet should self-register with the global
   * `BottomSheetStackContext` so the floating live-session bar can hide
   * while this sheet is active. Defaults to `true` for app-level sheets. The Live
   * Session sheets themselves opt out (`false`) — otherwise they would hide
   * their own minimized bar during the sheet-to-bar transition.
   */
  registerInGlobalStack?: boolean;
  /**
   * Extra cream padding below sheet content (above the safe-area inset).
   * @default space('Spacing/4')
   */
  bottomPaddingExtra?: number;
  /**
   * When the sheet opens, announced to VoiceOver / TalkBack (e.g. sheet title).
   */
  accessibilityTitle?: string;
  /**
   * Keeps a visible sheet rendered as a background layer while a nested
   * sheet owns touch and accessibility focus. Defaults to `true`.
   */
  interactionEnabled?: boolean;
};

/**
 * Reusable app-level bottom-sheet frame for edit/action flows.
 *
 * Includes scrim, top rounded shell (variant `standard`), drag handle, and
 * safe-area bottom padding. The Live Session sheet uses `variant='fullbleedDark'`
 * to draw its own dark header slab, and `autoSizeUpToFraction` to grow with
 * content while capping at the screen.
 */
export function BottomSheetShell({
  children,
  visible,
  extraBottomOffset = 0,
  onClose,
  onClosed,
  variant = 'standard',
  autoSizeUpToFraction,
  registerInGlobalStack = true,
  bottomPaddingExtra = space('Spacing/4'),
  accessibilityTitle,
  interactionEnabled = true,
}: BottomSheetShellProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const sheetGutter = contentGutter(windowWidth);
  const sheetStack = useBottomSheetStackWriters();
  const sheetId = useId();
  // Keep `onClose` in a ref so re-registering the sheet (when the prop
  // identity changes between renders) doesn't churn the global stack.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  // `onClosed` is commonly an inline callback that checks the parent's
  // current flow before unmounting a sheet. Keep the latest callback in a
  // ref so a parent render (for example, setting `saving`) does not restart
  // the native open/close animation just because that callback's identity
  // changed.
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);
  // Use the window height as the hidden translate-Y. A hard-coded value
  // (previously 420) is unsafe because some sheets (e.g. DropdownBottomSheet
  // with 7+ preset rows + custom input) are taller than that — the hidden
  // sheet would still poke up above the bottom edge and visually cover the
  // footer / safe-area primary button of any sheet rendered below it in the
  // sibling stack.
  const hiddenOffset = windowHeight;
  const translateY = useRef(new Animated.Value(hiddenOffset)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const forcedOffset = useRef(new Animated.Value(0)).current;
  const scrollOffsetY = useRef(0);
  const [scrollAtTop, setScrollAtTop] = useState(true);
  const panRef = useRef<PanGestureHandler>(null);

  /**
   * Tracks whether the sheet's natural content height exceeds the cap, so we
   * can switch the inner content area between "auto-size" and "scrollable
   * fixed-height" without freezing the sheet at full height when content is
   * short.
   */
  const [contentOverflow, setContentOverflow] = useState(false);

  /**
   * Tracks keyboard visibility so we can drop the safe-area bottom from
   * `paddingBottom` when the keyboard is up — the keyboard already covers
   * that region, otherwise the sheet ends up with ~SB extra cream below
   * the primary CTA when typing.
   */
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  /**
   * Keep the overlay in the elevated stacking band while a sheet is open or
   * playing its close animation. Drop back to flat once fully hidden so
   * invisible full-screen overlays do not occlude the shell FAB / minimized
   * live-session bar on Android (elevation-based compositing).
   */
  const [stackingElevated, setStackingElevated] = useState(visible);
  /** When true, swipe already carried the sheet off-screen — skip snap+slide on close. */
  const closingFromSwipeRef = useRef(false);

  useEffect(() => {
    if (visible) {
      closingFromSwipeRef.current = false;
      setStackingElevated(true);
      dragY.setValue(0);
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

    if (closingFromSwipeRef.current) {
      closingFromSwipeRef.current = false;
      dragY.setValue(0);
      translateY.setValue(hiddenOffset);
      scrimOpacity.setValue(0);
      setStackingElevated(false);
      onClosedRef.current?.();
      return;
    }

    dragY.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: hiddenOffset,
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
      if (finished) {
        setStackingElevated(false);
        onClosedRef.current?.();
      }
    });
  }, [dragY, hiddenOffset, scrimOpacity, translateY, visible]);

  const prevVisibleRef = useRef(visible);
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      announceAccessibilityMessage(accessibilityTitle);
    }
    prevVisibleRef.current = visible;
  }, [accessibilityTitle, visible]);

  useEffect(() => {
    Animated.timing(forcedOffset, {
      toValue: Math.max(0, extraBottomOffset),
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [extraBottomOffset, forcedOffset]);

  // ---- Global stack registration -------------------------------------------
  // Sheets register from open through the end of their close animation so
  // the LiveSessionOverlay hides its floating bar for the entire transition.
  // Live-session sheets opt out via `registerInGlobalStack={false}`.
  const sheetActive = visible || stackingElevated;
  useEffect(() => {
    if (!sheetStack || !registerInGlobalStack || !sheetActive) return;
    const unregister = sheetStack.registerSheet(sheetId, {
      onRequestClose: () => onCloseRef.current?.(),
    });
    return unregister;
  }, [registerInGlobalStack, sheetActive, sheetId, sheetStack]);

  // Reports the rendered sheet's top edge (window-relative) every time the
  // inner Animated.View lays out so the registry can identify the topmost
  // sheet. We compute this from the sheet's measured height + the known
  // window height since the sheet is anchored to the bottom of the window.
  const handleSheetLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (!sheetStack || !registerInGlobalStack || !visible) return;
      const measuredHeight = e.nativeEvent.layout.height;
      const topY = Math.max(0, windowHeight - measuredHeight);
      sheetStack.setSheetTop(sheetId, topY);
    },
    [registerInGlobalStack, sheetId, sheetStack, visible, windowHeight],
  );

  // iOS uses `KeyboardAvoidingView` below to push the sheet up. Android's
  // default adjustResize behavior already resizes the native scene, so adding
  // KAV `height` there double-applies the keyboard inset and can leave the
  // sheet hovering after the keyboard dismisses. This listener still tracks
  // keyboard visibility on both platforms so the sheet can drop redundant
  // safe-area padding while the keyboard is open.
  useEffect(() => {
    const onShow = () => setKeyboardVisible(true);
    const onHide = () => setKeyboardVisible(false);
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isFullbleed = variant === 'fullbleedDark';

  // Cap the OUTER sheet view at this height when the caller opts in. We
  // reserve the keyboard offset / extra offset slots same as the existing
  // translate logic — the sheet's max useful height shrinks when the keyboard
  // is up so primary actions stay reachable. Bottom inset is part of the
  // sheet's internal padding (see `paddingBottom` below) and is included in
  // the cap.
  const maxSheetHeight = autoSizeUpToFraction
    ? Math.max(160, windowHeight * autoSizeUpToFraction)
    : undefined;

  // When the keyboard is up the keyboard itself covers the home indicator
  // / safe-area bottom region, so we collapse our own safe-area
  // paddingBottom to keep the primary CTA flush ~12px above the keyboard
  // top instead of leaving an SB-sized gap of cream below it.
  const effectiveSafeBottom = keyboardVisible ? 0 : insets.bottom;

  // The inner scrollview becomes height-locked when content overflows. We
  // approximate the available content height by subtracting the chrome we
  // own (handle area, safe-area bottom). Children own their padding when
  // `fullbleedDark`, so the only overhead there is the safe-area bottom.
  const sheetChromeHeight = isFullbleed
    ? effectiveSafeBottom + bottomPaddingExtra
    : space('Spacing/12') /* paddingTop */ +
      space('Spacing/12') /* handleHitArea paddingBottom */ +
      6 /* handle h */ +
      effectiveSafeBottom +
      bottomPaddingExtra;

  const scrollViewMaxHeight =
    maxSheetHeight != null ? Math.max(0, maxSheetHeight - sheetChromeHeight) : undefined;

  const dismissSheet = useCallback(() => {
    onCloseRef.current?.();
  }, []);

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: dragY } }],
    {
      useNativeDriver: true,
      listener: (event: { nativeEvent: { translationY: number } }) => {
        const ty = event.nativeEvent.translationY;
        if (ty < 0 || scrollOffsetY.current > 4) {
          dragY.setValue(0);
        }
      },
    },
  );

  const onPanHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      const { state, oldState, translationY, velocityY } = event.nativeEvent;
      if (oldState === State.ACTIVE) {
        if (scrollOffsetY.current > 4) {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
          return;
        }
        if (translationY > 72 || velocityY > 800) {
          const start = Math.max(0, translationY);
          dragY.setValue(start);
          const remaining = Math.max(1, hiddenOffset - start);
          const duration = Math.max(140, Math.min(280, remaining * 0.32));
          closingFromSwipeRef.current = true;
          Animated.parallel([
            Animated.timing(dragY, {
              toValue: hiddenOffset,
              duration,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(scrimOpacity, {
              toValue: 0,
              duration: Math.min(180, duration),
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start(({ finished }) => {
            if (!finished) {
              closingFromSwipeRef.current = false;
              return;
            }
            dismissSheet();
          });
          return;
        }
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      }
      if (state === State.BEGAN) {
        if (!closingFromSwipeRef.current) {
          dragY.setValue(0);
        }
      }
    },
    [dismissSheet, dragY, hiddenOffset, scrimOpacity],
  );

  const onScrollOffsetChange = useCallback((offsetY: number) => {
    const atTop = offsetY <= 4;
    setScrollAtTop((prev) => (prev === atTop ? prev : atTop));
  }, []);

  // Bleed into the status bar only. Never bleed below the host — sheets that
  // sit in `shellMain` (above the tab bar) would otherwise paint scrim over
  // the nav as a solid grey band under the sheet.
  const overlayBleedStyle = useMemo(
    () => ({
      top: -insets.top,
    }),
    [insets.top],
  );

  // When the sheet is hidden we still keep the view tree mounted so the slide-down
  // animation can play, but taps must pass through to whatever is behind us —
  // otherwise stacking two sheets (e.g. chooser + edit) swallows the active sheet's
  // taps via the inactive sheet's scrim Pressable.
  const interactive = visible && interactionEnabled;
  return (
    <View
      testID="bottom-sheet-overlay"
      style={[
        styles.overlay,
        stackingElevated ? styles.overlayElevated : styles.overlayFlat,
      ]}
      pointerEvents={interactive ? 'box-none' : 'none'}
      accessibilityViewIsModal={interactive}
      accessibilityElementsHidden={!interactive}
      importantForAccessibility={interactive ? 'yes' : 'no-hide-descendants'}
    >
      {/* Scrim sits in its OWN absolutely-positioned layer so it covers
          the full screen (including the area behind the keyboard) — keeps
          tap-to-dismiss working everywhere outside the sheet.
          Bleed into system bars on Android without expanding the sheet host. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close bottom sheet"
        onPress={onClose}
        style={[absoluteFill, overlayBleedStyle]}
        pointerEvents={interactive ? 'auto' : 'none'}
      >
        <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]} />
      </Pressable>
      {/* iOS needs explicit keyboard avoidance. Android's native scene uses
          adjustResize, so it must not also receive a KAV height reduction. */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <BottomSheetScrollProvider
          onDismiss={dismissSheet}
          scrollOffsetYRef={scrollOffsetY}
          onScrollOffsetChange={onScrollOffsetChange}
        >
          <PanGestureHandler
            ref={panRef}
            enabled={interactive && scrollAtTop}
            activeOffsetY={10}
            failOffsetY={-5}
            failOffsetX={[-24, 24]}
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onPanHandlerStateChange}
          >
            <Animated.View
              onLayout={handleSheetLayout}
              collapsable={false}
              style={[
                isFullbleed ? styles.sheetFullbleed : styles.sheet,
                !isFullbleed ? { paddingHorizontal: sheetGutter } : null,
                {
                  paddingBottom: isFullbleed ? 0 : effectiveSafeBottom + bottomPaddingExtra,
                  maxHeight: maxSheetHeight,
                  transform: [
                    {
                      translateY: Animated.add(
                        Animated.add(translateY, dragY),
                        Animated.multiply(forcedOffset, -1),
                      ),
                    },
                  ],
                },
              ]}
              pointerEvents={interactive ? 'auto' : 'none'}
            >
              {!isFullbleed ? (
                <View style={styles.handleHitArea}>
                  <View style={styles.handle} />
                </View>
              ) : null}
              {scrollViewMaxHeight != null ? (
                <BottomSheetScrollView
                  waitFor={scrollAtTop ? panRef : undefined}
                  style={{ maxHeight: scrollViewMaxHeight }}
                  contentContainerStyle={isFullbleed ? undefined : styles.contentContainer}
                  scrollEnabled={contentOverflow || Platform.OS === 'android'}
                  showsVerticalScrollIndicator={contentOverflow}
                  scrollEventThrottle={16}
                  nestedScrollEnabled
                  onContentSizeChange={(_w, h) => {
                    setContentOverflow(h > scrollViewMaxHeight);
                  }}
                  keyboardShouldPersistTaps="handled"
                >
                  {isFullbleed ? children : <View style={styles.content}>{children}</View>}
                </BottomSheetScrollView>
              ) : isFullbleed ? (
                children
              ) : (
                <View style={styles.content}>{children}</View>
              )}
            </Animated.View>
          </PanGestureHandler>
        </BottomSheetScrollProvider>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...absoluteFill,
    justifyContent: 'flex-end',
  },
  overlayElevated: {
    zIndex: 1000,
    elevation: 1000,
  },
  overlayFlat: {
    zIndex: 0,
    elevation: 0,
  },
  /**
   * `KeyboardAvoidingView` host. Fills the overlay (so its `flex-end`
   * justification anchors the sheet to the bottom of whatever space is left
   * after the keyboard takes its share). The KAV adds `paddingBottom` on
   * iOS; Android relies on the native scene's adjustResize behavior.
   */
  kav: {
    ...absoluteFill,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...absoluteFill,
    backgroundColor: color('Foundation/Text/Primary'),
    opacity: 0.3,
  },
  sheet: {
    borderTopLeftRadius: radius('Radius/32'),
    borderTopRightRadius: radius('Radius/32'),
    borderTopWidth: 1,
    borderTopColor: border.subtle,
    backgroundColor: bg.canvasWarm,
    paddingTop: space('Spacing/12'),
    // Horizontal inset comes from the shared responsive gutter at runtime.
  },
  /** Larger touch target for swipe-down dismiss (handle + padding). */
  handleHitArea: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingBottom: space('Spacing/12'),
  },
  /**
   * Fullbleed variant: caller owns ALL visual chrome (top corners, header
   * background, padding) so the dark live-session header can run flush to
   * the rounded top edge. Sheet fill matches the live-session header blue so
   * the clipped radius never flashes cream above the header.
   */
  sheetFullbleed: {
    borderTopLeftRadius: radius('Radius/32'),
    borderTopRightRadius: radius('Radius/32'),
    overflow: 'hidden',
    backgroundColor: color('Foundation/Border/Default'),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 6,
    borderRadius: radius('Radius/Full'),
    backgroundColor: color('Foundation/Text/Primary'),
    opacity: 0.2,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: CONTENT_COLUMN_MAX_WIDTH,
  },
  contentContainer: {
    alignItems: 'center',
  },
});
