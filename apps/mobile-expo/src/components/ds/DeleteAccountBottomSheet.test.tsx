import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import {
  DELETE_ACCOUNT_CONFIRMATION_PHRASE,
  DeleteAccountBottomSheet,
} from './DeleteAccountBottomSheet';

const typography = {
  body: { fontSize: 16 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const },
  bodySmall: { fontSize: 14 },
  titleH3: { fontSize: 22, fontWeight: '700' as const },
  ctaPrimaryLabel: { fontSize: 14, fontWeight: '700' as const },
} as never;

describe('DeleteAccountBottomSheet', () => {
  it('keeps DELETE ACCOUNT disabled until the confirmation phrase is typed exactly', () => {
    const onSubmit = jest.fn();
    const screen = render(
      <DeleteAccountBottomSheet
        typography={typography}
        visible
        onSubmit={onSubmit}
      />,
    );

    fireEvent.press(screen.getByLabelText('DELETE ACCOUNT'));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.changeText(
      screen.getByPlaceholderText(DELETE_ACCOUNT_CONFIRMATION_PHRASE),
      'delete',
    );
    fireEvent.press(screen.getByLabelText('DELETE ACCOUNT'));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.changeText(
      screen.getByPlaceholderText(DELETE_ACCOUNT_CONFIRMATION_PHRASE),
      DELETE_ACCOUNT_CONFIRMATION_PHRASE,
    );
    fireEvent.press(screen.getByLabelText('DELETE ACCOUNT'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
