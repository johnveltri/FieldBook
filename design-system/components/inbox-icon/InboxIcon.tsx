import type { CSSProperties } from 'react';
import {
  color,
  space,
  typographyBodySmallStyle,
} from '../../lib/tokens';

export type InboxIconProps = {
  /**
   * Outer frame size (Figma component frame is 40×40; glyph is 24×24 inside).
   * Hit area scales; icon and badge scale proportionally.
   */
  size?: number;
  /** Show badge when count is a positive integer. Omit or `0` for “no notifications”. */
  badgeCount?: number;
  className?: string;
  style?: CSSProperties;
};

function formatBadgeCount(count: number): string {
  if (count > 99) return '99+';
  return String(count);
}

/**
 * Inbox / tray icon (Figma: `Inbox icon` component set, node `786:16`).
 * Stroke uses `Foundation/Text/Primary`; optional count badge matches Figma badge styling.
 */
export function InboxIcon({
  size = 40,
  badgeCount = 0,
  className,
  style,
}: InboxIconProps) {
  const scale = size / 40;
  const iconSize = 24 * scale;
  const inset = 8 * scale;
  const showBadge = badgeCount > 0;

  const badgeTextStyle: CSSProperties = {
    ...typographyBodySmallStyle(),
    fontWeight: 600,
  };

  return (
    <span
      className={className}
      role="img"
      aria-label={
        showBadge
          ? `Inbox, ${badgeCount} unread`
          : 'Inbox'
      }
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size,
        height: size,
        ...style,
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          left: inset,
          top: inset,
          color: color('Foundation/Text/Primary'),
          display: 'block',
        }}
        aria-hidden
      >
        {/* Paths from Figma export `inbox.svg` (24×24); stroke uses token via `currentColor`. */}
        <path
          d="M22 12H16L14 15H10L8 12H2"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.45 5.11L2 12V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H20C20.5304 20 21.0391 19.7893 21.4142 19.4142C21.7893 19.0391 22 18.5304 22 18V12L18.55 5.11C18.3844 4.77679 18.1292 4.49637 17.813 4.30028C17.4967 4.10419 17.1321 4.0002 16.76 4H7.24C6.86792 4.0002 6.50326 4.10419 6.18704 4.30028C5.87083 4.49637 5.61558 4.77679 5.45 5.11Z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showBadge && (
        <span
          style={{
            position: 'absolute',
            top: 6 * scale,
            left: '50%',
            transform: `translateX(calc(-50% + ${10 * scale}px))`,
            minWidth: 16 * scale,
            minHeight: 16 * scale,
            paddingLeft: space('Spacing/4'),
            paddingRight: space('Spacing/4'),
            paddingTop: 2 * scale,
            paddingBottom: 2 * scale,
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 9999,
            backgroundColor: color('Brand/Primary'),
            color: color('Foundation/Background/Default'),
            ...badgeTextStyle,
            lineHeight: 1,
          }}
        >
          {formatBadgeCount(badgeCount)}
        </span>
      )}
    </span>
  );
}
