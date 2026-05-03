import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import App from './App';

jest.mock('./src/lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => true),
}));

jest.mock('./src/context/AuthContext', () => {
  const React = require('react');
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => ({
      loading: false,
      session: { user: { id: 'user-77', email: 'tech@example.com' } },
    }),
  };
});

// Stub out the global Live Session UI so tests don't hit Supabase / fonts
// / AppState while exercising the JobsScreen ↔ JobDetailScreen pipe.
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

jest.mock('./src/screens/SignInScreen', () => ({
  SignInScreen: () => {
    const { Text } = require('react-native');
    return <Text>SignInScreen</Text>;
  },
}));

jest.mock('./src/screens/JobsScreen', () => ({
  JobsScreen: ({
    onOpenJobDetail,
  }: {
    onOpenJobDetail: (jobId?: string) => void;
  }) => {
    const { Text, View } = require('react-native');
    return (
      <View>
        <Text testID="jobs-screen">JobsScreen</Text>
        <Text onPress={() => onOpenJobDetail('job-abc-9')}>OpenJob</Text>
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

jest.mock('./src/screens/HomeScreen', () => {
  const { Text } = require('react-native');
  return {
    HomeScreen: () => <Text testID="home-screen">HomeScreen</Text>,
  };
});

jest.mock('./src/screens/EarningsScreen', () => {
  const { Text } = require('react-native');
  return {
    EarningsScreen: () => <Text testID="earnings-screen">EarningsScreen</Text>,
  };
});

jest.mock('./src/screens/ProfileScreen', () => {
  const { Text } = require('react-native');
  return {
    ProfileScreen: () => <Text testID="profile-screen">ProfileScreen</Text>,
  };
});

jest.mock('./src/components/shell/ShellBottomNav', () => ({
  ShellBottomNav: () => null,
  shellBottomNavOuterHeight: () => 0,
}));

describe('App jobs to detail sync', () => {
  it('passes selected job id and session user id into JobDetailScreen', () => {
    const screen = render(<App />);

    expect(screen.getByTestId('jobs-screen')).toBeTruthy();

    fireEvent.press(screen.getByText('OpenJob'));

    expect(screen.getByTestId('detail-props').props.children).toContain('jobId:job-abc-9');
    expect(screen.getByTestId('detail-props').props.children).toContain('user:user-77');
    expect(screen.getByTestId('detail-props').props.children).toContain('loadKey:1');
  });

  it('returns to JobsScreen when detail requests close', () => {
    const screen = render(<App />);

    fireEvent.press(screen.getByText('OpenJob'));
    expect(screen.getByTestId('detail-props')).toBeTruthy();

    fireEvent.press(screen.getByText('CloseDetail'));
    expect(screen.getByTestId('jobs-screen')).toBeTruthy();
  });

  it('switches to HOME and dismisses Job Detail when the HOME tab is tapped from inside detail', () => {
    const screen = render(<App />);

    fireEvent.press(screen.getByText('OpenJob'));
    expect(screen.getByTestId('detail-props')).toBeTruthy();

    fireEvent.press(screen.getByText('DetailNavHome'));
    expect(screen.queryByTestId('detail-props')).toBeNull();
    expect(screen.getByTestId('home-screen')).toBeTruthy();
  });

  it('switches to EARNINGS and dismisses Job Detail when the EARNINGS tab is tapped from inside detail', () => {
    const screen = render(<App />);

    fireEvent.press(screen.getByText('OpenJob'));
    expect(screen.getByTestId('detail-props')).toBeTruthy();

    fireEvent.press(screen.getByText('DetailNavEarnings'));
    expect(screen.queryByTestId('detail-props')).toBeNull();
    expect(screen.getByTestId('earnings-screen')).toBeTruthy();
  });

  it('returns to JobsScreen when the JOBS tab is tapped from inside Job Detail', () => {
    const screen = render(<App />);

    fireEvent.press(screen.getByText('OpenJob'));
    expect(screen.getByTestId('detail-props')).toBeTruthy();

    fireEvent.press(screen.getByText('DetailNavJobs'));
    expect(screen.queryByTestId('detail-props')).toBeNull();
    expect(screen.getByTestId('jobs-screen')).toBeTruthy();
  });
});
