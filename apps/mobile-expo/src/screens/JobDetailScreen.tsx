/**
 * Job detail screen — single job: header, earnings, CTAs, metrics, sessions, materials, notes, timeline.
 *
 * **Layout:** Full-screen `CanvasTiledBackground` → `ScrollView` (transparent so the lined canvas shows in gutters)
 * → optional fixed `BottomNavJobs` pinned to the bottom (outside the scroll so it stays visible).
 *
 * **Width:** Content uses `CONTENT_MAX_WIDTH` / `TOP_HEADER_MAX_WIDTH` so phones scale edge-to-edge (minus padding)
 * while wide layouts cap at the Figma frame (~393pt).
 *
 * **Typography:** `createTextStyles` maps DS roles to loaded Expo Google Font family names (see `nativeTokens.ts`).
 * **Money:** Amounts in mock data are integer cents; `formatUsdRow` turns them into `$` / `-$` + formatted digits.
 */
import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
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
// Money — TODO: move to shared helpers when used outside this screen
// -----------------------------------------------------------------------------

/** Formats one currency column: sign prefix (`$` or `-$`) separate from digits for mixed font weights in the UI. */
function formatUsdRow(cents: number): { prefix: string; amount: string } {
  const negative = cents < 0;
  const dollars = Math.abs(cents) / 100;
  const formattedDollars = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
  return {
    prefix: negative ? '-$' : '$',
    amount: formattedDollars,
  };
}

// -----------------------------------------------------------------------------
// Status pill — mirrors design-system `StatusPill` (semantic colors per work status)
// -----------------------------------------------------------------------------

/** Uppercase labels for the pill; `textTransform: 'none'` on the Text avoids double-uppercase on Android. */
const PILL_LABEL: Record<JobDetailWorkStatus, string> = {
  paid: 'PAID',
  notStarted: 'NOT STARTED',
  inProgress: 'IN PROGRESS',
  completed: 'COMPLETED',
  onHold: 'ON HOLD',
  cancelled: 'CANCELLED',
};

/** Maps mock `workStatus` to DS semantic token triples (fill, stroke, label). */
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

/** Rounded bordered pill next to the job title; uses label caps font but not uppercase transform (labels are already uppercase). */
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
// Primary CTA — next action depends on `workStatus` (fill, label, contrast)
// -----------------------------------------------------------------------------

type JobCtaConfig = {
  label: string;
  backgroundColor: string;
  labelColor: string;
  shadowColor: string;
  shadowOpacity: number;
  borderWidth?: number;
  borderColor?: string;
};

/** Suggested next step for the job: colors from DS tokens; white “unpaid” uses border for definition. */
function jobCtaConfig(status: JobDetailWorkStatus): JobCtaConfig {
  const surfaceWhite = color('Foundation/Surface/White');
  const textPrimary = color('Foundation/Text/Primary');
  const canvas = color('Foundation/Background/Default');

  switch (status) {
    case 'notStarted':
    case 'onHold': {
      const bg = color('Semantic/Status/Info/Text');
      return {
        label: 'MARK IN PROGRESS',
        backgroundColor: bg,
        labelColor: surfaceWhite,
        shadowColor: bg,
        shadowOpacity: 0.35,
      };
    }
    case 'inProgress': {
      const bg = color('Semantic/Activity/Note');
      return {
        label: 'MARK COMPLETED',
        backgroundColor: bg,
        labelColor: surfaceWhite,
        shadowColor: bg,
        shadowOpacity: 0.35,
      };
    }
    case 'completed': {
      const bg = color('Semantic/Status/Success/Text');
      return {
        label: 'MARK PAID',
        backgroundColor: bg,
        labelColor: surfaceWhite,
        shadowColor: bg,
        shadowOpacity: 0.35,
      };
    }
    case 'paid':
      return {
        label: 'MARK UNPAID',
        backgroundColor: surfaceWhite,
        labelColor: textPrimary,
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        borderWidth: 1,
        borderColor: color('Foundation/Border/Subtle'),
      };
    case 'cancelled':
      return {
        label: 'REOPEN JOB',
        backgroundColor: textPrimary,
        labelColor: canvas,
        shadowColor: textPrimary,
        shadowOpacity: 0.35,
      };
  }
}

// -----------------------------------------------------------------------------
// Screen — composition follows Figma `1836:1875` (Job Detail)
// -----------------------------------------------------------------------------

/** Vertical gap between stacked blocks inside the padded main column (`1836:1874`). */
const SLOT_GAP = space('Spacing/20');

/** Pull scroll content slightly closer to the status bar (pt). */
const TOP_INSET_TRIM_PX = 6;

export function JobDetailScreen() {
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

  // TODO: replace with `useJobDetail(jobId)` (Supabase / API).
  const job = mockJobDetail;

  const onClose = useCallback(() => {}, []);
  const onEdit = useCallback(() => {}, []);

  /** Must run before any early return — Rules of Hooks. */
  const cta = useMemo(() => jobCtaConfig(job.workStatus), [job.workStatus]);
  const ctaShadow: ViewStyle = useMemo(
    () => ({
      shadowColor: cta.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: cta.shadowOpacity,
      shadowRadius: 2,
      elevation: cta.borderWidth ? 2 : 3,
    }),
    [cta.shadowColor, cta.shadowOpacity, cta.borderWidth],
  );

  /** Spinner state: same canvas background as main screen so the transition does not flash a flat color. */
  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <CanvasTiledBackground />
        <ActivityIndicator accessibilityLabel="Loading fonts" />
      </View>
    );
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
          paddingTop: Math.max(0, insets.top - TOP_INSET_TRIM_PX),
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
              <JobDetailIconTopClose color={fg.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit job"
              onPress={onEdit}
              style={({ pressed }) => [styles.editPill, pressed && styles.pressed]}
            >
              <JobDetailIconTopEdit color={color('Semantic/Status/Error/Text')} />
              <Text style={styles.addPillText}>EDIT</Text>
            </Pressable>
          </View>
        </View>

        {/* Main column: horizontal padding + vertical gap; width caps at DS max (see `styles.slot`). */}
        <View style={styles.slot}>
          {/* Title row + status pill + category chip — no white card surface (Figma “header without card”). */}
          <View style={styles.jobCardShell}>
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

          {/* Bordered white card: revenue / materials / optional fees / net — Figma `258:1549` (no section heading). */}
          <View style={[styles.jobSummaryCard, { maxWidth: CONTENT_MAX_WIDTH }]}>
            <JobSummaryRows earnings={job.earnings} typography={typography} />
          </View>

          {/* Primary action (full width) + overflow menu — Figma FieldBook CTA row. */}
          <View style={styles.ctaRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cta.label}
              onPress={() => {}}
              style={({ pressed }) => [
                styles.ctaPrimary,
                {
                  backgroundColor: cta.backgroundColor,
                  opacity: pressed ? 0.92 : 1,
                  borderWidth: cta.borderWidth ?? 0,
                  borderColor: cta.borderColor ?? 'transparent',
                },
                ctaShadow,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[typography.bodyBold, styles.ctaPrimaryLabel, { color: cta.labelColor }]}
              >
                {cta.label}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {}}
              style={({ pressed }) => [
                styles.ctaMore,
                pressed && styles.pressed,
              ]}
            >
              <JobDetailIconCtaMore color={fg.primary} />
            </Pressable>
          </View>

          {/* Three-column stats: time, net/hr, session count — tertiary metric card variant. */}
          <MetricCardJob metrics={job.metrics} typography={typography} />
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

// --- Job summary (matches `JobSummaryCard` rows + total) ---

/** Breakdown rows + bordered total — matches `JobSummaryCard` (`258:1549`). */
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
  const showFees = earnings.feesCents !== 0;
  const netPositive = earnings.netEarningsCents >= 0;
  const netTone = netPositive ? color('Semantic/Status/Success/Text') : color('Brand/Primary');
  const totalRuleColor = netPositive ? border.default : border.subtle;

  return (
    <View style={{ gap: space('Spacing/4'), width: '100%' }}>
      <View style={styles.summaryRow}>
        <Text style={[typography.bodyBold, { color: fg.secondary, flex: 1 }]}>Revenue</Text>
        <View style={styles.summaryValue}>
          <Text style={[typography.bodyBold, { color: fg.primary }]}>{rev.prefix}</Text>
          <Text style={[typography.bodyBold, { color: fg.primary, minWidth: 72, textAlign: 'right' }]}>
            {rev.amount}
          </Text>
        </View>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[typography.bodyBold, { color: fg.secondary, flex: 1 }]}>Materials</Text>
        <View style={styles.summaryValue}>
          <Text style={[typography.bodyBold, { color: color('Brand/Primary') }]}>{mat.prefix}</Text>
          <Text style={[typography.bodyBold, { color: color('Brand/Primary'), minWidth: 72, textAlign: 'right' }]}>
            {mat.amount}
          </Text>
        </View>
      </View>
      {showFees ? (
        <View style={styles.summaryRow}>
          <Text style={[typography.bodyBold, { color: fg.secondary, flex: 1 }]}>Fees</Text>
          <View style={styles.summaryValue}>
            <Text style={[typography.bodyBold, { color: color('Brand/Primary') }]}>{fees.prefix}</Text>
            <Text style={[typography.bodyBold, { color: color('Brand/Primary'), minWidth: 48, textAlign: 'right' }]}>
              {fees.amount}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={[styles.summaryTotal, { borderTopColor: totalRuleColor }]}>
        <Text style={[typography.metric, { flex: 1 }]}>Net Earnings</Text>
        <View style={styles.summaryValue}>
          <Text style={[typography.metric, { color: netTone }]}>{net.prefix}</Text>
          <Text style={[typography.metric, { color: netTone, minWidth: 88, textAlign: 'right' }]}>
            {net.amount}
          </Text>
        </View>
      </View>
    </View>
  );
}

// --- Metric card tertiary ---

/** White bordered rounded card with three equal columns; middle column shows $ + net/hr in success color. */
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
          <Text
            style={[typography.metric, styles.metricValueCentered, { textTransform: 'none' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {metrics.timeLabel}
          </Text>
        </View>
        <View style={styles.metricColEqual}>
          <View style={styles.metricLabelPad}>
            <Text style={labelStyle}>NET/HR</Text>
          </View>
          <View style={styles.netHrValue}>
            <Text
              style={[typography.metric, { color: success, textAlign: 'center' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {`$ ${metrics.netPerHrDisplay}`}
            </Text>
          </View>
        </View>
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

/** Leading icon + Metric-S title; optional trailing ADD pill (hidden for e.g. Timeline when `showAdd` is false). */
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
          <JobDetailIconSectionAdd color={color('Semantic/Status/Error/Text')} />
          <Text style={styles.addPillText}>ADD</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// --- View materials (multi-session) ---

/** Session bucket header: `MAR 25, 2026 SESSION` — same caps treatment as unassigned (via `labelCaps`). */
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
                <Text style={[typography.labelCaps, { color: fg.secondary }]}>Unassigned</Text>
              ) : (
                <Text style={[typography.labelCaps, { color: fg.secondary }]}>
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
                <Text style={[typography.labelCaps, { color: fg.secondary }]}>Unassigned</Text>
              ) : (
                <Text style={[typography.labelCaps, { color: fg.secondary }]}>
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
                <View style={{ marginTop: 2 }}>
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

  /** Padded column for the “hero” block: job header, summary, CTAs, metric card — width responsive, max DS width. */
  slot: {
    width: '100%',
    maxWidth: TOP_HEADER_MAX_WIDTH,
    paddingHorizontal: space('Spacing/20'),
    gap: SLOT_GAP,
    alignItems: 'center',
  },

  /** Shadow-only “card” around title area (no fill — content sits on the lined canvas). */
  jobCardShell: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
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
  /** Dark pill behind category — label uses canvas-colored text for contrast. */
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: color('Foundation/Text/Primary'),
    paddingHorizontal: space('Spacing/8'),
    paddingVertical: space('Spacing/4'),
    borderRadius: 6,
  },

  /** White elevated card — padding only; row stack uses `Spacing/4` (`258:1549`). */
  jobSummaryCard: {
    width: '100%',
    backgroundColor: bg.surface,
    borderRadius: radius('Radius/16'),
    borderWidth: 1,
    borderColor: border.subtle,
    padding: space('Spacing/24'),
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
  /** Net earnings row — `borderTopColor` set per net sign (Default vs Subtle in Figma). */
  summaryTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space('Spacing/8'),
    marginTop: space('Spacing/8'),
    borderTopWidth: 1,
  },

  /** Primary + ⋮ row (`1836:2011`): both **51px**; primary uses `Spacing/16` horizontal inset so labels don’t wrap (full-width DS buttons use `px` 100). */
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    width: '100%',
    maxWidth: 343,
  },
  ctaPrimary: {
    flex: 1,
    minWidth: 0,
    height: 51,
    borderRadius: radius('Radius/12'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space('Spacing/16'),
  },
  ctaPrimaryLabel: {
    textTransform: 'uppercase',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 14,
    includeFontPadding: false,
  },
  ctaMore: {
    flexShrink: 0,
    height: 51,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: border.subtle,
    backgroundColor: bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /** Rounded metric “pill” card — slightly tighter horizontal inset than DS default so columns feel balanced. */
  metricCard: {
    width: '100%',
    backgroundColor: bg.surface,
    borderRadius: radius('Radius/24'),
    borderWidth: 1,
    borderColor: border.subtle,
    paddingHorizontal: space('Spacing/4'),
    paddingVertical: space('Spacing/12'),
    ...cardShadowRn,
  },
  metricTertiaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    width: '100%',
  },
  /** Tertiary-only: three equal columns; mirrors `MetricCard.tsx` `MetricTripleCell` (no vertical column rules). */
  metricColEqual: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
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
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /** Full-bleed section title + optional ADD; extra top padding separates from previous block. */
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
    fontFamily: 'UbuntuSansMono_600SemiBold',
    fontSize: 10,
    color: color('Semantic/Status/Error/Text'),
  },

  /** Session list row — white card, optional bottom margin between multiple sessions. */
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
    ...cardShadowRn,
  },
  /** Bucket title strip — same cream as page canvas so it reads as “inside” the card. */
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

  /** Timeline activity row — icon well + two-line text stack. */
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

  /** Pinned below scroll: top hairline + solid canvas so tab strip does not show scroll bleed. */
  bottomNav: {
    width: '100%',
    alignSelf: 'center',
    flexShrink: 0,
    marginTop: space('Spacing/8'),
    borderTopWidth: 1,
    borderTopColor: border.subtle,
    backgroundColor: bg.canvas,
  },
  /** Three equal tabs; min height matches Figma tab strip. */
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
  /** Centers Figma SVG icons (`gap-[2px]` to label is on `bottomNavTabContent`). Max height aligns tabs. */
  bottomNavIconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },

  /** `StatusPillRn` container — pill shape via large radius + horizontal padding. */
  pillOuter: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: space('Spacing/12'),
    paddingVertical: space('Spacing/4'),
  },
});
