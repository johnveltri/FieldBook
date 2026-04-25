import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * Per-sheet registration row tracked by the global stack.
 *
 * `topY` is in *window* coordinates (`0` = top of the screen, larger numbers
 * lower). `null` until the sheet has reported its first layout — callers
 * should treat null as "we don't yet know how tall this sheet is, so don't
 * try to lift things above it".
 */
export type RegisteredBottomSheet = {
  id: string;
  topY: number | null;
  /**
   * Invoked by overlay UIs (e.g. the minimized live-session bar) when the
   * user wants to dismiss whatever sheet is currently topmost so a different
   * sheet can take its place.
   */
  onRequestClose: () => void;
};

/**
 * Stable, write-only API for sheets to participate in the registry. Lives
 * in its own context so registration effects (which are keyed on context
 * identity) DON'T re-run every time the reactive `topmostSheet` reader
 * flips — that re-run was racing with `onLayout` and dropping the sheet's
 * measured top mid-update.
 */
type BottomSheetStackWriters = {
  registerSheet: (
    id: string,
    initial: { onRequestClose: () => void },
  ) => () => void;
  setSheetTop: (id: string, topY: number) => void;
  requestCloseTopmost: () => void;
};

/** Reactive reader — re-renders when the topmost sheet changes. */
type BottomSheetStackReader = {
  topmostSheet: RegisteredBottomSheet | null;
};

const BottomSheetStackWritersContext =
  createContext<BottomSheetStackWriters | null>(null);
const BottomSheetStackReaderContext =
  createContext<BottomSheetStackReader>({ topmostSheet: null });

/**
 * Lightweight, app-wide registry of bottom sheets that are currently
 * presented. Lets the global Live Session overlay know whether to lift its
 * floating "minimized" bar above another sheet (so the user can interact
 * with both), and to dismiss that sheet first when the user taps the bar.
 *
 * Mounted at the App root above `LiveSessionProvider` so screens, sheets,
 * and the overlay can all participate.
 */
export function BottomSheetStackProvider({ children }: { children: ReactNode }) {
  // Use a Map<string, entry> ref so individual `setSheetTop` callers don't
  // trigger re-renders of every registered sheet — only the derived
  // `topmostSheet` flips state when relevant.
  const entriesRef = useRef<Map<string, RegisteredBottomSheet>>(new Map());

  // State mirror only of the derived value the consumers actually care
  // about; recomputed on every mutation.
  const [topmostSheet, setTopmostSheet] =
    useState<RegisteredBottomSheet | null>(null);

  const recomputeTopmost = useCallback(() => {
    let best: RegisteredBottomSheet | null = null;
    for (const entry of entriesRef.current.values()) {
      if (entry.topY == null) continue;
      if (best == null || entry.topY < best.topY!) {
        best = entry;
      }
    }
    setTopmostSheet((prev) => {
      if (!prev && !best) return prev;
      if (prev && best && prev.id === best.id && prev.topY === best.topY) {
        return prev;
      }
      return best;
    });
  }, []);

  const registerSheet = useCallback<BottomSheetStackWriters['registerSheet']>(
    (id, initial) => {
      entriesRef.current.set(id, {
        id,
        topY: null,
        onRequestClose: initial.onRequestClose,
      });
      recomputeTopmost();
      return () => {
        entriesRef.current.delete(id);
        recomputeTopmost();
      };
    },
    [recomputeTopmost],
  );

  const setSheetTop = useCallback<BottomSheetStackWriters['setSheetTop']>(
    (id, topY) => {
      const entry = entriesRef.current.get(id);
      if (!entry) return;
      // Avoid spamming React for sub-pixel layout jitters.
      if (entry.topY != null && Math.abs(entry.topY - topY) < 0.5) return;
      entry.topY = topY;
      recomputeTopmost();
    },
    [recomputeTopmost],
  );

  const requestCloseTopmost = useCallback(() => {
    // Snapshot from the entries ref so we always act on the *current*
    // topmost — `topmostSheet` from state may be a render behind for an
    // immediate caller (e.g. tap handlers).
    let best: RegisteredBottomSheet | null = null;
    for (const entry of entriesRef.current.values()) {
      if (entry.topY == null) continue;
      if (best == null || entry.topY < best.topY!) {
        best = entry;
      }
    }
    best?.onRequestClose();
  }, []);

  // Writers: ALL deps are stable refs/useCallbacks above with empty/
  // recomputeTopmost-only deps, so this object is created once and never
  // changes identity. Registration effects on the consumer side stay
  // stable across `topmostSheet` updates.
  const writers = useMemo<BottomSheetStackWriters>(
    () => ({ registerSheet, setSheetTop, requestCloseTopmost }),
    [registerSheet, requestCloseTopmost, setSheetTop],
  );

  // Reader: only re-creates when `topmostSheet` actually changes.
  const reader = useMemo<BottomSheetStackReader>(
    () => ({ topmostSheet }),
    [topmostSheet],
  );

  return (
    <BottomSheetStackWritersContext.Provider value={writers}>
      <BottomSheetStackReaderContext.Provider value={reader}>
        {children}
      </BottomSheetStackReaderContext.Provider>
    </BottomSheetStackWritersContext.Provider>
  );
}

/**
 * Stable hook for sheets that just want to participate in the registry.
 * Returns `null` outside a provider so isolated tests still render.
 */
export function useBottomSheetStackWriters(): BottomSheetStackWriters | null {
  return useContext(BottomSheetStackWritersContext);
}

/**
 * Reactive hook for overlay UIs (e.g. the live-session bar) that need to
 * react to the topmost sheet. Returns the default `{ topmostSheet: null }`
 * outside a provider.
 */
export function useTopmostBottomSheet(): RegisteredBottomSheet | null {
  return useContext(BottomSheetStackReaderContext).topmostSheet;
}
