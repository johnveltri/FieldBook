import { EarningsScreen } from '../../../src/screens/EarningsScreen';
import { useShellApp } from '../../../src/shell/AuthenticatedAppChrome';

export default function EarningsTabScreen() {
  const {
    mainTab,
    earningsWindow,
    setEarningsWindow,
    navigateToJobsOpenSection,
    openJobDetail,
  } = useShellApp();

  return (
    <EarningsScreen
      isActive={mainTab === 'earnings'}
      window={earningsWindow}
      onWindowChange={setEarningsWindow}
      onOpenJobsOpenTab={() => navigateToJobsOpenSection('unpaid')}
      onOpenJobDetail={(jobId?: string) => {
        openJobDetail(jobId, { entrySource: 'earnings' });
      }}
    />
  );
}
