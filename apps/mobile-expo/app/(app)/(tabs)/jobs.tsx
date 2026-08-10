import { StyleSheet, View } from 'react-native';

import { JobsScreen } from '../../../src/screens/JobsScreen';
import { useShellApp } from '../../../src/shell/AuthenticatedAppChrome';
import { ShellSceneOverlays } from '../../../src/shell/ShellSceneOverlays';

export default function JobsTabScreen() {
  const {
    mainTab,
    jobsListTab,
    setJobsListTab,
    jobsOpenScrollTarget,
    jobsOpenScrollNonce,
    clearJobsOpenScrollTarget,
    openInbox,
    openJobDetail,
  } = useShellApp();

  return (
    <View style={styles.root} collapsable={false}>
      <JobsScreen
        isActive={mainTab === 'jobs'}
        jobsListTab={jobsListTab}
        onJobsListTabChange={setJobsListTab}
        openScrollToSection={jobsOpenScrollTarget}
        openScrollNonce={jobsOpenScrollNonce}
        onOpenScrollToSectionHandled={clearJobsOpenScrollTarget}
        onOpenInbox={openInbox}
        onOpenJobDetail={(jobId?: string, options?: { initialEditOpen?: boolean }) => {
          openJobDetail(jobId, {
            ...options,
            entrySource: options?.initialEditOpen ? 'jobs_new_job' : 'jobs_list',
          });
        }}
      />
      <ShellSceneOverlays tab="jobs" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
