import { useEffect } from 'react';
import { Slot, useRootNavigationState, useRouter } from 'expo-router';

import { useAuth } from '../../src/context/AuthContext';
import { AuthenticatedAppChrome } from '../../src/shell/AuthenticatedAppChrome';
import { RootSpinner } from '../../src/shell/RootSpinner';

export default function AppGroupLayout() {
  const { session, loading, signupLegalPending } = useAuth();
  const rootNav = useRootNavigationState();
  const router = useRouter();

  useEffect(() => {
    if (!rootNav?.key || loading) return;
    if (signupLegalPending && session) return;
    if (!session) {
      router.replace('/sign-in');
    }
  }, [rootNav?.key, loading, session, signupLegalPending, router]);

  if (!rootNav?.key || loading || (signupLegalPending && session)) {
    return <RootSpinner />;
  }
  if (!session) {
    return <RootSpinner />;
  }

  return (
    <AuthenticatedAppChrome>
      <Slot />
    </AuthenticatedAppChrome>
  );
}
