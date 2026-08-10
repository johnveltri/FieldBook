import { StyleSheet, View } from 'react-native';

import { EarningsScreen } from '../../../src/screens/EarningsScreen';
import { useShellApp } from '../../../src/shell/AuthenticatedAppChrome';
import { ShellSceneOverlays } from '../../../src/shell/ShellSceneOverlays';

export default function EarningsTabScreen() {
  const {
    mainTab,
    earningsWindow,
    setEarningsWindow,
    navigateToJobsOpenSection,
    openJobDetail,
  } = useShellApp();

  return (
    <View style={styles.root} collapsable={false}>
      <EarningsScreen
        isActive={mainTab === 'earnings'}
        window={earningsWindow}
        onWindowChange={setEarningsWindow}
        onOpenJobsOpenTab={() => navigateToJobsOpenSection('unpaid')}
        onOpenJobDetail={(jobId?: string) => {
          openJobDetail(jobId, { entrySource: 'earnings' });
        }}
      />
      <ShellSceneOverlays tab="earnings" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
