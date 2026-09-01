import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { TradeMultiSelectBottomSheet } from './TradeMultiSelectBottomSheet';
import { TRADE_PRESETS } from '../../lib/trades';
import { createTextStyles } from '../../theme/nativeTokens';

const typography = createTextStyles({
  serifBold: 'System',
  sans: 'System',
  sansSemi: 'System',
  sansBold: 'System',
});

describe('TradeMultiSelectBottomSheet', () => {
  it('keeps the full trade list scrollable above the DONE action', () => {
    const screen = render(
      <TradeMultiSelectBottomSheet
        typography={typography}
        visible
        presets={TRADE_PRESETS}
        selected={['Plumbing']}
        onSubmit={() => undefined}
      />,
    );

    const list = screen.getByTestId('trade-list');
    expect(list.props.nestedScrollEnabled).toBe(true);
    expect(list.props.showsVerticalScrollIndicator).toBe(true);
    expect(screen.getByLabelText('Auto Repair')).toBeTruthy();
    expect(screen.getByLabelText('DONE')).toBeTruthy();
  });

  it('submits selections from the fixed footer action', () => {
    const onSubmit = jest.fn();
    const screen = render(
      <TradeMultiSelectBottomSheet
        typography={typography}
        visible
        presets={TRADE_PRESETS}
        selected={['Plumbing']}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.press(screen.getByLabelText('Electrical'));
    fireEvent.press(screen.getByLabelText('DONE'));
    expect(onSubmit).toHaveBeenCalledWith(['Plumbing', 'Electrical']);
  });
});
