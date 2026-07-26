import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
import { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, radius } from '@fieldsolo/design-system/lib/tokens';
import { CanvasTiledBackground } from '../components/CanvasTiledBackground';
import { cardShadowRn, createTextStyles, fg, space } from '../theme/nativeTokens';
import { useContentColumn } from '../theme/useContentColumn';

export type FirstRunOnboardingScreenProps = {
  busy?: boolean;
  error?: string | null;
  onAddFirstJob: () => void;
  onNotNow: () => void;
};

export function FirstRunOnboardingScreen({
  busy = false,
  error,
  onAddFirstJob,
  onNotNow,
}: FirstRunOnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { columnStyle } = useContentColumn();
  const [fontsLoaded] = useFonts({
    PTSerif_700Bold,
    UbuntuSansMono_400Regular,
    UbuntuSansMono_600SemiBold,
    UbuntuSansMono_700Bold,
  });
  const typography = useMemo(
    () => createTextStyles({
      serifBold: 'PTSerif_700Bold',
      mono: 'UbuntuSansMono_400Regular',
      monoSemi: 'UbuntuSansMono_600SemiBold',
      monoBold: 'UbuntuSansMono_700Bold',
    }),
    [],
  );

  if (!fontsLoaded) return <View style={styles.loading}><ActivityIndicator /></View>;

  return (
    <View style={styles.root}>
      <CanvasTiledBackground />
      <View style={[styles.content, { paddingTop: insets.top + space('Spacing/24'), paddingBottom: insets.bottom + space('Spacing/24') }]}>
        <View style={columnStyle}>
          <View style={styles.card}>
            <Image
              accessibilityIgnoresInvertColors
              source={require('../../assets/brand/fieldsolo-solo-notch-light.png')}
              style={styles.logo}
            />
            <Text accessibilityRole="header" style={[typography.headingH2, styles.title, { color: fg.primary }]}>Start with one real job</Text>
            <Text style={[typography.body, styles.body, { color: fg.secondary }]}>Add a recent job to track the work, time, materials, notes, and payment status.</Text>
            {error ? <Text style={[typography.bodySmall, styles.error]}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onAddFirstJob}
              style={({ pressed }) => [styles.primary, (pressed || busy) && styles.pressed]}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={[typography.bodyBold, styles.primaryText]}>ADD MY FIRST JOB</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={onNotNow} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
              <Text style={[typography.bodyBold, { color: fg.primary }]}>NOT NOW</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, justifyContent: 'center', zIndex: 1 },
  card: {
    ...cardShadowRn,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius('Radius/16'),
    padding: space('Spacing/28'),
  },
  logo: { height: 76, marginBottom: space('Spacing/24'), resizeMode: 'contain', width: 76 },
  title: { marginBottom: space('Spacing/12'), textAlign: 'center' },
  body: { lineHeight: 23, textAlign: 'center' },
  error: { color: color('Semantic/Status/Error/Text'), marginTop: space('Spacing/16'), textAlign: 'center' },
  primary: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: color('Brand/Primary'), borderRadius: radius('Radius/12'), justifyContent: 'center', marginTop: space('Spacing/28'), minHeight: 50, paddingHorizontal: space('Spacing/16') },
  primaryText: { color: '#fff' },
  secondary: { alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center', marginTop: space('Spacing/12'), minHeight: 44 },
  pressed: { opacity: 0.72 },
});
