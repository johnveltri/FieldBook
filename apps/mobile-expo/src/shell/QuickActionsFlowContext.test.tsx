import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Alert, Pressable, Text } from 'react-native';

import { QuickActionsFlowProvider, useQuickActionsFlow } from './QuickActionsFlowContext';

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
  EditMaterialBottomSheet: () => null,
  EditNoteBottomSheet: () => null,
  QuickActionsBottomSheet: () => null,
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
      <Text>{creatingJob ? 'creating' : 'idle'}</Text>
    </>
  );
}

describe('QuickActionsFlowProvider New Job action', () => {
  let alertSpy: jest.SpiedFunction<typeof Alert.alert>;

  beforeEach(() => {
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
});
