import { useEffect } from 'react';
import { useRootNavigationState, useRouter } from 'expo-router';

import { useAuth } from '../src/context/AuthContext';
import { SignInScreen } from '../src/screens/SignInScreen';
import { RootSpinner } from '../src/shell/RootSpinner';

export default function SignInRoute() {
  const { session, loading } = useAuth();
  const rootNav = useRootNavigationState();
  const router = useRouter();

  useEffect(() => {
    if (!rootNav?.key || loading) return;
    if (session) {
      router.replace('/');
    }
  }, [rootNav?.key, loading, session, router]);

  if (!rootNav?.key || loading) {
    return <RootSpinner />;
  }
  if (session) {
    return <RootSpinner />;
  }
  return <SignInScreen />;
}
