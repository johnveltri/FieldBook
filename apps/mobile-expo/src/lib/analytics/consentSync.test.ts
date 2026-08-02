import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockUpsertAnalyticsConsentStatus = jest.fn(async () => undefined);
const mockWriteAnalyticsConsentCache = jest.fn(async () => undefined);
const mockGrantConsent = jest.fn(async () => undefined);
const mockIdentify = jest.fn();

jest.mock('@fieldsolo/api-client', () => ({
  fetchAnalyticsConsentStatus: jest.fn(),
  upsertAnalyticsConsentStatus: (...args: unknown[]) =>
    mockUpsertAnalyticsConsentStatus(...(args as [])),
}));

jest.mock('../supabase', () => ({ supabase: {} }));

jest.mock('./consentStorage', () => ({
  clearAnalyticsConsentCache: jest.fn(),
  readAnalyticsConsentCache: jest.fn(),
  writeAnalyticsConsentCache: (...args: unknown[]) =>
    mockWriteAnalyticsConsentCache(...(args as [])),
}));

jest.mock('./client', () => ({
  analytics: {
    applyConsent: jest.fn(),
    grantConsent: () => mockGrantConsent(),
    identify: (userId: string) => mockIdentify(userId),
    withdrawConsent: jest.fn(),
  },
}));

import { grantAnalyticsConsent } from './consentSync';

describe('analytics consent sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('identifies the authenticated user immediately after granting consent', async () => {
    await grantAnalyticsConsent('user-1');

    expect(mockUpsertAnalyticsConsentStatus).toHaveBeenCalledWith(
      expect.anything(),
      'granted',
    );
    expect(mockWriteAnalyticsConsentCache).toHaveBeenCalledWith('user-1', 'granted');
    expect(mockGrantConsent).toHaveBeenCalled();
    expect(mockIdentify).toHaveBeenCalledWith('user-1');
  });

  it('applies granted consent locally when the server upsert fails', async () => {
    mockUpsertAnalyticsConsentStatus.mockRejectedValueOnce(new Error('offline'));

    await grantAnalyticsConsent('user-1');

    expect(mockWriteAnalyticsConsentCache).toHaveBeenCalledWith('user-1', 'granted');
    expect(mockGrantConsent).toHaveBeenCalled();
    expect(mockIdentify).toHaveBeenCalledWith('user-1');
  });
});
