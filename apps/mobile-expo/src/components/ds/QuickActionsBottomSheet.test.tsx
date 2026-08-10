import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import type { TextStyles } from '../../theme/nativeTokens';
import {
  QuickActionsBottomSheet,
  type QuickActionsStep,
} from './QuickActionsBottomSheet';

const typography = {
  titleH3: {},
  bodyBold: {},
  bodySmall: {},
  statusPillLabel: {},
} as TextStyles;

function renderChooser(step: QuickActionsStep) {
  return render(
    <QuickActionsBottomSheet
      typography={typography}
      visible
      step={step}
      recentJobs={[]}
      recentJobsLoading={false}
      recentJobsError={null}
      actionError={null}
      starting={false}
      onClose={jest.fn()}
      onSelectExistingJob={jest.fn()}
      onStartNewSession={jest.fn()}
      onSelectJobForCapture={jest.fn()}
      onCreateQuickCapture={jest.fn()}
    />,
  );
}

describe('QuickActionsBottomSheet', () => {
  const cases: { step: QuickActionsStep; title: string }[] = [
    { step: 'chooseJob', title: 'Start Session' },
    { step: 'noteCapture', title: 'New Note' },
    { step: 'materialCapture', title: 'New Material' },
  ];

  it.each(cases)('renders $step as a root chooser with no legacy Back path', ({ step, title }) => {
    const screen = renderChooser(step);

    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    expect(screen.queryByText('Quick Capture')).toBeNull();
  });
});
