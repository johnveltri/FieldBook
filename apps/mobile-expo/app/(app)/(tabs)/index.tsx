import { HomeScreen } from '../../../src/screens/HomeScreen';
import { useShellApp } from '../../../src/shell/AuthenticatedAppChrome';

export default function HomeTabScreen() {
  const {
    createJobAndOpen,
    onOpenProfile,
    onOpenEarningsFromHome,
    openJobDetail,
    navigateToJobsOpenSection,
  } = useShellApp();

  return (
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
  );
}
