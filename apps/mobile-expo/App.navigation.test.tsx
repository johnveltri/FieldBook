import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderRouter, testRouter } from 'expo-router/testing-library';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

let mockSession: { user: { id: string; email: string } } | null = {
  user: { id: 'user-77', email: 'tech@example.com' },
};

jest.mock('@fieldsolo/api-client', () => ({
  fetchLatestLegalAcceptanceVersions: jest.fn(async () => ({
    privacy_policy: '2026-07-03',
    terms: '2026-07-03',
  })),
  needsLegalReacceptance: jest.fn(() => false),
}));

jest.mock('./src/lib/analytics/consentSync', () => ({
  resolveAnalyticsConsentForUser: jest.fn(async () => 'granted'),
  syncAnalyticsConsentForUser: jest.fn(async () => undefined),
  grantAnalyticsConsent: jest.fn(async () => undefined),
  withdrawAnalyticsConsent: jest.fn(async () => undefined),
}));

jest.mock('./src/components/AnalyticsConsentPromptModal', () => ({
  AnalyticsConsentPromptModal: () => null,
}));

jest.mock('./src/components/LegalReacceptanceModal', () => ({
  LegalReacceptanceModal: () => null,
}));

jest.mock('./src/lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => true),
  supabase: {},
}));

jest.mock('./src/context/AuthContext', () => {
  const React = require('react');
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => ({
      loading: false,
      signupLegalPending: false,
      setSignupLegalPending: jest.fn(),
      session: mockSession,
    }),
  };
});

jest.mock('./src/lib/analytics', () => ({
  analytics: {
    capture: jest.fn(),
    identify: jest.fn(),
    screen: jest.fn(),
    onSignOut: jest.fn(async () => undefined),
    applyConsent: jest.fn(async () => undefined),
    isConsentGranted: jest.fn(() => true),
  },
  emailProperties: () => ({}),
}));

jest.mock('./src/context/LiveSessionContext', () => {
  const React = require('react');
  return {
    LiveSessionProvider: ({ children }: { children: React.ReactNode }) => children,
    useLiveSession: () => ({
      liveSession: null,
      hydrating: false,
      hasLiveSession: false,
      mode: 'hidden' as const,
      startLiveSession: jest.fn(),
      openSheet: jest.fn(),
      minimize: jest.fn(),
      openEditSheet: jest.fn(),
      closeEditSheet: jest.fn(),
      minimizeFromEdit: jest.fn(),
      endLiveSessionNow: jest.fn(),
      updateLiveSessionStartedAt: jest.fn(),
      deleteLiveSessionNow: jest.fn(),
      updateLiveSessionJobShortDescription: jest.fn(),
      refresh: jest.fn(),
    }),
    useHasLiveSession: () => false,
  };
});

jest.mock('./src/components/LiveSessionOverlay', () => ({
  LiveSessionOverlay: () => null,
}));

jest.mock('./src/components/shell/PrimaryActionOverlay', () => ({
  PrimaryActionOverlay: () => null,
}));

jest.mock('./src/navigation/OverlaySlideHost', () => {
  const React = require('react');
  return {
    OverlaySlideHost: ({
      children,
      visible,
      onExited,
    }: {
      children: React.ReactNode;
      visible: boolean;
      onExited?: () => void;
    }) => {
      React.useEffect(() => {
        if (!visible) onExited?.();
      }, [visible, onExited]);
      if (!visible) return null;
      return children;
    },
  };
});

jest.mock('./src/screens/SignInScreen', () => ({
  SignInScreen: () => {
    const { Text } = require('react-native');
    return <Text>SignInScreen</Text>;
  },
}));

jest.mock('./src/screens/JobsScreen', () => ({
  JobsScreen: ({
    onOpenJobDetail,
    onOpenInbox,
  }: {
    onOpenJobDetail: (jobId?: string) => void;
    onOpenInbox?: () => void;
  }) => {
    const React = require('react');
    const { Text, View } = require('react-native');
    React.useEffect(() => {
      jobsMountCount += 1;
    }, []);
    return (
      <View>
        <Text testID="jobs-screen">JobsScreen</Text>
        <Text onPress={() => onOpenJobDetail('job-abc-9')}>OpenJob</Text>
        <Text onPress={() => onOpenInbox?.()}>OpenInbox</Text>
      </View>
    );
  },
}));

type ShellTab = 'home' | 'jobs' | 'earnings';

jest.mock('./src/screens/JobDetailScreen', () => ({
  JobDetailScreen: ({
    jobId,
    loadKey,
    sessionUserId,
    onRequestClose,
    onSelectShellTab,
  }: {
    jobId?: string | null;
    loadKey?: number;
    sessionUserId?: string;
    onRequestClose?: () => void;
    onSelectShellTab?: (tab: ShellTab) => void;
  }) => {
    const { Text, View } = require('react-native');
    return (
      <View>
        <Text testID="detail-props">{`jobId:${jobId ?? 'null'}|loadKey:${loadKey ?? 0}|user:${sessionUserId ?? ''}`}</Text>
        <Text onPress={() => onRequestClose?.()}>CloseDetail</Text>
        <Text onPress={() => onSelectShellTab?.('home')}>DetailNavHome</Text>
        <Text onPress={() => onSelectShellTab?.('jobs')}>DetailNavJobs</Text>
        <Text onPress={() => onSelectShellTab?.('earnings')}>DetailNavEarnings</Text>
      </View>
    );
  },
}));

let homeMountCount = 0;
let jobsMountCount = 0;
let earningsMountCount = 0;

jest.mock('./src/screens/HomeScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    HomeScreen: ({ onOpenProfile }: { onOpenProfile?: () => void }) => {
      React.useEffect(() => {
        homeMountCount += 1;
      }, []);
      return (
        <>
          <Text testID="home-screen">HomeScreen</Text>
          <Text onPress={() => onOpenProfile?.()}>OpenProfile</Text>
        </>
      );
    },
  };
});

jest.mock('./src/screens/EarningsScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    EarningsScreen: () => {
      React.useEffect(() => {
        earningsMountCount += 1;
      }, []);
      return <Text testID="earnings-screen">EarningsScreen</Text>;
    },
  };
});

jest.mock('./src/screens/ProfileScreen', () => {
  const { Text } = require('react-native');
  return {
    ProfileScreen: () => <Text testID="profile-screen">ProfileScreen</Text>,
  };
});

jest.mock('./src/screens/InboxScreen', () => ({
  InboxScreen: ({
    onRequestClose,
    onSelectShellTab,
  }: {
    onRequestClose?: () => void;
    onSelectShellTab?: (tab: ShellTab) => void;
  }) => {
    const { Text, View } = require('react-native');
    return (
      <View>
        <Text testID="inbox-screen">InboxScreen</Text>
        <Text onPress={() => onRequestClose?.()}>CloseInbox</Text>
        <Text onPress={() => onSelectShellTab?.('home')}>InboxNavHome</Text>
        <Text onPress={() => onSelectShellTab?.('jobs')}>InboxNavJobs</Text>
        <Text onPress={() => onSelectShellTab?.('earnings')}>InboxNavEarnings</Text>
      </View>
    );
  },
}));

jest.mock('./src/shell/QuickActionsFlowContext', () => ({
  QuickActionsFlowProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuickActionsFlow: () => ({
    handlePrimaryAction: jest.fn(),
    quickActionsVisible: false,
  }),
}));

async function openJobsTab(screen: ReturnType<typeof renderRouter>) {
  testRouter.navigate('/jobs');
  await waitFor(() => expect(screen.getByTestId('jobs-screen')).toBeTruthy());
}

async function renderAppReady() {
  const screen = renderRouter('./app', { initialUrl: '/' });
  await waitFor(() => {
    expect(screen.getByTestId('home-screen')).toBeTruthy();
  });
  return screen;
}

describe('App jobs to detail sync', () => {
  beforeEach(() => {
    mockSession = { user: { id: 'user-77', email: 'tech@example.com' } };
    homeMountCount = 0;
    jobsMountCount = 0;
    earningsMountCount = 0;
  });

  it('passes selected job id and session user id into JobDetailScreen', async () => {
    const screen = await renderAppReady();

    await openJobsTab(screen);
    expect(screen.getByTestId('jobs-screen')).toBeTruthy();

    fireEvent.press(screen.getByText('OpenJob'));

    expect(screen.getByTestId('detail-props').props.children).toContain('jobId:job-abc-9');
    expect(screen.getByTestId('detail-props').props.children).toContain('user:user-77');
    expect(screen.getByTestId('detail-props').props.children).toContain('loadKey:1');
  });

  it('returns to JobsScreen when detail requests close', async () => {
    const screen = await renderAppReady();

    await openJobsTab(screen);
    fireEvent.press(screen.getByText('OpenJob'));
    expect(screen.getByTestId('detail-props')).toBeTruthy();

    fireEvent.press(screen.getByText('CloseDetail'));
    expect(screen.getByTestId('jobs-screen')).toBeTruthy();
  });
});

describe('App shell tab caching', () => {
  beforeEach(() => {
    mockSession = { user: { id: 'user-77', email: 'tech@example.com' } };
    homeMountCount = 0;
    jobsMountCount = 0;
    earningsMountCount = 0;
  });

  it('keeps tab screens mounted when switching between HOME, JOBS, and EARNINGS', async () => {
    const screen = await renderAppReady();

    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(homeMountCount).toBe(1);
    expect(jobsMountCount).toBe(0);
    expect(earningsMountCount).toBe(0);

    testRouter.navigate('/earnings');
    await waitFor(() => expect(screen.getByTestId('earnings-screen')).toBeTruthy());
    expect(earningsMountCount).toBeGreaterThanOrEqual(1);

    await openJobsTab(screen);
    expect(jobsMountCount).toBeGreaterThanOrEqual(1);

    testRouter.navigate('/earnings');
    await waitFor(() => expect(screen.getByTestId('earnings-screen')).toBeTruthy());
  });
});

describe('App inbox shell tab navigation', () => {
  beforeEach(() => {
    mockSession = { user: { id: 'user-77', email: 'tech@example.com' } };
    homeMountCount = 0;
    jobsMountCount = 0;
    earningsMountCount = 0;
  });

  it('returns to JobsScreen when the JOBS tab is tapped from Inbox', async () => {
    const screen = await renderAppReady();

    await openJobsTab(screen);
    fireEvent.press(screen.getByText('OpenInbox'));
    expect(screen.getByTestId('inbox-screen')).toBeTruthy();

    fireEvent.press(screen.getByText('InboxNavJobs'));
    expect(screen.queryByTestId('inbox-screen')).toBeNull();
    expect(screen.getByTestId('jobs-screen')).toBeTruthy();
  });

  it('switches to HOME and dismisses Inbox when the HOME tab is tapped from Inbox', async () => {
    const screen = await renderAppReady();

    await openJobsTab(screen);
    fireEvent.press(screen.getByText('OpenInbox'));
    expect(screen.getByTestId('inbox-screen')).toBeTruthy();

    fireEvent.press(screen.getByText('InboxNavHome'));
    expect(screen.queryByTestId('inbox-screen')).toBeNull();
    expect(screen.getByTestId('home-screen')).toBeTruthy();
  });

  it('switches to EARNINGS and dismisses Inbox when the EARNINGS tab is tapped from Inbox', async () => {
    const screen = await renderAppReady();

    await openJobsTab(screen);
    fireEvent.press(screen.getByText('OpenInbox'));
    expect(screen.getByTestId('inbox-screen')).toBeTruthy();

    fireEvent.press(screen.getByText('InboxNavEarnings'));
    expect(screen.queryByTestId('inbox-screen')).toBeNull();
    expect(screen.getByTestId('earnings-screen')).toBeTruthy();
  });
});

describe('App authentication navigation reset', () => {
  beforeEach(() => {
    mockSession = { user: { id: 'user-77', email: 'tech@example.com' } };
    homeMountCount = 0;
    jobsMountCount = 0;
    earningsMountCount = 0;
  });

  it('returns a user to Home after signing out from Profile and signing in again', async () => {
    const screen = await renderAppReady();

    fireEvent.press(screen.getByText('OpenProfile'));
    expect(screen.getByTestId('profile-screen')).toBeTruthy();

    mockSession = null;
    const signedOut = renderRouter('./app', { initialUrl: '/sign-in' });
    await waitFor(() => expect(signedOut.getByText('SignInScreen')).toBeTruthy());

    mockSession = { user: { id: 'user-88', email: 'returning@example.com' } };
    const signedIn = renderRouter('./app', { initialUrl: '/' });
    await waitFor(() => expect(signedIn.getByTestId('home-screen')).toBeTruthy());
    expect(signedIn.queryByTestId('profile-screen')).toBeNull();
  });
});
