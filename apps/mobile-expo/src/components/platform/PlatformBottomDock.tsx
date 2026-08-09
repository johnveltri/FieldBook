import { useCallback, useState } from 'react';
import {
  Modal,
  PixelRatio,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { contentColumnMetrics } from '../../theme/nativeTokens';
import type { ShellMainTab } from '../shell/ShellBottomNav';
import {
  DOCK_FLOATING_PAD_H,
  DOCK_PRIMARY_GAP,
  shellDockBottomPadding,
  shellDockRowHeight,
} from './shellDockMetrics';
import { PlatformNavigationGroup } from './PlatformNavigationGroup';
import {
  PlatformPrimaryAction,
  type PrimaryActionMenuItemId,
} from './PlatformPrimaryAction';

export type PlatformBottomDockProps = {
  selected: ShellMainTab;
  onSelect: (tab: ShellMainTab) => void;
  /** Hide the + control (e.g. during an active live session). */
  hidePrimaryAction?: boolean;
  onPrimaryAction: (action: PrimaryActionMenuItemId) => void;
};

/**
 * Slack-like floating dock: `[ Home | Jobs | Earnings ]` pill + same-height `+` circle.
 * When `+` opens, a Modal blurs/dims the whole screen (Calendar-style); `+`/menu stay sharp.
 */
export function PlatformBottomDock({
  selected,
  onSelect,
  hidePrimaryAction = false,
  onPrimaryAction,
}: PlatformBottomDockProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();
  const rowHeight = shellDockRowHeight(fontScale);
  // Slack search circle: same diameter as nav pill height.
  const primarySize = rowHeight;
  const bottomPad = shellDockBottomPadding(insets.bottom);
  const { sideInset, gutter } = contentColumnMetrics(windowWidth);
  const horizontalPad = Math.max(sideInset + gutter, DOCK_FLOATING_PAD_H);

  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);

  const onSelectItem = useCallback(
    (id: PrimaryActionMenuItemId) => {
      setMenuOpen(false);
      onPrimaryAction(id);
    },
    [onPrimaryAction],
  );

  const primaryControl = hidePrimaryAction ? null : (
    <PlatformPrimaryAction
      open={menuOpen}
      disabled={false}
      size={primarySize}
      onOpen={openMenu}
      onClose={closeMenu}
      onSelectMenuItem={onSelectItem}
    />
  );

  return (
    <>
      <View
        pointerEvents="box-none"
        style={styles.host}
        testID="platform-bottom-dock"
      >
        <View
          pointerEvents={menuOpen ? 'none' : 'box-none'}
          style={[
            styles.dockStrip,
            {
              paddingBottom: bottomPad,
              paddingHorizontal: horizontalPad,
            },
          ]}
        >
          <View style={[styles.row, { height: rowHeight }]}>
            <View style={[styles.navSlot, { height: rowHeight }]}>
              <PlatformNavigationGroup
                selected={selected}
                onSelect={(tab) => {
                  closeMenu();
                  onSelect(tab);
                }}
                rowHeight={rowHeight}
              />
            </View>
            {hidePrimaryAction ? null : (
              <View style={{ width: primarySize, height: primarySize }} />
            )}
          </View>
        </View>

        {/* Closed-state + sits in the dock; open-state + lives in the Modal above the blur. */}
        {menuOpen || hidePrimaryAction ? null : (
          <View
            pointerEvents="box-none"
            style={[
              styles.primaryStrip,
              {
                paddingBottom: bottomPad,
                paddingRight: horizontalPad,
              },
            ]}
          >
            <View style={{ width: primarySize, height: rowHeight }} pointerEvents="box-none">
              {primaryControl}
            </View>
          </View>
        )}
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeMenu}
      >
        <View style={styles.modalRoot} testID="platform-primary-menu-modal">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss primary action menu"
            style={StyleSheet.absoluteFill}
            onPress={closeMenu}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 64 : 80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.dimOverlay} />
          </Pressable>

          {/* Only +/× and menu stay sharp — nav + content sit under the blur (Calendar). */}
          {hidePrimaryAction ? null : (
            <View
              pointerEvents="box-none"
              style={[
                styles.primaryStrip,
                {
                  paddingBottom: bottomPad,
                  paddingRight: horizontalPad,
                  zIndex: 2,
                },
              ]}
            >
              <View style={{ width: primarySize, height: rowHeight }} pointerEvents="box-none">
                {primaryControl}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    overflow: 'visible',
  },
  modalRoot: {
    flex: 1,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    // Stronger on Android (no backdrop blur without blurMethod toast).
    backgroundColor:
      Platform.OS === 'android' ? 'rgba(20, 18, 16, 0.52)' : 'rgba(20, 18, 16, 0.42)',
  },
  dockStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    overflow: 'visible',
  },
  primaryStrip: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    overflow: 'visible',
    elevation: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: DOCK_PRIMARY_GAP,
  },
  navSlot: {
    flex: 1,
    minWidth: 0,
  },
});
