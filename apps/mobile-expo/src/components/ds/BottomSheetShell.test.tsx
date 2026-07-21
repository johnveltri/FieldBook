import { render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { Text } from 'react-native';

import { BottomSheetShell } from './BottomSheetShell';

describe('BottomSheetShell accessibility', () => {
  it('removes a mounted hidden sheet and its scrim from the accessibility tree', () => {
    const { rerender } = render(
      <BottomSheetShell visible={false} onClose={jest.fn()}>
        <Text>Hidden sheet content</Text>
      </BottomSheetShell>,
    );

    expect(screen.queryByLabelText('Close bottom sheet')).toBeNull();
    expect(screen.queryByText('Hidden sheet content')).toBeNull();

    rerender(
      <BottomSheetShell visible onClose={jest.fn()}>
        <Text>Visible sheet content</Text>
      </BottomSheetShell>,
    );

    expect(screen.getAllByLabelText('Close bottom sheet')).toHaveLength(1);
    expect(screen.getByText('Visible sheet content')).toBeTruthy();
  });
});
