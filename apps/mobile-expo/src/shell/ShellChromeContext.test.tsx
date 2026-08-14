import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import { Text } from 'react-native';

import {
  BottomSheetStackProvider,
} from '../context/BottomSheetStackContext';
import { BottomSheetShell } from '../components/ds/BottomSheetShell';
import {
  ShellChromeProvider,
  useShellChrome,
} from './ShellChromeContext';

function ChromeStatus() {
  const { hideBottomChrome } = useShellChrome();
  return <Text testID="chrome-status">{hideBottomChrome ? 'hidden' : 'visible'}</Text>;
}

describe('ShellChromeProvider', () => {
  it('hides bottom navigation and the primary FAB while a modal sheet is active', async () => {
    render(
      <BottomSheetStackProvider>
        <ShellChromeProvider>
          <ChromeStatus />
          <BottomSheetShell visible>
            <Text>Modal sheet</Text>
          </BottomSheetShell>
        </ShellChromeProvider>
      </BottomSheetStackProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('chrome-status').props.children).toBe('hidden');
    });
  });

  it('keeps bottom navigation visible when no modal sheet is active', () => {
    render(
      <BottomSheetStackProvider>
        <ShellChromeProvider>
          <ChromeStatus />
        </ShellChromeProvider>
      </BottomSheetStackProvider>,
    );

    expect(screen.getByTestId('chrome-status').props.children).toBe('visible');
  });
});
