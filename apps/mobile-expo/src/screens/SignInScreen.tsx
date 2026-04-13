import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { CanvasTiledBackground } from '../components/CanvasTiledBackground';
import {
  CONTENT_MAX_WIDTH,
  createTextStyles,
  fg,
  padScreenHorizontal,
  space,
} from '../theme/nativeTokens';

export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

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

  const text = useMemo(
    () => ({
      title: typography.titleH3,
      body: typography.body,
      caption: typography.bodySmall,
      bodySemi: typography.bodyBold,
    }),
    [typography],
  );

  const onSubmit = useCallback(async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Enter email and password.');
      return;
    }
    setBusy(true);
    try {
      const { error: err } =
        mode === 'signIn'
          ? await signIn(trimmed, password)
          : await signUp(trimmed, password);
      if (err) {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }, [email, password, mode, signIn, signUp]);

  if (!fontsLoaded) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator />
      </View>
    );
  }

  const horizontal = padScreenHorizontal();
  const gap = space('Spacing/20');

  return (
    <View style={styles.root}>
      <CanvasTiledBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + gap,
              paddingBottom: insets.bottom + gap,
              paddingHorizontal: horizontal,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', width: '100%' }]}>
            <Text style={[text.title, { color: fg.primary, marginBottom: gap }]}>Fieldbook</Text>
            <Text style={[text.body, { color: fg.secondary, marginBottom: gap }]}>
              Sign in with email and password
            </Text>

            <Text style={[text.caption, { color: fg.secondary, marginBottom: space('Spacing/8') }]}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={fg.muted}
              style={[styles.input, text.body, { color: fg.primary }]}
              editable={!busy}
            />

            <Text
              style={[
                text.caption,
                { color: fg.secondary, marginBottom: space('Spacing/8'), marginTop: gap },
              ]}
            >
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={fg.muted}
              style={[styles.input, text.body, { color: fg.primary }]}
              editable={!busy}
            />

            {error ? (
              <Text style={[text.caption, { color: '#b00020', marginTop: gap }]}>{error}</Text>
            ) : null}

            <Pressable
              onPress={onSubmit}
              disabled={busy}
              style={({ pressed }) => [
                styles.primaryButton,
                { marginTop: gap * 1.5, opacity: busy ? 0.6 : pressed ? 0.85 : 1 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[text.bodySemi, { color: '#fff' }]}>
                  {mode === 'signIn' ? 'Sign in' : 'Create account'}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
                setError(null);
              }}
              disabled={busy}
              style={{ marginTop: gap }}
            >
              <Text style={[text.caption, { color: fg.secondary }]}>
                {mode === 'signIn' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  card: {
    padding: space('Spacing/24'),
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
