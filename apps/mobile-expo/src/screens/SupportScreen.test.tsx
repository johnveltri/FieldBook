import React from 'react';
import { Linking } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { SupportScreen } from './SupportScreen';
import { SUPPORT_MAILTO } from '../lib/legal-versions';

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('../components/CanvasTiledBackground', () => ({
  CanvasTiledBackground: () => null,
}));

describe('SupportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows support instructions and opens a mailto link', async () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const screen = render(<SupportScreen onBack={jest.fn()} />);

    expect(screen.getByText('SUPPORT')).toBeTruthy();
    expect(
      screen.getByText(/request a copy of your data/i),
    ).toBeTruthy();
    expect(screen.getByText('support@fieldsolo.com')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('support@fieldsolo.com'));
    });

    expect(openUrl).toHaveBeenCalledWith(SUPPORT_MAILTO);
    openUrl.mockRestore();
  });
});
