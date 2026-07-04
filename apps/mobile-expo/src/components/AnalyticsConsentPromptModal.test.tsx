import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AnalyticsConsentPromptModal } from './AnalyticsConsentPromptModal';

const mockGrant = jest.fn<(userId: string) => Promise<void>>(async () => undefined);
const mockWithdraw = jest.fn<(userId: string) => Promise<void>>(async () => undefined);

jest.mock('../lib/analytics/consentSync', () => ({
  grantAnalyticsConsent: (userId: string) => mockGrant(userId),
  withdrawAnalyticsConsent: (userId: string) => mockWithdraw(userId),
}));

describe('AnalyticsConsentPromptModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('grants consent and resolves when Allow analytics is pressed', async () => {
    const onResolved = jest.fn();
    const screen = render(
      <AnalyticsConsentPromptModal
        visible
        userId="user-1"
        onResolved={onResolved}
      />,
    );

    fireEvent.press(screen.getByText('Allow analytics'));

    await waitFor(() => {
      expect(mockGrant).toHaveBeenCalledWith('user-1');
      expect(onResolved).toHaveBeenCalled();
    });
  });

  it('records withdrawal and resolves when No thanks is pressed', async () => {
    const onResolved = jest.fn();
    const screen = render(
      <AnalyticsConsentPromptModal
        visible
        userId="user-1"
        onResolved={onResolved}
      />,
    );

    fireEvent.press(screen.getByText('No thanks'));

    await waitFor(() => {
      expect(mockWithdraw).toHaveBeenCalledWith('user-1');
      expect(onResolved).toHaveBeenCalled();
    });
    expect(mockGrant).not.toHaveBeenCalled();
  });
});
