import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { JobDetailScreen } from './JobDetailScreen';
import type { JobDetailViewModel } from '@fieldbook/shared-types';

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('../components/CanvasTiledBackground', () => ({
  CanvasTiledBackground: () => null,
}));

jest.mock('../components/bottom-nav/BottomNavTabIcons', () => ({
  BottomNavIconEarnings: () => null,
  BottomNavIconHome: () => null,
  BottomNavIconJobs: () => null,
}));

jest.mock('../components/figma-icons/JobDetailScreenIcons', () => ({
  JobDetailIconCtaMore: () => null,
  JobDetailIconRowCardLeading: () => null,
  JobDetailIconSectionAdd: () => null,
  JobDetailIconSectionMaterials: () => null,
  JobDetailIconSectionNotes: () => null,
  JobDetailIconSectionSessions: () => null,
  JobDetailIconSectionTimeline: () => null,
  JobDetailIconTopClose: () => null,
  JobDetailIconTopEdit: () => null,
  JobDetailIconViewNote: () => null,
}));

jest.mock('../components/ds', () => ({
  EditJobBottomSheet: () => null,
  JobDetailCtaRow: () => null,
  JobDetailJobHeader: () => null,
  JobDetailMetricTertiary: () => null,
  JobDetailSummaryCard: () => null,
  NewSessionBottomSheet: ({
    visible,
    onLogPastPress,
  }: {
    visible: boolean;
    onLogPastPress?: () => void;
  }) => {
    const { Text, View } = require('react-native');
    return visible ? (
      <View>
        <Text>new-session-sheet</Text>
        <Text onPress={() => onLogPastPress?.()}>Log Past Session</Text>
      </View>
    ) : null;
  },
  EditSessionBottomSheet: ({
    visible,
    title,
    onSavePress,
    onDiscardPress,
  }: {
    visible: boolean;
    title: string;
    onSavePress?: (values: { startedAt: string; endedAt: string }) => void;
    onDiscardPress?: () => void;
  }) => {
    const { Text, View } = require('react-native');
    return visible ? (
      <View>
        <Text>{title}</Text>
        <Text
          onPress={() =>
            onSavePress?.({
              startedAt: '2026-04-18T14:00:00.000Z',
              endedAt: '2026-04-18T16:00:00.000Z',
            })
          }
        >
          Save Session
        </Text>
        <Text onPress={() => onDiscardPress?.()}>Discard Session</Text>
      </View>
    ) : null;
  },
  SessionCard: ({
    session,
    onEditPress,
  }: {
    session: { id: string; dateLabel: string };
    onEditPress: () => void;
  }) => {
    const { Text, View } = require('react-native');
    return (
      <View>
        <Text>{session.dateLabel}</Text>
        <Text onPress={onEditPress}>{`Edit session ${session.id}`}</Text>
      </View>
    );
  },
}));

jest.mock('@fieldbook/api-client', () => ({
  createManualSession: jest.fn(),
  deleteJobById: jest.fn(),
  discardSession: jest.fn(),
  fetchFirstJobIdForCurrentUser: jest.fn(),
  fetchJobDetail: jest.fn(),
  updateJobById: jest.fn(),
  updateSessionTimes: jest.fn(),
}));

jest.mock('../lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => true),
  supabase: {},
}));

describe('JobDetailScreen manual session flow', () => {
  const apiClient = jest.requireMock('@fieldbook/api-client') as any;

  const baseJob: JobDetailViewModel = {
    id: 'job-1',
    shortDescription: 'Fixture install',
    customerName: 'Alice',
    serviceAddress: '1 Main St',
    jobType: 'electrical',
    lastWorkedLabel: 'Last worked Apr 18, 2026',
    workStatus: 'inProgress',
    earnings: {
      revenueCents: 10000,
      materialsCents: -500,
      feesCents: 0,
      netEarningsCents: 9500,
    },
    metrics: {
      timeLabel: '2.0h',
      netPerHrDisplay: '$47.50/hr',
      sessionCount: 1,
    },
    sessions: [
      {
        id: 'sess-1',
        startedAt: '2026-04-17T14:00:00.000Z',
        endedAt: '2026-04-17T15:00:00.000Z',
        dateLabel: 'Apr 17, 2026',
        timeRangeLabel: '9:00 AM – 10:00 AM',
        durationLabel: '1.0h',
      },
    ],
    materialBuckets: [],
    noteBuckets: [],
    timeline: {
      title: 'Session started',
      timeLabel: '10:00 AM',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.fetchJobDetail.mockResolvedValue(baseJob);
    apiClient.createManualSession.mockResolvedValue('sess-new-1');
    apiClient.updateSessionTimes.mockResolvedValue(undefined);
    apiClient.discardSession.mockResolvedValue(undefined);
  });

  it('creates a manual session from add flow', async () => {
    const screen = render(<JobDetailScreen jobId="job-1" sessionUserId="user-1" />);

    await waitFor(() => {
      expect(apiClient.fetchJobDetail).toHaveBeenCalledWith({}, 'job-1');
    });

    fireEvent.press(screen.getByLabelText('Add SESSIONS'));
    fireEvent.press(screen.getByText('Log Past Session'));
    fireEvent.press(screen.getByText('Save Session'));

    await waitFor(() => {
      expect(apiClient.createManualSession).toHaveBeenCalledWith({}, {
        jobId: 'job-1',
        startedAt: '2026-04-18T14:00:00.000Z',
        endedAt: '2026-04-18T16:00:00.000Z',
      });
    });
  });

  it('updates an existing session from edit flow', async () => {
    const screen = render(<JobDetailScreen jobId="job-1" sessionUserId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit session sess-1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Edit session sess-1'));
    fireEvent.press(screen.getByText('Save Session'));

    await waitFor(() => {
      expect(apiClient.updateSessionTimes).toHaveBeenCalledWith({}, 'sess-1', {
        startedAt: '2026-04-18T14:00:00.000Z',
        endedAt: '2026-04-18T16:00:00.000Z',
      });
    });
  });

  it('discards a session from edit flow', async () => {
    const screen = render(<JobDetailScreen jobId="job-1" sessionUserId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit session sess-1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Edit session sess-1'));
    fireEvent.press(screen.getByText('Discard Session'));

    await waitFor(() => {
      expect(apiClient.discardSession).toHaveBeenCalledWith({}, 'sess-1');
    });
  });
});
