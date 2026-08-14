import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useHasRegisteredBottomSheet } from '../context/BottomSheetStackContext';

type ShellChromeContextValue = {
  /** Hide native tab bar + FAB (e.g. profile edit sheets). */
  hideBottomChrome: boolean;
  setProfileSheetsMounted: (mounted: boolean) => void;
};

const ShellChromeContext = createContext<ShellChromeContextValue | null>(null);

export function ShellChromeProvider({ children }: { children: ReactNode }) {
  const [profileSheetsMounted, setProfileSheetsMountedState] = useState(false);
  const hasRegisteredBottomSheet = useHasRegisteredBottomSheet();

  const setProfileSheetsMounted = useCallback((mounted: boolean) => {
    setProfileSheetsMountedState(mounted);
  }, []);

  const value = useMemo(
    (): ShellChromeContextValue => ({
      // Modal sheets own the entire interaction layer. Native tabs and the
      // global primary-action FAB must not float above their scrim/surface.
      hideBottomChrome: profileSheetsMounted || hasRegisteredBottomSheet,
      setProfileSheetsMounted,
    }),
    [hasRegisteredBottomSheet, profileSheetsMounted, setProfileSheetsMounted],
  );

  return <ShellChromeContext.Provider value={value}>{children}</ShellChromeContext.Provider>;
}

export function useShellChrome(): ShellChromeContextValue {
  const ctx = useContext(ShellChromeContext);
  if (!ctx) {
    throw new Error('useShellChrome must be used within ShellChromeProvider');
  }
  return ctx;
}

/** Optional hook for screens that may render outside the provider in tests. */
export function useShellChromeOptional(): ShellChromeContextValue | null {
  return useContext(ShellChromeContext);
}
