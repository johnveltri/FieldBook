import { render, screen, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { Text } from 'react-native';

import {
  BottomSheetStackProvider,
  useHasRegisteredBottomSheet,
} from '../../context/BottomSheetStackContext';
import { BottomSheetShell } from './BottomSheetShell';

function SheetStackStatus() {
  const hasRegisteredSheet = useHasRegisteredBottomSheet();
  return <Text testID="sheet-stack-status">{hasRegisteredSheet ? 'active' : 'idle'}</Text>;
}

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

  it('marks the overlay as a modal while visible', () => {
    render(
      <BottomSheetShell visible accessibilityTitle="Edit Job" onClose={jest.fn()}>
        <Text>Visible sheet content</Text>
      </BottomSheetShell>,
    );

    expect(screen.getByTestId('bottom-sheet-overlay').props.accessibilityViewIsModal).toBe(true);
  });

  it('registers as active as soon as the sheet opens', async () => {
    render(
      <BottomSheetStackProvider>
        <SheetStackStatus />
        <BottomSheetShell visible onClose={jest.fn()}>
          <Text>Visible sheet content</Text>
        </BottomSheetShell>
      </BottomSheetStackProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sheet-stack-status').props.children).toBe('active');
    });
  });
});
