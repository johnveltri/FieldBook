/**
 * Job detail screen — single job: header, earnings, CTAs, metrics, sessions, materials, notes, timeline.
 *
 * **Layout:** Full-screen `CanvasTiledBackground` → `ScrollView` (transparent so the lined canvas shows in gutters)
 * → optional fixed `BottomNavJobs` pinned to the bottom (outside the scroll so it stays visible).
 *
 * **Width:** Content uses `CONTENT_MAX_WIDTH` / `TOP_HEADER_MAX_WIDTH` so phones scale edge-to-edge (minus padding)
 * while wide layouts cap at the Figma frame (~393pt).
 *
 * **Typography:** `createTextStyles` maps `typography.json` roles to loaded Expo fonts (see `nativeTokens.ts`).
 * **Money:** `formatUsdCombined` in `lib/formatUsd.ts` + `JobDetailSummaryCard` use DS color tokens for tones.
 */
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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  JobDetailCtaRow,
  JobDetailJobHeader,
  JobDetailMetricTertiary,
  JobDetailSummaryCard,
} from '../components/ds';
import { CanvasTiledBackground } from '../components/CanvasTiledBackground';
import {
  BottomNavIconEarnings,
  BottomNavIconHome,
  BottomNavIconJobs,
} from '../components/bottom-nav/BottomNavTabIcons';
import {
  JobDetailIconCtaMore,
  JobDetailIconRowCardLeading,
  JobDetailIconSectionAdd,
  JobDetailIconSectionMaterials,
  JobDetailIconSectionNotes,
  JobDetailIconSectionSessions,
  JobDetailIconSectionTimeline,
  JobDetailIconTopClose,
  JobDetailIconTopEdit,
  JobDetailIconViewNote,
  JobDetailIconViewSessionChevron,
} from '../components/figma-icons/JobDetailScreenIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, colorWithAlpha, radius } from '@fieldbook/design-system/lib/tokens';
import { fetchFirstJobIdForCurrentUser, fetchJobDetail } from '@fieldbook/api-client';
import type { JobDetailViewModel } from '@fieldbook/shared-types';

import { mockJobDetail } from '../mocks/jobDetail';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  CONTENT_MAX_WIDTH,
  TOP_HEADER_MAX_WIDTH,
  bg,
  border,
  createTextStyles,
  fg,
  space,
} from '../theme/nativeTokens';
import type { TextStyles } from '../theme/nativeTokens';

/** Vertical gap between stacked blocks in the main column (`Spacing/20` = 16 + 4). */
const SLOT_GAP = space('Spacing/20');

function supabaseApiHostLabel(): string {
  const u = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  try {
    return new URL(u).host || u;
  } catch {
    return u.length > 48 ? `${u.slice(0, 48)}…` : u;
  }
}

export type JobDetailScreenProps = {
  /** Top-left close (X): return to the shell home screen (e.g. where sign out lives). */
  onRequestClose?: () => void;
  /** Signed-in user (refetch job list when this changes). */
  sessionUserId?: string | null;
  sessionEmail?: string | null;
  /** Parent increments when navigating to this screen (e.g. "View job") to force reload. */
  loadKey?: number;
};

export function JobDetailScreen({
  onRequestClose,
  sessionUserId,
  sessionEmail,
  loadKey = 0,
}: JobDetailScreenProps = {}) {
  /** Top safe area (status bar); bottom inset used for scroll padding + nav. */
  const insets = useSafeAreaInsets();

  /** Load DS fonts before rendering text (avoids flash of system font / layout jump). */
  const [fontsLoaded] = useFonts({
    PTSerif_700Bold,
    UbuntuSansMono_400Regular,
    UbuntuSansMono_600SemiBold,
    UbuntuSansMono_700Bold,
  });

  /** Memoized text style bundle (serif headings + mono body) tied to loaded font postscript names. */
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

  const supabaseReady = isSupabaseConfigured();
  const [job, setJob] = useState<JobDetailViewModel | null>(() =>
    supabaseReady ? null : mockJobDetail,
  );
  const [jobLoading, setJobLoading] = useState(supabaseReady);
  /** Set when Supabase is configured but fetch returns null or throws (no silent mock). */
  const [jobLoadError, setJobLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseReady) return;
    let cancelled = false;

    const load = async () => {
      setJobLoading(true);
      setJobLoadError(null);
      try {
        const jobId = await fetchFirstJobIdForCurrentUser(supabase);
        if (cancelled) return;
        if (!jobId) {
          setJob(null);
          setJobLoadError('No jobs yet.');
          return;
        }

        const j = await fetchJobDetail(supabase, jobId);
        if (cancelled) return;
        if (j) {
          setJob(j);
        } else {
          setJob(null);
          setJobLoadError('Could not load that job.');
        }
      } catch (e) {
        if (!cancelled) {
          setJob(null);
          setJobLoadError(e instanceof Error ? e.message : 'Could not load job.');
        }
      } finally {
        if (!cancelled) setJobLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [supabaseReady, sessionUserId, loadKey]);

  const onClose = useCallback(() => {
    onRequestClose?.();
  }, [onRequestClose]);
  const onEdit = useCallback(() => {}, []);

  /** Spinner state: same canvas background as main screen so the transition does not flash a flat color. */
  if (!fontsLoaded || (supabaseReady && jobLoading)) {
    return (
      <View style={styles.loading}>
        <CanvasTiledBackground />
        <ActivityIndicator
          accessibilityLabel={!fontsLoaded ? 'Loading fonts' : 'Loading job'}
        />
      </View>
    );
  }

  if (supabaseReady && !job) {
    return (
      <View style={styles.loading}>
        <CanvasTiledBackground />
        {__DEV__ ? (
          <Text
            style={[
              typography.bodySmall,
              {
                color: fg.muted,
                paddingHorizontal: space('Spacing/20'),
                textAlign: 'center',
                marginBottom: space('Spacing/12'),
              },
            ]}
          >
            {sessionEmail ?? '(no email)'} · API {supabaseApiHostLabel()}
          </Text>
        ) : null}
        <Text
          style={[
            typography.body,
            { color: fg.primary, paddingHorizontal: space('Spacing/20'), textAlign: 'center' },
          ]}
        >
          {jobLoadError ?? 'Unable to load job.'}
        </Text>
      </View>
    );
  }

  if (!job) {
    return null;
  }

  /**
   * Space reserved under the scroll content so the last section clears the **fixed** bottom tab bar.
   * Roughly: outer margin + top border + 64px tab row + bottom padding + home indicator (`insets.bottom`).
   */
  const stripPad = space('Spacing/8');
  const bottomNavReservedHeight =
    stripPad + 1 + 64 + stripPad + insets.bottom;

  return (
    <View style={styles.root}>
      {/* Lined canvas + cream fill — behind all scroll content. */}
      <CanvasTiledBackground />
      <ScrollView
        style={[styles.scroll, styles.scrollTransparent]}
        contentContainerStyle={{
          width: '100%',
          paddingTop: Math.max(
            0,
            insets.top - space('Spacing/6') - space('Spacing/12'),
          ),
          paddingBottom: space('Spacing/20') + bottomNavReservedHeight,
          alignItems: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {__DEV__ && supabaseReady ? (
          <Text
            style={[
              typography.bodySmall,
              {
                color: fg.muted,
                alignSelf: 'center',
                marginBottom: space('Spacing/8'),
                paddingHorizontal: space('Spacing/20'),
                textAlign: 'center',
              },
            ]}
          >
            {sessionEmail ?? '(no email)'} · {supabaseApiHostLabel()} · job {job.id}
          </Text>
        ) : null}
        {/* `TopHeader` variant `X (Close &Edit)` (`231:858`) */}
        <View style={[styles.topHeader, { maxWidth: TOP_HEADER_MAX_WIDTH }]}>
          <View style={styles.topHeaderRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => [styles.closeCircle, pressed && styles.pressed]}
            >
              <JobDetailIconTopClose color={fg.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit job"
              onPress={onEdit}
              style={({ pressed }) => [styles.editPill, pressed && styles.pressed]}
            >
              <JobDetailIconTopEdit color={color('Semantic/Action/Primary')} />
              <Text style={[typography.pillCompact, { color: color('Semantic/Status/Error/Text') }]}>
                EDIT
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Main column: horizontal padding + vertical gap; width caps at DS max (see `styles.slot`). */}
        <View style={styles.slot}>
          <JobDetailJobHeader
            title={job.shortDescription}
            customerName={job.customerName}
            lastWorkedLabel={job.lastWorkedLabel}
            categoryLabelUppercase={job.categoryLabel.toUpperCase()}
            workStatus={job.workStatus}
            typography={typography}
          />
          <JobDetailSummaryCard earnings={job.earnings} typography={typography} />
          <JobDetailCtaRow
            workStatus={job.workStatus}
            typography={typography}
            onPrimaryPress={() => {}}
            onMorePress={() => {}}
            MoreIcon={<JobDetailIconCtaMore color={fg.primary} />}
          />
          <JobDetailMetricTertiary metrics={job.metrics} typography={typography} />
        </View>

        {/* Section headers are full-bleed within max width; ADD uses error-tint pill like Figma. */}
        <SectionHeaderFigma
          title="SESSIONS"
          icon={<JobDetailIconSectionSessions color={color('Brand/Accent')} />}
          typography={typography}
          showAdd
        />
        {job.sessions.map((s) => (
          // One row per session — collapsed “view session” card (chevron for future expand).
          <View key={s.id} style={[styles.viewSessionCard, { maxWidth: CONTENT_MAX_WIDTH }]}>
            <View style={styles.viewSessionInner}>
              <View style={styles.viewSessionLeading}>
                <View style={styles.viewSessionDatePad}>
                  <Text style={[typography.bodyBold, { color: fg.primary }]}>{s.dateLabel}</Text>
                </View>
                <Text style={typography.sessionTimeRange}>{s.timeRangeLabel}</Text>
              </View>
              <View style={styles.viewSessionTrailing}>
                <Text style={[typography.metric, { textTransform: 'none' }]}>{s.durationLabel}</Text>
                <JobDetailIconViewSessionChevron color={fg.secondary} />
              </View>
            </View>
          </View>
        ))}

        <SectionHeaderFigma
          title="MATERIALS"
          icon={<JobDetailIconSectionMaterials color={color('Brand/Accent')} />}
          typography={typography}
          showAdd
        />
        <ViewMaterialsBuckets buckets={job.materialBuckets} typography={typography} />

        <SectionHeaderFigma
          title="NOTES"
          icon={<JobDetailIconSectionNotes color={color('Brand/Accent')} />}
          typography={typography}
          showAdd
        />
        <ViewNotesBuckets buckets={job.noteBuckets} typography={typography} />

        <SectionHeaderFigma
          title="TIMELINE"
          icon={<JobDetailIconSectionTimeline color={color('Brand/Accent')} />}
          typography={typography}
          showAdd={false}
        />

        {/* `RowCard` `activityCard` (`786:28` / `787:55`) — matches DS: subtle border, 12 gap, icon well. */}
        <View style={[styles.rowCard, { maxWidth: CONTENT_MAX_WIDTH, width: '100%' }]}>
          <View style={styles.rowCardIconWrap}>
            <JobDetailIconRowCardLeading color={color('Brand/Primary')} />
          </View>
          <View style={styles.rowCardTextStack}>
            <Text style={[typography.bodyBold, { color: fg.primary }]}>{job.timeline.title}</Text>
            <Text style={[typography.bodySmall, { color: fg.secondary }]}>{job.timeline.timeLabel}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Tab bar stays fixed while list scrolls; `bottomInset` clears home indicator. */}
      <BottomNavJobs typography={typography} bottomInset={insets.bottom} />
    </View>
  );
}

// --- Section header (Figma `371:2179` Row) ---

/** Leading icon + Metric-S title; optional trailing ADD pill (hidden for e.g. Timeline when `showAdd` is false). */
function SectionHeaderFigma({
  title,
  icon,
  typography,
  showAdd,
}: {
  title: string;
  icon: ReactNode;
  typography: TextStyles;
  showAdd: boolean;
}) {
  return (
    <View style={[styles.sectionHeader, { maxWidth: TOP_HEADER_MAX_WIDTH }]}>
      <View style={styles.sectionHeaderLead}>
        {icon}
        <View style={styles.sectionHeaderTitleWrap}>
          <Text style={typography.metricS} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
      {showAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${title}`}
          onPress={() => {}}
          style={({ pressed }) => [styles.addPill, pressed && styles.pressed]}
        >
          <JobDetailIconSectionAdd color={color('Semantic/Status/Error/Text')} />
          <Text style={[typography.pillCompact, { color: color('Semantic/Status/Error/Text') }]}>
            ADD
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// --- View materials (multi-session) ---

/** Session bucket header — `Typography/LABEL` + secondary via `labelHeadingSecondary` (materials + notes). */
function bucketSessionHeaderTitle(sessionDateLabel: string | undefined): string {
  const d = sessionDateLabel?.trim() ?? '';
  return `${d} SESSION`.replace(/\s+/g, ' ').trim().toUpperCase();
}

/**
 * Single bordered card listing material buckets (unassigned vs per-session).
 * Each bucket: tinted header row (`bg.canvas`) then line items with optional top borders between buckets.
 */
function ViewMaterialsBuckets({
  buckets,
  typography,
}: {
  buckets: import('../mocks/jobDetail').JobDetailMaterialBucket[];
  typography: TextStyles;
}) {
  return (
    <View style={[styles.viewCardOuter, { maxWidth: CONTENT_MAX_WIDTH }]}>
      <View style={styles.viewCardBorder}>
        {buckets.map((bucket, bi) => (
          <View
            key={bucket.id}
            style={bi > 0 ? { borderTopWidth: 1, borderTopColor: color('Foundation/Border/Subtle') } : undefined}
          >
            <View style={[styles.bucketHeader, bi === 0 && styles.bucketHeaderFirst]}>
              {bucket.kind === 'unassigned' ? (
                <Text style={typography.labelHeadingSecondary}>UNASSIGNED</Text>
              ) : (
                <Text style={typography.labelHeadingSecondary}>
                  {bucketSessionHeaderTitle(bucket.sessionDateLabel)}
                </Text>
              )}
            </View>
            {bucket.items.map((item, ii) => (
              <View
                key={`${bucket.id}-${item.name}-${ii}`}
                style={[
                  styles.materialRow,
                  ii > 0 && { borderTopWidth: 1, borderTopColor: color('Foundation/Border/Subtle') },
                ]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[typography.bodyBold, { color: fg.primary }]}>{item.name}</Text>
                  <Text style={[typography.body, { color: fg.secondary, marginTop: space('Spacing/4') }]}>
                    {item.quantityLabel}
                  </Text>
                </View>
                <Text style={[typography.bodyBold, { color: fg.primary }]}>{item.priceLabel}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// --- View notes (multi-session) ---

/** Same outer structure as materials: buckets, header strip, rows with icon + excerpt + date. */
function ViewNotesBuckets({
  buckets,
  typography,
}: {
  buckets: import('../mocks/jobDetail').JobDetailNoteBucket[];
  typography: TextStyles;
}) {
  const noteIcon = color('Semantic/Activity/Note');
  return (
    <View style={[styles.viewCardOuter, { maxWidth: CONTENT_MAX_WIDTH }]}>
      <View style={styles.viewCardBorder}>
        {buckets.map((bucket, bi) => (
          <View
            key={bucket.id}
            style={bi > 0 ? { borderTopWidth: 1, borderTopColor: color('Foundation/Border/Subtle') } : undefined}
          >
            <View style={[styles.bucketHeader, bi === 0 && styles.bucketHeaderFirst]}>
              {bucket.kind === 'unassigned' ? (
                <Text style={typography.labelHeadingSecondary}>UNASSIGNED</Text>
              ) : (
                <Text style={typography.labelHeadingSecondary}>
                  {bucketSessionHeaderTitle(bucket.sessionDateLabel)}
                </Text>
              )}
            </View>
            {bucket.notes.map((n, ni) => (
              <View
                key={`${bucket.id}-n-${ni}`}
                style={[
                  styles.noteRow,
                  ni > 0 && { borderTopWidth: 1, borderTopColor: color('Foundation/Border/Subtle') },
                ]}
              >
                <View style={{ marginTop: space('Spacing/2') }}>
                  <JobDetailIconViewNote color={noteIcon} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[typography.body, { color: fg.primary }]}>{n.excerpt}</Text>
                  <Text style={[typography.bodySmall, { color: fg.secondary, marginTop: space('Spacing/8') }]}>
                    {n.dateLabel}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// --- Bottom nav (Figma `225:12089` — vectors from `BottomNavTabIcons`, not Ionicons) ---

/** One tab: optional orange top indicator when selected; label recolors to brand primary. */
function BottomNavTabCell({
  selected,
  label,
  icon,
  typography,
}: {
  selected: boolean;
  label: string;
  icon: ReactNode;
  typography: TextStyles;
}) {
  const brand = color('Brand/Primary');
  const labelColor = selected ? brand : fg.primary;
  const tabPad = space('Spacing/12');
  const indicatorW = space('Spacing/32');
  const indicatorH = space('Spacing/4');

  return (
    <View
      style={[
        styles.bottomNavTabCell,
        { justifyContent: selected ? 'space-between' : 'flex-end' },
      ]}
    >
      {selected ? (
        <View style={styles.bottomNavIndicatorWrap}>
          <View style={[styles.bottomNavIndicator, { width: indicatorW, height: indicatorH }]} />
        </View>
      ) : null}
      <View style={[styles.bottomNavTabContent, { padding: tabPad }]}>
        <View style={styles.bottomNavIconSlot}>{icon}</View>
        <Text style={[typography.labelCaps, { color: labelColor, textAlign: 'center' }]}>{label}</Text>
      </View>
    </View>
  );
}

/** Three tabs (HOME / JOBS / EARNINGS); JOBS selected — placeholder until navigation is wired. */
function BottomNavJobs({
  typography,
  bottomInset,
}: {
  typography: TextStyles;
  bottomInset: number;
}) {
  const primary = fg.primary;
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
          icon={<BottomNavIconHome color={primary} />}
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
          icon={<BottomNavIconEarnings color={primary} />}
        />
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Styles — grouped roughly top-to-bottom to match the component tree
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  /** Screen root: one column; background comes from `CanvasTiledBackground` under the scroll. */
  root: { flex: 1 },
  /** Centered spinner over the same lined background as the loaded screen. */
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  /** Scroll fills root; flex lets the fixed bottom nav sit in the same column without overlapping scroll height math incorrectly. */
  scroll: { flex: 1 },
  /** Default scroll content background can read as white on iOS; keep lines visible. */
  scrollTransparent: { backgroundColor: 'transparent' },
  /** Shared pressed state for `Pressable` opacity feedback. */
  pressed: { opacity: 0.75 },

  /**
   * Toolbar chrome only — no fill so `CanvasTiledBackground` (sibling under `ScrollView`) shows the same
   * cream + ruled lines here as in the body. Shadow still separates the header band from content below.
   */
  topHeader: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    paddingTop: space('Spacing/32'),
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space('Spacing/20'),
    paddingBottom: space('Spacing/12'),
  },
  closeCircle: {
    width: space('Spacing/32'),
    height: space('Spacing/32'),
    borderRadius: radius('Radius/16'),
    backgroundColor: bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/8'),
    height: space('Spacing/24'),
    paddingHorizontal: space('Spacing/12'),
    paddingVertical: space('Spacing/4'),
    borderRadius: radius('Radius/Full'),
    backgroundColor: color('Semantic/Status/Error/BG'),
  },

  /** Padded column for the “hero” block: job header, summary, CTAs, metric card — width responsive, max DS width. */
  slot: {
    width: '100%',
    maxWidth: TOP_HEADER_MAX_WIDTH,
    paddingHorizontal: space('Spacing/20'),
    gap: SLOT_GAP,
    alignItems: 'center',
  },

  /** Full-bleed section title + optional ADD — slightly tighter vertical rhythm. */
  sectionHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space('Spacing/24'),
    paddingBottom: space('Spacing/12'),
    paddingHorizontal: space('Spacing/20'),
  },
  sectionHeaderLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/8'),
    flex: 1,
    minWidth: 0,
  },
  sectionHeaderTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color('Semantic/Status/Error/BG'),
    borderRadius: radius('Radius/Full'),
    height: space('Spacing/24'),
    paddingHorizontal: space('Spacing/12'),
    gap: space('Spacing/8'),
  },

  /** Session list row — white card, optional bottom margin between multiple sessions. */
  viewSessionCard: {
    width: '100%',
    minHeight: space('Spacing/80'),
    backgroundColor: bg.surfaceWhite,
    borderRadius: radius('Radius/16'),
    borderWidth: 1,
    borderColor: border.subtle,
    marginBottom: space('Spacing/8'),
  },
  viewSessionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space('Spacing/16'),
    paddingVertical: space('Spacing/16'),
  },
  viewSessionLeading: { flex: 1, minWidth: 0 },
  viewSessionDatePad: { paddingVertical: space('Spacing/4') },
  viewSessionTrailing: { flexDirection: 'row', alignItems: 'center', gap: space('Spacing/12') },

  /** Vertical breathing room around materials/notes cards (Figma `py-[9px]`). */
  viewCardOuter: {
    width: '100%',
    paddingVertical: space('Spacing/8'),
  },
  /** Single surface: rounded rect, clip children so bucket headers respect corner radius. */
  viewCardBorder: {
    borderRadius: radius('Radius/16'),
    borderWidth: 1,
    borderColor: border.subtle,
    backgroundColor: bg.surfaceWhite,
    overflow: 'hidden',
  },
  /** Bucket title strip — same cream as page canvas so it reads as “inside” the card. */
  bucketHeader: {
    height: space('Spacing/32'),
    justifyContent: 'center',
    backgroundColor: bg.canvasWarm,
    paddingHorizontal: space('Spacing/16'),
  },
  bucketHeaderFirst: {
    borderTopLeftRadius: radius('Radius/16'),
    borderTopRightRadius: radius('Radius/16'),
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space('Spacing/16'),
    gap: space('Spacing/16'),
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space('Spacing/8'),
    paddingHorizontal: space('Spacing/16'),
    paddingVertical: space('Spacing/16'),
  },

  /** Timeline activity row — icon well + two-line text stack. */
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: space('Spacing/74'),
    paddingHorizontal: space('Spacing/20'),
    paddingVertical: space('Spacing/16'),
    backgroundColor: bg.surface,
    borderRadius: radius('Radius/16'),
    borderWidth: 1,
    borderColor: border.subtle,
    gap: space('Spacing/12'),
  },
  rowCardIconWrap: {
    width: space('Spacing/28'),
    height: space('Spacing/28'),
    borderRadius: radius('Radius/14'),
    backgroundColor: colorWithAlpha('Brand/Primary', 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** `row-card-title-stack` — `gap: Spacing/4` in `RowCard.tsx` `activityCard`. */
  rowCardTextStack: {
    flex: 1,
    minWidth: 0,
    gap: space('Spacing/4'),
  },

  /** Pinned below scroll: top hairline + solid canvas so tab strip does not show scroll bleed. */
  bottomNav: {
    width: '100%',
    alignSelf: 'center',
    flexShrink: 0,
    marginTop: space('Spacing/8'),
    borderTopWidth: 1,
    borderTopColor: colorWithAlpha('Foundation/Border/Default', 0.05),
    backgroundColor: bg.canvasWarm,
  },
  /** Three equal tabs; min height matches Figma tab strip. */
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
  },
  bottomNavTabContent: {
    alignItems: 'center',
    gap: space('Spacing/2'),
  },
  /** Centers Figma SVG icons (`gap-[2px]` to label is on `bottomNavTabContent`). Max height aligns tabs. */
  bottomNavIconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: space('Spacing/28'),
  },
});
