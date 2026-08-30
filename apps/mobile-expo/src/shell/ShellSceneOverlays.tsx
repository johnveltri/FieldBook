import { StyleSheet, View } from 'react-native';

import { OverlaySlideHost } from '../navigation/OverlaySlideHost';
import { InboxScreen } from '../screens/InboxScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { analytics } from '../lib/analytics';
import { useShellOverlays } from './ShellOverlayContext';
import type { ShellMainTab } from './shellTabRoutes';

type ShellSceneOverlaysProps = {
  /** Which tab scene this host lives in — only the active tab mounts overlays. */
  tab: ShellMainTab;
};

/**
 * Profile / Inbox chrome hosted inside the focused NativeTabs scene.
 *
 * Must not render as a sibling above `NativeTabs` — absolute overlays outside
 * the tab host cover the system tab bar on both iOS and Android.
 */
export function ShellSceneOverlays({ tab }: ShellSceneOverlaysProps) {
  const overlays = useShellOverlays();

  if (!overlays || overlays.mainTab !== tab) {
    return null;
  }

  const {
    mainTab,
    inboxOpen,
    inboxMounted,
    inboxLoadKey,
    closeInbox,
    onInboxExited,
    profileOpen,
    profileMounted,
    closeProfile,
    onProfileExited,
  } = overlays;

  return (
    <>
      {inboxMounted ? (
        <View style={styles.overlayPane} testID="inbox-overlay-pane" pointerEvents="box-none">
          <OverlaySlideHost
            visible={inboxOpen}
            axis="horizontal"
            onRequestClose={() => {
              analytics.capture('inbox_closed', { destination: mainTab });
              closeInbox();
            }}
            onExited={onInboxExited}
          >
            <InboxScreen
              loadKey={inboxLoadKey}
              onRequestClose={() => {
                analytics.capture('inbox_closed', { destination: mainTab });
                closeInbox();
              }}
            />
          </OverlaySlideHost>
        </View>
      ) : null}
      {profileMounted ? (
        <View style={styles.overlayPane} testID="profile-overlay-pane" pointerEvents="box-none">
          <OverlaySlideHost
            visible={profileOpen}
            axis="horizontal"
            onRequestClose={closeProfile}
            onExited={onProfileExited}
          >
            <ProfileScreen onBack={closeProfile} onBackToHome={closeProfile} />
          </OverlaySlideHost>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  /** Fills the tab scene only — native tab bar stays below this host. */
  overlayPane: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    elevation: 20,
  },
});
