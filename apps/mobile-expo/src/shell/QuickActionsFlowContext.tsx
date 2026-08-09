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
  useState,
  type ReactNode,
} from 'react';
import { Alert, Modal, Platform, StyleSheet, View } from 'react-native';

import {
  ChooseJobBottomSheet,
  ChooseSessionBottomSheet,
  DropdownBottomSheet,
  EditMaterialBottomSheet,
  EditNoteBottomSheet,
  QuickActionsBottomSheet,
  type ChooseJobBottomSheetJob,
  type ChooseSessionBottomSheetSession,
  type EditMaterialBottomSheetValues,
  type EditNoteBottomSheetValues,
  type QuickActionsRecentJob,
  type QuickActionsStep,
  type QuickCaptureKind,
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
  listAllJobsForCapture,
  type CaptureJob,
  type CaptureMode,
  type CaptureStep,
} from './quickActionsFlowHelpers';

type QuickActionsFlowContextValue = {
  handlePrimaryAction: (id: PrimaryActionMenuItemId) => void;
  quickActionsVisible: boolean;
};

const QuickActionsFlowContext = createContext<QuickActionsFlowContextValue | null>(null);

export type QuickActionsFlowProviderProps = {
  children: ReactNode;
  onCreateJob: () => Promise<unknown>;
};

export function QuickActionsFlowProvider({ children, onCreateJob }: QuickActionsFlowProviderProps) {
  const hasLiveSession = useHasLiveSession();
  const { startLiveSession, refresh: refreshLiveSession } = useLiveSession();
  const { invalidateJobsList } = useJobsListInvalidation();

  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [recentJobs, setRecentJobs] = useState<RecentJobItem[]>([]);
  const [recentJobsLoading, setRecentJobsLoading] = useState(false);
  const [recentJobsError, setRecentJobsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

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
  }, [hasLiveSession, quickActionsVisible]);

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

  const openQuickActionsAtStep = useCallback(
    (step: QuickActionsStep) => {
      resetCapture();
      setQaStep(step);
      setActionError(null);
      setQuickActionsVisible(true);
    },
    [resetCapture],
  );

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
      setCaptureSessions([]);
    }
  }, []);

  const beginInboxCapture = useCallback(
    (kind: QuickCaptureKind) => {
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
    },
    [recentJobs.length],
  );

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

  const handlePrimaryAction = useCallback(
    (id: PrimaryActionMenuItemId) => {
      switch (id) {
        case 'new_job':
          void onCreateJob();
          return;
        case 'live_session':
          openQuickActionsAtStep('chooseJob');
          return;
        case 'quick_note':
          openQuickActionsAtStep('noteCapture');
          return;
        case 'quick_material':
          openQuickActionsAtStep('materialCapture');
          return;
        default: {
          const _exhaustive: never = id;
          return _exhaustive;
        }
      }
    },
    [onCreateJob, openQuickActionsAtStep],
  );

  const contextValue = useMemo(
    () => ({
      handlePrimaryAction,
      quickActionsVisible,
    }),
    [handlePrimaryAction, quickActionsVisible],
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
