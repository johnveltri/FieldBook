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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ChooseSessionBottomSheet,
  EditJobBottomSheet,
  EditNoteBottomSheet,
  EditSessionBottomSheet,
  JobDetailCtaRow,
  JobDetailJobHeader,
  JobDetailMetricTertiary,
  JobDetailSummaryCard,
  NewSessionBottomSheet,
  SessionCard,
  type ChooseSessionBottomSheetSession,
  type EditNoteBottomSheetValues,
  type EditSessionBottomSheetValues,
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
} from '../components/figma-icons/JobDetailScreenIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, colorWithAlpha, radius } from '@fieldbook/design-system/lib/tokens';
import {
  createManualSession,
  createNote,
  deleteJobById,
  discardSession,
  fetchFirstJobIdForCurrentUser,
  fetchJobDetail,
  softDeleteNote,
  updateJobById,
  updateNote,
  updateSessionTimes,
} from '@fieldbook/api-client';
import type {
  JobDetailNote,
  JobDetailSession,
  JobDetailViewModel,
} from '@fieldbook/shared-types';

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
import type { EditJobBottomSheetValues } from '../components/ds/EditJobBottomSheet';

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
  /** Optional explicit job id to load (used by Jobs screen card taps / new job). */
  jobId?: string | null;
  /** Parent increments when navigating to this screen (e.g. "View job") to force reload. */
  loadKey?: number;
  /** When true, open the edit job sheet once after the job finishes loading (e.g. new job FAB). */
  initialEditOpen?: boolean;
};

export function JobDetailScreen({
  onRequestClose,
  sessionUserId,
  sessionEmail,
  jobId,
  loadKey = 0,
  initialEditOpen = false,
}: JobDetailScreenProps = {}) {
  /** Top safe area (status bar); bottom inset used for scroll padding + nav. */
  const insets = useSafeAreaInsets();
  const scrollY = useMemo(() => new Animated.Value(0), []);

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
  const [job, setJob] = useState<JobDetailViewModel | null>(null);
  const [jobLoading, setJobLoading] = useState(supabaseReady);
  const [jobSaving, setJobSaving] = useState(false);
  const [editSheetMounted, setEditSheetMounted] = useState(false);
  const [editSheetVisible, setEditSheetVisible] = useState(false);

  /** State machine for the session add/edit flow. */
  type SessionFlow = 'closed' | 'chooser' | 'addForm' | 'editForm';
  const [sessionFlow, setSessionFlow] = useState<SessionFlow>('closed');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  /** Which session card (by id) is expanded; only one at a time. */
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  /** Mount flag lets BottomSheetShell play its exit animation before unmounting. */
  const [sessionSheetMounted, setSessionSheetMounted] = useState(false);
  const [sessionSaving, setSessionSaving] = useState(false);

  /**
   * State machine for the note add/edit flow. Mirrors the session flow:
   * - `addNote` / `editNote` — the EditNoteBottomSheet.
   * - `attachSession` / `editSession` — the ChooseSessionBottomSheet,
   *   reachable from the note sheet via the `+SESSION` / pencil pill.
   */
  type NoteFlow = 'closed' | 'addNote' | 'editNote' | 'attachSession' | 'editSession';
  const [noteFlow, setNoteFlow] = useState<NoteFlow>('closed');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState('');
  const [draftSessionId, setDraftSessionId] = useState<string | null>(null);
  const [noteSheetMounted, setNoteSheetMounted] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  /** Set when Supabase is configured but fetch returns null or throws (no silent mock). */
  const [jobLoadError, setJobLoadError] = useState<string | null>(null);
  /** Ensures we only auto-open the edit sheet once per navigation (see `initialEditOpen`). */
  const autoEditOpenedRef = useRef(false);

  useEffect(() => {
    autoEditOpenedRef.current = false;
  }, [loadKey, jobId]);

  useEffect(() => {
    if (!initialEditOpen || jobLoading || !job || autoEditOpenedRef.current) return;
    autoEditOpenedRef.current = true;
    setEditSheetMounted(true);
    setEditSheetVisible(true);
  }, [initialEditOpen, jobLoading, job]);

  useEffect(() => {
    if (!supabaseReady) {
      setJobLoading(false);
      setJob(null);
      setJobLoadError(
        'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
      );
      return;
    }
    let cancelled = false;

    const load = async () => {
      setJobLoading(true);
      setJobLoadError(null);
      try {
        const resolvedJobId = jobId ?? (await fetchFirstJobIdForCurrentUser(supabase));
        if (cancelled) return;
        if (!resolvedJobId) {
          setJob(null);
          setJobLoadError('No jobs yet.');
          return;
        }

        const j = await fetchJobDetail(supabase, resolvedJobId);
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
  }, [supabaseReady, sessionUserId, loadKey, jobId]);

  const onClose = useCallback(() => {
    onRequestClose?.();
  }, [onRequestClose]);
  const onEdit = useCallback(() => {
    setEditSheetMounted(true);
    setEditSheetVisible(true);
  }, []);
  const onCloseEditSheet = useCallback(() => {
    setEditSheetVisible(false);
  }, []);

  const parseRevenueCents = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return { ok: true as const, value: null };
    }

    const normalized = trimmed.replace(/[$,\s]/g, '');
    if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
      return {
        ok: false as const,
        error: 'Revenue must be a non-negative dollar amount (up to 2 decimals).',
      };
    }

    const parsed = Number.parseFloat(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return {
        ok: false as const,
        error: 'Revenue must be a non-negative dollar amount.',
      };
    }

    return { ok: true as const, value: Math.round(parsed * 100) };
  }, []);

  const toEditValues = useCallback((j: JobDetailViewModel): EditJobBottomSheetValues => {
    const revenue = (j.earnings.revenueCents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return {
      jobTitle: j.shortDescription,
      customerName: j.customerName,
      serviceAddress: j.serviceAddress,
      revenue,
      jobType: j.jobType,
    };
  }, []);

  const onSaveJobSheet = useCallback(
    async (values: EditJobBottomSheetValues) => {
      if (!job) return;
      const shortDescription = values.jobTitle.trim();
      if (!shortDescription) {
        Alert.alert('Validation error', 'Job title is required.');
        return;
      }

      const revenueParsed = parseRevenueCents(values.revenue);
      if (!revenueParsed.ok) {
        Alert.alert('Validation error', revenueParsed.error);
        return;
      }

      setJobSaving(true);
      try {
        await updateJobById(supabase, job.id, {
          shortDescription,
          customerName: values.customerName.trim(),
          serviceAddress: values.serviceAddress.trim(),
          revenueCents: revenueParsed.value,
          jobType: values.jobType.trim(),
        });
        const refreshed = await fetchJobDetail(supabase, job.id);
        if (refreshed) setJob(refreshed);
        onCloseEditSheet();
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === 'object' &&
                e !== null &&
                'message' in e &&
                typeof (e as { message: unknown }).message === 'string'
              ? (e as { message: string }).message
              : String(e);
        Alert.alert('Save failed', msg || 'Could not save job changes.');
      } finally {
        setJobSaving(false);
      }
    },
    [job, onCloseEditSheet, parseRevenueCents],
  );

  // --- Session add/edit flow ---

  const openSessionChooser = useCallback(() => {
    setSessionSheetMounted(true);
    setSessionFlow('chooser');
    setEditingSessionId(null);
  }, []);

  const closeSessionFlow = useCallback(() => {
    setSessionFlow('closed');
  }, []);

  const openAddSession = useCallback(() => {
    setSessionFlow('addForm');
  }, []);

  const openEditSession = useCallback((sessionId: string) => {
    setEditingSessionId(sessionId);
    setSessionSheetMounted(true);
    setSessionFlow('editForm');
  }, []);

  const editingSession = useMemo<JobDetailSession | null>(() => {
    if (!editingSessionId || !job) return null;
    return job.sessions.find((s) => s.id === editingSessionId) ?? null;
  }, [editingSessionId, job]);

  const refetchJob = useCallback(async () => {
    if (!job) return;
    const refreshed = await fetchJobDetail(supabase, job.id);
    if (refreshed) setJob(refreshed);
  }, [job]);

  const formatErrorMessage = useCallback((e: unknown): string => {
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
  }, []);

  const onSaveNewSession = useCallback(
    async (values: EditSessionBottomSheetValues) => {
      if (!job) return;
      setSessionSaving(true);
      try {
        await createManualSession(supabase, {
          jobId: job.id,
          startedAt: values.startedAt,
          endedAt: values.endedAt,
        });
        await refetchJob();
        closeSessionFlow();
      } catch (e) {
        Alert.alert('Save failed', formatErrorMessage(e) || 'Could not save session.');
      } finally {
        setSessionSaving(false);
      }
    },
    [closeSessionFlow, formatErrorMessage, job, refetchJob],
  );

  const onSaveSessionChanges = useCallback(
    async (values: EditSessionBottomSheetValues) => {
      if (!editingSessionId) return;
      setSessionSaving(true);
      try {
        await updateSessionTimes(supabase, editingSessionId, {
          startedAt: values.startedAt,
          endedAt: values.endedAt,
        });
        await refetchJob();
        closeSessionFlow();
      } catch (e) {
        Alert.alert('Save failed', formatErrorMessage(e) || 'Could not save session.');
      } finally {
        setSessionSaving(false);
      }
    },
    [closeSessionFlow, editingSessionId, formatErrorMessage, refetchJob],
  );

  const onDiscardEditingSession = useCallback(async () => {
    if (!editingSessionId) return;
    setSessionSaving(true);
    try {
      await discardSession(supabase, editingSessionId);
      await refetchJob();
      closeSessionFlow();
    } catch (e) {
      Alert.alert('Discard failed', formatErrorMessage(e) || 'Could not discard session.');
    } finally {
      setSessionSaving(false);
    }
  }, [closeSessionFlow, editingSessionId, formatErrorMessage, refetchJob]);

  // --- Note add/edit flow ---

  /** Find a note across all buckets by id (used when opening Edit Note from a tap). */
  const findNote = useCallback(
    (noteId: string): JobDetailNote | null => {
      if (!job) return null;
      for (const bucket of job.noteBuckets) {
        const hit = bucket.notes.find((n) => n.id === noteId);
        if (hit) return hit;
      }
      return null;
    },
    [job],
  );

  const closeNoteFlow = useCallback(() => {
    setNoteFlow('closed');
  }, []);

  const openAddNote = useCallback(() => {
    setEditingNoteId(null);
    setDraftBody('');
    setDraftSessionId(null);
    setNoteSheetMounted(true);
    setNoteFlow('addNote');
  }, []);

  const openEditNote = useCallback(
    (noteId: string) => {
      const n = findNote(noteId);
      if (!n) return;
      setEditingNoteId(noteId);
      setDraftBody(n.body);
      setDraftSessionId(n.sessionId);
      setNoteSheetMounted(true);
      setNoteFlow('editNote');
    },
    [findNote],
  );

  const openSessionPickerFromNoteSheet = useCallback(() => {
    // Edit mode when the note already has a session, attach mode otherwise.
    setNoteFlow(draftSessionId ? 'editSession' : 'attachSession');
  }, [draftSessionId]);

  const returnToNoteSheet = useCallback(() => {
    setNoteFlow(editingNoteId ? 'editNote' : 'addNote');
  }, [editingNoteId]);

  const onSelectDraftSession = useCallback(
    (sessionId: string) => {
      setDraftSessionId(sessionId);
      returnToNoteSheet();
    },
    [returnToNoteSheet],
  );

  const onRemoveDraftSession = useCallback(() => {
    setDraftSessionId(null);
    returnToNoteSheet();
  }, [returnToNoteSheet]);

  const onSaveNewNote = useCallback(
    async ({ body }: EditNoteBottomSheetValues) => {
      if (!job) return;
      setNoteSaving(true);
      try {
        // Exactly one of jobId / sessionId is set (notes_exactly_one_parent).
        await createNote(supabase, {
          jobId: job.id,
          sessionId: draftSessionId,
          body,
        });
        await refetchJob();
        closeNoteFlow();
      } catch (e) {
        Alert.alert('Save failed', formatErrorMessage(e) || 'Could not save note.');
      } finally {
        setNoteSaving(false);
      }
    },
    [closeNoteFlow, draftSessionId, formatErrorMessage, job, refetchJob],
  );

  const onSaveNoteChanges = useCallback(
    async ({ body }: EditNoteBottomSheetValues) => {
      if (!editingNoteId) return;
      setNoteSaving(true);
      try {
        // Pass sessionId unconditionally so the api-client re-parents to the
        // current draft assignment (including `null` → back to unassigned).
        await updateNote(supabase, editingNoteId, {
          body,
          sessionId: draftSessionId,
        });
        await refetchJob();
        closeNoteFlow();
      } catch (e) {
        Alert.alert('Save failed', formatErrorMessage(e) || 'Could not save note.');
      } finally {
        setNoteSaving(false);
      }
    },
    [closeNoteFlow, draftSessionId, editingNoteId, formatErrorMessage, refetchJob],
  );

  const onDiscardOrDeleteEditingNote = useCallback(async () => {
    if (!editingNoteId) {
      // Add flow — trash simply abandons the draft.
      closeNoteFlow();
      return;
    }
    setNoteSaving(true);
    try {
      await softDeleteNote(supabase, editingNoteId);
      await refetchJob();
      closeNoteFlow();
    } catch (e) {
      Alert.alert('Delete failed', formatErrorMessage(e) || 'Could not delete note.');
    } finally {
      setNoteSaving(false);
    }
  }, [closeNoteFlow, editingNoteId, formatErrorMessage, refetchJob]);

  /** Non-discarded sessions, mapped for the generic `ChooseSessionBottomSheet`. */
  const chooserSessions = useMemo<ChooseSessionBottomSheetSession[]>(
    () =>
      job?.sessions.map((s) => ({
        id: s.id,
        dateLabel: s.dateLabel,
        timeRangeLabel: s.timeRangeLabel,
      })) ?? [],
    [job],
  );

  /** Hydrated version of `draftSessionId` used by the note sheet subtitle + pill icon. */
  const draftAssignedSession = useMemo(() => {
    if (!draftSessionId) return null;
    const s = job?.sessions.find((x) => x.id === draftSessionId);
    if (!s) return null;
    return { id: s.id, dateLabel: s.dateLabel, timeRangeLabel: s.timeRangeLabel };
  }, [draftSessionId, job]);

  const onDeleteJobSheet = useCallback(async () => {
    if (!job) return;
    setJobSaving(true);
    try {
      await deleteJobById(supabase, job.id);
      onCloseEditSheet();
      onRequestClose?.();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === 'object' &&
              e !== null &&
              'message' in e &&
              typeof (e as { message: unknown }).message === 'string'
            ? (e as { message: string }).message
            : String(e);
      Alert.alert('Delete failed', msg || 'Could not delete this job.');
    } finally {
      setJobSaving(false);
    }
  }, [job, onCloseEditSheet, onRequestClose]);

  /** Spinner state: same canvas background as main screen so the transition does not flash a flat color. */
  if (!fontsLoaded || (supabaseReady && jobLoading)) {
    return (
      <View style={styles.loading}>
        <CanvasTiledBackground scrollY={scrollY} />
        <ActivityIndicator
          accessibilityLabel={!fontsLoaded ? 'Loading fonts' : 'Loading job'}
        />
      </View>
    );
  }

  if (supabaseReady && !job) {
    return (
      <View style={styles.loading}>
        <CanvasTiledBackground scrollY={scrollY} />
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
      <CanvasTiledBackground scrollY={scrollY} />
      <Animated.ScrollView
        style={[styles.scroll, styles.scrollTransparent]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
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
            serviceAddress={job.serviceAddress}
            lastWorkedLabel={job.lastWorkedLabel}
            jobTypeLabelUppercase={job.jobType.toUpperCase()}
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
          onAddPress={openSessionChooser}
        />
        <View style={[styles.sessionList, { maxWidth: CONTENT_MAX_WIDTH }]}>
          {job.sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              typography={typography}
              expanded={expandedSessionId === s.id}
              onToggle={() =>
                setExpandedSessionId((prev) => (prev === s.id ? null : s.id))
              }
              onEditPress={() => openEditSession(s.id)}
            />
          ))}
        </View>

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
          onAddPress={openAddNote}
        />
        <ViewNotesBuckets
          buckets={job.noteBuckets}
          typography={typography}
          onNotePress={openEditNote}
        />

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
      </Animated.ScrollView>

      {/* Tab bar stays fixed while list scrolls; `bottomInset` clears home indicator. */}
      <BottomNavJobs typography={typography} bottomInset={insets.bottom} />
      {editSheetMounted ? (
        <EditJobBottomSheet
          typography={typography}
          values={job ? toEditValues(job) : undefined}
          visible={editSheetVisible}
          onClose={onCloseEditSheet}
          onClosed={() => setEditSheetMounted(false)}
          onSavePress={onSaveJobSheet}
          onDeletePress={() => {
            void onDeleteJobSheet();
          }}
        />
      ) : null}
      {noteSheetMounted ? (
        <>
          <EditNoteBottomSheet
            typography={typography}
            visible={noteFlow === 'addNote' || noteFlow === 'editNote'}
            // Derive stable title/primaryLabel from editingNoteId (not noteFlow)
            // so they do not flicker during the slide-down close animation.
            title={editingNoteId ? 'Edit Note' : 'Add Note'}
            primaryLabel={editingNoteId ? 'SAVE CHANGES' : 'SAVE NEW NOTE'}
            values={{ body: draftBody }}
            assignedSession={draftAssignedSession}
            canAttachSession={chooserSessions.length > 0}
            onClose={closeNoteFlow}
            onClosed={() => {
              if (noteFlow === 'closed') setNoteSheetMounted(false);
            }}
            onBack={closeNoteFlow}
            onSavePress={(values) => {
              if (noteSaving) return;
              if (editingNoteId) {
                void onSaveNoteChanges(values);
              } else {
                void onSaveNewNote(values);
              }
            }}
            onDiscardPress={() => {
              if (noteSaving) return;
              void onDiscardOrDeleteEditingNote();
            }}
            onSessionPillPress={openSessionPickerFromNoteSheet}
          />
          <ChooseSessionBottomSheet
            typography={typography}
            visible={noteFlow === 'attachSession' || noteFlow === 'editSession'}
            mode={noteFlow === 'editSession' ? 'edit' : 'attach'}
            sessions={chooserSessions}
            currentSessionId={draftSessionId}
            onClose={closeNoteFlow}
            onClosed={() => {
              if (noteFlow === 'closed') setNoteSheetMounted(false);
            }}
            onBack={returnToNoteSheet}
            onSelect={onSelectDraftSession}
            onRemove={onRemoveDraftSession}
          />
        </>
      ) : null}
      {sessionSheetMounted ? (
        <>
          <NewSessionBottomSheet
            typography={typography}
            visible={sessionFlow === 'chooser'}
            onClose={closeSessionFlow}
            onClosed={() => {
              if (sessionFlow === 'closed') setSessionSheetMounted(false);
            }}
            onLogPastPress={openAddSession}
          />
          <EditSessionBottomSheet
            typography={typography}
            visible={sessionFlow === 'addForm' || sessionFlow === 'editForm'}
            // Derive mode from editingSessionId (not sessionFlow) so the title /
            // primary label stay stable during the slide-down close animation,
            // where sessionFlow has already flipped to 'closed'.
            title={editingSessionId ? 'Edit Session' : 'Add Session'}
            primaryLabel={editingSessionId ? 'SAVE CHANGES' : 'SAVE NEW SESSION'}
            values={
              editingSessionId && editingSession
                ? {
                    startedAt: editingSession.startedAt,
                    endedAt:
                      editingSession.endedAt ?? editingSession.startedAt,
                  }
                : undefined
            }
            onClose={closeSessionFlow}
            onClosed={() => {
              if (sessionFlow === 'closed') setSessionSheetMounted(false);
            }}
            onBack={() => {
              if (sessionFlow === 'addForm') {
                setSessionFlow('chooser');
              } else {
                closeSessionFlow();
              }
            }}
            onSavePress={(values) => {
              if (sessionSaving) return;
              if (sessionFlow === 'editForm') {
                void onSaveSessionChanges(values);
              } else {
                void onSaveNewSession(values);
              }
            }}
            onDiscardPress={() => {
              if (sessionSaving) return;
              if (sessionFlow === 'editForm') {
                void onDiscardEditingSession();
              } else {
                closeSessionFlow();
              }
            }}
          />
        </>
      ) : null}
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
  onAddPress,
}: {
  title: string;
  icon: ReactNode;
  typography: TextStyles;
  showAdd: boolean;
  onAddPress?: () => void;
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
          onPress={onAddPress}
          disabled={!onAddPress}
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
  if (buckets.length === 0) {
    return null;
  }

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
  onNotePress,
}: {
  buckets: import('../mocks/jobDetail').JobDetailNoteBucket[];
  typography: TextStyles;
  /** Tap a row → open the Edit Note sheet prefilled with this note's body + session. */
  onNotePress?: (noteId: string) => void;
}) {
  if (buckets.length === 0) {
    return null;
  }

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
              <Pressable
                key={`${bucket.id}-n-${n.id}`}
                accessibilityRole="button"
                accessibilityLabel="Edit note"
                onPress={onNotePress ? () => onNotePress(n.id) : undefined}
                style={({ pressed }) => [
                  styles.noteRow,
                  ni > 0 && { borderTopWidth: 1, borderTopColor: color('Foundation/Border/Subtle') },
                  pressed && onNotePress ? styles.pressed : null,
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
              </Pressable>
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

  /** Column wrapper for the Sessions list — caps to DS content width. */
  sessionList: {
    width: '100%',
  },

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
