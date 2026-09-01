import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import {
  ChooseJobBottomSheet,
  type ChooseJobBottomSheetJob,
} from './ChooseJobBottomSheet';
import { createTextStyles } from '../../theme/nativeTokens';

const typography = createTextStyles({
  serifBold: 'System',
  sans: 'System',
  sansSemi: 'System',
  sansBold: 'System',
});

const jobs: ChooseJobBottomSheetJob[] = Array.from({ length: 10 }, (_, index) => ({
  id: `job-${index + 1}`,
  shortDescription: `Job ${index + 1}`,
  customerName: `Customer ${index + 1}`,
}));

describe('ChooseJobBottomSheet', () => {
  it('renders long job lists inside a vertically scrollable container', () => {
    const screen = render(
      <ChooseJobBottomSheet
        typography={typography}
        visible
        jobs={jobs}
        onSelect={() => undefined}
      />,
    );

    const list = screen.getByTestId('choose-job-list');
    expect(list.props.nestedScrollEnabled).toBe(true);
    expect(list.props.showsVerticalScrollIndicator).toBe(true);
    expect(screen.getByLabelText('Add to job Job 10')).toBeTruthy();
  });

  it('selects a job from the scrollable list', () => {
    const onSelect = jest.fn();
    const screen = render(
      <ChooseJobBottomSheet
        typography={typography}
        visible
        jobs={jobs}
        onSelect={onSelect}
      />,
    );

    fireEvent.press(screen.getByLabelText('Add to job Job 10'));
    expect(onSelect).toHaveBeenCalledWith('job-10');
  });
});
