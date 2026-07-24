import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import { SignInScreen } from './SignInScreen';

const mockSignIn = jest.fn(async () => ({ error: null, session: null }));
const mockSignUp = jest.fn(async () => ({ error: null, session: { user: { id: 'user-1' } } }));
const mockSetSignupLegalPending = jest.fn();

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    setSignupLegalPending: mockSetSignupLegalPending,
  }),
}));

jest.mock('../components/CanvasTiledBackground', () => ({
  CanvasTiledBackground: () => null,
}));

jest.mock('../lib/analytics', () => ({
  analytics: {
    capture: jest.fn(),
  },
  emailProperties: () => ({}),
  errorProperties: () => ({}),
}));

const mockRecordSignupLegalAcceptances = jest.fn(async () => undefined);
const mockCacheLegalAcceptance = jest.fn(async () => undefined);

jest.mock('@fieldsolo/api-client', () => ({
  recordSignupLegalAcceptances: (...args: unknown[]) =>
    mockRecordSignupLegalAcceptances(...(args as [])),
}));

jest.mock('../lib/supabase', () => ({
  supabase: {},
}));

jest.mock('../lib/legalAcceptanceStorage', () => ({
  cacheLegalAcceptance: (...args: unknown[]) =>
    mockCacheLegalAcceptance(...(args as [])),
}));

describe('SignInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows sign-in instructions in sign-in mode', () => {
    const { getByText } = render(<SignInScreen />);

    expect(getByText('Sign in with email and password')).toBeTruthy();
  });

  it('shows sign-up instructions in sign-up mode', () => {
    const screen = render(<SignInScreen />);

    fireEvent.press(screen.getByText('Need an account? Sign up'));

    expect(screen.getByText('Create an account with email and password')).toBeTruthy();
  });

  it('marks the brand title as an accessibility header', () => {
    const { getByText } = render(<SignInScreen />);

    expect(getByText('FieldSolo').props.accessibilityRole).toBe('header');
  });

  it('renders the FieldSolo brand name', () => {
    const { getByText } = render(<SignInScreen />);

    expect(getByText('FieldSolo')).toBeTruthy();
  });

  it('shows privacy policy and terms links on sign in', () => {
    const { getAllByText } = render(<SignInScreen />);

    expect(getAllByText('Privacy Policy').length).toBeGreaterThan(0);
    expect(getAllByText('Terms').length).toBeGreaterThan(0);
  });

  it('requires the legal checkbox before creating an account', async () => {
    const screen = render(<SignInScreen />);

    fireEvent.press(screen.getByText('Need an account? Sign up'));
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'tech@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Alex'), 'Alex');
    fireEvent.changeText(screen.getByPlaceholderText('Builder'), 'Builder');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'password123');

    await act(async () => {
      fireEvent.press(screen.getByText('Create account'));
    });

    expect(
      screen.getByText('Agree to the Privacy Policy and Terms to create an account.'),
    ).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('submits sign up after the legal checkbox is checked', async () => {
    const screen = render(<SignInScreen />);

    fireEvent.press(screen.getByText('Need an account? Sign up'));
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'tech@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Alex'), 'Alex');
    fireEvent.changeText(screen.getByPlaceholderText('Builder'), 'Builder');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'password123');
    fireEvent.press(screen.getByRole('checkbox'));

    await act(async () => {
      fireEvent.press(screen.getByText('Create account'));
    });

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1);
      expect(mockRecordSignupLegalAcceptances).toHaveBeenCalledTimes(1);
      expect(mockCacheLegalAcceptance).toHaveBeenCalledWith({
        userId: 'user-1',
        privacyVersion: '2026-07-20',
        termsVersion: '2026-07-20',
      });
    });
  });
});
