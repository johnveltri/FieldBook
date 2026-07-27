import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { recordReacceptanceLegalAcceptances } from '@fieldsolo/api-client';

import { analyticsConfig } from '../lib/analytics/config';
import {
  LEGAL_URLS,
  REQUIRED_PRIVACY_VERSION,
  REQUIRED_TERMS_VERSION,
} from '../lib/legal-versions';
import { supabase } from '../lib/supabase';
import { cardShadowRn, fg, space } from '../theme/nativeTokens';

type LegalReacceptanceModalProps = {
  visible: boolean;
  onAccepted: () => void;
};

export function LegalReacceptanceModal({
  visible,
  onAccepted,
}: LegalReacceptanceModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAccept = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await recordReacceptanceLegalAcceptances(supabase, {
        privacyVersion: REQUIRED_PRIVACY_VERSION,
        termsVersion: REQUIRED_TERMS_VERSION,
        appVersion: analyticsConfig.appVersion,
        platform: analyticsConfig.platform,
      });
      onAccepted();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not save your acceptance. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }, [onAccepted]);

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Updated legal terms</Text>
          <Text style={styles.body}>
            FieldSolo&apos;s Privacy Policy and Terms have been updated. Review
            the current versions and agree to continue using the app.
          </Text>
          <Text style={styles.links}>
            <Text
              style={styles.link}
              onPress={() => void Linking.openURL(LEGAL_URLS.privacyPolicy)}
            >
              Privacy Policy
            </Text>
            {' · '}
            <Text
              style={styles.link}
              onPress={() => void Linking.openURL(LEGAL_URLS.terms)}
            >
              Terms
            </Text>
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => void onAccept()}
            disabled={busy}
            style={({ pressed }) => [
              styles.button,
              { opacity: busy ? 0.6 : pressed ? 0.85 : 1 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonLabel}>I agree</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: space('Spacing/24'),
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: space('Spacing/24'),
    gap: space('Spacing/16'),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: fg.primary,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: fg.secondary,
  },
  links: {
    fontSize: 15,
    lineHeight: 22,
    color: fg.secondary,
  },
  link: {
    color: fg.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  error: {
    color: '#b00020',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    ...cardShadowRn,
    marginTop: space('Spacing/8'),
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
