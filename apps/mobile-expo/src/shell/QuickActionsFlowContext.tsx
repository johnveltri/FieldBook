import { useFonts } from 'expo-font';
import {
  fieldsoloExpoFontAssets,
  fieldsoloLoadedFonts,
} from '@fieldsolo/design-system/expo/loadFieldSoloFonts';
import {
  createBlankJobForLiveSessionStart,
  createMaterial,
  createNote,
  deleteJobById,
  listRecentJobsForCurrentUser,
  tryBumpJobToInProgressIfNotStarted,
  type RecentJobItem,
} from '@fieldsolo/api-client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert, Modal, Platform, StyleSheet, View } from 'react-native';

import {
  DropdownBottomSheet,
  EditMaterialBottomSheet,
  EditNoteBottomSheet,
  QuickActionsBottomSheet,
  type EditMaterialBottomSheetValues,
  type EditNoteBottomSheetValues,
  type QuickActionsRecentJob,
  type QuickActionsStep,
} from '../components/ds';
import type { PrimaryActionMenuItemId } from '../components/platform/PlatformPrimaryAction';
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
import { createTextStyles } from '../theme/nativeTokens';
import {
  CAPTURE_UNIT_OPTIONS,
  formatCaptureError,
  formatLiveSessionJobTitle,
  type CaptureStep,
} from './quickActionsFlowHelpers';

type QuickCaptureKind = 'note' | 'material';
type CaptureMode = 'inbox' | 'job';

type QuickActionsFlowContextValue = {
  handlePrimaryAction: (id: PrimaryActionMenuItemId) => void;
  creatingJob: boolean;
  quickActionsVisible: boolean;
};

const QuickActionsFlowContext = createContext<QuickActionsFlowContextValue | null>(null);

export type QuickActionsFlowProviderProps = {
  children: ReactNode;
  onCreateJob: () => Promise<unknown>;
  /** Called after a quick note/material is saved so the underlying screen can refresh. */
  onQuickCaptureSaved?: (info: { mode: CaptureMode; jobId: string | null }) => void;
};

export function QuickActionsFlowProvider({
  children,
  onCreateJob,
  onQuickCaptureSaved,
}: QuickActionsFlowProviderProps) {
  const hasLiveSession = useHasLiveSession();
  const { startLiveSession, refresh: refreshLiveSession } = useLiveSession();
  const { invalidateJobsList } = useJobsListInvalidation();

  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [recentJobs, setRecentJobs] = useState<RecentJobItem[]>([]);
  const [recentJobsLoading, setRecentJobsLoading] = useState(false);
  const [recentJobsError, setRecentJobsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const creatingJobRef = useRef(false);

  const [qaStep, setQaStep] = useState<QuickActionsStep>('chooseJob');
  const [captureStep, setCaptureStep] = useState<CaptureStep>('idle');
  const [captureKind, setCaptureKind] = useState<QuickCaptureKind>('note');
  const [captureSaving, setCaptureSaving] = useState(false);
  const [draftBody, setDraftBody] = useState('');
  const [matDraftDescription, setMatDraftDescription] = useState('');
  const [matDraftUnitCostCents, setMatDraftUnitCostCents] = useState(0);
  const [matDraftQuantity, setMatDraftQuantity] = useState(1);
  const [matDraftUnit, setMatDraftUnit] = useState('ea');

  const [fontsLoaded] = useFonts(fieldsoloExpoFontAssets);

  const typography = useMemo(
    () =>
      createTextStyles(fieldsoloLoadedFonts),
    [],
  );

  useEffect(() => {
    if (!quickActionsVisible || captureStep !== 'idle') return;
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
  }, [captureStep, hasLiveSession, quickActionsVisible]);

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
        console.error('[QuickActionsFlow] startLiveSession (existing job)', err);
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
      console.error('[QuickActionsFlow] startLiveSession (new job)', err);
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
          console.error('[QuickActionsFlow] cleanup orphaned quick-session job failed', cleanupErr);
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
    setDraftBody('');
    setMatDraftDescription('');
    setMatDraftUnitCostCents(0);
    setMatDraftQuantity(1);
    setMatDraftUnit('ea');
    setCaptureSaving(false);
  }, []);

  const closeQuickActions = useCallback(() => {
    setQuickActionsVisible(false);
    resetCapture();
  }, [resetCapture]);

  const openQuickActionsAtStep = useCallback(
    (step: QuickActionsStep) => {
      resetCapture();
      setQaStep(step);
      setActionError(null);
      setQuickActionsVisible(true);
    },
    [resetCapture],
  );

  const beginInboxCapture = useCallback(
    (kind: QuickCaptureKind) => {
      setQuickActionsVisible(true);
      analytics.capture('home_quick_action_selected', {
        action: kind === 'note' ? 'new_note' : 'new_material',
        recent_job_count: recentJobs.length,
      });
      analytics.capture(kind === 'note' ? 'note_create_opened' : 'material_create_opened', {
        source: 'quick_actions',
        parent: 'inbox',
      });
      setCaptureKind(kind);
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
    [recentJobs.length],
  );

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
          jobId: null,
          sessionId: null,
          body,
        });
        analytics.capture('note_created', {
          source: 'quick_actions',
          note_id: noteId,
          parent_type: 'inbox',
          job_id: null,
          session_id: null,
          text_length_bucket: textLengthBucket(body),
        });
        closeQuickActions();
        invalidateJobsList();
        onQuickCaptureSaved?.({
          mode: 'inbox',
          jobId: null,
        });
      } catch (e) {
        analytics.capture('note_create_failed', {
          source: 'quick_actions',
          parent_type: 'inbox',
          ...errorProperties(e),
        });
        Alert.alert('Save failed', formatCaptureError(e) || 'Could not save note.');
      } finally {
        setCaptureSaving(false);
      }
    },
    [captureSaving, closeQuickActions, invalidateJobsList, onQuickCaptureSaved],
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
          jobId: null,
          sessionId: null,
          description: values.description,
          quantity: values.quantity,
          unit: values.unit,
          unitCostCents: values.unitCostCents,
        });
        analytics.capture('material_created', {
          source: 'quick_actions',
          material_id: materialId,
          parent_type: 'inbox',
          job_id: null,
          session_id: null,
          unit: values.unit,
          quantity_bucket: quantityBucket(values.quantity),
          cost_bucket: moneyBucket(values.unitCostCents),
          text_length_bucket: textLengthBucket(values.description),
        });
        closeQuickActions();
        invalidateJobsList();
        onQuickCaptureSaved?.({
          mode: 'inbox',
          jobId: null,
        });
      } catch (e) {
        analytics.capture('material_create_failed', {
          source: 'quick_actions',
          parent_type: 'inbox',
          ...errorProperties(e),
        });
        Alert.alert('Save failed', formatCaptureError(e) || 'Could not save material.');
      } finally {
        setCaptureSaving(false);
      }
    },
    [captureSaving, closeQuickActions, invalidateJobsList, onQuickCaptureSaved],
  );

  const handlePrimaryAction = useCallback(
    (id: PrimaryActionMenuItemId) => {
      switch (id) {
        case 'new_job': {
          if (creatingJobRef.current) return;
          creatingJobRef.current = true;
          setCreatingJob(true);
          void onCreateJob()
            .catch((error) => {
              Alert.alert(
                'Create job failed',
                error instanceof Error ? error.message : 'Could not create job.',
              );
            })
            .finally(() => {
              creatingJobRef.current = false;
              setCreatingJob(false);
            });
          return;
        }
        case 'live_session':
          openQuickActionsAtStep('chooseJob');
          return;
        case 'quick_note':
          beginInboxCapture('note');
          return;
        case 'quick_material':
          beginInboxCapture('material');
          return;
        default: {
          const _exhaustive: never = id;
          return _exhaustive;
        }
      }
    },
    [beginInboxCapture, onCreateJob, openQuickActionsAtStep],
  );

  const contextValue = useMemo(
    () => ({
      handlePrimaryAction,
      creatingJob,
      quickActionsVisible,
    }),
    [creatingJob, handlePrimaryAction, quickActionsVisible],
  );

  return (
    <QuickActionsFlowContext.Provider value={contextValue}>
      {children}
      {quickActionsVisible && fontsLoaded ? (
        <Modal
          visible
          transparent
          animationType="none"
          statusBarTranslucent
          navigationBarTranslucent={Platform.OS === 'android'}
          onRequestClose={closeQuickActions}
        >
          <View style={styles.modalHost}>
            <QuickActionsBottomSheet
              typography={typography}
              visible={captureStep === 'idle'}
              step={qaStep}
              recentJobs={recentJobs}
              recentJobsLoading={recentJobsLoading}
              recentJobsError={recentJobsError}
              actionError={actionError}
              starting={starting}
              onClose={closeQuickActions}
              onSelectExistingJob={onSelectExistingJob}
              onStartNewSession={onStartNewSession}
            />

            <EditNoteBottomSheet
              typography={typography}
              visible={captureStep === 'noteEdit'}
              title="New Note"
              primaryLabel="SAVE NOTE TO INBOX"
              subtitle="Unassigned quick capture note"
              values={{ body: draftBody }}
              assignedSession={null}
              canAttachSession={false}
              registerInGlobalStack={false}
              onClose={closeQuickActions}
              onBack={closeQuickActions}
              onSavePress={(values) => void saveCaptureNote(values)}
              onDeletePress={closeQuickActions}
            />

            <EditMaterialBottomSheet
              typography={typography}
              visible={captureStep === 'materialEdit'}
              title="New Material"
              primaryLabel="SAVE MATERIAL TO INBOX"
              subtitle="Unassigned quick capture material"
              values={{
                description: matDraftDescription,
                unitCostCents: matDraftUnitCostCents,
                quantity: matDraftQuantity,
                unit: matDraftUnit,
              }}
              assignedSession={null}
              canAttachSession={false}
              registerInGlobalStack={false}
              onClose={closeQuickActions}
              onBack={closeQuickActions}
              onUnitPress={(values) => {
                setMatDraftDescription(values.description);
                setMatDraftUnitCostCents(values.unitCostCents);
                setMatDraftQuantity(values.quantity);
                setMatDraftUnit(values.unit);
                setCaptureStep('materialUnit');
              }}
              onSavePress={(values) => void saveCaptureMaterial(values)}
              onDeletePress={closeQuickActions}
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
      ) : null}
    </QuickActionsFlowContext.Provider>
  );
}

export function useQuickActionsFlow(): QuickActionsFlowContextValue {
  const ctx = useContext(QuickActionsFlowContext);
  if (!ctx) {
    throw new Error('useQuickActionsFlow must be used within QuickActionsFlowProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  modalHost: { flex: 1 },
});
