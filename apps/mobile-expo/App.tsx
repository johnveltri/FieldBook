import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import type { JobsOpenSectionKind } from './src/components/ds';
import { LiveSessionOverlay } from './src/components/LiveSessionOverlay';
import { ShellBottomNav, type ShellMainTab } from './src/components/shell/ShellBottomNav';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import {
  BottomSheetStackProvider,
  useBottomSheetStackWriters,
  useTopmostBottomSheet,
} from './src/context/BottomSheetStackContext';
import { JobsListInvalidationProvider, useJobsListInvalidation } from './src/context/JobsListInvalidationContext';
import {
  LiveSessionProvider,
  useLiveSession,
} from './src/context/LiveSessionContext';
import type { ListJobsForCurrentUserTab } from '@fieldsolo/api-client';
import {
  createBlankJobForCurrentUser,
  fetchLatestLegalAcceptanceVersions,
  needsLegalReacceptance,
} from '@fieldsolo/api-client';
import { analytics, emailProperties } from './src/lib/analytics';
import { resolveAnalyticsConsentForUser } from './src/lib/analytics/consentSync';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import {
  REQUIRED_PRIVACY_VERSION,
  REQUIRED_TERMS_VERSION,
} from './src/lib/legal-versions';
import {
  cacheLegalAcceptance,
  hasCachedLegalAcceptance,
} from './src/lib/legalAcceptanceStorage';
import { AnalyticsConsentPromptModal } from './src/components/AnalyticsConsentPromptModal';
import { LegalReacceptanceModal } from './src/components/LegalReacceptanceModal';
import { EarningsScreen, type EarningsWindow } from './src/screens/EarningsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InboxScreen } from './src/screens/InboxScreen';
import { JobsScreen } from './src/screens/JobsScreen';
import { JobDetailScreen } from './src/screens/JobDetailScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { OverlaySlideHost } from './src/navigation/OverlaySlideHost';
import { color } from '@fieldsolo/design-system/lib/tokens';

import { bg } from './src/theme/nativeTokens';
function AuthenticatedShell() {
  const { session, loading, signupLegalPending } = useAuth();
  const [legalGate, setLegalGate] = useState<'loading' | 'blocked' | 'ready'>('loading');
  const [analyticsConsentGate, setAnalyticsConsentGate] = useState<
    'idle' | 'loading' | 'prompt' | 'ready'
  >('idle');
  /** When true, job detail covers tab shell (HOME / JOBS / EARNINGS); X returns here. */
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  /** Android: keep host mounted through exit animation (Modal is iOS-only for detail). */
  const [jobDetailMounted, setJobDetailMounted] = useState(false);
  /** Skip Modal/host exit slide when Job Detail already animated off-screen via swipe. */
  const [jobDetailModalAnimation, setJobDetailModalAnimation] = useState<'slide' | 'none'>('slide');
  const [jobDetailExitAnimated, setJobDetailExitAnimated] = useState(true);
  /** Prevents overscroll/X from re-enabling Modal slide after a swipe dismiss starts. */
  const jobDetailSwipeClosingRef = useRef(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetailEntrySource, setJobDetailEntrySource] = useState<string>('unknown');
  /** True when opening detail from "New job" FAB — JobDetailScreen auto-opens the edit sheet. */
  const [jobDetailInitialEditOpen, setJobDetailInitialEditOpen] = useState(false);
  /** Bump on each "View job" so Job Detail refetches (same user, fresh data). */
  const [jobDetailLoadKey, setJobDetailLoadKey] = useState(0);
  /** Persisted while Job Detail is open so closing returns to the same Jobs tab. */
  const [jobsListTab, setJobsListTab] = useState<ListJobsForCurrentUserTab>('all');
  /** When set, Jobs → Open scrolls to this stack section after navigation. */
  const [jobsOpenScrollTarget, setJobsOpenScrollTarget] = useState<JobsOpenSectionKind | null>(
    null,
  );
  const [jobsOpenScrollNonce, setJobsOpenScrollNonce] = useState(0);
  /** Earnings page time window; lifted so Home can land on "Past Week". */
  const [earningsWindow, setEarningsWindow] = useState<EarningsWindow>('week');
  const [mainTab, setMainTab] = useState<ShellMainTab>('home');
  /** Profile is stacked over Home while staying on the HOME bottom-nav tab. */
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMounted, setProfileMounted] = useState(false);
  useEffect(() => {
    if (profileOpen) setProfileMounted(true);
  }, [profileOpen]);
  /** Inbox covers the shell (like Job Detail); opened from the Jobs header icon. */
  const [inboxOpen, setInboxOpen] = useState(false);
  const [inboxMounted, setInboxMounted] = useState(false);
  useEffect(() => {
    if (inboxOpen) setInboxMounted(true);
  }, [inboxOpen]);
  /** Bump on each Inbox open so it refetches its unassigned captures. */
  const [inboxLoadKey, setInboxLoadKey] = useState(0);
  // Hooks must be called unconditionally — bail-out renders below still execute these.
  const liveSession = useLiveSession();
  const { invalidateJobsList } = useJobsListInvalidation();
  const sheetStackWriters = useBottomSheetStackWriters();
  const topmostSheet = useTopmostBottomSheet();

  useEffect(() => {
    if (!session || signupLegalPending) {
      if (!session) setLegalGate('loading');
      return;
    }

    let cancelled = false;
    void (async () => {
      setLegalGate('loading');
      try {
        const accepted = await fetchLatestLegalAcceptanceVersions(supabase);
        if (cancelled) return;
        const requiresAcceptance = needsLegalReacceptance(accepted, {
          privacyVersion: REQUIRED_PRIVACY_VERSION,
          termsVersion: REQUIRED_TERMS_VERSION,
        });
        if (!requiresAcceptance) {
          try {
            await cacheLegalAcceptance({
              userId: session.user.id,
              privacyVersion: REQUIRED_PRIVACY_VERSION,
              termsVersion: REQUIRED_TERMS_VERSION,
            });
          } catch {
            // The server remains authoritative; local caching is best-effort.
          }
        }
        if (!cancelled) setLegalGate(requiresAcceptance ? 'blocked' : 'ready');
      } catch {
        const cached = await hasCachedLegalAcceptance({
          userId: session.user.id,
          privacyVersion: REQUIRED_PRIVACY_VERSION,
          termsVersion: REQUIRED_TERMS_VERSION,
        });
        if (!cancelled) setLegalGate(cached ? 'ready' : 'blocked');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, signupLegalPending]);

  useEffect(() => {
    if (!session?.user.id || signupLegalPending || legalGate !== 'ready') {
      if (!session?.user.id) setAnalyticsConsentGate('idle');
      return;
    }

    let cancelled = false;
    void (async () => {
      setAnalyticsConsentGate('loading');
      const result = await resolveAnalyticsConsentForUser(session.user.id);
      if (cancelled) return;
      setAnalyticsConsentGate(result === 'missing' ? 'prompt' : 'ready');
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, signupLegalPending, legalGate]);

  useEffect(() => {
    if (session) return;
    void analytics.onSignOut();
    setAnalyticsConsentGate('idle');
    // AuthenticatedShell remains mounted while the sign-in screen is shown, so
    // explicitly clear its navigation state. A later login must always enter
    // Home instead of restoring Profile, Inbox, Job Detail, or another tab.
    // Clear mount flags too: signing out early-returns before OverlaySlideHost
    // can fire onExited, and a sticky inboxMounted/jobDetailMounted would hide
    // or block the shell on the next login.
    setMainTab('home');
    setProfileOpen(false);
    setProfileMounted(false);
    setInboxOpen(false);
    setInboxMounted(false);
    setJobDetailOpen(false);
    setJobDetailMounted(false);
    setSelectedJobId(null);
  }, [session]);

  const navigateToJobsOpenSection = useCallback((section: JobsOpenSectionKind) => {
    setJobsListTab('open');
    setMainTab('jobs');
    setJobsOpenScrollTarget(section);
    setJobsOpenScrollNonce((n) => n + 1);
  }, []);

  const clearJobsOpenScrollTarget = useCallback(() => {
    setJobsOpenScrollTarget(null);
  }, []);

  const openInbox = useCallback(() => {
    analytics.capture('inbox_opened', { source: 'jobs_header' });
    setInboxLoadKey((k) => k + 1);
    setInboxOpen(true);
  }, []);

  const closeJobDetail = useCallback((options?: { animated?: boolean }) => {
    const animated = options?.animated !== false;
    // Swipe path already owns the exit animation — don't let a late call
    // re-enable a second slide.
    if (jobDetailSwipeClosingRef.current && animated) {
      return;
    }
    if (!animated) {
      jobDetailSwipeClosingRef.current = true;
    }
    analytics.capture('job_detail_closed', { destination: mainTab });
    setJobDetailInitialEditOpen(false);
    invalidateJobsList();
    if (Platform.OS === 'android') {
      setJobDetailExitAnimated(animated);
      setJobDetailOpen(false);
      return;
    }
    if (!animated) {
      setJobDetailModalAnimation('none');
      requestAnimationFrame(() => {
        setJobDetailOpen(false);
      });
      return;
    }
    setJobDetailModalAnimation('slide');
    setJobDetailOpen(false);
  }, [invalidateJobsList, mainTab]);

  /** Arm parent close guards as soon as swipe commit starts (before exit anim ends). */
  const onJobDetailSwipeDismissStart = useCallback(() => {
    jobDetailSwipeClosingRef.current = true;
    if (Platform.OS === 'android') {
      setJobDetailExitAnimated(false);
    } else {
      setJobDetailModalAnimation('none');
    }
  }, []);

  const onJobDetailSwipeDismissCancel = useCallback(() => {
    jobDetailSwipeClosingRef.current = false;
    setJobDetailExitAnimated(true);
    setJobDetailModalAnimation('slide');
  }, []);

  const openJobDetail = useCallback(
    (
      jobId: string | null | undefined,
      options?: { initialEditOpen?: boolean; entrySource?: string },
    ) => {
      if (options?.entrySource) setJobDetailEntrySource(options.entrySource);
      jobDetailSwipeClosingRef.current = false;
      setSelectedJobId(jobId ?? null);
      setJobDetailInitialEditOpen(options?.initialEditOpen ?? false);
      setJobDetailLoadKey((k) => k + 1);
      setJobDetailExitAnimated(true);
      setJobDetailModalAnimation('slide');
      setJobDetailMounted(true);
      setJobDetailOpen(true);
    },
    [],
  );

  const createJobAndOpen = useCallback(async (source: 'jobs_fab' | 'home_empty') => {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.');
    analytics.capture('job_create_started', { source });
    try {
      const jobId = await createBlankJobForCurrentUser(supabase);
      analytics.capture('job_created', { source, job_id: jobId, placeholder: true });
      invalidateJobsList();
      openJobDetail(jobId, { initialEditOpen: true, entrySource: source });
      return jobId;
    } catch (error) {
      analytics.capture('job_create_failed', { source });
      throw error;
    }
  }, [invalidateJobsList, openJobDetail]);

  useEffect(() => {
    if (jobDetailOpen) setJobDetailMounted(true);
  }, [jobDetailOpen]);

  // Android job detail is an in-tree overlay (not Dialog Modal) — handle back.
  useEffect(() => {
    if (Platform.OS !== 'android' || !jobDetailOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (topmostSheet) {
        sheetStackWriters?.requestCloseTopmost();
        return true;
      }
      if (jobDetailSwipeClosingRef.current) return true;
      closeJobDetail();
      return true;
    });
    return () => sub.remove();
  }, [closeJobDetail, jobDetailOpen, sheetStackWriters, topmostSheet]);

  useEffect(() => {
    if (mainTab !== 'home') setProfileOpen(false);
  }, [mainTab]);

  const onShellTabSelect = useCallback(
    (tab: ShellMainTab) => {
      analytics.capture('shell_tab_selected', {
        from_tab: mainTab,
        to_tab: tab,
        has_live_session: liveSession.hasLiveSession,
      });
      if (jobDetailOpen) {
        closeJobDetail();
      }
      if (inboxOpen) setInboxOpen(false);
      setMainTab(tab);
      // HOME tab tap closes Profile overlay (same tab stays selected).
      if (tab === 'home') setProfileOpen(false);
    },
    [closeJobDetail, inboxOpen, jobDetailOpen, liveSession.hasLiveSession, mainTab],
  );

  /**
   * After a live session ends or is deleted from the global overlay, only
   * touch Job Detail when it is already open for that job (refresh in place).
   * Ending from the tab shell should return the user to Home / Jobs / Earnings
   * — not push a new Job Detail navigation that can fail or trap them on an
   * error screen.
   */
  const onLiveSessionEnded = useCallback(
    (jobId: string) => {
      if (jobDetailOpen && selectedJobId === jobId) {
        setJobDetailLoadKey((k) => k + 1);
        return;
      }
      if (jobDetailOpen) {
        setJobDetailEntrySource('live_session_overlay');
        setSelectedJobId(jobId);
        setJobDetailInitialEditOpen(false);
        setJobDetailLoadKey((k) => k + 1);
      }
    },
    [jobDetailOpen, selectedJobId],
  );

  const currentScreen = useMemo(() => {
    if (!session) return 'sign_in' as const;
    if (jobDetailOpen) return 'job_detail' as const;
    if (inboxOpen) return 'inbox' as const;
    if (mainTab === 'home' && profileOpen) return 'profile' as const;
    return mainTab;
  }, [inboxOpen, jobDetailOpen, mainTab, profileOpen, session]);

  useEffect(() => {
    if (
      !session
      || analyticsConsentGate !== 'ready'
      || !analytics.isConsentGranted()
    ) {
      return;
    }
    analytics.identify(session.user.id, {
      ...emailProperties(session.user.email),
      auth_provider: 'supabase',
    });
  }, [analyticsConsentGate, session?.user.id, session?.user.email, session]);

  useEffect(() => {
    if (analyticsConsentGate !== 'ready' || !analytics.isConsentGranted()) {
      return;
    }
    analytics.screen(currentScreen, {
      auth_state: session ? 'authenticated' : 'anonymous',
      main_tab: mainTab,
      job_detail_open: jobDetailOpen,
      inbox_open: inboxOpen,
      profile_open: profileOpen,
      has_live_session: liveSession.hasLiveSession,
    });
  }, [
    analyticsConsentGate,
    currentScreen,
    inboxOpen,
    jobDetailOpen,
    liveSession.hasLiveSession,
    mainTab,
    profileOpen,
    session,
  ]);

  const openedTrackedRef = useRef(false);
  useEffect(() => {
    if (
      openedTrackedRef.current
      || analyticsConsentGate !== 'ready'
      || !analytics.isConsentGranted()
    ) {
      return;
    }
    openedTrackedRef.current = true;
    analytics.capture('app_opened', {
      auth_state: session ? 'authenticated' : loading ? 'loading' : 'anonymous',
      has_live_session: liveSession.hasLiveSession,
    });
  }, [analyticsConsentGate, liveSession.hasLiveSession, loading, session]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        analytics.capture('app_became_active', {
          auth_state: session ? 'authenticated' : 'anonymous',
          has_live_session: liveSession.hasLiveSession,
        });
      }
    });
    return () => sub.remove();
  }, [liveSession.hasLiveSession, session]);

  if (
    loading
    || (signupLegalPending && session)
    || (session && legalGate === 'loading')
    || (session && legalGate === 'ready' && analyticsConsentGate === 'loading')
  ) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <SignInScreen />;
  }

  return (
    <View style={styles.root}>
      {/*
        Mount these Modals only while shown. Leaving transparent RN Modals in the
        tree with visible={false} after they were presented can leave an invisible
        native host that swallows all taps (especially on iOS).
      */}
      {legalGate === 'blocked' ? (
        <LegalReacceptanceModal
          visible
          onAccepted={() => {
            void cacheLegalAcceptance({
              userId: session.user.id,
              privacyVersion: REQUIRED_PRIVACY_VERSION,
              termsVersion: REQUIRED_TERMS_VERSION,
            }).catch(() => {});
            setLegalGate('ready');
          }}
        />
      ) : null}
      {legalGate === 'ready' && analyticsConsentGate === 'prompt' ? (
        <AnalyticsConsentPromptModal
          visible
          userId={session.user.id}
          onResolved={() => setAnalyticsConsentGate('ready')}
        />
      ) : null}
      {legalGate === 'ready' && analyticsConsentGate === 'ready' ? (
        <>
      {inboxMounted ? (
        <OverlaySlideHost
          visible={inboxOpen}
          axis="horizontal"
          onRequestClose={() => {
            analytics.capture('inbox_closed', { destination: mainTab });
            setInboxOpen(false);
          }}
          onExited={() => setInboxMounted(false)}
        >
          <InboxScreen
            loadKey={inboxLoadKey}
            onRequestClose={() => {
              analytics.capture('inbox_closed', { destination: mainTab });
              setInboxOpen(false);
            }}
            onSelectShellTab={(tab) => {
              analytics.capture('shell_tab_selected', {
                from_tab: 'inbox',
                to_tab: tab,
                has_live_session: liveSession.hasLiveSession,
              });
              analytics.capture('inbox_closed', { destination: tab });
              setInboxOpen(false);
              setMainTab(tab);
              if (tab === 'home') setProfileOpen(false);
            }}
          />
        </OverlaySlideHost>
      ) : (
        <View style={styles.shellColumn}>
          <View style={styles.shellMain}>
            <View style={tabPaneStyle(mainTab === 'home')}>
              <HomeScreen
                onCreateFirstJob={() => createJobAndOpen('home_empty')}
                onOpenProfile={() => {
                  analytics.capture('profile_opened_from_home', {});
                  setProfileOpen(true);
                }}
                onOpenEarnings={() => {
                  analytics.capture('home_earnings_pressed', {});
                  analytics.capture('earnings_opened', {
                    source: 'home_weekly_snapshot',
                    window: 'week',
                  });
                  setEarningsWindow('week');
                  setMainTab('earnings');
                }}
                onOpenJobDetail={(jobId, options) => {
                  openJobDetail(jobId, {
                    ...options,
                    entrySource: 'home',
                  });
                }}
                onOpenJobsOpenTab={navigateToJobsOpenSection}
              />
            </View>
            <View style={tabPaneStyle(mainTab === 'jobs')}>
              <JobsScreen
                onCreateJob={() => createJobAndOpen('jobs_fab')}
                isActive={mainTab === 'jobs'}
                jobsListTab={jobsListTab}
                onJobsListTabChange={setJobsListTab}
                openScrollToSection={jobsOpenScrollTarget}
                openScrollNonce={jobsOpenScrollNonce}
                onOpenScrollToSectionHandled={clearJobsOpenScrollTarget}
                suppressFab={liveSession.hasLiveSession}
                onOpenInbox={openInbox}
                onOpenJobDetail={(jobId?: string, options?: { initialEditOpen?: boolean }) => {
                  openJobDetail(jobId, {
                    ...options,
                    entrySource: options?.initialEditOpen ? 'jobs_new_job' : 'jobs_list',
                  });
                }}
              />
            </View>
            <View style={tabPaneStyle(mainTab === 'earnings')}>
              <EarningsScreen
                isActive={mainTab === 'earnings'}
                window={earningsWindow}
                onWindowChange={setEarningsWindow}
                onOpenJobsOpenTab={() => navigateToJobsOpenSection('unpaid')}
                onOpenJobDetail={(jobId?: string) => {
                  openJobDetail(jobId, { entrySource: 'earnings' });
                }}
              />
            </View>
          </View>
          <ShellBottomNav selected={mainTab} onSelect={onShellTabSelect} />
          {profileMounted ? (
            <View style={styles.profileOverlayPane}>
              <OverlaySlideHost
                visible={profileOpen}
                axis="horizontal"
                onRequestClose={() => setProfileOpen(false)}
                onExited={() => setProfileMounted(false)}
              >
                <ProfileScreen
                  onBack={() => setProfileOpen(false)}
                  onSelectShellTab={onShellTabSelect}
                />
              </OverlaySlideHost>
            </View>
          ) : null}
        </View>
      )}

      <LiveSessionOverlay onSessionEnded={({ jobId }) => onLiveSessionEnded(jobId)} />

      {Platform.OS === 'android' && jobDetailMounted ? (
        <View style={styles.jobDetailOverlayHost} testID="job-detail-modal">
          <OverlaySlideHost
            visible={jobDetailOpen}
            axis="vertical"
            enableSwipeDismiss={false}
            exitAnimated={jobDetailExitAnimated}
            onRequestClose={() => closeJobDetail()}
            onExited={() => {
              setJobDetailMounted(false);
              setJobDetailExitAnimated(true);
            }}
          >
            <View style={styles.jobDetailModalRoot}>
              <JobDetailScreen
                loadKey={jobDetailLoadKey}
                jobId={selectedJobId}
                entrySource={jobDetailEntrySource}
                initialEditOpen={jobDetailInitialEditOpen}
                sessionUserId={session.user.id}
                sessionEmail={session.user.email ?? null}
                onRequestClose={closeJobDetail}
                onSwipeDismissStart={onJobDetailSwipeDismissStart}
                onSwipeDismissCancel={onJobDetailSwipeDismissCancel}
              />
            </View>
          </OverlaySlideHost>
        </View>
      ) : null}

      {Platform.OS !== 'android' && jobDetailMounted ? (
      <Modal
        testID="job-detail-modal"
        visible={jobDetailOpen}
        animationType={jobDetailModalAnimation}
        presentationStyle="fullScreen"
        onRequestClose={() => closeJobDetail()}
        onDismiss={() => {
          setJobDetailMounted(false);
          setJobDetailModalAnimation('slide');
          jobDetailSwipeClosingRef.current = false;
        }}
      >
        <GestureHandlerRootView style={styles.jobDetailModalRoot}>
          <JobDetailScreen
            loadKey={jobDetailLoadKey}
            jobId={selectedJobId}
            entrySource={jobDetailEntrySource}
            initialEditOpen={jobDetailInitialEditOpen}
            sessionUserId={session.user.id}
            sessionEmail={session.user.email ?? null}
            onRequestClose={closeJobDetail}
            onSwipeDismissStart={onJobDetailSwipeDismissStart}
            onSwipeDismissCancel={onJobDetailSwipeDismissCancel}
          />
        </GestureHandlerRootView>
      </Modal>
      ) : null}
        </>
      ) : null}
    </View>
  );
}

export default function App() {
  const configured = isSupabaseConfigured();
  return (
    <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider style={styles.root}>
      <View style={styles.root}>
        {configured ? (
          <AuthProvider>
            <BottomSheetStackProvider>
              <JobsListInvalidationProvider>
                <LiveSessionProvider>
                  <AuthenticatedShell />
                </LiveSessionProvider>
              </JobsListInvalidationProvider>
            </BottomSheetStackProvider>
          </AuthProvider>
        ) : (
          <View style={[styles.root, styles.centered]}>
            <Text style={styles.configText}>
              Missing Supabase env vars. Set `EXPO_PUBLIC_SUPABASE_URL` and
              `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
            </Text>
          </View>
        )}
        <StatusBar style="dark" />
      </View>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function tabPaneStyle(visible: boolean): StyleProp<ViewStyle> {
  return visible ? styles.tabPaneVisible : styles.tabPaneHidden;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color('Foundation/Background/Default'),
  },
  shellColumn: {
    flex: 1,
    width: '100%',
    /** Match tab screens + bottom nav cream fill. */
    backgroundColor: bg.canvasWarm,
  },
  shellMain: {
    flex: 1,
    backgroundColor: bg.canvasWarm,
  },
  tabPaneVisible: {
    flex: 1,
  },
  tabPaneHidden: {
    display: 'none',
  },
  profileOverlayPane: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    elevation: 20,
  },
  /** Above live-session chrome (zIndex 1100) so Android job detail covers the shell. */
  jobDetailOverlayHost: {
    ...StyleSheet.absoluteFill,
    zIndex: 1200,
    elevation: 1200,
  },
  jobDetailModalRoot: {
    flex: 1,
    backgroundColor: bg.canvasWarm,
    overflow: 'visible',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  configText: {
    color: color('Foundation/Text/Primary'),
    paddingHorizontal: 24,
    textAlign: 'center',
  },
});
