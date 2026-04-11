import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createFieldbookClient, fetchJobById } from '@fieldbook/api-client';
import type { Job } from '@fieldbook/shared-types';

/** Matches `backend/supabase/seed.sql` so local/remote DB can satisfy the same id. */
const DEMO_JOB_ID = '00000000-0000-0000-0000-000000000001';

/** Fallback when env is missing, fetch fails, or the row does not exist. */
const DEMO_JOB: Job = {
  id: DEMO_JOB_ID,
  title: 'Kitchen remodel',
  customerName: 'Rivera & Co.',
  updatedAt: new Date().toISOString(),
};

export function JobDetailScreen() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const hasEnv = Boolean(url && key);

  const [remote, setRemote] = useState<Job | null | undefined>(undefined);

  useEffect(() => {
    if (!hasEnv || !url || !key) {
      setRemote(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const client = createFieldbookClient(url, key);
        const row = await fetchJobById(client, DEMO_JOB_ID);
        if (!cancelled) setRemote(row);
      } catch {
        if (!cancelled) setRemote(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasEnv, url, key]);

  const showLoader = hasEnv && remote === undefined;
  if (showLoader) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator accessibilityLabel="Loading job" />
      </View>
    );
  }

  const job = remote ?? DEMO_JOB;
  const showDemoBanner = !hasEnv || remote === null;

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
      {showDemoBanner ? (
        <Text style={styles.banner}>
          Demo data — set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY,
          or implement fetchJobById against Supabase.
        </Text>
      ) : null}
      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.subtitle}>{job.customerName ?? 'No customer'}</Text>
      <Text style={styles.meta}>
        Updated {new Date(job.updatedAt).toLocaleString()}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#faf6f0',
  },
  scroll: {
    padding: 24,
    paddingTop: 56,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf6f0',
  },
  banner: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5c6570',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2b3441',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#2b3441',
    marginBottom: 12,
  },
  meta: {
    fontSize: 14,
    color: '#5c6570',
  },
});
