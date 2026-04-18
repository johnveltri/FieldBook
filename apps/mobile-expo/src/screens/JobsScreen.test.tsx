import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { JobsScreen } from './JobsScreen';

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('../components/CanvasTiledBackground', () => ({
  CanvasTiledBackground: () => null,
}));

jest.mock('../components/ds', () => ({
  JobDetailStatusPill: () => null,
}));

jest.mock('@fieldbook/api-client', () => ({
  listJobsForCurrentUser: jest.fn(),
  createBlankJobForCurrentUser: jest.fn(),
}));

jest.mock('../lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => true),
  supabase: {},
}));

describe('JobsScreen', () => {
  const apiClient = jest.requireMock('@fieldbook/api-client') as any;
  const supabaseLib = jest.requireMock('../lib/supabase') as any;

  beforeEach(() => {
    jest.clearAllMocks();
    supabaseLib.isSupabaseConfigured.mockReturnValue(true);
  });

  it('loads jobs and opens detail for the selected job', async () => {
    apiClient.listJobsForCurrentUser.mockResolvedValue([
      {
        id: 'job-1',
        shortDescription: 'Install light fixture',
        customerName: 'Alice',
        updatedAt: '2026-04-17T00:00:00.000Z',
        lastWorkedLabel: 'Last worked Apr 16, 2026',
        timeLabel: '1.5h',
        jobType: 'electrical',
        workStatus: 'inProgress',
        jobPaymentState: 'pending',
        revenueCents: 30000,
        materialsCents: -2000,
        netEarningsCents: 28000,
        collectedCents: 0,
      },
    ]);

    const onOpenJobDetail = jest.fn();
    const screen = render(<JobsScreen onOpenJobDetail={onOpenJobDetail} />);

    await waitFor(() => {
      expect(screen.getByText('Install light fixture')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Install light fixture'));
    expect(onOpenJobDetail).toHaveBeenCalledWith('job-1');
  });

  it('creates a new job and opens detail with returned id', async () => {
    apiClient.listJobsForCurrentUser.mockResolvedValue([]);
    apiClient.createBlankJobForCurrentUser.mockResolvedValue('job-new-7');

    const onOpenJobDetail = jest.fn();
    const screen = render(<JobsScreen onOpenJobDetail={onOpenJobDetail} />);

    await waitFor(() => {
      expect(screen.getByText('No jobs yet.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('New Job'));

    await waitFor(() => {
      expect(apiClient.createBlankJobForCurrentUser).toHaveBeenCalledTimes(1);
    });
    expect(onOpenJobDetail).toHaveBeenCalledWith('job-new-7', { initialEditOpen: true });
  });

  it('shows load errors from list API failures', async () => {
    apiClient.listJobsForCurrentUser.mockRejectedValue(new Error('Network unavailable'));

    const screen = render(<JobsScreen onOpenJobDetail={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText('Network unavailable')).toBeTruthy();
    });
  });
});
