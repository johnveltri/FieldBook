import type { CSSProperties, ReactNode } from 'react';
import { color } from '../../lib/tokens';
import {
  fabFixedAboveBottomNavStyle,
  SCROLL_BOTTOM_INSET_FOR_FAB_PX,
} from '../../lib/fabAnchor';
import { BottomNav, type BottomNavProps, type BottomNavTab } from '../bottom-nav';
import { FloatingActionButton } from '../floating-action-button';

export type ScreenShellProps = {
  /** Main column; scrolls between optional header and bottom nav. */
  children: ReactNode;
  /** Renders above the scroll region (e.g. `TopHeader`). Does not scroll. */
  header?: ReactNode;
  /** Passed to `BottomNav`. */
  navSelection: BottomNavProps['selection'];
  onNavSelect?: (tab: BottomNavTab) => void;
  /** When provided, fixed FAB is shown (Figma Home `12:9727` geometry via `fabAnchor`). */
  onFabClick?: () => void;
  /** Icon FAB only; defaults to “Add”. */
  fabAriaLabel?: string;
  className?: string;
  style?: CSSProperties;
  /** Overrides on the scroll container only. */
  contentStyle?: CSSProperties;
};

/**
 * Minimal app chrome: optional fixed header, scrolling body, docked bottom nav,
 * and fixed FAB above the nav (web + CSS `env(safe-area-inset-*)`).
 *
 * Figma reference: **Home / Default** `12:9727` (scroll + `225:12089` + `613:2`).
 */
export function ScreenShell({
  children,
  header,
  navSelection,
  onNavSelect,
  onFabClick,
  fabAriaLabel = 'Add',
  className,
  style,
  contentStyle,
}: ScreenShellProps) {
  const bg = color('Foundation/Background/Default');
  const showFab = onFabClick != null;

  const scrollPad: CSSProperties = showFab
    ? { paddingBottom: SCROLL_BOTTOM_INSET_FOR_FAB_PX }
    : {};

  return (
    <>
      <div
        className={className}
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: bg,
          ...style,
        }}
      >
        {header != null ? (
          <div style={{ flexShrink: 0, width: '100%' }}>{header}</div>
        ) : null}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            width: '100%',
            ...scrollPad,
            ...contentStyle,
          }}
        >
          {children}
        </div>
        <BottomNav
          selection={navSelection}
          onSelect={onNavSelect}
          style={{ flexShrink: 0, width: '100%' }}
        />
      </div>
      {showFab ? (
        <div style={fabFixedAboveBottomNavStyle({ pointerEvents: 'none' })}>
          <FloatingActionButton
            variant="icon"
            aria-label={fabAriaLabel}
            onClick={onFabClick}
            style={{ pointerEvents: 'auto' }}
          />
        </div>
      ) : null}
    </>
  );
}
