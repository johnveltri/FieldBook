/** Post-email-confirmation landing page on the marketing site. */
export const AUTH_CONFIRM_URL = 'https://fieldsoli.com/auth/confirmed';

/** Opens the native app on the sign-in screen (see SignInScreen deep-link handler). */
export const APP_SIGN_IN_DEEP_LINK = 'fieldsoli://sign-in';

export function isAppSignInDeepLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'fieldsoli:') return false;
    // fieldsoli://sign-in  → hostname "sign-in"
    // fieldsoli:///sign-in → pathname "/sign-in"
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, '').toLowerCase();
    return host === 'sign-in' || path === '/sign-in';
  } catch {
    return /^fieldsoli:\/+sign-in\/?(?:\?.*)?$/i.test(url);
  }
}
