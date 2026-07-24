import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { Text } from 'react-native';

import { JobDetailCtaRow } from './JobDetailCtaRow';

const typography = {
  ctaPrimaryLabel: { fontSize: 16, fontWeight: '700' as const },
} as never;

describe('JobDetailCtaRow', () => {
  it('labels the more actions control for accessibility', () => {
    const { getByLabelText } = render(
      <JobDetailCtaRow
        workStatus="notStarted"
        typography={typography}
        onPrimaryPress={jest.fn()}
        onMorePress={jest.fn()}
        MoreIcon={<Text>⋯</Text>}
      />,
    );

    expect(getByLabelText('Change job status')).toBeTruthy();
  });
});
