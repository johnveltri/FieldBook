import { JobsScreen } from '../../../src/screens/JobsScreen';
import { useShellApp } from '../../../src/shell/AuthenticatedAppChrome';

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
  );
}
