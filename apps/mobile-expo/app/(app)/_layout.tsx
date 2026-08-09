import { Redirect, Slot, useRootNavigationState } from 'expo-router';

import { useAuth } from '../../src/context/AuthContext';
import { AuthenticatedAppChrome } from '../../src/shell/AuthenticatedAppChrome';
import { RootSpinner } from '../../src/shell/RootSpinner';

export default function AppGroupLayout() {
  const { session, loading, signupLegalPending } = useAuth();
  const rootNav = useRootNavigationState();

  // Avoid Redirect/navigation state updates before ExpoRoot's navigator is mounted
  // (Android LogBox: "state update on a component that hasn't mounted yet").
  if (!rootNav?.key || loading || (signupLegalPending && session)) {
    return <RootSpinner />;
  }
  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <AuthenticatedAppChrome>
      <Slot />
    </AuthenticatedAppChrome>
  );
}
