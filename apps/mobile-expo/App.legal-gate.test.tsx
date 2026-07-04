import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import App from './App';

const mockFetchLatestLegalAcceptanceVersions = jest.fn(async () => ({
  privacy_policy: '2026-01-01',
  terms: '2026-01-01',
}));
const mockNeedsLegalReacceptance = jest.fn(() => true);

jest.mock('@fieldsolo/api-client', () => ({
  fetchLatestLegalAcceptanceVersions: (...args: unknown[]) =>
    mockFetchLatestLegalAcceptanceVersions(...(args as [])),
  needsLegalReacceptance: (...args: unknown[]) =>
    mockNeedsLegalReacceptance(...(args as [])),
}));

jest.mock('./src/lib/analytics/consentSync', () => ({
  resolveAnalyticsConsentForUser: jest.fn(async () => 'granted'),
}));

jest.mock('./src/components/AnalyticsConsentPromptModal', () => ({
  AnalyticsConsentPromptModal: () => null,
}));

jest.mock('./src/components/LegalReacceptanceModal', () => ({
  LegalReacceptanceModal: ({ visible }: { visible: boolean }) => {
    const { Text } = require('react-native');
    return visible ? (
      <Text testID="legal-reacceptance-modal">Updated legal terms</Text>
    ) : null;
  },
}));

jest.mock('./src/lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => true),
  supabase: {},
}));

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

jest.mock('./src/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    loading: false,
    signupLegalPending: false,
    setSignupLegalPending: jest.fn(),
    session: { user: { id: 'user-77', email: 'tech@example.com' } },
  }),
}));

jest.mock('./src/context/LiveSessionContext', () => ({
  LiveSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useLiveSession: () => ({
    liveSession: null,
    hydrating: false,
    hasLiveSession: false,
    refresh: jest.fn(),
  }),
}));

jest.mock('./src/components/LiveSessionOverlay', () => ({
  LiveSessionOverlay: () => null,
}));

jest.mock('./src/screens/SignInScreen', () => ({
  SignInScreen: () => {
    const { Text } = require('react-native');
    return <Text>SignInScreen</Text>;
  },
}));

jest.mock('./src/screens/HomeScreen', () => ({
  HomeScreen: () => {
    const { Text } = require('react-native');
    return <Text testID="home-screen">HomeScreen</Text>;
  },
}));

jest.mock('./src/screens/JobsScreen', () => ({
  JobsScreen: () => {
    const { Text } = require('react-native');
    return <Text testID="jobs-screen">JobsScreen</Text>;
  },
}));

jest.mock('./src/screens/EarningsScreen', () => ({
  EarningsScreen: () => {
    const { Text } = require('react-native');
    return <Text testID="earnings-screen">EarningsScreen</Text>;
  },
}));

jest.mock('./src/screens/ProfileScreen', () => ({
  ProfileScreen: () => {
    const { Text } = require('react-native');
    return <Text testID="profile-screen">ProfileScreen</Text>;
  },
}));

jest.mock('./src/screens/InboxScreen', () => ({
  InboxScreen: () => null,
}));

jest.mock('./src/screens/JobDetailScreen', () => ({
  JobDetailScreen: () => null,
}));

jest.mock('./src/components/shell/ShellBottomNav', () => ({
  ShellBottomNav: () => null,
  shellBottomNavOuterHeight: () => 0,
}));

describe('App legal reacceptance gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNeedsLegalReacceptance.mockReturnValue(true);
  });

  it('shows the reacceptance modal when required versions are not accepted', async () => {
    const screen = render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('legal-reacceptance-modal')).toBeTruthy();
    });
    expect(mockFetchLatestLegalAcceptanceVersions).toHaveBeenCalled();
    expect(mockNeedsLegalReacceptance).toHaveBeenCalled();
  });
});
