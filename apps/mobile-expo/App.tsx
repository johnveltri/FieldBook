import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthSignOutButton } from './src/components/AuthSignOutButton';
import { LiveSessionOverlay } from './src/components/LiveSessionOverlay';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BottomSheetStackProvider } from './src/context/BottomSheetStackContext';
import {
  LiveSessionProvider,
  useLiveSession,
} from './src/context/LiveSessionContext';
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
  /** True when opening detail from "New job" FAB — JobDetailScreen auto-opens the edit sheet. */
  const [jobDetailInitialEditOpen, setJobDetailInitialEditOpen] = useState(false);
  /** Bump on each "View job" so Job Detail refetches (same user, fresh data). */
  const [jobDetailLoadKey, setJobDetailLoadKey] = useState(0);

  // Hooks must be called unconditionally — bail-out renders below still execute these.
  const liveSession = useLiveSession();

  const navigateToJob = useCallback(
    (jobId: string) => {
      setSelectedJobId(jobId);
      setJobDetailInitialEditOpen(false);
      setJobDetailLoadKey((k) => k + 1);
      setJobDetailOpen(true);
    },
    [],
  );

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

  return (
    <View style={styles.root}>
      {!jobDetailOpen ? (
        <View style={styles.root}>
          <JobsScreen
            // Suppress the "New Job" FAB while a live session is in progress —
            // the floating MinimizedLiveSessionBar takes its slot per spec.
            suppressFab={liveSession.hasLiveSession}
            onOpenJobDetail={(jobId?: string, options?: { initialEditOpen?: boolean }) => {
              setSelectedJobId(jobId ?? null);
              setJobDetailInitialEditOpen(options?.initialEditOpen ?? false);
              setJobDetailLoadKey((k) => k + 1);
              setJobDetailOpen(true);
            }}
          />
          <AuthSignOutButton />
        </View>
      ) : (
        <JobDetailScreen
          loadKey={jobDetailLoadKey}
          jobId={selectedJobId}
          initialEditOpen={jobDetailInitialEditOpen}
          sessionUserId={session.user.id}
          sessionEmail={session.user.email ?? null}
          onRequestClose={() => {
            setJobDetailOpen(false);
            setJobDetailInitialEditOpen(false);
          }}
        />
      )}

      <LiveSessionOverlay
        onNavigateToJob={({ jobId }) => navigateToJob(jobId)}
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
            <BottomSheetStackProvider>
              <LiveSessionProvider>
                <AuthenticatedShell />
              </LiveSessionProvider>
            </BottomSheetStackProvider>
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
