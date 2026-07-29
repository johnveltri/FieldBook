import { describe, expect, it } from '@jest/globals';

import { APP_SIGN_IN_DEEP_LINK, isAppSignInDeepLink } from './authUrls';

describe('authUrls', () => {
  it('recognizes the app sign-in deep link', () => {
    expect(isAppSignInDeepLink(APP_SIGN_IN_DEEP_LINK)).toBe(true);
    expect(isAppSignInDeepLink('fieldsoli://sign-in?foo=bar')).toBe(true);
    expect(isAppSignInDeepLink('fieldsoli:///sign-in')).toBe(true);
    expect(isAppSignInDeepLink('https://fieldsoli.com/auth/confirmed')).toBe(false);
  });
});
