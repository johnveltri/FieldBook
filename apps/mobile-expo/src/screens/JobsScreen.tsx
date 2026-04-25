import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createBlankJobForCurrentUser,
  listJobsForCurrentUser,
  type ListJobsForCurrentUserItem,
} from '@fieldbook/api-client';
import { color, colorWithAlpha, radius } from '@fieldbook/design-system/lib/tokens';

import { CanvasTiledBackground } from '../components/CanvasTiledBackground';
import {
  BottomNavIconEarnings,
  BottomNavIconHome,
  BottomNavIconJobs,
} from '../components/bottom-nav/BottomNavTabIcons';
import {
  JobsFabPlusIcon,
  JobsInboxIcon,
  JobsSearchIcon,
} from '../components/figma-icons/JobsScreenIcons';
import { JobDetailStatusPill } from '../components/ds';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  CONTENT_MAX_WIDTH,
  TOP_HEADER_MAX_WIDTH,
  bg,
  border,
  cardShadowRn,
  createTextStyles,
  fg,
  space,
} from '../theme/nativeTokens';

type JobsScreenProps = {
  onOpenJobDetail: (jobId?: string, options?: { initialEditOpen?: boolean }) => void;
  /**
   * Hide the "New Job" floating action button. Used while a Live Session is
   * in progress — the floating MinimizedLiveSessionBar takes its slot.
   */
  suppressFab?: boolean;
};

type Typography = ReturnType<typeof createTextStyles>;

function formatUsd(cents: number | null | undefined): string {
  const value = cents ?? 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function BottomNavTabCell({
  selected,
  label,
  icon,
  typography,
}: {
  selected: boolean;
  label: string;
  icon: ReactNode;
  typography: Typography;
}) {
  return (
    <View
      style={[
        styles.bottomNavTabCell,
        { justifyContent: selected ? 'space-between' : 'flex-end' },
      ]}
    >
      {selected ? (
        <View style={styles.bottomNavIndicatorWrap}>
          <View style={styles.bottomNavIndicator} />
        </View>
      ) : null}
      <View style={styles.bottomNavTabContent}>
        <View style={styles.bottomNavIconSlot}>{icon}</View>
        <Text
          style={[
            typography.labelCaps,
            { color: selected ? color('Brand/Primary') : fg.primary, textAlign: 'center' },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function BottomNavJobs({
  typography,
  bottomInset,
}: {
  typography: Typography;
  bottomInset: number;
}) {
  const stripPad = space('Spacing/8');
  return (
    <View
      style={[
        styles.bottomNav,
        {
          maxWidth: TOP_HEADER_MAX_WIDTH,
          paddingHorizontal: stripPad,
          paddingBottom: bottomInset + stripPad - space('Spacing/32'),
        },
      ]}
    >
      <View style={styles.bottomNavInner}>
        <BottomNavTabCell
          selected={false}
          label="HOME"
          typography={typography}
          icon={<BottomNavIconHome color={fg.primary} />}
        />
        <BottomNavTabCell
          selected
          label="JOBS"
          typography={typography}
          icon={<BottomNavIconJobs color={color('Brand/Primary')} />}
        />
        <BottomNavTabCell
          selected={false}
          label="EARNINGS"
          typography={typography}
          icon={<BottomNavIconEarnings color={fg.primary} />}
        />
      </View>
    </View>
  );
}

function JobsCard({
  job,
  onPress,
  typography,
}: {
  job: ListJobsForCurrentUserItem;
  onPress: () => void;
  typography: Typography;
}) {
  const category = (job.jobType ?? '').trim().toUpperCase();
  const showCategoryChip = category.length > 0;
  const timeValue = job.timeLabel || '0.0h';
  const revenue = formatUsd(job.revenueCents);
  const materials = formatUsd(job.materialsCents);
  const net = formatUsd(job.netEarningsCents);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={styles.jobCard}>
        <View style={styles.jobCardRail} />
        <View style={styles.jobCardContent}>
          <View style={styles.jobHeaderRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[typography.titleH3, { color: fg.primary }]}>{job.shortDescription}</Text>
              <Text style={[typography.body, { color: fg.secondary, marginTop: space('Spacing/4') }]}>
                {(job.customerName || 'No customer').trim()} {'\u2022'} {job.lastWorkedLabel}
              </Text>
            </View>
            <View style={styles.statusPillWrap}>
              <JobDetailStatusPill kind={job.workStatus} typography={typography} />
            </View>
          </View>

          {showCategoryChip ? (
            <View style={styles.categoryChip}>
              <Text style={[typography.labelCaps, { color: bg.canvasWarm }]}>{category}</Text>
            </View>
          ) : null}

          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={typography.jobDetailMetricColumnLabel}>TIME</Text>
              <Text style={[typography.metric, styles.metricValue, { color: fg.primary }]}>
                {timeValue}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={typography.jobDetailMetricColumnLabel}>REV</Text>
              <Text style={[typography.metric, styles.metricValue, { color: fg.primary }]}>
                {revenue}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={typography.jobDetailMetricColumnLabel}>MAT</Text>
              <Text
                style={[
                  typography.metric,
                  styles.metricValue,
                  { color: color('Semantic/Financial/Negative') },
                ]}
              >
                {materials}
              </Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={typography.jobDetailMetricColumnLabel}>NET</Text>
              <Text
                style={[
                  typography.metric,
                  styles.metricValue,
                  { color: color('Semantic/Financial/Positive') },
                ]}
              >
                {net}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function JobsScreen({ onOpenJobDetail, suppressFab = false }: JobsScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useMemo(() => new Animated.Value(0), []);
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

  const [jobs, setJobs] = useState<ListJobsForCurrentUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creatingJob, setCreatingJob] = useState(false);

  const loadJobs = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      setJobs([]);
      setLoadError('Supabase is not configured.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await listJobsForCurrentUser(supabase);
      setJobs(rows);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' &&
              error !== null &&
              'message' in error &&
              typeof (error as { message: unknown }).message === 'string'
            ? (error as { message: string }).message
            : 'Failed to load jobs.';
      setJobs([]);
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const onCreateJob = useCallback(async () => {
    if (creatingJob) return;
    if (!isSupabaseConfigured()) {
      setLoadError('Supabase is not configured.');
      return;
    }
    setCreatingJob(true);
    setLoadError(null);
    try {
      const jobId = await createBlankJobForCurrentUser(supabase);
      onOpenJobDetail(jobId, { initialEditOpen: true });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' &&
              error !== null &&
              'message' in error &&
              typeof (error as { message: unknown }).message === 'string'
            ? (error as { message: string }).message
            : 'Failed to create job.';
      setLoadError(message);
    } finally {
      setCreatingJob(false);
    }
  }, [creatingJob, onOpenJobDetail]);

  if (!fontsLoaded) {
    return (
      <View style={styles.root}>
        <CanvasTiledBackground scrollY={scrollY} />
      </View>
    );
  }

  const bottomNavReservedHeight =
    space('Spacing/8') + 1 + 64 + space('Spacing/8') + insets.bottom;

  return (
    <View style={styles.root}>
      <CanvasTiledBackground scrollY={scrollY} />
      <View
        pointerEvents="none"
        style={[
          styles.safeAreaTopAccentWrap,
          { top: 0, maxWidth: TOP_HEADER_MAX_WIDTH },
        ]}
      >
        <View style={styles.topAccent} />
      </View>
      <Animated.ScrollView
        style={[styles.scroll, { paddingTop: Math.max(insets.top - space('Spacing/12'), 0) }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: bottomNavReservedHeight + space('Spacing/20') + 72,
        }}
      >
        <View style={[styles.topHeader, { maxWidth: TOP_HEADER_MAX_WIDTH }]}>
          <Text style={typography.displayH1}>JOBS</Text>
          <View style={styles.inboxWrap}>
            <JobsInboxIcon color={fg.primary} />
            <View style={styles.inboxBadge}>
              <Text style={[typography.bodySmall, { color: bg.canvasWarm }]}>10</Text>
            </View>
          </View>
        </View>

        <View style={[styles.searchBar, { maxWidth: CONTENT_MAX_WIDTH }]}>
          <JobsSearchIcon color={fg.secondary} />
          <Text style={[typography.body, { color: fg.secondary }]}>Search jobs or customers...</Text>
        </View>

        <View style={[styles.tabsWrap, { maxWidth: CONTENT_MAX_WIDTH }]}>
          <View style={styles.tabActive}>
            <Text style={[typography.labelCaps, { color: fg.primary }]}>All</Text>
          </View>
          <View style={styles.tabIdle}>
            <Text style={typography.labelCaps}>Open</Text>
          </View>
          <View style={styles.tabIdle}>
            <Text style={typography.labelCaps}>Paid</Text>
          </View>
        </View>

        <View style={[styles.sectionHeader, { maxWidth: TOP_HEADER_MAX_WIDTH }]}>
          <Text style={typography.metricS}>THIS WEEK</Text>
        </View>

        <View style={[styles.jobsListWrap, { maxWidth: TOP_HEADER_MAX_WIDTH }]}>
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator />
            </View>
          ) : loadError ? (
            <View style={styles.centerState}>
              <Text style={[typography.body, { color: fg.secondary, textAlign: 'center' }]}>
                {loadError}
              </Text>
            </View>
          ) : jobs.length === 0 ? (
            <View style={styles.centerState}>
              <Text style={[typography.body, { color: fg.secondary }]}>No jobs yet.</Text>
            </View>
          ) : (
            jobs.map((job) => (
              <JobsCard
                key={job.id}
                job={job}
                onPress={() => onOpenJobDetail(job.id)}
                typography={typography}
              />
            ))
          )}
        </View>
      </Animated.ScrollView>

      {suppressFab ? null : (
        <View
          style={[
            styles.fabWrap,
            { bottom: space('Spacing/8') + insets.bottom + 64 + space('Spacing/12') },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create new job"
            disabled={creatingJob}
            onPress={onCreateJob}
            style={({ pressed }) => [styles.fabContent, (pressed || creatingJob) && styles.pressed]}
          >
            <JobsFabPlusIcon color={bg.canvasWarm} />
            <Text style={[typography.bodyBold, { color: bg.canvasWarm }]}>New Job</Text>
          </Pressable>
        </View>
      )}

      <BottomNavJobs typography={typography} bottomInset={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Match lined canvas fill (`CanvasTiledBackground`) so overscroll (rubber-band)
   * does not flash the window default. Lines still do not draw in the bounce
   * inset — only this solid `canvasWarm` shows there.
   */
  root: { flex: 1, alignItems: 'center', backgroundColor: bg.canvasWarm },
  scroll: { flex: 1, width: '100%', backgroundColor: 'transparent' },
  safeAreaTopAccentWrap: {
    position: 'absolute',
    width: '100%',
    alignSelf: 'center',
    zIndex: 5,
  },
  topAccent: {
    width: '100%',
    height: 6,
    backgroundColor: color('Brand/Accent'),
  },
  topHeader: {
    width: '100%',
    paddingHorizontal: space('Spacing/20'),
    paddingTop: space('Spacing/32'),
    paddingBottom: space('Spacing/16'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inboxWrap: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  inboxBadge: {
    position: 'absolute',
    top: 2,
    right: 1,
    minWidth: 16,
    height: 16,
    borderRadius: radius('Radius/Full'),
    backgroundColor: color('Brand/Primary'),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  searchBar: {
    width: '100%',
    height: 48,
    backgroundColor: bg.surfaceWhite,
    borderWidth: 1,
    borderColor: border.subtle,
    borderRadius: 12,
    ...cardShadowRn,
    paddingHorizontal: space('Spacing/16'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/12'),
  },
  tabsWrap: {
    width: '100%',
    marginTop: space('Spacing/12'),
    backgroundColor: bg.subtle,
    borderRadius: radius('Radius/Full'),
    padding: space('Spacing/4'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabActive: {
    flex: 1,
    backgroundColor: bg.surfaceWhite,
    borderRadius: radius('Radius/Full'),
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...cardShadowRn,
  },
  tabIdle: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    width: '100%',
    paddingHorizontal: space('Spacing/20'),
    paddingTop: space('Spacing/36'),
    paddingBottom: space('Spacing/16'),
  },
  jobsListWrap: {
    width: '100%',
    paddingHorizontal: space('Spacing/20'),
    gap: space('Spacing/12'),
  },
  centerState: {
    width: '100%',
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: border.subtle,
    borderRadius: 16,
    backgroundColor: bg.surfaceWhite,
    overflow: 'hidden',
    flexDirection: 'row',
    paddingLeft: space('Spacing/24'),
    paddingRight: 0,
    ...cardShadowRn,
  },
  jobCardRail: {
    width: 2,
    backgroundColor: colorWithAlpha('Brand/Primary', 0.15),
  },
  jobCardContent: {
    flex: 1,
    paddingHorizontal: space('Spacing/24'),
    paddingVertical: space('Spacing/24'),
    gap: space('Spacing/16'),
  },
  jobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space('Spacing/8'),
  },
  statusPillWrap: {
    alignSelf: 'flex-start',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: color('Foundation/Text/Primary'),
    borderRadius: 6,
    paddingHorizontal: space('Spacing/8'),
    paddingVertical: space('Spacing/4'),
  },
  metricsRow: {
    borderTopWidth: 1,
    borderTopColor: border.subtle,
    paddingTop: space('Spacing/16'),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
    gap: space('Spacing/4'),
    alignItems: 'center',
  },
  metricValue: {
    textTransform: 'none',
    textAlign: 'center',
  },
  pressed: { opacity: 0.75 },
  fabWrap: {
    position: 'absolute',
    right: space('Spacing/24'),
    zIndex: 20,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/8'),
    height: 56,
    borderRadius: radius('Radius/Full'),
    backgroundColor: color('Brand/Primary'),
    paddingHorizontal: 21,
    ...cardShadowRn,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  bottomNav: {
    width: '100%',
    alignSelf: 'center',
    flexShrink: 0,
    marginTop: space('Spacing/8'),
    borderTopWidth: 1,
    borderTopColor: colorWithAlpha('Foundation/Border/Default', 0.05),
    backgroundColor: bg.canvasWarm,
  },
  bottomNavInner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: space('Spacing/64'),
    width: '100%',
  },
  bottomNavTabCell: {
    flex: 1,
    minWidth: 0,
    minHeight: space('Spacing/64'),
  },
  bottomNavIndicatorWrap: {
    alignItems: 'center',
    paddingTop: space('Spacing/2'),
  },
  bottomNavIndicator: {
    borderRadius: radius('Radius/Full'),
    backgroundColor: color('Brand/Primary'),
    width: space('Spacing/32'),
    height: space('Spacing/4'),
  },
  bottomNavTabContent: {
    alignItems: 'center',
    gap: space('Spacing/2'),
    padding: space('Spacing/12'),
  },
  bottomNavIconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: space('Spacing/28'),
  },
});
