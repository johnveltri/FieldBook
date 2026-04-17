import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthSignOutButton } from './src/components/AuthSignOutButton';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { isSupabaseConfigured } from './src/lib/supabase';
import { JobsScreen } from './src/screens/JobsScreen';
import { JobDetailScreen } from './src/screens/JobDetailScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { color } from '@fieldbook/design-system/lib/tokens';

function AuthenticatedShell() {
  const { session, loading } = useAuth();
  /** When true, job detail is shown without the shell sign-out control; X returns here. */
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  /** Bump on each "View job" so Job Detail refetches (same user, fresh data). */
  const [jobDetailLoadKey, setJobDetailLoadKey] = useState(0);

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <SignInScreen />;
  }

  if (!jobDetailOpen) {
    return (
      <View style={styles.root}>
        <JobsScreen
          onOpenJobDetail={(jobId?: string) => {
            setSelectedJobId(jobId ?? null);
            setJobDetailLoadKey((k) => k + 1);
            setJobDetailOpen(true);
          }}
        />
        <AuthSignOutButton />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <JobDetailScreen
        loadKey={jobDetailLoadKey}
        jobId={selectedJobId}
        sessionUserId={session.user.id}
        sessionEmail={session.user.email ?? null}
        onRequestClose={() => setJobDetailOpen(false)}
      />
    </View>
  );
}

export default function App() {
  const configured = isSupabaseConfigured();
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {configured ? (
          <AuthProvider>
            <AuthenticatedShell />
          </AuthProvider>
        ) : (
          <View style={[styles.root, styles.centered]}>
            <Text style={styles.configText}>
              Missing Supabase env vars. Set `EXPO_PUBLIC_SUPABASE_URL` and
              `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
            </Text>
          </View>
        )}
        <StatusBar style="dark" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color('Foundation/Background/Default'),
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  configText: {
    color: color('Foundation/Text/Primary'),
    paddingHorizontal: 24,
    textAlign: 'center',
  },
});
