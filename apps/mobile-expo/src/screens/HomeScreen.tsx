import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
import {
  createBlankJobForLiveSessionStart,
  createMaterial,
  createNote,
  deleteJobById,
  fetchJobDetail,
  fetchFirstJobIdForCurrentUser,
  getWeeklyNetEarningsCentsForCurrentUser,
  listJobsForCurrentUserPage,
  listRecentDetailedJobsForCurrentUser,
  listRecentJobsForCurrentUser,
  tryBumpJobToInProgressIfNotStarted,
  type ListJobsForCurrentUserItem,
  type RecentJobItem,
} from '@fieldsolo/api-client';
import { color, radius } from '@fieldsolo/design-system/lib/tokens';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CanvasTiledBackground } from '../components/CanvasTiledBackground';
import { ScrollFriendlyPressable } from '../components/ScrollFriendlyPressable';
import {
  dynamicTypeLineMinHeight,
  dynamicTypeTextStyle,
} from '../theme/dynamicTypeText';
import {
  ChooseJobBottomSheet,
  ChooseSessionBottomSheet,
  DropdownBottomSheet,
  EditMaterialBottomSheet,
  EditNoteBottomSheet,
  JOBS_OPEN_SECTION_KINDS,
  JobCard,
  JobsOpenSummaryCard,
  MetricSnapshotCard,
  QuickActionsBottomSheet,
  SectionHeader,
  type JobsOpenSectionKind,
  type ChooseJobBottomSheetJob,
  type ChooseSessionBottomSheetSession,
  type DropdownBottomSheetOption,
  type EditMaterialBottomSheetValues,
  type EditNoteBottomSheetValues,
  type QuickActionsRecentJob,
  type QuickActionsStep,
  type QuickCaptureKind,
} from '../components/ds';
import { HomeJumpBackInIcon, HomeNeedsAttentionIcon } from '../components/figma-icons/HomeSectionIcons';
import { JobsFabPlusIcon } from '../components/figma-icons/JobsScreenIcons';
import { TopHeaderProfileIcon } from '../components/figma-icons/TopHeaderIcons';
import { useJobsListInvalidation } from '../context/JobsListInvalidationContext';
import { useHasLiveSession, useLiveSession } from '../context/LiveSessionContext';
import {
  analytics,
  errorProperties,
  moneyBucket,
  quantityBucket,
  textLengthBucket,
} from '../lib/analytics';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { bucketOpenTabJobs } from '../lib/openJobsBuckets';
import {
  FAB_SIZE,
  bg,
  cardShadowRn,
  createTextStyles,
  fg,
  scrollBottomInsetForFab,
  space,
} from '../theme/nativeTokens';
import { useContentColumn } from '../theme/useContentColumn';
import { screenHeaderA11y } from '../lib/accessibility';

const OPEN_TAB_PAGE_SIZE = 100;
const CAPTURE_JOBS_PAGE_SIZE = 100;

function formatWeeklyUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export type HomeScreenProps = {
  onCreateFirstJob?: () => Promise<string>;
  onOpenProfile: () => void;
  onOpenJobDetail: (jobId?: string, options?: { initialEditOpen?: boolean }) => void;
  /** Navigate to the Earnings tab (Past Week) — fired by the weekly snapshot card. */
  onOpenEarnings: () => void;
  /** Navigate to Jobs → Open and scroll to the matching stack section. */
  onOpenJobsOpenTab: (section: JobsOpenSectionKind) => void;
};

function formatLiveSessionJobTitle(now: Date): string {
  const monthDay = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(now);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);
  return `Live Session ${monthDay} at ${time}`;
}

/** Capture is either headed to the Inbox (no parent) or attached to a job. */
type CaptureMode = 'inbox' | 'job';

/** Active sub-sheet in the quick-capture flow (swapped within the same modal). */
type CaptureStep =
  | 'idle'
  | 'noteEdit'
  | 'materialEdit'
  | 'chooseJob'
  | 'noteSession'
  | 'materialSession'
  | 'materialUnit';

type CaptureJob = {
  id: string;
  shortDescription: string;
  customerName: string | null;
};

async function listAllJobsForCapture(): Promise<ChooseJobBottomSheetJob[]> {
  const jobs: ChooseJobBottomSheetJob[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await listJobsForCurrentUserPage(supabase, {
      limit: CAPTURE_JOBS_PAGE_SIZE,
      offset,
      tab: 'all',
    });
    jobs.push(
      ...page.items.map((j) => ({
        id: j.id,
        shortDescription: j.shortDescription,
        customerName: j.customerName,
      })),
    );
    hasMore = page.hasMore && page.items.length > 0;
    offset += page.items.length;
  }

  return jobs;
}

const CAPTURE_UNIT_OPTIONS: DropdownBottomSheetOption[] = (
  ['ea', 'ft', 'pcs', 'kit', 'lb', 'gal', 'lot'] as const
).map((u) => ({ id: u, label: u, value: u }));

function formatCaptureError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    typeof (e as { message: unknown }).message === 'string'
  ) {
    return (e as { message: string }).message;
  }
  return String(e);
}

export function HomeScreen({
  onCreateFirstJob = async () => { throw new Error('Could not create your first job.'); },
  onOpenProfile,
  onOpenJobDetail,
  onOpenEarnings,
  onOpenJobsOpenTab,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { columnStyle, fabRight } = useContentColumn();
  const { fontScale } = useWindowDimensions();
  const brandTitle = fontScale > 1.6 ? 'FIELD\nSOLO' : 'FIELDSOLO';
  const scrollY = useMemo(() => new Animated.Value(0), []);
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const hasLiveSession = useHasLiveSession();
  const { startLiveSession, refresh: refreshLiveSession } = useLiveSession();
  const { invalidateJobsList, version } = useJobsListInvalidation();

  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [recentJobs, setRecentJobs] = useState<RecentJobItem[]>([]);
  const [recentJobsLoading, setRecentJobsLoading] = useState(false);
  const [recentJobsError, setRecentJobsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // ---- Quick capture (note / material) -------------------------------------
  // The QuickActions step is controlled here so a capture sub-sheet's Back
  // returns to the matching chooser instead of resetting to the tiles.
  const [qaStep, setQaStep] = useState<QuickActionsStep>('quickCapture');
  const [captureStep, setCaptureStep] = useState<CaptureStep>('idle');
  const [captureKind, setCaptureKind] = useState<QuickCaptureKind>('note');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('inbox');
  const [captureJob, setCaptureJob] = useState<CaptureJob | null>(null);
  const [captureSessions, setCaptureSessions] = useState<ChooseSessionBottomSheetSession[]>([]);
  const [captureSaving, setCaptureSaving] = useState(false);
  const [draftBody, setDraftBody] = useState('');
  const [draftSessionId, setDraftSessionId] = useState<string | null>(null);
  const [matDraftDescription, setMatDraftDescription] = useState('');
  const [matDraftUnitCostCents, setMatDraftUnitCostCents] = useState(0);
  const [matDraftQuantity, setMatDraftQuantity] = useState(1);
  const [matDraftUnit, setMatDraftUnit] = useState('ea');
  const [chooseJobList, setChooseJobList] = useState<ChooseJobBottomSheetJob[]>([]);
  const [chooseJobLoading, setChooseJobLoading] = useState(false);
  const [chooseJobError, setChooseJobError] = useState<string | null>(null);

  const [homeLoading, setHomeLoading] = useState(true);
  const hasLoadedHomeRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);
  const [weeklyNetCents, setWeeklyNetCents] = useState(0);
  const [hasAnyJobs, setHasAnyJobs] = useState<boolean | null>(null);
  const [creatingFirstJob, setCreatingFirstJob] = useState(false);
  const [firstJobError, setFirstJobError] = useState<string | null>(null);
  const [openTabJobsPage, setOpenTabJobsPage] = useState<ListJobsForCurrentUserItem[]>([]);
  const [recentJobsDetail, setRecentJobsDetail] = useState<ListJobsForCurrentUserItem[]>([]);
  /** Lined canvas height — same pattern as JobDetail (`CanvasTiledBackground` + `onContentSizeChange`). */
  const [scrollContentHeight, setScrollContentHeight] = useState(0);

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

  const brandDisplay = typography.displayH1;
  const brandTitleStyle = dynamicTypeTextStyle(brandDisplay, fontScale, {
    letterSpacingUntilScale: 99,
    padRatio: 0.08,
  });
  const brandLineCount = brandTitle.includes('\n') ? 2 : 1;
  const brandMinHeight = dynamicTypeLineMinHeight(
    brandDisplay?.fontSize ?? 32,
    fontScale,
    1.4 * brandLineCount,
  );

  const openTabJobBuckets = useMemo(
    () => bucketOpenTabJobs(openTabJobsPage),
    [openTabJobsPage],
  );

  const needsAttentionSummaries = useMemo(
    () =>
      JOBS_OPEN_SECTION_KINDS.filter((kind) => openTabJobBuckets[kind].length > 0).map((kind) => ({
        kind,
        count: openTabJobBuckets[kind].length,
      })),
    [openTabJobBuckets],
  );

  const runHomeFetch = useCallback(async (isCancelled: () => boolean) => {
    const startedAt = Date.now();
    if (!isSupabaseConfigured()) {
      if (!isCancelled()) {
        setHomeError('Supabase is not configured.');
        setWeeklyNetCents(0);
        setOpenTabJobsPage([]);
        setRecentJobsDetail([]);
        analytics.capture('supabase_not_configured_seen', {
          screen: 'home',
          operation: 'home_loaded',
        });
      }
      return;
    }
    if (!isCancelled()) setHomeError(null);
    try {
      const [weekly, openPage, recent, firstJobId] = await Promise.all([
        getWeeklyNetEarningsCentsForCurrentUser(supabase),
        listJobsForCurrentUserPage(supabase, {
          limit: OPEN_TAB_PAGE_SIZE,
          offset: 0,
          tab: 'open',
        }),
        listRecentDetailedJobsForCurrentUser(supabase, { limit: 3 }),
        fetchFirstJobIdForCurrentUser(supabase),
      ]);
      if (!isCancelled()) {
        setWeeklyNetCents(weekly.netEarningsCents);
        setOpenTabJobsPage(openPage.items);
        setRecentJobsDetail(recent);
        setHasAnyJobs(firstJobId != null);
        const buckets = bucketOpenTabJobs(openPage.items);
        analytics.capture('home_loaded', {
          weekly_net_bucket: moneyBucket(weekly.netEarningsCents),
          weekly_earnings_available: true,
          jump_back_in_count: recent.length,
          needs_attention_count: buckets.incomplete.length + buckets.inProgress.length + buckets.unpaid.length,
          open_incomplete_count: buckets.incomplete.length,
          open_in_progress_count: buckets.inProgress.length,
          open_unpaid_count: buckets.unpaid.length,
          load_duration_ms: Date.now() - startedAt,
        });
      }
    } catch (err) {
      if (!isCancelled()) {
        setHomeError(err instanceof Error ? err.message : 'Failed to load home.');
        setWeeklyNetCents(0);
        setOpenTabJobsPage([]);
        setRecentJobsDetail([]);
        setHasAnyJobs(null);
        analytics.capture('home_load_failed', {
          failing_module: 'home',
          load_duration_ms: Date.now() - startedAt,
          ...errorProperties(err),
        });
      }
    }
  }, []);

  useEffect(() => {
    let alive = true;
    if (!hasLoadedHomeRef.current) {
      setHomeLoading(true);
    }
    void (async () => {
      await runHomeFetch(() => !alive);
      if (alive) {
        setHomeLoading(false);
        hasLoadedHomeRef.current = true;
      }
    })();
    return () => {
      alive = false;
    };
  }, [version, runHomeFetch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await runHomeFetch(() => false);
    } finally {
      setRefreshing(false);
    }
  }, [runHomeFetch]);

  useEffect(() => {
    if (!quickActionsVisible) return;
    setActionError(null);
    let cancelled = false;
    setRecentJobsLoading(true);
    setRecentJobsError(null);
    void (async () => {
      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setRecentJobsError('Supabase is not configured.');
          setRecentJobsLoading(false);
        }
        return;
      }
      try {
        const items = await listRecentJobsForCurrentUser(supabase, { limit: 3 });
        if (!cancelled) {
          setRecentJobs(items);
          analytics.capture('home_quick_actions_opened', {
            recent_job_count: items.length,
            has_live_session: hasLiveSession,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setRecentJobsError(err instanceof Error ? err.message : 'Could not load jobs.');
        }
      } finally {
        if (!cancelled) {
          setRecentJobsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quickActionsVisible]);

  const onSelectExistingJob = useCallback(
    async (job: RecentJobItem) => {
      if (!isSupabaseConfigured()) {
        setActionError('Supabase is not configured.');
        return;
      }
      setActionError(null);
      setStarting(true);
      analytics.capture('session_start_requested', {
        source: 'quick_actions',
        job_id: job.id,
        placeholder_job: false,
      });
      analytics.capture('home_quick_action_selected', {
        action: 'start_session_existing_job',
        recent_job_count: recentJobs.length,
      });
      try {
        const created = await startLiveSession({
          jobId: job.id,
          jobShortDescription: job.shortDescription,
        });
        await tryBumpJobToInProgressIfNotStarted(supabase, job.id);
        analytics.capture('live_session_started', {
          source: 'quick_actions',
          session_id: created.id,
          job_id: job.id,
          placeholder_job: false,
        });
        setQuickActionsVisible(false);
        invalidateJobsList();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[HomeScreen] startLiveSession (existing job)', err);
        void refreshLiveSession();
        analytics.capture('live_session_start_failed', {
          source: 'quick_actions',
          job_id: job.id,
          placeholder_job: false,
          recovery_result: 'refresh_requested',
          ...errorProperties(err),
        });
        setActionError(err instanceof Error ? err.message : 'Could not start session.');
      } finally {
        setStarting(false);
      }
    },
    [invalidateJobsList, recentJobs.length, refreshLiveSession, startLiveSession],
  );

  const onStartNewSession = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setActionError('Supabase is not configured.');
      return;
    }
    const shortDescription = formatLiveSessionJobTitle(new Date());
    let createdJobId: string | null = null;
    setActionError(null);
    setStarting(true);
    analytics.capture('session_start_requested', {
      source: 'quick_actions',
      placeholder_job: true,
    });
    analytics.capture('home_quick_action_selected', {
      action: 'start_session_new_job',
      recent_job_count: recentJobs.length,
    });
    try {
      createdJobId = await createBlankJobForLiveSessionStart(supabase, { shortDescription });
      const created = await startLiveSession({ jobId: createdJobId, jobShortDescription: shortDescription });
      await tryBumpJobToInProgressIfNotStarted(supabase, createdJobId);
      analytics.capture('job_created', {
        source: 'home_quick_session',
        job_id: createdJobId,
        placeholder: true,
      });
      analytics.capture('live_session_started', {
        source: 'quick_actions',
        session_id: created.id,
        job_id: createdJobId,
        placeholder_job: true,
      });
      setQuickActionsVisible(false);
      invalidateJobsList();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[HomeScreen] startLiveSession (new job)', err);
      let recoveredJobId: string | null = null;
      try {
        const recovered = await refreshLiveSession();
        recoveredJobId = recovered?.jobId ?? null;
      } catch {
        // Refresh is best-effort recovery; cleanup below still protects the quick job.
      }
      if (createdJobId && recoveredJobId === createdJobId) {
        analytics.capture('live_session_start_failed', {
          source: 'quick_actions',
          job_id: createdJobId,
          placeholder_job: true,
          recovery_result: 'recovered_created_job_session',
          ...errorProperties(err),
        });
        setQuickActionsVisible(false);
        invalidateJobsList();
        return;
      }
      if (createdJobId) {
        try {
          await deleteJobById(supabase, createdJobId);
          invalidateJobsList();
        } catch (cleanupErr) {
          // eslint-disable-next-line no-console
          console.error('[HomeScreen] cleanup orphaned quick-session job failed', cleanupErr);
        }
      }
      analytics.capture('live_session_start_failed', {
        source: 'quick_actions',
        job_id: createdJobId,
        placeholder_job: true,
        recovery_result: createdJobId ? 'placeholder_job_deleted' : 'no_job_created',
        ...errorProperties(err),
      });
      setActionError(err instanceof Error ? err.message : 'Could not start session.');
    } finally {
      setStarting(false);
    }
  }, [invalidateJobsList, recentJobs.length, refreshLiveSession, startLiveSession]);

  const resetCapture = useCallback(() => {
    setCaptureStep('idle');
    setCaptureMode('inbox');
    setCaptureJob(null);
    setCaptureSessions([]);
    setDraftBody('');
    setDraftSessionId(null);
    setMatDraftDescription('');
    setMatDraftUnitCostCents(0);
    setMatDraftQuantity(1);
    setMatDraftUnit('ea');
    setCaptureSaving(false);
    setChooseJobList([]);
    setChooseJobError(null);
  }, []);

  const closeQuickActions = useCallback(() => {
    setQuickActionsVisible(false);
    resetCapture();
  }, [resetCapture]);

  const openQuickActions = useCallback(() => {
    resetCapture();
    setQaStep('quickCapture');
    setActionError(null);
    setQuickActionsVisible(true);
  }, [resetCapture]);

  /** Load a job's sessions so the job-scoped capture can offer the +SESSION pill. */
  const loadCaptureJobSessions = useCallback(async (jobId: string) => {
    if (!isSupabaseConfigured()) {
      setCaptureSessions([]);
      return;
    }
    try {
      const detail = await fetchJobDetail(supabase, jobId);
      const sessions = (detail?.allSessions ?? []).map((s) => ({
        id: s.id,
        dateLabel: s.dateLabel,
        timeRangeLabel: s.timeRangeLabel,
      }));
      setCaptureSessions(sessions);
    } catch {
      // Best-effort: without sessions the +SESSION pill simply stays hidden.
      setCaptureSessions([]);
    }
  }, []);

  const beginInboxCapture = useCallback((kind: QuickCaptureKind) => {
    analytics.capture('home_quick_action_selected', {
      action: kind === 'note' ? 'new_note' : 'new_material',
      recent_job_count: recentJobs.length,
    });
    analytics.capture(kind === 'note' ? 'note_create_opened' : 'material_create_opened', {
      source: 'quick_actions',
      parent: 'inbox',
    });
    setCaptureKind(kind);
    setCaptureMode('inbox');
    setCaptureJob(null);
    setCaptureSessions([]);
    setDraftSessionId(null);
    if (kind === 'note') {
      setDraftBody('');
      setCaptureStep('noteEdit');
    } else {
      setMatDraftDescription('');
      setMatDraftUnitCostCents(0);
      setMatDraftQuantity(1);
      setMatDraftUnit('ea');
      setCaptureStep('materialEdit');
    }
  }, [recentJobs.length]);

  const beginJobCapture = useCallback(
    (job: QuickActionsRecentJob, kind: QuickCaptureKind) => {
      setCaptureKind(kind);
      setCaptureMode('job');
      setCaptureJob({
        id: job.id,
        shortDescription: job.shortDescription,
        customerName: job.customerName,
      });
      setCaptureSessions([]);
      setDraftSessionId(null);
      void loadCaptureJobSessions(job.id);
      analytics.capture('home_quick_action_selected', {
        action: kind === 'note' ? 'new_note_existing_job' : 'new_material_existing_job',
        recent_job_count: recentJobs.length,
      });
      analytics.capture(kind === 'note' ? 'note_create_opened' : 'material_create_opened', {
        source: 'quick_actions',
        parent: 'job',
        job_id: job.id,
      });
      if (kind === 'note') {
        setDraftBody('');
        setCaptureStep('noteEdit');
      } else {
        setMatDraftDescription('');
        setMatDraftUnitCostCents(0);
        setMatDraftQuantity(1);
        setMatDraftUnit('ea');
        setCaptureStep('materialEdit');
      }
    },
    [loadCaptureJobSessions, recentJobs.length],
  );

  /** Inbox capture → "+JOB" pill: open the full job chooser. */
  const openChooseJob = useCallback(() => {
    setCaptureStep('chooseJob');
    setChooseJobError(null);
    setChooseJobLoading(true);
    void (async () => {
      if (!isSupabaseConfigured()) {
        setChooseJobError('Supabase is not configured.');
        setChooseJobLoading(false);
        return;
      }
      try {
        setChooseJobList(await listAllJobsForCapture());
      } catch (err) {
        setChooseJobError(formatCaptureError(err) || 'Could not load jobs.');
      } finally {
        setChooseJobLoading(false);
      }
    })();
  }, []);

  /** Picking a job in the chooser converts the Inbox draft into a job capture. */
  const onChooseJobSelect = useCallback(
    (jobId: string) => {
      const job = chooseJobList.find((j) => j.id === jobId) ?? null;
      setCaptureMode('job');
      setCaptureJob(job);
      setDraftSessionId(null);
      setCaptureSessions([]);
      if (job) void loadCaptureJobSessions(job.id);
      setCaptureStep(captureKind === 'note' ? 'noteEdit' : 'materialEdit');
    },
    [captureKind, chooseJobList, loadCaptureJobSessions],
  );

  const returnToCaptureEdit = useCallback(() => {
    setCaptureStep(captureKind === 'note' ? 'noteEdit' : 'materialEdit');
  }, [captureKind]);

  const draftAssignedSession = useMemo(() => {
    if (!draftSessionId) return null;
    const s = captureSessions.find((x) => x.id === draftSessionId);
    return s ? { id: s.id, dateLabel: s.dateLabel, timeRangeLabel: s.timeRangeLabel } : null;
  }, [captureSessions, draftSessionId]);

  const saveCaptureNote = useCallback(
    async ({ body }: EditNoteBottomSheetValues) => {
      if (captureSaving) return;
      if (!isSupabaseConfigured()) {
        Alert.alert('Save failed', 'Supabase is not configured.');
        return;
      }
      setCaptureSaving(true);
      try {
        const noteId = await createNote(supabase, {
          jobId: captureMode === 'job' && captureJob ? captureJob.id : null,
          sessionId: captureMode === 'job' ? draftSessionId : null,
          body,
        });
        analytics.capture('note_created', {
          source: 'quick_actions',
          note_id: noteId,
          parent_type: captureMode === 'job' ? (draftSessionId ? 'session' : 'job') : 'inbox',
          job_id: captureMode === 'job' && captureJob ? captureJob.id : null,
          session_id: captureMode === 'job' ? draftSessionId : null,
          text_length_bucket: textLengthBucket(body),
        });
        closeQuickActions();
        invalidateJobsList();
      } catch (e) {
        analytics.capture('note_create_failed', {
          source: 'quick_actions',
          parent_type: captureMode === 'job' ? (draftSessionId ? 'session' : 'job') : 'inbox',
          ...errorProperties(e),
        });
        Alert.alert('Save failed', formatCaptureError(e) || 'Could not save note.');
      } finally {
        setCaptureSaving(false);
      }
    },
    [captureJob, captureMode, captureSaving, closeQuickActions, draftSessionId, invalidateJobsList],
  );

  const saveCaptureMaterial = useCallback(
    async (values: EditMaterialBottomSheetValues) => {
      if (captureSaving) return;
      if (!isSupabaseConfigured()) {
        Alert.alert('Save failed', 'Supabase is not configured.');
        return;
      }
      setCaptureSaving(true);
      try {
        const materialId = await createMaterial(supabase, {
          jobId: captureMode === 'job' && captureJob ? captureJob.id : null,
          sessionId: captureMode === 'job' ? draftSessionId : null,
          description: values.description,
          quantity: values.quantity,
          unit: values.unit,
          unitCostCents: values.unitCostCents,
        });
        analytics.capture('material_created', {
          source: 'quick_actions',
          material_id: materialId,
          parent_type: captureMode === 'job' ? (draftSessionId ? 'session' : 'job') : 'inbox',
          job_id: captureMode === 'job' && captureJob ? captureJob.id : null,
          session_id: captureMode === 'job' ? draftSessionId : null,
          unit: values.unit,
          quantity_bucket: quantityBucket(values.quantity),
          cost_bucket: moneyBucket(values.unitCostCents),
          text_length_bucket: textLengthBucket(values.description),
        });
        closeQuickActions();
        invalidateJobsList();
      } catch (e) {
        analytics.capture('material_create_failed', {
          source: 'quick_actions',
          parent_type: captureMode === 'job' ? (draftSessionId ? 'session' : 'job') : 'inbox',
          ...errorProperties(e),
        });
        Alert.alert('Save failed', formatCaptureError(e) || 'Could not save material.');
      } finally {
        setCaptureSaving(false);
      }
    },
    [captureJob, captureMode, captureSaving, closeQuickActions, draftSessionId, invalidateJobsList],
  );

  const headerTopPad = Math.max(insets.top - space('Spacing/12'), 0);
  /** Clear FAB from bottom of shell main + small gap. */
  // shellMain sits above ShellBottomNav (sibling) — FAB offset must not subtract nav height
  // (nav grows with Dynamic Type and used to collapse scroll clearance into negatives).
  const fabBottom = fabBottomOffset();
  const scrollBottomPad =
    scrollBottomInsetForFab(fabBottom, FAB_SIZE) +
    (fontScale > 1.6 ? space('Spacing/24') * Math.min(fontScale, 2.25) : 0);

  if (!fontsLoaded) {
    return (
      <View style={styles.root}>
        <CanvasTiledBackground scrollY={scrollY} contentHeight={scrollContentHeight} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CanvasTiledBackground scrollY={scrollY} contentHeight={scrollContentHeight} />
      <View
        pointerEvents="none"
        style={[styles.safeAreaTopAccentWrap, { top: 0 }, columnStyle]}
      >
        <View style={styles.topAccent} />
      </View>
      <Animated.ScrollView
        ref={scrollRef}
        style={[styles.scroll, { paddingTop: headerTopPad }]}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: scrollBottomPad,
          },
        ]}
        onContentSizeChange={(_w, h) => setScrollContentHeight(h)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
          listener: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
            scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          },
        })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color('Brand/Primary')} />
        }
      >
        <View style={columnStyle}>
          <View style={styles.headerBand}>
            <View style={styles.topHeader}>
              <View style={[styles.brandTitle, { minHeight: brandMinHeight }]}>
                <Text
                  {...screenHeaderA11y('FieldSolo')}
                  style={[brandTitleStyle, styles.brandTitleText]}
                >
                  {brandTitle}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Profile"
                onPress={onOpenProfile}
                style={({ pressed }) => [styles.profileHit, pressed && styles.pressed]}
              >
                <TopHeaderProfileIcon color={fg.primary} size={20} />
              </Pressable>
            </View>
          </View>

          <View style={styles.modulesColumn}>
          {homeLoading ? (
            <ActivityIndicator
              color={color('Brand/Primary')}
              style={{ marginTop: space('Spacing/24'), marginBottom: space('Spacing/16') }}
            />
          ) : null}
          {homeError != null && homeError !== '' ? (
            <Text
              style={[typography.bodySmall, styles.homeError, { color: color('Semantic/Status/Error/Text') }]}
            >
              {homeError}
            </Text>
          ) : null}

          {!homeLoading && hasAnyJobs === false ? (
            <View style={styles.firstJobEmptyState}>
              <Image
                accessibilityIgnoresInvertColors
                source={require('../../assets/brand/fieldsolo-solo-notch-light.png')}
                style={styles.firstJobLogo}
              />
              <Text accessibilityRole="header" style={[typography.headingH2, styles.firstJobTitle, { color: fg.primary }]}>
                Looks like you don't have any jobs yet
              </Text>
              <Text style={[typography.bodySmall, styles.firstJobBody, { color: fg.primary }]}>
                FieldSolo is a jobs &amp; earnings tracker for independent tradespeople designed for the field.
              </Text>
              <Text style={[typography.bodySmall, styles.firstJobBody, { color: fg.primary }]}>
                Start with minimal info, and then let FieldSolo guide you to track enough so that you can understand your profitability. Track every job to understand your business and price smarter over time.
              </Text>
              {firstJobError ? (
                <Text style={[typography.bodySmall, styles.firstJobError, { color: color('Semantic/Status/Error/Text') }]}>
                  {firstJobError}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={creatingFirstJob}
                onPress={() => {
                  if (creatingFirstJob) return;
                  setCreatingFirstJob(true);
                  setFirstJobError(null);
                  void onCreateFirstJob()
                    .catch((error) => setFirstJobError(error instanceof Error ? error.message : 'Could not create your first job.'))
                    .finally(() => setCreatingFirstJob(false));
                }}
                style={({ pressed }) => [styles.firstJobButton, (pressed || creatingFirstJob) && styles.pressed]}
              >
                {creatingFirstJob ? (
                  <ActivityIndicator color={bg.canvasWarm} />
                ) : (
                  <Text style={[typography.bodyBold, styles.firstJobButtonText]}>Create my first job</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {!homeLoading && hasAnyJobs !== false ? (
            <>
              <SectionHeader
                title="Weekly Snapshot"
                subtitle="Completed jobs worked in the past 7 days"
                tone="neutral"
                typography={typography}
                contentInset={0}
              />
              <MetricSnapshotCard
                label="NET EARNINGS"
                value={formatWeeklyUsd(weeklyNetCents)}
                helperText={weeklyNetCents === 0 ? 'No earnings from this week. Complete a job to track earnings here.' : undefined}
                valueTone="success"
                typography={typography}
                onPress={onOpenEarnings}
              />
            </>
          ) : null}

          {hasAnyJobs !== false && needsAttentionSummaries.length > 0 ? (
            <>
              <SectionHeader
                title="Needs Attention"
                tone="accent"
                typography={typography}
                leadingIcon={<HomeNeedsAttentionIcon color={color('Brand/Accent')} />}
                contentInset={0}
              />
              <View style={styles.needsAttentionBlock}>
                {needsAttentionSummaries.map(({ kind, count }) => (
                  <View key={kind} style={styles.needsAttentionRowWrap}>
                    <JobsOpenSummaryCard
                      kind={kind}
                      count={count}
                      typography={typography}
                      onPress={() => {
                        analytics.capture('home_needs_attention_summary_pressed', {
                          open_section: kind,
                          job_count: count,
                        });
                        analytics.capture('home_jobs_open_pressed', {
                          source: 'needs_attention',
                          open_section: kind,
                        });
                        onOpenJobsOpenTab(kind);
                      }}
                    />
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {hasAnyJobs !== false && recentJobsDetail.length > 0 ? (
            <>
              <SectionHeader
                title="Jump Back In"
                tone="neutral"
                typography={typography}
                leadingIcon={<HomeJumpBackInIcon color={fg.secondary} />}
                contentInset={0}
              />
              <View style={styles.jumpBackList}>
                {recentJobsDetail.map((job) => (
                  <View key={job.id} style={styles.jumpBackRowWrap}>
                    <JobCard
                      job={job}
                      typography={typography}
                      recencyLabelMode="lastUpdated"
                      onPress={() => {
                        analytics.capture('home_job_card_pressed', {
                          module: 'jump_back_in',
                          job_id: job.id,
                          job_status: job.workStatus,
                        });
                        onOpenJobDetail(job.id);
                      }}
                    />
                  </View>
                ))}
              </View>
            </>
          ) : null}
          </View>
        </View>
      </Animated.ScrollView>

      {hasAnyJobs === false || hasLiveSession || quickActionsVisible ? null : (
        <View style={[styles.fabWrap, { bottom: fabBottom, right: fabRight }]}>
          <ScrollFriendlyPressable
            accessibilityRole="button"
            accessibilityLabel="Quick capture"
            onPress={openQuickActions}
            onScrollDelta={(dy) => {
              const next = Math.max(0, scrollOffsetRef.current - dy);
              scrollOffsetRef.current = next;
              scrollRef.current?.scrollTo({ y: next, animated: false });
            }}
            style={({ pressed }) => [styles.fabCircle, pressed && styles.pressed]}
          >
            <JobsFabPlusIcon color={bg.canvasWarm} size={28} />
          </ScrollFriendlyPressable>
        </View>
      )}

      <Modal
        visible={quickActionsVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent={Platform.OS === 'android'}
        onRequestClose={closeQuickActions}
      >
        <View style={styles.modalHost}>
          <QuickActionsBottomSheet
            typography={typography}
            visible={quickActionsVisible && captureStep === 'idle'}
            step={qaStep}
            onStepChange={setQaStep}
            recentJobs={recentJobs}
            recentJobsLoading={recentJobsLoading}
            recentJobsError={recentJobsError}
            actionError={actionError}
            starting={starting}
            onClose={closeQuickActions}
            onSelectExistingJob={onSelectExistingJob}
            onStartNewSession={onStartNewSession}
            onSelectJobForCapture={beginJobCapture}
            onCreateQuickCapture={beginInboxCapture}
          />

          <EditNoteBottomSheet
            typography={typography}
            visible={captureStep === 'noteEdit'}
            title={captureMode === 'inbox' ? 'New Note' : 'Add Note'}
            primaryLabel={captureMode === 'inbox' ? 'SAVE NOTE TO INBOX' : 'SAVE NEW NOTE'}
            subtitle={captureMode === 'inbox' ? 'Unassigned quick capture note' : undefined}
            values={{ body: draftBody }}
            assignedSession={draftAssignedSession}
            canAttachSession={captureMode === 'job' && captureSessions.length > 0}
            registerInGlobalStack={false}
            onClose={closeQuickActions}
            onBack={() => setCaptureStep('idle')}
            onJobPillPress={
              captureMode === 'inbox'
                ? (values) => {
                    setDraftBody(values.body);
                    openChooseJob();
                  }
                : undefined
            }
            onSessionPillPress={
              captureMode === 'job'
                ? (values) => {
                    setDraftBody(values.body);
                    setCaptureStep('noteSession');
                  }
                : undefined
            }
            onSavePress={(values) => void saveCaptureNote(values)}
            onDeletePress={() => setCaptureStep('idle')}
          />

          <EditMaterialBottomSheet
            typography={typography}
            visible={captureStep === 'materialEdit'}
            title={captureMode === 'inbox' ? 'New Material' : 'Add Material'}
            primaryLabel={captureMode === 'inbox' ? 'SAVE MATERIAL TO INBOX' : 'SAVE NEW MATERIAL'}
            subtitle={captureMode === 'inbox' ? 'Unassigned quick capture material' : undefined}
            values={{
              description: matDraftDescription,
              unitCostCents: matDraftUnitCostCents,
              quantity: matDraftQuantity,
              unit: matDraftUnit,
            }}
            assignedSession={draftAssignedSession}
            canAttachSession={captureMode === 'job' && captureSessions.length > 0}
            registerInGlobalStack={false}
            onClose={closeQuickActions}
            onBack={() => setCaptureStep('idle')}
            onJobPillPress={
              captureMode === 'inbox'
                ? (values) => {
                    setMatDraftDescription(values.description);
                    setMatDraftUnitCostCents(values.unitCostCents);
                    setMatDraftQuantity(values.quantity);
                    setMatDraftUnit(values.unit);
                    openChooseJob();
                  }
                : undefined
            }
            onSessionPillPress={
              captureMode === 'job'
                ? (values) => {
                    setMatDraftDescription(values.description);
                    setMatDraftUnitCostCents(values.unitCostCents);
                    setMatDraftQuantity(values.quantity);
                    setMatDraftUnit(values.unit);
                    setCaptureStep('materialSession');
                  }
                : undefined
            }
            onUnitPress={(values) => {
              setMatDraftDescription(values.description);
              setMatDraftUnitCostCents(values.unitCostCents);
              setMatDraftQuantity(values.quantity);
              setMatDraftUnit(values.unit);
              setCaptureStep('materialUnit');
            }}
            onSavePress={(values) => void saveCaptureMaterial(values)}
            onDeletePress={() => setCaptureStep('idle')}
          />

          <ChooseJobBottomSheet
            typography={typography}
            visible={captureStep === 'chooseJob'}
            jobs={chooseJobList}
            loading={chooseJobLoading}
            error={chooseJobError}
            registerInGlobalStack={false}
            onClose={closeQuickActions}
            onBack={returnToCaptureEdit}
            onSelect={onChooseJobSelect}
          />

          <ChooseSessionBottomSheet
            typography={typography}
            visible={captureStep === 'noteSession'}
            mode={draftSessionId ? 'edit' : 'attach'}
            sessions={captureSessions}
            currentSessionId={draftSessionId}
            registerInGlobalStack={false}
            onClose={closeQuickActions}
            onBack={() => setCaptureStep('noteEdit')}
            onSelect={(sessionId) => {
              setDraftSessionId(sessionId);
              setCaptureStep('noteEdit');
            }}
            onRemove={() => {
              setDraftSessionId(null);
              setCaptureStep('noteEdit');
            }}
          />

          <ChooseSessionBottomSheet
            typography={typography}
            visible={captureStep === 'materialSession'}
            mode={draftSessionId ? 'edit' : 'attach'}
            sessions={captureSessions}
            currentSessionId={draftSessionId}
            registerInGlobalStack={false}
            onClose={closeQuickActions}
            onBack={() => setCaptureStep('materialEdit')}
            onSelect={(sessionId) => {
              setDraftSessionId(sessionId);
              setCaptureStep('materialEdit');
            }}
            onRemove={() => {
              setDraftSessionId(null);
              setCaptureStep('materialEdit');
            }}
          />

          <DropdownBottomSheet
            typography={typography}
            visible={captureStep === 'materialUnit'}
            options={CAPTURE_UNIT_OPTIONS}
            currentValue={matDraftUnit}
            allowCustom
            customPlaceholder="Custom"
            registerInGlobalStack={false}
            onClose={closeQuickActions}
            onBack={() => setCaptureStep('materialEdit')}
            onSelect={(unit) => {
              setMatDraftUnit(unit || 'ea');
              setCaptureStep('materialEdit');
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

/** Gap from shellMain bottom to FAB — nav is a sibling below, not an overlay. */
function fabBottomOffset(): number {
  return space('Spacing/8') + space('Spacing/32') + space('Spacing/4');
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', backgroundColor: bg.canvasWarm },
  modalHost: { flex: 1 },
  scroll: { flex: 1, width: '100%', backgroundColor: 'transparent', zIndex: 1 },
  scrollContent: {
    // Stretch lets capped-width bands use full width; `alignSelf: 'center'` on
    // those bands keeps cards centered on wider Android screens.
    alignItems: 'stretch',
  },
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
  headerBand: {
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  },
  modulesColumn: {
    width: '100%',
    alignItems: 'stretch',
    overflow: 'visible',
  },
  firstJobEmptyState: {
    ...cardShadowRn,
    alignItems: 'center',
    backgroundColor: bg.surfaceWhite,
    borderRadius: radius('Radius/16'),
    marginTop: space('Spacing/20'),
    padding: space('Spacing/28'),
  },
  firstJobLogo: {
    height: 76,
    marginBottom: space('Spacing/24'),
    resizeMode: 'contain',
    width: 76,
  },
  firstJobTitle: {
    marginBottom: space('Spacing/20'),
    textAlign: 'center',
  },
  firstJobBody: {
    marginBottom: space('Spacing/16'),
    textAlign: 'center',
  },
  firstJobError: {
    marginBottom: space('Spacing/12'),
    textAlign: 'center',
  },
  firstJobButton: {
    alignItems: 'center',
    backgroundColor: color('Brand/Primary'),
    borderRadius: radius('Radius/12'),
    justifyContent: 'center',
    marginTop: space('Spacing/12'),
    minHeight: 52,
    paddingHorizontal: space('Spacing/20'),
    width: '100%',
  },
  firstJobButtonText: {
    color: bg.canvasWarm,
  },
  homeError: {
    textAlign: 'center',
    marginBottom: space('Spacing/12'),
  },
  needsAttentionBlock: {
    width: '100%',
  },
  needsAttentionRowWrap: {
    width: '100%',
    marginBottom: space('Spacing/12'),
  },
  jumpBackList: {
    width: '100%',
  },
  jumpBackRowWrap: {
    width: '100%',
    marginBottom: space('Spacing/12'),
  },
  topHeader: {
    width: '100%',
    // Horizontal inset comes from the shared responsive content column.
    paddingHorizontal: 0,
    paddingTop: space('Spacing/32'),
    paddingBottom: space('Spacing/8'),
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space('Spacing/12'),
  },
  brandTitle: {
    flex: 1,
    minWidth: 0,
    overflow: 'visible',
    justifyContent: 'center',
  },
  brandTitleText: {
    width: '100%',
  },
  profileHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: radius('Radius/12'),
    backgroundColor: bg.surfaceWhite,
    ...cardShadowRn,
  },
  pressed: { opacity: 0.75 },
  fabWrap: {
    position: 'absolute',
    zIndex: 20,
  },
  fabCircle: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radius('Radius/Full'),
    backgroundColor: color('Brand/Primary'),
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadowRn,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
