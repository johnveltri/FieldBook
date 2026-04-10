import type { CSSProperties } from 'react';
import {
  color,
  colorWithAlpha,
  shadow,
  space,
  typographyBodyBoldStyle,
  typographyLabelStyle,
  typographyMetricStyle,
} from '../../lib/tokens';

const openShadow: CSSProperties = {
  boxShadow: shadow('Shadow/Live/Open'),
};

const minimizedShadow: CSSProperties = {
  boxShadow: shadow('Shadow/Live/Minimized'),
};

const headingOpen: CSSProperties = {
  fontFamily: '"PT Serif", Georgia, "Times New Roman", serif',
  fontSize: 24,
  fontWeight: 700,
  lineHeight: 'normal',
};

export const LIVE_SESSION_VARIANTS = ['openHeader', 'minimized'] as const;

export type LiveSessionVariant = (typeof LIVE_SESSION_VARIANTS)[number];

function LiveDot({ sizePx }: { sizePx: number }) {
  return (
    <span
      style={{
        width: sizePx,
        height: sizePx,
        borderRadius: 9999,
        backgroundColor: color('Brand/Accent'),
        flexShrink: 0,
      }}
      aria-hidden
    />
  );
}

function ChevronDownIcon() {
  const c = color('Foundation/Surface/White');
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        stroke={c}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUpIcon() {
  const c = color('Foundation/Surface/White');
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 12.5 10 7.5 15 12.5"
        stroke={c}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type LiveSessionCardProps = {
  variant: LiveSessionVariant;
  sessionTitle: string;
  /** Large timer when `openHeader` (e.g. `01:10`). */
  timerOpen: string;
  /** Compact strip timer when `minimized` (e.g. `03:02`); falls back to `timerOpen`. */
  timerMinimized?: string;
  onToggle?: () => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * Active live session timer — expanded panel or minimized floating bar
 * (Figma **Live Session** `1287:1545`).
 */
export function LiveSessionCard({
  variant,
  sessionTitle,
  timerOpen,
  timerMinimized,
  onToggle,
  className,
  style,
}: LiveSessionCardProps) {
  const bg = color('Foundation/Border/Default');
  const accent = color('Brand/Accent');
  const white = color('Foundation/Surface/White');
  const muted = color('Foundation/Text/Muted');
  const primaryTimer = color('Brand/Primary');

  const label = typographyLabelStyle();
  const bodyBold = typographyBodyBoldStyle();
  const metricSmall = typographyMetricStyle();

  const stripTimer = timerMinimized ?? timerOpen;

  if (variant === 'minimized') {
    return (
      <section
        className={className}
        data-name="live-session-minimized"
        style={{
          width: '100%',
          maxWidth: 359,
          minHeight: 67.5,
          boxSizing: 'border-box',
          backgroundColor: bg,
          borderRadius: 16,
          border: `1px solid ${colorWithAlpha('Foundation/Surface/Default', 0.1)}`,
          ...minimizedShadow,
          paddingLeft: space('Spacing/16'),
          paddingRight: space('Spacing/16'),
          paddingTop: 9,
          paddingBottom: 9,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space('Spacing/12'),
          ...style,
        }}
      >
        <div
          data-name="live-session-minimized-main"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 11,
            minWidth: 0,
            flex: '1 1 auto',
          }}
        >
          <span data-name="live-session-minimized-dot">
            <LiveDot sizePx={13.5} />
          </span>
          <div
            data-name="live-session-minimized-copy"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 0,
              minWidth: 0,
            }}
          >
            <span
              data-name="live-session-minimized-label"
              style={{
                ...label,
                color: colorWithAlpha('Foundation/Surface/Default', 0.7),
              }}
            >
              Active Session
            </span>
            <p
              data-name="live-session-minimized-title"
              style={{
                margin: 0,
                ...bodyBold,
                color: muted,
                maxWidth: 194,
              }}
            >
              {sessionTitle}
            </p>
          </div>
        </div>
        <div
          data-name="live-session-minimized-actions"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: space('Spacing/12'),
            flexShrink: 0,
          }}
        >
          <span
            data-name="live-session-minimized-timer"
            style={{
              ...metricSmall,
              color: primaryTimer,
              textTransform: 'none',
            }}
          >
            {stripTimer}
          </span>
          <button
            type="button"
            data-name="live-session-minimized-toggle"
            onClick={onToggle}
            aria-label="Expand session"
            style={{
              margin: 0,
              padding: 0,
              border: 'none',
              background: 'none',
              cursor: onToggle ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
            }}
          >
            <span data-name="live-session-minimized-toggle-icon">
              <ChevronUpIcon />
            </span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className={className}
      data-name="live-session-open-header"
      style={{
        width: '100%',
        maxWidth: 391,
        minHeight: 260,
        boxSizing: 'border-box',
        backgroundColor: bg,
        position: 'relative',
        ...openShadow,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        data-name="live-session-open-rail"
        style={{
          height: 6,
          width: '100%',
          backgroundColor: accent,
        }}
        aria-hidden
      />
      <div
        data-name="live-session-open-content"
        style={{
          paddingLeft: space('Spacing/20'),
          paddingRight: space('Spacing/20'),
          paddingTop: space('Spacing/16'),
          paddingBottom: space('Spacing/24'),
        }}
      >
        <div
          data-name="live-session-open-top-row"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: space('Spacing/12'),
          }}
        >
          <div
            data-name="live-session-open-status"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              minWidth: 0,
            }}
          >
            <span data-name="live-session-open-status-dot">
              <LiveDot sizePx={11.5} />
            </span>
            <span data-name="live-session-open-status-label" style={{ ...label, color: muted }}>
              Active Session
            </span>
          </div>
          <button
            type="button"
            data-name="live-session-open-toggle"
            onClick={onToggle}
            aria-label="Collapse session"
            style={{
              margin: 0,
              padding: 0,
              border: 'none',
              background: 'none',
              cursor: onToggle ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              flexShrink: 0,
            }}
          >
            <span data-name="live-session-open-toggle-icon">
              <ChevronDownIcon />
            </span>
          </button>
        </div>

        <h2
          data-name="live-session-open-title"
          style={{
            margin: 0,
            marginTop: space('Spacing/8'),
            ...headingOpen,
            color: white,
            maxWidth: 326,
          }}
        >
          {sessionTitle}
        </h2>

        <div
          data-name="live-session-open-timer-wrap"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: space('Spacing/32'),
            paddingLeft: 77,
            paddingRight: 77,
            boxSizing: 'border-box',
          }}
        >
          <p
            data-name="live-session-open-timer"
            style={{
              margin: 0,
              fontFamily: bodyBold.fontFamily,
              fontWeight: 700,
              fontSize: 70,
              lineHeight: 1,
              color: white,
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
          >
            {timerOpen}
          </p>
        </div>
      </div>
    </section>
  );
}
