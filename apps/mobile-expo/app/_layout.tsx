import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

import { AuthProvider } from '../src/context/AuthContext';
import {
  BottomSheetStackProvider,
} from '../src/context/BottomSheetStackContext';
import { JobsListInvalidationProvider } from '../src/context/JobsListInvalidationContext';
import { LiveSessionProvider } from '../src/context/LiveSessionContext';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { color } from '@fieldsolo/design-system/lib/tokens';

export default function RootLayout() {
  const configured = isSupabaseConfigured();
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider style={styles.root}>
        <View style={styles.root}>
          {configured ? (
            <AuthProvider>
              <BottomSheetStackProvider>
                <JobsListInvalidationProvider>
                  <LiveSessionProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="sign-in" />
                      <Stack.Screen name="(app)" />
                    </Stack>
                  </LiveSessionProvider>
                </JobsListInvalidationProvider>
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
    </GestureHandlerRootView>
  );
}

export function RootSpinner() {
  return (
    <View style={[styles.root, styles.centered]}>
      <ActivityIndicator />
    </View>
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
