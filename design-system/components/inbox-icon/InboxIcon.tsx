import type { CSSProperties } from 'react';
import {
  color,
  space,
  typographyBodySmallStyle,
} from '../../lib/tokens';

export const INBOX_ICON_VARIANTS = ['Default', 'No Notifications'] as const;
export type InboxIconVariant = (typeof INBOX_ICON_VARIANTS)[number];

export type InboxIconProps = {
  /** Matches Figma `Property 1` (`Default` | `No Notifications`). */
  property1?: InboxIconVariant;
  /**
   * Optional code-only override for the badge count in the `Default` variant.
   * Figma shows `5` in the reference master.
   */
  badgeCount?: number;
  /**
   * Outer frame size (Figma component frame is 40×40; glyph is 24×24 inside).
   * Hit area scales; icon and badge scale proportionally.
   */
  size?: number;
  className?: string;
  style?: CSSProperties;
};

function formatBadgeCount(count: number): string {
  if (count > 99) return '99+';
  return String(count);
}

/**
 * Inbox / tray icon (Figma: `Inbox icon` component set, node `786:16`).
 * DOM mirrors the renamed Figma layers: `inbox-icon-glyph`, `inbox-icon-badge`, and `inbox-icon-badge-value`.
 */
export function InboxIcon({
  property1 = 'Default',
  badgeCount = 5,
  size = 40,
  className,
  style,
}: InboxIconProps) {
  const scale = size / 40;
  const iconSize = 24 * scale;
  const inset = 8 * scale;
  const resolvedProperty1 =
    property1 ?? (badgeCount > 0 ? 'Default' : 'No Notifications');
  const showBadge = resolvedProperty1 === 'Default' && badgeCount > 0;

  const badgeTextStyle: CSSProperties = {
    ...typographyBodySmallStyle(),
    fontWeight: 600,
  };

  return (
    <span
      data-name="inbox-icon"
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
      <span
        data-name="inbox-icon-glyph"
        style={{
          position: 'absolute',
          left: inset,
          top: inset,
          width: iconSize,
          height: iconSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color('Foundation/Text/Primary'),
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden>
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
      </span>

      {showBadge && (
        <span
          data-name="inbox-icon-badge"
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
          <span data-name="inbox-icon-badge-value">{formatBadgeCount(badgeCount)}</span>
        </span>
      )}
    </span>
  );
}
