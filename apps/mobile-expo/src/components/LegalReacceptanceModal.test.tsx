import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { LegalReacceptanceModal } from './LegalReacceptanceModal';

const mockRecordReacceptance = jest.fn(async () => undefined);

jest.mock('@fieldsolo/api-client', () => ({
  recordReacceptanceLegalAcceptances: (...args: unknown[]) =>
    mockRecordReacceptance(...(args as [])),
}));

jest.mock('../lib/supabase', () => ({
  supabase: {},
}));

describe('LegalReacceptanceModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records reacceptance and calls onAccepted when the user agrees', async () => {
    const onAccepted = jest.fn();
    const screen = render(
      <LegalReacceptanceModal visible onAccepted={onAccepted} />,
    );

    expect(screen.getByText('Updated legal terms')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('I agree'));
    });

    await waitFor(() => {
      expect(mockRecordReacceptance).toHaveBeenCalledTimes(1);
      expect(onAccepted).toHaveBeenCalledTimes(1);
    });
  });
});
