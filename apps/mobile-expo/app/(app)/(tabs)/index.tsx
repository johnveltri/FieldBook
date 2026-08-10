import { StyleSheet, View } from 'react-native';

import { HomeScreen } from '../../../src/screens/HomeScreen';
import { useShellApp } from '../../../src/shell/AuthenticatedAppChrome';
import { ShellSceneOverlays } from '../../../src/shell/ShellSceneOverlays';

export default function HomeTabScreen() {
  const {
    createJobAndOpen,
    onOpenProfile,
    onOpenEarningsFromHome,
    openJobDetail,
    navigateToJobsOpenSection,
  } = useShellApp();

  return (
    <View style={styles.root} collapsable={false}>
      <HomeScreen
        onCreateFirstJob={() => createJobAndOpen('home_empty')}
        onOpenProfile={onOpenProfile}
        onOpenEarnings={onOpenEarningsFromHome}
        onOpenJobDetail={(jobId, options) => {
          openJobDetail(jobId, {
            ...options,
            entrySource: 'home',
          });
        }}
        onOpenJobsOpenTab={navigateToJobsOpenSection}
      />
      <ShellSceneOverlays tab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
