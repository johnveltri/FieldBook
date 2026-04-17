import { createFieldbookClient } from '@fieldbook/api-client';

import { authStorage } from './authStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Shared Supabase client for the Expo app. Requires EXPO_PUBLIC_* env vars. */
export const supabase = createFieldbookClient(url, anon, {
  auth: {
    storage: authStorage,
    storageKey: 'fieldbook.auth.token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function isSupabaseConfigured(): boolean {
  return url.length > 0 && anon.length > 0;
}
