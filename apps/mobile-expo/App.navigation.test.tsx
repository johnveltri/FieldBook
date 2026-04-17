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

jest.mock('./src/components/AuthSignOutButton', () => ({
  AuthSignOutButton: () => {
    const { Text } = require('react-native');
    return <Text>SignOut</Text>;
  },
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

jest.mock('./src/screens/JobDetailScreen', () => ({
  JobDetailScreen: ({
    jobId,
    loadKey,
    sessionUserId,
    onRequestClose,
  }: {
    jobId?: string | null;
    loadKey?: number;
    sessionUserId?: string;
    onRequestClose?: () => void;
  }) => {
    const { Text, View } = require('react-native');
    return (
      <View>
        <Text testID="detail-props">{`jobId:${jobId ?? 'null'}|loadKey:${loadKey ?? 0}|user:${sessionUserId ?? ''}`}</Text>
        <Text onPress={() => onRequestClose?.()}>CloseDetail</Text>
      </View>
    );
  },
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
});
