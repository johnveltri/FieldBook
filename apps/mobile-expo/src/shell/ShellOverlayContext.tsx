import { createContext, useContext, type ReactNode } from 'react';

import type { ShellMainTab } from './shellTabRoutes';

export type ShellOverlayContextValue = {
  mainTab: ShellMainTab;
  inboxOpen: boolean;
  inboxMounted: boolean;
  inboxLoadKey: number;
  closeInbox: () => void;
  onInboxExited: () => void;
  profileOpen: boolean;
  profileMounted: boolean;
  closeProfile: () => void;
  onProfileExited: () => void;
  /**
   * Close Profile / Inbox when the user taps a native tab (including re-tapping
   * the current tab, e.g. Home while Profile is open).
   */
  dismissOverlaysForTabPress: (destinationTab: ShellMainTab) => void;
};

const ShellOverlayContext = createContext<ShellOverlayContextValue | null>(null);

export function ShellOverlayProvider({
  value,
  children,
}: {
  value: ShellOverlayContextValue;
  children: ReactNode;
}) {
  return <ShellOverlayContext.Provider value={value}>{children}</ShellOverlayContext.Provider>;
}

export function useShellOverlays(): ShellOverlayContextValue | null {
  return useContext(ShellOverlayContext);
}
