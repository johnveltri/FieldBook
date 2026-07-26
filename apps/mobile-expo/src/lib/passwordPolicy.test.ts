import { describe, expect, it } from '@jest/globals';

import { newPasswordMeetsPolicy, newPasswordPolicyError } from './passwordPolicy';

describe('new password policy', () => {
  it('requires length, a capital letter, and a symbol', () => {
    expect(newPasswordMeetsPolicy('shortA!')).toBe(false);
    expect(newPasswordMeetsPolicy('lowercase!')).toBe(false);
    expect(newPasswordMeetsPolicy('NoSymbols1')).toBe(false);
    expect(newPasswordMeetsPolicy('ValidPass!')).toBe(true);
  });

  it('returns clear guidance for a weak new password', () => {
    expect(newPasswordPolicyError('password')).toBe(
      'Password must be at least 8 characters and include 1 capital letter and 1 symbol.',
    );
    expect(newPasswordPolicyError('Password!')).toBeNull();
  });
});
