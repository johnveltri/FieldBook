import { Redirect, useRootNavigationState } from 'expo-router';

import { useAuth } from '../src/context/AuthContext';
import { SignInScreen } from '../src/screens/SignInScreen';
import { RootSpinner } from '../src/shell/RootSpinner';

export default function SignInRoute() {
  const { session, loading } = useAuth();
  const rootNav = useRootNavigationState();

  if (!rootNav?.key || loading) {
    return <RootSpinner />;
  }
  if (session) {
    return <Redirect href="/" />;
  }
  return <SignInScreen />;
}
