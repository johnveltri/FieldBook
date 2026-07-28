import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { recordSignupLegalAcceptances } from '@fieldsolo/api-client';

import { useAuth } from '../context/AuthContext';
import { CanvasTiledBackground } from '../components/CanvasTiledBackground';
import { analytics, emailProperties, errorProperties } from '../lib/analytics';
import { analyticsConfig } from '../lib/analytics/config';
import {
  LEGAL_URLS,
  REQUIRED_PRIVACY_VERSION,
  REQUIRED_TERMS_VERSION,
} from '../lib/legal-versions';
import { cacheLegalAcceptance } from '../lib/legalAcceptanceStorage';
import { supabase } from '../lib/supabase';
import { cardShadowRn, createTextStyles, fg, space } from '../theme/nativeTokens';
import { useContentColumn } from '../theme/useContentColumn';
import { announceAccessibilityMessage, screenHeaderA11y } from '../lib/accessibility';
import {
  NEW_PASSWORD_REQUIREMENT,
  newPasswordPolicyError,
} from '../lib/passwordPolicy';

function authErrorMessage(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (normalized.includes('email not confirmed')) return 'Confirm your email before signing in.';
  if (normalized.includes('user already registered')) return 'An account already exists for this email. Sign in instead.';
  if (normalized.includes('fetch failed') || normalized.includes('network request failed')) {
    return "Couldn't connect. Check your connection and try again.";
  }
  return message || 'Something went wrong. Try again.';
}

export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { columnStyle } = useContentColumn();
  const scrollY = useMemo(() => new Animated.Value(0), []);
  const { signIn, signUp, setSignupLegalPending } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const previousModeRef = useRef(mode);
  const lastNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    analytics.capture('auth_screen_viewed', { mode });
  }, [mode]);

  useEffect(() => {
    announceAccessibilityMessage(error);
  }, [error]);

  useEffect(() => {
    if (previousModeRef.current === mode) return;
    analytics.capture('auth_mode_changed', {
      from_mode: previousModeRef.current,
      to_mode: mode,
    });
    previousModeRef.current = mode;
  }, [mode]);

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
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password) {
      setError('Enter email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    if (mode === 'signUp') {
      const policyError = newPasswordPolicyError(password);
      if (policyError) {
        setError(policyError);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!firstName.trim() || !lastName.trim()) {
        setError('Enter your first and last name.');
        return;
      }
      if (!legalAccepted) {
        setError('Agree to the Privacy Policy and Terms to create an account.');
        return;
      }
    }

    // Supabase emits the signed-in state while `signInWithPassword` resolves.
    // Dismiss the focused native TextInput first so the auth-driven shell swap
    // cannot unmount the form while it still owns the keyboard responder.
    Keyboard.dismiss();
    setBusy(true);
    try {
      if (mode === 'signIn') {
        analytics.capture('sign_in_submitted', {
          ...emailProperties(trimmed),
          has_password: password.length > 0,
        });
        const { error: err } = await signIn(trimmed, password);
        if (err) {
          analytics.capture('sign_in_failed', {
            ...emailProperties(trimmed),
            ...errorProperties(err),
          });
          setError(authErrorMessage(err));
        } else {
          analytics.capture('sign_in_succeeded', {
            ...emailProperties(trimmed),
          });
        }
      } else {
        analytics.capture('sign_up_submitted', {
          ...emailProperties(trimmed),
          first_name_present: firstName.trim().length > 0,
          last_name_present: lastName.trim().length > 0,
        });
        // First/last name go into raw_user_meta_data so the
        // public.handle_new_user trigger can seed the profiles row.
        const { error: signUpErr, session: signUpSession } = await signUp(trimmed, password, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        if (signUpErr) {
          analytics.capture('sign_up_failed', {
            stage: 'sign_up',
            ...emailProperties(trimmed),
            ...errorProperties(signUpErr),
          });
          setError(authErrorMessage(signUpErr));
          return;
        }
        analytics.capture('sign_up_succeeded', {
          ...emailProperties(trimmed),
        });
        setSignupLegalPending(true);
        try {
          let acceptedUserId = signUpSession?.user.id ?? null;
          if (!signUpSession) {
            const { error: signInErr, session: immediateSession } = await signIn(
              trimmed,
              password,
            );
            if (signInErr) {
              analytics.capture('sign_up_failed', {
                stage: 'immediate_sign_in',
                ...emailProperties(trimmed),
                ...errorProperties(signInErr),
              });
              setError(
                'Account created. Check your email to confirm your account, then sign in.',
              );
              setMode('signIn');
              return;
            }
            acceptedUserId = immediateSession?.user.id ?? null;
          }

          await recordSignupLegalAcceptances(supabase, {
            privacyVersion: REQUIRED_PRIVACY_VERSION,
            termsVersion: REQUIRED_TERMS_VERSION,
            appVersion: analyticsConfig.appVersion,
            platform: analyticsConfig.platform,
          });
          if (acceptedUserId) {
            try {
              await cacheLegalAcceptance({
                userId: acceptedUserId,
                privacyVersion: REQUIRED_PRIVACY_VERSION,
                termsVersion: REQUIRED_TERMS_VERSION,
              });
            } catch {
              // The durable server record succeeded; local caching is best-effort.
            }
          }
        } catch (consentErr) {
          analytics.capture('sign_up_failed', {
            stage: 'legal_acceptance',
            ...emailProperties(trimmed),
            ...errorProperties(consentErr),
          });
          setError(
            consentErr instanceof Error
              ? consentErr.message
              : 'Could not save your legal acceptance. Try signing in again.',
          );
        } finally {
          setSignupLegalPending(false);
        }
      }
    } catch (e) {
      analytics.capture(mode === 'signIn' ? 'sign_in_failed' : 'sign_up_failed', {
        stage: mode === 'signIn' ? 'sign_in' : 'unexpected',
        ...emailProperties(trimmed),
        ...errorProperties(e),
      });
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [email, password, confirmPassword, firstName, lastName, legalAccepted, mode, setSignupLegalPending, signIn, signUp]);

  if (!fontsLoaded) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <CanvasTiledBackground scrollY={scrollY} />
        <ActivityIndicator />
      </View>
    );
  }

  const gap = space('Spacing/20');

  return (
    <View style={styles.root}>
      <CanvasTiledBackground scrollY={scrollY} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            mode === 'signIn' ? styles.scrollContentCentered : styles.scrollContentTop,
            {
              paddingTop: insets.top + gap,
              paddingBottom: insets.bottom + gap,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={columnStyle}>
          <View style={styles.brandBlock}>
            <Image
              accessibilityIgnoresInvertColors
              source={require('../../assets/brand/fieldsoli-solo-notch-light.png')}
              style={styles.logo}
            />
            <Text {...screenHeaderA11y('FieldSoli')} style={[typography.displayH1, styles.brandName, { color: fg.primary }]}>FIELDSOLI</Text>
          </View>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={[text.title, { color: fg.primary, marginBottom: space('Spacing/8') }]}>
              {mode === 'signUp' ? 'Create your account' : 'Welcome back'}
            </Text>
            <Text style={[text.body, { color: fg.secondary, marginBottom: space('Spacing/24') }]}>
              {mode === 'signUp'
                ? 'Start with one real job. You can add the rest as you go.'
                : 'Sign in to keep track of your jobs, time & earnings.'}
            </Text>

            {mode === 'signUp' ? (
              <>
                <Text
                  style={[
                    text.caption,
                    { color: fg.secondary, marginBottom: space('Spacing/8') },
                  ]}
                >
                  First name
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={(value) => {
                    setFirstName(value);
                    if (error) setError(null);
                  }}
                  accessibilityLabel="First name"
                  autoCapitalize="words"
                  autoComplete="name-given"
                  autoCorrect={false}
                  textContentType="givenName"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameInputRef.current?.focus()}
                  placeholder="Alex"
                  placeholderTextColor={fg.secondary}
                  style={[styles.input, text.body, { color: fg.primary }]}
                  editable={!busy}
                />
                <Text
                  style={[
                    text.caption,
                    {
                      color: fg.secondary,
                      marginBottom: space('Spacing/8'),
                      marginTop: gap,
                    },
                  ]}
                >
                  Last name
                </Text>
                <TextInput
                  ref={lastNameInputRef}
                  value={lastName}
                  onChangeText={(value) => {
                    setLastName(value);
                    if (error) setError(null);
                  }}
                  accessibilityLabel="Last name"
                  autoCapitalize="words"
                  autoComplete="name-family"
                  autoCorrect={false}
                  textContentType="familyName"
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  placeholder="Builder"
                  placeholderTextColor={fg.secondary}
                  style={[styles.input, text.body, { color: fg.primary }]}
                  editable={!busy}
                />
                <View style={{ height: gap }} />
              </>
            ) : null}

            <Text style={[text.caption, { color: fg.secondary, marginBottom: space('Spacing/8') }]}>
              Email
            </Text>
            <TextInput
              ref={emailInputRef}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (error) setError(null);
              }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              placeholder={emailFocused ? undefined : 'you@example.com'}
              placeholderTextColor={fg.secondary}
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
            <View style={styles.passwordInputShell}>
              <TextInput
                ref={passwordInputRef}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (error) setError(null);
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                autoCorrect={false}
                secureTextEntry={!passwordVisible}
                textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
                returnKeyType={mode === 'signUp' ? 'next' : 'done'}
                onSubmitEditing={() => {
                  if (mode === 'signUp') confirmPasswordInputRef.current?.focus();
                  else void onSubmit();
                }}
                placeholder={passwordFocused ? undefined : '••••••••'}
                placeholderTextColor={fg.secondary}
                style={[styles.passwordInput, text.body, { color: fg.primary }]}
                editable={!busy}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                disabled={busy}
                hitSlop={8}
                onPress={() => setPasswordVisible((visible) => !visible)}
                style={({ pressed }) => [styles.passwordVisibilityButton, pressed && styles.pressed]}
              >
                <Text style={[text.caption, styles.passwordVisibilityLabel, { color: fg.primary }]}>
                  {passwordVisible ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>

            {mode === 'signUp' ? (
              <>
                <Text style={[text.caption, styles.passwordRequirement, { color: fg.secondary }]}>{NEW_PASSWORD_REQUIREMENT}</Text>
                <Text
                  style={[
                    text.caption,
                    { color: fg.secondary, marginBottom: space('Spacing/8'), marginTop: gap },
                  ]}
                >
                  Confirm password
                </Text>
                <TextInput
                  ref={confirmPasswordInputRef}
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    if (error) setError(null);
                  }}
                  accessibilityLabel="Confirm password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  autoCorrect={false}
                  secureTextEntry={!passwordVisible}
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={() => void onSubmit()}
                  placeholder="Re-enter password"
                  placeholderTextColor={fg.secondary}
                  style={[styles.input, text.body, { color: fg.primary }]}
                  editable={!busy}
                />
              </>
            ) : null}

            {error ? (
              <Text style={[text.caption, { color: '#b00020', marginTop: gap }]}>{error}</Text>
            ) : null}

            {mode === 'signUp' ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="I agree to the Privacy Policy and Terms"
                accessibilityState={{ checked: legalAccepted }}
                onPress={() => setLegalAccepted((value) => !value)}
                disabled={busy}
                style={[styles.consentRow, { marginTop: gap }]}
              >
                <View style={[styles.consentBox, legalAccepted && styles.consentBoxChecked]}>
                  {legalAccepted ? (
                    <Text style={[text.caption, styles.consentMark]}>✓</Text>
                  ) : null}
                </View>
                <Text style={[text.caption, styles.consentLabel, { color: fg.secondary }]}>
                  I agree to the{' '}
                  <Text
                    style={styles.consentLink}
                    onPress={() => void Linking.openURL(LEGAL_URLS.privacyPolicy)}
                  >
                    Privacy Policy
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.consentLink}
                    onPress={() => void Linking.openURL(LEGAL_URLS.terms)}
                  >
                    Terms
                  </Text>
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy, busy }}
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
              accessibilityRole="button"
              onPress={() => {
                setMode((m) => {
                  const next = m === 'signIn' ? 'signUp' : 'signIn';
                  if (next === 'signUp') {
                    setLegalAccepted(false);
                  }
                  return next;
                });
                setPassword('');
                setConfirmPassword('');
                setPasswordVisible(false);
                setError(null);
              }}
              disabled={busy}
              style={styles.modeSwitch}
            >
              <Text style={[text.bodySemi, { color: fg.primary }]}>
                {mode === 'signIn' ? 'Create an account' : 'Back to sign in'}
              </Text>
            </Pressable>

            {mode === 'signIn' ? (
              <Text style={[text.caption, styles.legalFooter, { color: fg.secondary, marginTop: gap }]}>
                <Text
                  style={styles.consentLink}
                  onPress={() => void Linking.openURL(LEGAL_URLS.privacyPolicy)}
                >
                  Privacy Policy
                </Text>
                {' · '}
                <Text
                  style={styles.consentLink}
                  onPress={() => void Linking.openURL(LEGAL_URLS.terms)}
                >
                  Terms
                </Text>
              </Text>
            ) : null}
          </View>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, zIndex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  scrollContent: { flexGrow: 1 },
  scrollContentCentered: { justifyContent: 'center' },
  scrollContentTop: { justifyContent: 'flex-start' },
  brandBlock: { alignItems: 'center', marginBottom: space('Spacing/20') },
  logo: { height: 68, resizeMode: 'contain', width: 68 },
  brandName: { letterSpacing: 1.4, marginTop: space('Spacing/8') },
  card: {
    width: '100%',
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
  passwordInputShell: {
    alignItems: 'center',
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  passwordVisibilityButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 56,
    paddingHorizontal: space('Spacing/12'),
  },
  passwordVisibilityLabel: {
    textDecorationLine: 'underline',
  },
  passwordRequirement: {
    marginTop: space('Spacing/8'),
  },
  primaryButton: {
    ...cardShadowRn,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modeSwitch: {
    alignItems: 'center',
    borderColor: 'rgba(43,52,65,0.18)',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: space('Spacing/12'),
    minHeight: 46,
    paddingHorizontal: space('Spacing/12'),
  },
  pressed: { opacity: 0.75 },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  consentBox: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  consentBoxChecked: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  consentMark: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  consentLabel: {
    flex: 1,
    lineHeight: 20,
  },
  consentLink: {
    color: '#1a1a1a',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  legalFooter: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
