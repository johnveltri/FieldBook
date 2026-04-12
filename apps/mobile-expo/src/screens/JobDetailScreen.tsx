import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { CanvasTiledBackground } from '../components/CanvasTiledBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, colorWithAlpha, radius } from '@fieldbook/design-system/lib/tokens';

import {
  mockJobDetail,
  type JobDetailMock,
  type JobDetailWorkStatus,
} from '../mocks/jobDetail';
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

// -----------------------------------------------------------------------------
// Money — TODO: shared helpers
// -----------------------------------------------------------------------------

function formatUsdRow(cents: number): { prefix: string; amount: string } {
  const negative = cents < 0;
  const amount = Math.abs(cents) / 100;
  const s = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return {
    prefix: negative ? '-$' : '$',
    amount: s,
  };
}

// -----------------------------------------------------------------------------
// Status pill — same tokens as `StatusPill`
// -----------------------------------------------------------------------------

const PILL_LABEL: Record<JobDetailWorkStatus, string> = {
  paid: 'Paid',
  notStarted: 'NOT STARTED',
  inProgress: 'IN PROGRESS',
  completed: 'COMPLETED',
  onHold: 'ON HOLD',
  cancelled: 'CANCELLED',
};

function statusPillColors(kind: JobDetailWorkStatus): {
  bg: string;
  border: string;
  text: string;
} {
  switch (kind) {
    case 'paid':
      return {
        bg: color('Semantic/Status/Success/BG'),
        border: color('Semantic/Status/Success/Text'),
        text: color('Semantic/Status/Success/Text'),
      };
    case 'notStarted':
      return {
        bg: color('Semantic/Status/Neutral/BG'),
        border: color('Semantic/Status/Neutral/Text'),
        text: color('Semantic/Status/Neutral/Text'),
      };
    case 'inProgress':
      return {
        bg: color('Semantic/Status/Info/BG'),
        border: color('Semantic/Status/Info/Text'),
        text: color('Semantic/Status/Info/Text'),
      };
    case 'completed':
      return {
        bg: color('Semantic/Status/Warning/BG'),
        border: color('Semantic/Status/Warning/Stroke'),
        text: color('Semantic/Status/Warning/Label'),
      };
    case 'onHold':
      return {
        bg: color('Semantic/Status/Paused/BG'),
        border: color('Semantic/Status/Paused/Text'),
        text: color('Semantic/Status/Paused/Text'),
      };
    case 'cancelled':
      return {
        bg: color('Semantic/Status/Error/BG'),
        border: color('Semantic/Status/Error/Text'),
        text: color('Semantic/Status/Error/Text'),
      };
  }
}

function StatusPillRn({
  kind,
  typography,
}: {
  kind: JobDetailWorkStatus;
  typography: ReturnType<typeof createTextStyles>;
}) {
  const c = statusPillColors(kind);
  const pillText: TextStyle = {
    fontFamily: typography.labelCaps.fontFamily,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'none',
    color: c.text,
  };

  return (
    <View style={[styles.pillOuter, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={pillText}>{PILL_LABEL[kind]}</Text>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Screen — composition follows Figma `1836:1875` (Job Detail)
// -----------------------------------------------------------------------------

const SLOT_GAP = space('Spacing/20');
const JOB_CARD_WIDTH = 351;

export function JobDetailScreen() {
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

  // TODO: job id → Supabase
  const job = mockJobDetail;

  const onClose = useCallback(() => {}, []);
  const onEdit = useCallback(() => {}, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <CanvasTiledBackground />
        <ActivityIndicator accessibilityLabel="Loading fonts" />
      </View>
    );
  }

  const noteOrange = color('Semantic/Activity/Note');
  const ctaShadow: ViewStyle = {
    shadowColor: noteOrange,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  };

  /** Fixed bottom nav: margin + border + tab strip (`minHeight` 64) + strip padding + home indicator. */
  const stripPad = space('Spacing/8');
  const bottomNavReservedHeight =
    stripPad + 1 + 64 + stripPad + insets.bottom;

  return (
    <View style={styles.root}>
      <CanvasTiledBackground />
      <ScrollView
        style={[styles.scroll, styles.scrollTransparent]}
        contentContainerStyle={{
          width: '100%',
          paddingTop: insets.top,
          paddingBottom: space('Spacing/24') + bottomNavReservedHeight,
          alignItems: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* `TopHeader` variant `X (Close &Edit)` (`231:858`) */}
        <View style={[styles.topHeader, { maxWidth: TOP_HEADER_MAX_WIDTH }]}>
          <View style={styles.topHeaderRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => [styles.closeCircle, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={20} color={fg.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit job"
              onPress={onEdit}
              style={({ pressed }) => [styles.editPill, pressed && styles.pressed]}
            >
              <Ionicons name="pencil" size={14} color={color('Semantic/Status/Error/Text')} />
              <Text style={styles.editPillLabel}>EDIT</Text>
            </Pressable>
          </View>
        </View>

        {/* Slot: gap 20px, px 20 — `1836:1874` */}
        <View style={styles.slot}>
          {/* `JobCard` `Header without card` (`1836:2829`) */}
          <View style={[styles.jobCardShell, { width: JOB_CARD_WIDTH }]}>
            <View style={styles.jobCardContent}>
              <View style={styles.jobHeaderRow}>
                <View style={styles.jobTitleBlock}>
                  <View style={styles.jobHeadingPad}>
                    <Text style={[typography.headingH2]} numberOfLines={3}>
                      {job.shortDescription}
                    </Text>
                  </View>
                  <Text style={[typography.body, { color: fg.secondary }]}>
                    <Text>{job.customerName}</Text>
                    <Text>{` • `}</Text>
                    <Text>{job.lastWorkedLabel}</Text>
                  </Text>
                </View>
                <StatusPillRn kind={job.workStatus} typography={typography} />
              </View>
              <View style={styles.categoryChip}>
                <Text style={[typography.labelCaps, { color: color('Foundation/Background/Default'), textTransform: 'none' }]}>
                  {job.categoryLabel.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* `JobSummaryCard` (`258:1549`) */}
          <View style={[styles.jobSummaryCard, { maxWidth: CONTENT_MAX_WIDTH }]}>
            <Text style={[typography.labelHeadingSecondary, { paddingVertical: space('Spacing/4') }]}>
              Earnings Summary
            </Text>
            <JobSummaryRows earnings={job.earnings} typography={typography} />
          </View>

          {/* `FieldBookCtaButton` `notePrimaryWithMore` (`1836:2011`) */}
          <View style={styles.ctaRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {}}
              style={({ pressed }) => [
                styles.ctaPrimary,
                { backgroundColor: noteOrange, opacity: pressed ? 0.92 : 1 },
                ctaShadow,
              ]}
            >
              <Text style={[typography.bodyBold, styles.ctaPrimaryLabel]}>MARK COMPLETED</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {}}
              style={({ pressed }) => [
                styles.ctaMore,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={fg.primary} />
            </Pressable>
          </View>

          {/* `MetricCard` tertiary-only job (`258:1399`) */}
          <MetricCardJob metrics={job.metrics} typography={typography} />
        </View>

        {/* `SectionHeader` Row + `ViewSession` collapsed */}
        <SectionHeaderFigma
          title="SESSIONS"
          icon={<Ionicons name="time-outline" size={16} color={color('Brand/Accent')} />}
          typography={typography}
          showAdd
        />
        {job.sessions.map((s) => (
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
                <Ionicons name="chevron-down" size={20} color={fg.primary} />
              </View>
            </View>
          </View>
        ))}

        <SectionHeaderFigma
          title="MATERIALS"
          icon={<Ionicons name="build-outline" size={16} color={color('Brand/Accent')} />}
          typography={typography}
          showAdd
        />
        <ViewMaterialsBuckets buckets={job.materialBuckets} typography={typography} />

        <SectionHeaderFigma
          title="NOTES"
          icon={<Ionicons name="document-text-outline" size={16} color={color('Brand/Accent')} />}
          typography={typography}
          showAdd
        />
        <ViewNotesBuckets buckets={job.noteBuckets} typography={typography} />

        <SectionHeaderFigma
          title="TIMELINE"
          icon={<Ionicons name="pulse-outline" size={16} color={color('Brand/Accent')} />}
          typography={typography}
          showAdd={false}
        />

        {/* `RowCard` `activityCard` (`786:28` / `787:55`) — matches DS: subtle border, 12 gap, icon well. */}
        <View style={[styles.rowCard, { maxWidth: CONTENT_MAX_WIDTH, width: '100%' }]}>
          <View style={styles.rowCardIconWrap}>
            <Ionicons name="time-outline" size={14} color={color('Brand/Primary')} />
          </View>
          <View style={styles.rowCardTextStack}>
            <Text style={[typography.bodyBold, { color: fg.primary }]}>{job.timeline.title}</Text>
            <Text style={[typography.bodySmall, { color: fg.secondary }]}>{job.timeline.timeLabel}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pinned to screen bottom — not part of scroll (`225:12089`). */}
      <BottomNavJobs typography={typography} bottomInset={insets.bottom} />
    </View>
  );
}

// --- Job summary (matches `JobSummaryCard` rows + total) ---

function JobSummaryRows({
  earnings,
  typography,
}: {
  earnings: JobDetailMock['earnings'];
  typography: ReturnType<typeof createTextStyles>;
}) {
  const rev = formatUsdRow(earnings.revenueCents);
  const mat = formatUsdRow(earnings.materialsCents);
  const fees = formatUsdRow(earnings.feesCents);
  const net = formatUsdRow(earnings.netEarningsCents);

  return (
    <View style={{ gap: space('Spacing/4'), width: '100%' }}>
      <View style={styles.summaryRow}>
        <Text style={[typography.body, { color: fg.secondary, flex: 1 }]}>Revenue</Text>
        <View style={styles.summaryValue}>
          <Text style={[typography.bodyBold, { color: fg.primary }]}>{rev.prefix}</Text>
          <Text style={[typography.bodyBold, { color: fg.primary, minWidth: 72, textAlign: 'right' }]}>
            {rev.amount}
          </Text>
        </View>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[typography.body, { color: fg.secondary, flex: 1 }]}>Materials</Text>
        <View style={styles.summaryValue}>
          <Text style={[typography.bodyBold, { color: color('Brand/Primary') }]}>{mat.prefix}</Text>
          <Text style={[typography.bodyBold, { color: color('Brand/Primary'), minWidth: 72, textAlign: 'right' }]}>
            {mat.amount}
          </Text>
        </View>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[typography.body, { color: fg.secondary, flex: 1 }]}>Fees</Text>
        <View style={styles.summaryValue}>
          <Text style={[typography.bodyBold, { color: color('Brand/Primary') }]}>{fees.prefix}</Text>
          <Text style={[typography.bodyBold, { color: color('Brand/Primary'), minWidth: 48, textAlign: 'right' }]}>
            {fees.amount}
          </Text>
        </View>
      </View>
      <View style={styles.summaryTotal}>
        <Text style={[typography.metric, { flex: 1 }]}>Net Earnings</Text>
        <View style={styles.summaryValue}>
          <Text style={[typography.metric, { color: color('Semantic/Status/Success/Text') }]}>{net.prefix}</Text>
          <Text style={[typography.metric, { color: color('Semantic/Status/Success/Text'), minWidth: 88, textAlign: 'right' }]}>
            {net.amount}
          </Text>
        </View>
      </View>
    </View>
  );
}

// --- Metric card tertiary ---

function MetricColumnDivider() {
  return (
    <View style={styles.metricDividerTrack}>
      <View style={styles.metricDividerLine} />
    </View>
  );
}

function MetricCardJob({
  metrics,
  typography,
}: {
  metrics: JobDetailMock['metrics'];
  typography: ReturnType<typeof createTextStyles>;
}) {
  /** Matches `MetricCard` tertiary (`258:1161`): LABEL uses **Foundation/Text/Secondary**. */
  const labelStyle: TextStyle = {
    fontFamily: typography.labelCaps.fontFamily,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: fg.secondary,
    textAlign: 'center',
  };

  const success = color('Semantic/Status/Success/Text');

  return (
    <View style={[styles.metricCard, { maxWidth: CONTENT_MAX_WIDTH }]}>
      <View style={styles.metricTertiaryRow}>
        <View style={styles.metricColEqual}>
          <View style={styles.metricLabelPad}>
            <Text style={labelStyle}>TIME</Text>
          </View>
          <Text style={[typography.metric, styles.metricValueCentered, { textTransform: 'none' }]}>
            {metrics.timeLabel}
          </Text>
        </View>
        <MetricColumnDivider />
        <View style={styles.metricColEqual}>
          <View style={styles.metricLabelPad}>
            <Text style={labelStyle}>NET/HR</Text>
          </View>
          <View style={styles.netHrValue}>
            <Text style={[typography.metric, { color: success }]}>$</Text>
            <Text style={[typography.metric, { color: success }]}>{metrics.netPerHrDisplay}</Text>
          </View>
        </View>
        <MetricColumnDivider />
        <View style={styles.metricColEqual}>
          <View style={styles.metricLabelPad}>
            <Text style={labelStyle}>SESSIONS</Text>
          </View>
          <Text style={[typography.metric, styles.metricValueCentered, { textTransform: 'none' }]}>
            {String(metrics.sessionCount)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// --- Section header (Figma `371:2179` Row) ---

function SectionHeaderFigma({
  title,
  icon,
  typography,
  showAdd,
}: {
  title: string;
  icon: ReactNode;
  typography: ReturnType<typeof createTextStyles>;
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
          <Ionicons name="add" size={12} color={color('Semantic/Status/Error/Text')} />
          <Text style={styles.addPillText}>ADD</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// --- View materials (multi-session) ---

function ViewMaterialsBuckets({
  buckets,
  typography,
}: {
  buckets: import('../mocks/jobDetail').JobDetailMaterialBucket[];
  typography: ReturnType<typeof createTextStyles>;
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
                <Text style={[typography.labelCaps, { color: fg.secondary, textTransform: 'none' }]}>
                  Unassigned
                </Text>
              ) : (
                <Text style={[typography.bodySmall, { color: fg.secondary }]}>
                  <Text>{`${bucket.sessionDateLabel?.trim() ?? ''} `}</Text>
                  <Text style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Session</Text>
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

function ViewNotesBuckets({
  buckets,
  typography,
}: {
  buckets: import('../mocks/jobDetail').JobDetailNoteBucket[];
  typography: ReturnType<typeof createTextStyles>;
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
                <Text style={[typography.labelCaps, { color: fg.secondary, textTransform: 'none' }]}>
                  Unassigned
                </Text>
              ) : (
                <Text style={[typography.bodySmall, { color: fg.secondary }]}>
                  <Text>{`${bucket.sessionDateLabel?.trim() ?? ''} `}</Text>
                  <Text style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Session</Text>
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
                <Ionicons name="document-text" size={16} color={noteIcon} style={{ marginTop: 2 }} />
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

// --- Bottom nav (Figma `225:12089` — mirrors `BottomNav.tsx`) ---

const BOTTOM_NAV_ICON = 24;
const BOTTOM_NAV_ICON_PAD = space('Spacing/4');
const BOTTOM_NAV_ICON_FRAME = BOTTOM_NAV_ICON + BOTTOM_NAV_ICON_PAD * 2;

function BottomNavTabCell({
  selected,
  label,
  icon,
  typography,
}: {
  selected: boolean;
  label: string;
  icon: ReactNode;
  typography: ReturnType<typeof createTextStyles>;
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
        <View
          style={[
            styles.bottomNavIconWell,
            {
              width: BOTTOM_NAV_ICON_FRAME,
              height: BOTTOM_NAV_ICON_FRAME,
              borderRadius: BOTTOM_NAV_ICON_FRAME / 2,
              padding: BOTTOM_NAV_ICON_PAD,
            },
          ]}
        >
          {icon}
        </View>
        <Text style={[typography.labelCaps, { color: labelColor, textAlign: 'center' }]}>{label}</Text>
      </View>
    </View>
  );
}

function BottomNavJobs({
  typography,
  bottomInset,
}: {
  typography: ReturnType<typeof createTextStyles>;
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
          paddingBottom: bottomInset + stripPad,
        },
      ]}
    >
      <View style={styles.bottomNavInner}>
        <BottomNavTabCell
          selected={false}
          label="HOME"
          typography={typography}
          icon={<Ionicons name="home-outline" size={BOTTOM_NAV_ICON} color={primary} />}
        />
        <BottomNavTabCell
          selected
          label="JOBS"
          typography={typography}
          icon={
            <Ionicons name="briefcase-outline" size={BOTTOM_NAV_ICON} color={color('Brand/Primary')} />
          }
        />
        <BottomNavTabCell
          selected={false}
          label="EARNINGS"
          typography={typography}
          icon={<Ionicons name="bar-chart-outline" size={BOTTOM_NAV_ICON} color={primary} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  /** Default scroll content background can read as white on iOS; keep lines visible. */
  scrollTransparent: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.75 },

  topHeader: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: bg.canvas,
    paddingTop: space('Spacing/40'),
    ...cardShadowRn,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: space('Spacing/20'),
    paddingBottom: space('Spacing/16'),
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/8'),
    height: 24,
    paddingHorizontal: space('Spacing/12'),
    paddingVertical: space('Spacing/4'),
    borderRadius: 9999,
    backgroundColor: color('Semantic/Status/Error/BG'),
  },
  editPillLabel: {
    fontFamily: 'UbuntuSansMono_400Regular',
    fontSize: 10,
    color: color('Semantic/Status/Error/Text'),
  },

  slot: {
    width: '100%',
    maxWidth: TOP_HEADER_MAX_WIDTH,
    paddingHorizontal: space('Spacing/20'),
    gap: SLOT_GAP,
    alignItems: 'center',
  },

  jobCardShell: {
    borderRadius: radius('Radius/16'),
    ...cardShadowRn,
  },
  jobCardContent: {
    paddingVertical: space('Spacing/24'),
    gap: space('Spacing/16'),
  },
  jobHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space('Spacing/8'),
  },
  jobTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: space('Spacing/4'),
  },
  jobHeadingPad: {
    paddingVertical: space('Spacing/4'),
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: color('Foundation/Text/Primary'),
    paddingHorizontal: space('Spacing/8'),
    paddingVertical: space('Spacing/4'),
    borderRadius: 6,
  },

  jobSummaryCard: {
    width: '100%',
    backgroundColor: bg.surface,
    borderRadius: radius('Radius/16'),
    borderWidth: 1,
    borderColor: border.subtle,
    padding: space('Spacing/24'),
    gap: space('Spacing/8'),
    ...cardShadowRn,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },
  summaryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  summaryTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space('Spacing/8'),
    marginTop: space('Spacing/8'),
    borderTopWidth: 1,
    borderTopColor: border.default,
  },

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space('Spacing/16'),
    width: '100%',
    maxWidth: 343,
  },
  ctaPrimary: {
    flex: 1,
    minHeight: 51,
    borderRadius: radius('Radius/12'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    paddingHorizontal: 24,
  },
  ctaPrimaryLabel: {
    color: color('Foundation/Surface/White'),
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  ctaMore: {
    width: 51,
    height: 51,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colorWithAlpha('Brand/Primary', 0.2),
    backgroundColor: bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  metricCard: {
    width: '100%',
    backgroundColor: bg.surface,
    borderRadius: radius('Radius/24'),
    borderWidth: 1,
    borderColor: border.subtle,
    paddingHorizontal: space('Spacing/32'),
    paddingVertical: space('Spacing/12'),
    ...cardShadowRn,
  },
  metricTertiaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    width: '100%',
  },
  /** Tertiary-only: three equal columns; mirrors `MetricCard.tsx` `MetricTripleCell`. */
  metricColEqual: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  /** Vertical rules inset from top/bottom (Figma — dividers do not meet card edges). */
  metricDividerTrack: {
    alignSelf: 'stretch',
    paddingVertical: space('Spacing/12'),
    width: 1,
  },
  metricDividerLine: {
    flex: 1,
    width: '100%',
    minWidth: 1,
    backgroundColor: border.subtle,
  },
  metricLabelPad: {
    paddingVertical: space('Spacing/4'),
    width: '100%',
    alignItems: 'center',
  },
  metricValueCentered: {
    textAlign: 'center',
    color: fg.primary,
  },
  netHrValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: space('Spacing/4'),
  },

  sectionHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space('Spacing/36'),
    paddingBottom: space('Spacing/16'),
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
    borderRadius: 9999,
    height: 24,
    paddingHorizontal: space('Spacing/12'),
    gap: space('Spacing/8'),
  },
  addPillText: {
    fontFamily: 'UbuntuSansMono_400Regular',
    fontSize: 10,
    color: color('Semantic/Status/Error/Text'),
  },

  viewSessionCard: {
    width: '100%',
    minHeight: 80,
    backgroundColor: bg.surfaceWhite,
    borderRadius: radius('Radius/16'),
    borderWidth: 1,
    borderColor: border.subtle,
    marginBottom: space('Spacing/8'),
    ...cardShadowRn,
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

  viewCardOuter: {
    width: '100%',
    paddingVertical: space('Spacing/8'),
  },
  viewCardBorder: {
    borderRadius: radius('Radius/16'),
    borderWidth: 1,
    borderColor: border.subtle,
    backgroundColor: bg.surfaceWhite,
    overflow: 'hidden',
    ...cardShadowRn,
  },
  bucketHeader: {
    height: 32,
    justifyContent: 'center',
    backgroundColor: bg.canvas,
    paddingHorizontal: space('Spacing/16'),
  },
  bucketHeaderFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 74,
    paddingHorizontal: space('Spacing/20'),
    paddingVertical: space('Spacing/16'),
    backgroundColor: bg.surface,
    borderRadius: radius('Radius/16'),
    borderWidth: 1,
    borderColor: border.subtle,
    gap: space('Spacing/12'),
    ...cardShadowRn,
  },
  rowCardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
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

  bottomNav: {
    width: '100%',
    alignSelf: 'center',
    flexShrink: 0,
    marginTop: space('Spacing/8'),
    borderTopWidth: 1,
    borderTopColor: border.subtle,
    backgroundColor: bg.canvas,
  },
  bottomNavInner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 64,
    width: '100%',
  },
  bottomNavTabCell: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
  },
  bottomNavIndicatorWrap: {
    alignItems: 'center',
    paddingTop: 2,
  },
  bottomNavIndicator: {
    borderRadius: 9999,
    backgroundColor: color('Brand/Primary'),
  },
  bottomNavTabContent: {
    alignItems: 'center',
    gap: 2,
  },
  bottomNavIconWell: {
    backgroundColor: bg.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pillOuter: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: space('Spacing/12'),
    paddingVertical: space('Spacing/4'),
  },
});
