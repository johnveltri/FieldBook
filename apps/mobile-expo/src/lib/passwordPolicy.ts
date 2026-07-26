export const NEW_PASSWORD_REQUIREMENT =
  'At least 8 characters, 1 capital letter, and 1 symbol';

export function newPasswordMeetsPolicy(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password)
  );
}

export function newPasswordPolicyError(password: string): string | null {
  return newPasswordMeetsPolicy(password)
    ? null
    : 'Password must be at least 8 characters and include 1 capital letter and 1 symbol.';
}
