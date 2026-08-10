import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ShellChromeContextValue = {
  /** Hide native tab bar + FAB (e.g. profile edit sheets). */
  hideBottomChrome: boolean;
  setProfileSheetsMounted: (mounted: boolean) => void;
};

const ShellChromeContext = createContext<ShellChromeContextValue | null>(null);

export function ShellChromeProvider({ children }: { children: ReactNode }) {
  const [profileSheetsMounted, setProfileSheetsMountedState] = useState(false);

  const setProfileSheetsMounted = useCallback((mounted: boolean) => {
    setProfileSheetsMountedState(mounted);
  }, []);

  const value = useMemo(
    (): ShellChromeContextValue => ({
      hideBottomChrome: profileSheetsMounted,
      setProfileSheetsMounted,
    }),
    [profileSheetsMounted, setProfileSheetsMounted],
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
