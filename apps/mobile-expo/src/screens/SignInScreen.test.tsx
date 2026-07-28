import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Keyboard } from 'react-native';

import { SignInScreen } from './SignInScreen';

const mockSignIn = jest.fn<
  (...args: unknown[]) => Promise<{ error: Error | null; session: null }>
>(async () => ({ error: null, session: null }));
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
    mockSignIn.mockResolvedValue({ error: null, session: null });
    mockSignUp.mockResolvedValue({ error: null, session: { user: { id: 'user-1' } } });
  });

  it('shows sign-in instructions in sign-in mode', () => {
    const { getByText } = render(<SignInScreen />);

    expect(getByText('Welcome back')).toBeTruthy();
    expect(getByText('Sign in to keep track of your jobs, time & earnings.')).toBeTruthy();
  });

  it('shows sign-up instructions in sign-up mode', () => {
    const screen = render(<SignInScreen />);

    fireEvent.press(screen.getByText('Create an account'));

    expect(screen.getByText('Create your account')).toBeTruthy();
  });

  it('marks the brand title as an accessibility header', () => {
    const { getByText } = render(<SignInScreen />);

    expect(getByText('FIELDSOLI').props.accessibilityRole).toBe('header');
  });

  it('renders the FieldSoli brand name', () => {
    const { getByText } = render(<SignInScreen />);

    expect(getByText('FIELDSOLI')).toBeTruthy();
  });

  it('rejects an invalid email before calling sign in', async () => {
    const screen = render(<SignInScreen />);
    fireEvent.changeText(screen.getByLabelText('Email'), 'not-an-email');
    fireEvent.changeText(screen.getByLabelText('Password'), 'password123');

    await act(async () => {
      fireEvent.press(screen.getByText('Sign in'));
    });

    expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('normalizes the email and submits from the password keyboard', async () => {
    const screen = render(<SignInScreen />);
    fireEvent.changeText(screen.getByLabelText('Email'), '  Tech@Example.COM  ');
    fireEvent.changeText(screen.getByLabelText('Password'), 'password123');

    await act(async () => {
      fireEvent(screen.getByLabelText('Password'), 'submitEditing');
    });

    expect(mockSignIn).toHaveBeenCalledWith('tech@example.com', 'password123');
  });

  it('hides email and password placeholders while those fields are focused', () => {
    const screen = render(<SignInScreen />);
    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');

    expect(email.props.placeholder).toBe('you@example.com');
    expect(password.props.placeholder).toBe('••••••••');

    fireEvent(email, 'focus');
    expect(screen.getByLabelText('Email').props.placeholder).toBeUndefined();
    expect(screen.getByLabelText('Password').props.placeholder).toBe('••••••••');

    fireEvent(email, 'blur');
    fireEvent(password, 'focus');
    expect(screen.getByLabelText('Email').props.placeholder).toBe('you@example.com');
    expect(screen.getByLabelText('Password').props.placeholder).toBeUndefined();

    fireEvent(password, 'blur');
    expect(screen.getByLabelText('Password').props.placeholder).toBe('••••••••');
  });

  it('dismisses the keyboard before starting sign-in', async () => {
    const dismissKeyboard = jest.spyOn(Keyboard, 'dismiss');
    const screen = render(<SignInScreen />);
    fireEvent.changeText(screen.getByLabelText('Email'), 'tech@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'password123');

    await act(async () => {
      fireEvent.press(screen.getByText('Sign in'));
    });

    expect(dismissKeyboard).toHaveBeenCalledTimes(1);
    expect(dismissKeyboard.mock.invocationCallOrder[0]).toBeLessThan(
      mockSignIn.mock.invocationCallOrder[0],
    );
    dismissKeyboard.mockRestore();
  });

  it('turns invalid-credential errors into clear sign-in copy', async () => {
    mockSignIn.mockResolvedValueOnce({
      error: new Error('Invalid login credentials'),
      session: null,
    });
    const screen = render(<SignInScreen />);
    fireEvent.changeText(screen.getByLabelText('Email'), 'tech@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-password');

    await act(async () => {
      fireEvent.press(screen.getByText('Sign in'));
    });

    expect(screen.getByText('Incorrect email or password.')).toBeTruthy();
  });

  it('lets the user show and hide the password', () => {
    const screen = render(<SignInScreen />);
    const password = screen.getByLabelText('Password');

    expect(password.props.secureTextEntry).toBe(true);
    fireEvent.press(screen.getByLabelText('Show password'));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
    fireEvent.press(screen.getByLabelText('Hide password'));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  });

  it('provides platform autofill hints for sign in and sign up', () => {
    const screen = render(<SignInScreen />);

    expect(screen.getByLabelText('Email').props.autoComplete).toBe('email');
    expect(screen.getByLabelText('Password').props.autoComplete).toBe('current-password');

    fireEvent.press(screen.getByText('Create an account'));
    expect(screen.getByLabelText('First name').props.autoComplete).toBe('name-given');
    expect(screen.getByLabelText('Last name').props.autoComplete).toBe('name-family');
    expect(screen.getByLabelText('Password').props.autoComplete).toBe('new-password');
    expect(screen.getByLabelText('Confirm password').props.autoComplete).toBe('new-password');
  });

  it('requires matching passwords when creating an account', async () => {
    const screen = render(<SignInScreen />);
    fireEvent.press(screen.getByText('Create an account'));
    fireEvent.changeText(screen.getByLabelText('Email'), 'tech@example.com');
    fireEvent.changeText(screen.getByLabelText('First name'), 'Alex');
    fireEvent.changeText(screen.getByLabelText('Last name'), 'Builder');
    fireEvent.changeText(screen.getByLabelText('Password'), 'Password123!');
    fireEvent.changeText(screen.getByLabelText('Confirm password'), 'Different123!');

    await act(async () => {
      fireEvent.press(screen.getByText('Create account'));
    });

    expect(screen.getByText('Passwords do not match.')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('requires a capital letter and symbol for a new account password', async () => {
    const screen = render(<SignInScreen />);
    fireEvent.press(screen.getByText('Create an account'));
    fireEvent.changeText(screen.getByLabelText('Email'), 'tech@example.com');
    fireEvent.changeText(screen.getByLabelText('First name'), 'Alex');
    fireEvent.changeText(screen.getByLabelText('Last name'), 'Builder');
    fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
    fireEvent.changeText(screen.getByLabelText('Confirm password'), 'password123');

    await act(async () => {
      fireEvent.press(screen.getByText('Create account'));
    });

    expect(screen.getByText('Password must be at least 8 characters and include 1 capital letter and 1 symbol.')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows privacy policy and terms links on sign in', () => {
    const { getAllByText } = render(<SignInScreen />);

    expect(getAllByText('Privacy Policy').length).toBeGreaterThan(0);
    expect(getAllByText('Terms').length).toBeGreaterThan(0);
  });

  it('shows privacy and terms only in the agreement line during sign up', () => {
    const screen = render(<SignInScreen />);

    fireEvent.press(screen.getByText('Create an account'));

    expect(screen.getAllByText('Privacy Policy')).toHaveLength(1);
    expect(screen.getAllByText('Terms')).toHaveLength(1);
    expect(screen.getByText('Back to sign in')).toBeTruthy();
  });

  it('requires the legal checkbox before creating an account', async () => {
    const screen = render(<SignInScreen />);

    fireEvent.press(screen.getByText('Create an account'));
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'tech@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Alex'), 'Alex');
    fireEvent.changeText(screen.getByPlaceholderText('Builder'), 'Builder');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'Password123!');
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'Password123!');

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

    fireEvent.press(screen.getByText('Create an account'));
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'tech@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Alex'), 'Alex');
    fireEvent.changeText(screen.getByPlaceholderText('Builder'), 'Builder');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'Password123!');
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'Password123!');
    fireEvent.press(screen.getByRole('checkbox'));

    await act(async () => {
      fireEvent.press(screen.getByText('Create account'));
    });

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1);
      expect(mockRecordSignupLegalAcceptances).toHaveBeenCalledTimes(1);
      expect(mockCacheLegalAcceptance).toHaveBeenCalledWith({
        userId: 'user-1',
        privacyVersion: '2026-07-27',
        termsVersion: '2026-07-27',
      });
    });
  });
});
