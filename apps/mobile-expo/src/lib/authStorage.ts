import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { SupportedStorage } from '@supabase/auth-js';

/**
 * Session persistence for Supabase Auth.
 * - **Web (Expo):** `AsyncStorage` has no native module → use `localStorage`.
 * - **iOS / Android:** use AsyncStorage (pin version with `npx expo install @react-native-async-storage/async-storage`).
 */
const webStorage: SupportedStorage = {
  getItem: (key) => {
    try {
      return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null);
    } catch {
      return Promise.resolve(null);
    }
  },
  setItem: (key, value) => {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* ignore quota / privacy mode */
    }
    return Promise.resolve();
  },
  removeItem: (key) => {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
    return Promise.resolve();
  },
};

export const authStorage: SupportedStorage =
  Platform.OS === 'web' ? webStorage : AsyncStorage;
