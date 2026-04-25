import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { Platform } from 'react-native';

import { EditLiveSessionBottomSheet } from './EditLiveSessionBottomSheet';
import { createTextStyles } from '../../theme/nativeTokens';

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => {
    const React = require('react');
    const { View } = require('react-native');
    return <View testID="date-time-picker" />;
  },
  DateTimePickerAndroid: { open: jest.fn() },
}));

const typography = createTextStyles({
  serifBold: 'System',
  mono: 'System',
  monoSemi: 'System',
  monoBold: 'System',
});

function setPlatformOS(os: 'ios' | 'android') {
  const original = Platform.OS;
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  });
  return () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => original,
    });
  };
}

describe('EditLiveSessionBottomSheet', () => {
  const baseProps = {
    typography,
    visible: true,
    startedAt: '2026-04-25T15:00:00.000Z',
  } as const;

  it('keeps iOS end time optional when the picker is opened but not changed', () => {
    const restorePlatform = setPlatformOS('ios');
    const onSavePress = jest.fn();
    try {
      const screen = render(
        <EditLiveSessionBottomSheet
          {...baseProps}
          onSavePress={onSavePress}
        />,
      );

      fireEvent.press(
        screen.getByLabelText(
          'End time (optional — saving with a value ends the session)',
        ),
      );
      expect(screen.getByTestId('date-time-picker')).toBeTruthy();

      fireEvent.press(screen.getByLabelText('SAVE CHANGES'));

      expect(onSavePress).toHaveBeenCalledWith({
        kind: 'updateStart',
        startedAt: '2026-04-25T15:00:00.000Z',
      });
    } finally {
      restorePlatform();
    }
  });
});
