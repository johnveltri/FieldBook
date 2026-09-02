import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Alert, Pressable, Text } from 'react-native';

import { QuickActionsFlowProvider, useQuickActionsFlow } from './QuickActionsFlowContext';

let mockEditNoteProps: {
  visible: boolean;
  onSavePress: (values: { body: string }) => void;
} | null = null;
let mockEditMaterialProps: {
  visible: boolean;
  onSavePress: (values: {
    description: string;
    quantity: number;
    unit: string;
    unitCostCents: number;
  }) => void;
} | null = null;
let mockQuickActionsVisible = false;

class TestErrorBoundary extends React.Component<React.PropsWithChildren, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    return this.state.error ? <Text>{`Render error: ${this.state.error.message}`}</Text> : this.props.children;
  }
}

jest.mock('expo-font', () => ({ useFonts: () => [true] }));

jest.mock('@fieldsolo/api-client', () => ({
  createBlankJobForLiveSessionStart: jest.fn(),
  createMaterial: jest.fn(),
  createNote: jest.fn(),
  deleteJobById: jest.fn(),
  fetchJobDetail: jest.fn(),
  listRecentJobsForCurrentUser: jest.fn(),
  tryBumpJobToInProgressIfNotStarted: jest.fn(),
}));

jest.mock('../components/ds', () => ({
  ChooseJobBottomSheet: () => null,
  ChooseSessionBottomSheet: () => null,
  DropdownBottomSheet: () => null,
  EditMaterialBottomSheet: (props: typeof mockEditMaterialProps) => {
    mockEditMaterialProps = props;
    return null;
  },
  EditNoteBottomSheet: (props: typeof mockEditNoteProps) => {
    mockEditNoteProps = props;
    return null;
  },
  QuickActionsBottomSheet: ({ visible }: { visible: boolean }) => {
    mockQuickActionsVisible = visible;
    return null;
  },
}));

jest.mock('../context/JobsListInvalidationContext', () => ({
  useJobsListInvalidation: () => ({ invalidateJobsList: jest.fn() }),
}));

jest.mock('../context/LiveSessionContext', () => ({
  useHasLiveSession: () => false,
  useLiveSession: () => ({ startLiveSession: jest.fn(), refresh: jest.fn() }),
}));

jest.mock('../lib/analytics', () => ({
  analytics: { capture: jest.fn() },
  errorProperties: () => ({}),
  moneyBucket: () => 'zero',
  quantityBucket: () => 'zero',
  textLengthBucket: () => 'empty',
}));

jest.mock('../lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: {},
}));

jest.mock('./quickActionsFlowHelpers', () => ({
  CAPTURE_UNIT_OPTIONS: [],
  formatCaptureError: (error: unknown) =>
    error instanceof Error ? error.message : 'Could not complete action.',
  formatLiveSessionJobTitle: () => 'New Job',
  listAllJobsForCapture: jest.fn(),
}));

function Harness() {
  const { creatingJob, handlePrimaryAction } = useQuickActionsFlow();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create job"
        onPress={() => handlePrimaryAction('new_job')}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quick note"
        onPress={() => handlePrimaryAction('quick_note')}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quick material"
        onPress={() => handlePrimaryAction('quick_material')}
      />
      <Text>{creatingJob ? 'creating' : 'idle'}</Text>
    </>
  );
}

describe('QuickActionsFlowProvider New Job action', () => {
  let alertSpy: jest.SpiedFunction<typeof Alert.alert>;

  beforeEach(() => {
    mockEditNoteProps = null;
    mockEditMaterialProps = null;
    mockQuickActionsVisible = false;
    const apiClient = jest.requireMock('@fieldsolo/api-client') as any;
    apiClient.listRecentJobsForCurrentUser.mockResolvedValue([]);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('allows only one job creation while the first request is in flight', async () => {
    let resolveCreate: (() => void) | undefined;
    const onCreateJob = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const screen = render(
      <QuickActionsFlowProvider onCreateJob={onCreateJob}>
        <Harness />
      </QuickActionsFlowProvider>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Create job' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create job' }));

    expect(onCreateJob).toHaveBeenCalledTimes(1);
    expect(screen.getByText('creating')).toBeTruthy();

    await act(async () => {
      resolveCreate?.();
    });
    await screen.findByText('idle');
  });

  it('reports job creation failures and returns to idle', async () => {
    const onCreateJob = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('Network down'));
    const screen = render(
      <QuickActionsFlowProvider onCreateJob={onCreateJob}>
        <Harness />
      </QuickActionsFlowProvider>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Create job' }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Create job failed', 'Network down');
      expect(screen.getByText('idle')).toBeTruthy();
    });
  });

  it('opens Quick Note directly and saves it unassigned to Inbox', async () => {
    const apiClient = jest.requireMock('@fieldsolo/api-client') as any;
    apiClient.createNote.mockResolvedValue('note-1');
    const onQuickCaptureSaved = jest.fn();
    const screen = render(
      <TestErrorBoundary>
        <QuickActionsFlowProvider onCreateJob={async () => {}} onQuickCaptureSaved={onQuickCaptureSaved}>
          <Harness />
        </QuickActionsFlowProvider>
      </TestErrorBoundary>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Quick note' }));
    await waitFor(() => expect(mockEditNoteProps?.visible).toBe(true));
    expect(mockQuickActionsVisible).toBe(false);
    await act(async () => {
      mockEditNoteProps?.onSavePress({ body: 'Captured note' });
    });

    await waitFor(() => {
      expect(apiClient.createNote).toHaveBeenCalledWith({}, {
        jobId: null,
        sessionId: null,
        body: 'Captured note',
      });
      expect(onQuickCaptureSaved).toHaveBeenCalledWith({ mode: 'inbox', jobId: null });
      expect(screen.queryByText(/^Render error:/)).toBeNull();
    });
  });

  it('opens Quick Material directly and saves it unassigned to Inbox', async () => {
    const apiClient = jest.requireMock('@fieldsolo/api-client') as any;
    apiClient.createMaterial.mockResolvedValue('material-1');
    const onQuickCaptureSaved = jest.fn();
    const screen = render(
      <TestErrorBoundary>
        <QuickActionsFlowProvider onCreateJob={async () => {}} onQuickCaptureSaved={onQuickCaptureSaved}>
          <Harness />
        </QuickActionsFlowProvider>
      </TestErrorBoundary>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Quick material' }));
    await waitFor(() => expect(mockEditMaterialProps?.visible).toBe(true));
    expect(mockQuickActionsVisible).toBe(false);
    await act(async () => {
      mockEditMaterialProps?.onSavePress({
        description: 'Copper pipe',
        quantity: 2,
        unit: 'ft',
        unitCostCents: 500,
      });
    });

    await waitFor(() => {
      expect(apiClient.createMaterial).toHaveBeenCalledWith({}, {
        jobId: null,
        sessionId: null,
        description: 'Copper pipe',
        quantity: 2,
        unit: 'ft',
        unitCostCents: 500,
      });
      expect(onQuickCaptureSaved).toHaveBeenCalledWith({ mode: 'inbox', jobId: null });
      expect(screen.queryByText(/^Render error:/)).toBeNull();
    });
  });
});
