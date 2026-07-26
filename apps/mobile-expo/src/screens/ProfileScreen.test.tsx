import React from 'react';
import { Alert, Linking } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ProfileScreen } from './ProfileScreen';

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('../components/CanvasTiledBackground', () => ({
  CanvasTiledBackground: () => null,
}));

const mockSignOut = jest.fn(async () => {});
const mockUpdatePassword = jest.fn(async () => ({ error: null }));
const mockDeleteAccount = jest.fn(async () => ({ error: null }));

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'tech@example.com' } },
    user: { id: 'user-1', email: 'tech@example.com' },
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: mockSignOut,
    updatePassword: mockUpdatePassword,
    deleteAccount: mockDeleteAccount,
  }),
}));

jest.mock('../lib/supabase', () => ({
  supabase: {},
  isSupabaseConfigured: () => true,
}));

jest.mock('../lib/analytics/consentSync', () => ({
  resolveAnalyticsConsentForUser: jest.fn(async () => 'withdrawn'),
  grantAnalyticsConsent: jest.fn(async () => undefined),
  withdrawAnalyticsConsent: jest.fn(async () => undefined),
}));

type ProfileShape = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  trades: string[];
};
const mockFetchProfile = jest.fn<() => Promise<ProfileShape | null>>();
const mockUpdateProfile = jest.fn<() => Promise<ProfileShape>>();
jest.mock('@fieldsolo/api-client', () => ({
  fetchCurrentUserProfile: (...args: unknown[]) => mockFetchProfile(...(args as [])),
  updateCurrentUserProfile: (...args: unknown[]) => mockUpdateProfile(...(args as [])),
}));

jest.mock('../components/shell/ShellBottomNav', () => ({
  ShellBottomNav: () => null,
  shellBottomNavOuterHeight: () => 80,
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchProfile.mockResolvedValue({
      id: 'user-1',
      firstName: 'Alex',
      lastName: 'Builder',
      trades: ['Plumbing', 'Handyman'],
    });
  });

  it('renders all three section headers and the user info', async () => {
    const screen = render(<ProfileScreen onBack={jest.fn()} onSelectShellTab={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Alex Builder')).toBeTruthy();
    });
    expect(screen.getByText('Personal Info')).toBeTruthy();
    expect(screen.getByText('Plan')).toBeTruthy();
    expect(screen.getByText('Account')).toBeTruthy();
    expect(screen.getByText('tech@example.com')).toBeTruthy();
    expect(screen.getByText('Plumbing, Handyman')).toBeTruthy();
  });

  it('logs the user out when "Log out" is pressed', async () => {
    const screen = render(<ProfileScreen onBack={jest.fn()} onSelectShellTab={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Log out')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Log out'));
    });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('opens a prefilled feedback email from the primary profile button', async () => {
    const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const screen = render(<ProfileScreen onBack={jest.fn()} onSelectShellTab={jest.fn()} />);

    await waitFor(() => expect(screen.getByText('Send feedback')).toBeTruthy());
    fireEvent.press(screen.getByText('Send feedback'));

    await waitFor(() => {
      expect(openUrlSpy).toHaveBeenCalledWith(expect.stringContaining('mailto:support@fieldsolo.com'));
    });
    openUrlSpy.mockRestore();
  });

  it('opens the Update Profile sheet from the EDIT pill even when no profile row exists', async () => {
    mockFetchProfile.mockResolvedValueOnce(null);
    const screen = render(<ProfileScreen onBack={jest.fn()} onSelectShellTab={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Personal Info')).toBeTruthy();
    });
    fireEvent.press(screen.getByLabelText('EDIT'));
    await waitFor(() => {
      expect(screen.getByText('Update Profile')).toBeTruthy();
    });
  });

  it('opens Privacy from the account section', async () => {
    const screen = render(<ProfileScreen onBack={jest.fn()} onSelectShellTab={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Privacy')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Privacy'));
    await waitFor(() => {
      expect(screen.getByText('PRIVACY')).toBeTruthy();
    });
  });

  it('opens Help from the account section', async () => {
    const screen = render(<ProfileScreen onBack={jest.fn()} onSelectShellTab={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Help')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Help'));
    await waitFor(() => {
      expect(screen.getByText('HELP')).toBeTruthy();
      expect(screen.getByText('support@fieldsolo.com')).toBeTruthy();
    });
  });

  it('opens the delete account sheet before showing the system confirmation', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const screen = render(<ProfileScreen onBack={jest.fn()} onSelectShellTab={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Delete account')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Delete account'));
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByText('Delete Account')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('delete account'), 'delete account');
    fireEvent.press(screen.getByLabelText('DELETE ACCOUNT'));

    expect(alertSpy).toHaveBeenCalled();
    const [title] = alertSpy.mock.calls[0];
    expect(title).toBe('Delete account?');
    alertSpy.mockRestore();
  });
});
