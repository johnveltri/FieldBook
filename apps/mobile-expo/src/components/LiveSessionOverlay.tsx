import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EditLiveSessionBottomSheet,
  LiveSessionBottomSheet,
  MinimizedLiveSessionBar,
  type EditLiveSessionSavePayload,
} from './ds';
import {
  useBottomSheetStackWriters,
  useTopmostBottomSheet,
} from '../context/BottomSheetStackContext';
import { useLiveSession } from '../context/LiveSessionContext';
import { createTextStyles, space } from '../theme/nativeTokens';

type LiveSessionOverlayProps = {
  /**
   * Called whenever a live session terminates and the parent should navigate
   * to the corresponding job detail screen so the user lands on the
   * now-completed session card.
   */
  onNavigateToJob: (input: { jobId: string }) => void;
};

/**
 * Global Live Session UI. Mounted once at the root of `AuthenticatedShell`
 * (after the screen tree) so the floating bar / sheets always render above
 * every screen and persist across navigations.
 *
 * Renders nothing when there is no active live session.
 */
export function LiveSessionOverlay({ onNavigateToJob }: LiveSessionOverlayProps) {
  const insets = useSafeAreaInsets();
  const sheetStackWriters = useBottomSheetStackWriters();
  const topmostSheet = useTopmostBottomSheet();
  const {
    liveSession,
    mode,
    minimize,
    openSheet,
    openEditSheet,
    closeEditSheet,
    minimizeFromEdit,
    endLiveSessionNow,
    updateLiveSessionStartedAt,
    deleteLiveSessionNow,
  } = useLiveSession();

  const [fontsLoaded] = useFonts({
    PTSerif_700Bold,
    UbuntuSansMono_400Regular,
    UbuntuSansMono_600SemiBold,
    UbuntuSansMono_700Bold,
  });

  const typography = useMemo(
    () =>
      createTextStyles({
        serifBold: 'PTSerif_700Bold',
        mono: 'UbuntuSansMono_400Regular',
        monoSemi: 'UbuntuSansMono_600SemiBold',
        monoBold: 'UbuntuSansMono_700Bold',
      }),
    [],
  );

  const handleEndSession = useCallback(async () => {
    const ended = await endLiveSessionNow();
    if (ended) onNavigateToJob({ jobId: ended.jobId });
  }, [endLiveSessionNow, onNavigateToJob]);

  const handleEditSave = useCallback(
    async (payload: EditLiveSessionSavePayload) => {
      if (payload.kind === 'updateStart') {
        try {
          await updateLiveSessionStartedAt({ startedAt: payload.startedAt });
        } finally {
          // Return to full sheet whether the network call succeeded or
          // rolled back — the user explicitly tapped Save Changes and the
          // sheet should not stay in edit mode.
          closeEditSheet();
        }
        return;
      }
      // endSession path: persist the new start (if changed), then end.
      if (liveSession && payload.startedAt !== liveSession.startedAt) {
        try {
          await updateLiveSessionStartedAt({ startedAt: payload.startedAt });
        } catch {
          // Surface but don't block — the more important transition is
          // ending the session per the user's intent.
        }
      }
      const ended = await endLiveSessionNow({ endedAt: payload.endedAt });
      if (ended) onNavigateToJob({ jobId: ended.jobId });
    },
    [
      closeEditSheet,
      endLiveSessionNow,
      liveSession,
      onNavigateToJob,
      updateLiveSessionStartedAt,
    ],
  );

  const handleEditDelete = useCallback(async () => {
    const deleted = await deleteLiveSessionNow();
    if (deleted) onNavigateToJob({ jobId: deleted.jobId });
  }, [deleteLiveSessionNow, onNavigateToJob]);

  // Tapping the minimized bar should:
  //   1. If a foreign bottom sheet (Edit Job, etc.) is currently presented,
  //      ask it to dismiss first so the user is not left with two stacked
  //      overlays.
  //   2. Open the Live Session sheet. Both animations play simultaneously
  //      (foreign sheet slides down, live sheet slides up) which reads as
  //      a swap rather than a queued stack.
  const handleBarPress = useCallback(() => {
    if (topmostSheet) {
      sheetStackWriters?.requestCloseTopmost();
    }
    openSheet();
  }, [openSheet, sheetStackWriters, topmostSheet]);

  // The bar's anchor stays pinned at `fabSlotBottom` (where it lives when
  // no foreign sheet is presented). When a foreign sheet IS presented we
  // SLIDE the bar up via an animated `translateY` so it lands just above
  // the sheet's top edge with a small gap.
  //
  // The translateY is animated (rather than the bar's `bottom`) so the
  // animation can run on the native driver and so the bar visually moves
  // in lockstep with the foreign sheet's open animation — instead of the
  // previous behavior where the bar jumped to its lifted position the
  // moment the sheet's onLayout fired (well before the slide-up was done).
  const fabSlotBottom = space('Spacing/8') + insets.bottom + 64 + space('Spacing/12');
  const stackTopY = topmostSheet?.topY ?? null;
  const liftDelta = useMemo(() => {
    if (stackTopY == null) return 0;
    const windowH = Dimensions.get('window').height;
    // `windowH - topY` is the visible height of the foreign sheet (it's
    // anchored to the bottom). The bar should sit `Spacing/12` above the
    // sheet's top edge.
    const liftedBottom = Math.max(0, windowH - stackTopY) + space('Spacing/12');
    return Math.max(0, liftedBottom - fabSlotBottom);
  }, [stackTopY, fabSlotBottom]);

  const liftAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Match the BottomSheetShell open/close timing so the bar and the
    // foreign sheet land at their final resting positions at the same
    // moment. Open: ease-out cubic ≈ 280ms; Close: ease-in cubic ≈ 220ms.
    const isLifting = liftDelta > 0;
    Animated.timing(liftAnim, {
      toValue: -liftDelta,
      duration: isLifting ? 280 : 220,
      easing: isLifting ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [liftAnim, liftDelta]);

  if (!fontsLoaded || !liveSession) return null;

  const barVisible = mode === 'minimized';

  return (
    <>
      {/*
        Sheet stack: both BottomSheetShells stay mounted so they can play
        their slide-down animation — visibility flips drive the slide.
      */}
      <LiveSessionBottomSheet
        typography={typography}
        visible={mode === 'sheet'}
        jobShortDescription={liveSession.jobShortDescription}
        startedAt={liveSession.startedAt}
        onMinimize={minimize}
        onEditPress={openEditSheet}
        onEndSessionPress={() => void handleEndSession()}
      />

      <EditLiveSessionBottomSheet
        typography={typography}
        visible={mode === 'editSheet'}
        startedAt={liveSession.startedAt}
        // Per spec: tapping outside / swiping the edit sheet down should
        // MINIMIZE the live session (not just go back to the full sheet).
        onClose={minimizeFromEdit}
        onBack={closeEditSheet}
        onSavePress={(payload) => void handleEditSave(payload)}
        onDeletePress={() => void handleEditDelete()}
      />

      {/*
        Bar stays mounted whenever a live session exists, so the morph
        between full sheet ↔ bar is a smooth crossfade rather than a
        mount/unmount jolt. `visible` drives the bar's internal
        opacity/translate/scale animation.
      */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.minimizedAnchor,
          { bottom: fabSlotBottom, transform: [{ translateY: liftAnim }] },
        ]}
      >
        <MinimizedLiveSessionBar
          typography={typography}
          visible={barVisible}
          jobShortDescription={liveSession.jobShortDescription}
          startedAt={liveSession.startedAt}
          onPress={handleBarPress}
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  minimizedAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: space('Spacing/16'),
  },
});
