import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CanvasTiledBackground } from '../components/CanvasTiledBackground';
import { CONTENT_MAX_WIDTH, createTextStyles, fg, space } from '../theme/nativeTokens';

type AuthenticatedHomeScreenProps = {
  onOpenJobDetail: () => void;
};

/** Post–sign-in home: sign out (shell) + entry to job detail. */
export function AuthenticatedHomeScreen({ onOpenJobDetail }: AuthenticatedHomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    PTSerif_700Bold,
    UbuntuSansMono_400Regular,
    UbuntuSansMono_600SemiBold,
    UbuntuSansMono_700Bold,
  });

  const typography = useMemo(
    () =>
      createTextStyles({
        serifBold: 'PTSerif_700Bold',
        mono: 'UbuntuSansMono_400Regular',
        monoSemi: 'UbuntuSansMono_600SemiBold',
        monoBold: 'UbuntuSansMono_700Bold',
      }),
    [],
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.root}>
        <CanvasTiledBackground />
      </View>
    );
  }

  const gap = space('Spacing/20');

  return (
    <View style={styles.root}>
      <CanvasTiledBackground />
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + gap,
            paddingBottom: insets.bottom + gap,
            paddingHorizontal: space('Spacing/20'),
          },
        ]}
      >
        <View style={[styles.card, { maxWidth: CONTENT_MAX_WIDTH, width: '100%' }]}>
          <Text style={[typography.titleH3, { color: fg.primary, marginBottom: gap }]}>
            Fieldbook
          </Text>
          <Text style={[typography.body, { color: fg.secondary, marginBottom: gap * 1.5 }]}>
            Open a job to view details. Sign out is available on this screen.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open job detail"
            onPress={onOpenJobDetail}
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={[typography.bodyBold, { color: '#fff' }]}>View job</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    padding: space('Spacing/24'),
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  primaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
