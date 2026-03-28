import type { CSSProperties } from 'react';
import { color, space, typographyLabelStyle } from '../../lib/tokens';

export type BottomNavSelection = 'Default' | 'Home' | 'Jobs' | 'Earnings';

export type BottomNavTab = 'Home' | 'Jobs' | 'Earnings';

export type BottomNavProps = {
  /** Matches Figma component property `Selection`. */
  selection?: BottomNavSelection;
  className?: string;
  style?: CSSProperties;
  onSelect?: (tab: BottomNavTab) => void;
};

const TABS: { id: BottomNavTab; label: string }[] = [
  { id: 'Home', label: 'HOME' },
  { id: 'Jobs', label: 'JOBS' },
  { id: 'Earnings', label: 'EARNINGS' },
];

function tabIcon(tab: BottomNavTab, iconColor: string) {
  const common = {
    width: space('Spacing/12') * 2,
    height: space('Spacing/12') * 2,
    color: iconColor,
  } as const;

  switch (tab) {
    case 'Home':
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'Jobs':
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect
            x={5}
            y={7}
            width={14}
            height={12}
            rx={1.5}
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <path d="M9 7V5.5a1 1 0 011-1h4a1 1 0 011 1V7" stroke="currentColor" strokeWidth={1.5} />
        </svg>
      );
    case 'Earnings':
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 18V6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
          <path d="M12 18V10" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
          <path d="M19 18V14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      );
  }
}

function selectedTabIndex(selection: BottomNavSelection): number | null {
  if (selection === 'Home') return 0;
  if (selection === 'Jobs') return 1;
  if (selection === 'Earnings') return 2;
  return null;
}

/**
 * Three-tab bottom navigation (Figma: `Bottom Nav`, node 225:12089).
 * Tokens: `../../tokens/*.json`; spec: `./spec.json`.
 */
export function BottomNav({
  selection = 'Default',
  className,
  style,
  onSelect,
}: BottomNavProps) {
  const bg = color('Foundation/Background/Default');
  const borderSubtle = color('Foundation/Border/Subtle');
  const textPrimary = color('Foundation/Text/Primary');
  const brand = color('Brand/Primary');
  const surfaceWhite = color('Foundation/Surface/White');

  const pad = space('Spacing/12');
  const gap = space('Spacing/12');
  const indicatorH = space('Spacing/4');
  const indicatorW = space('Spacing/32');

  const labelStyle = typographyLabelStyle();
  const selIdx = selectedTabIndex(selection);

  const indicatorLeft =
    selIdx === null
      ? undefined
      : `calc(${(selIdx + 0.5) * (100 / 3)}% - ${indicatorW / 2}px)`;

  return (
    <nav
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 391,
        minHeight: 73,
        boxSizing: 'border-box',
        backgroundColor: bg,
        borderTop: `1px solid ${borderSubtle}`,
        ...style,
      }}
      aria-label="Primary"
    >
      {selIdx !== null && (
        <div
          style={{
            position: 'absolute',
            top: 2.5,
            left: indicatorLeft,
            width: indicatorW,
            height: indicatorH,
            borderRadius: 9999,
            backgroundColor: brand,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 73,
          boxSizing: 'border-box',
        }}
      >
        {TABS.map((tab) => {
          const isSelected =
            selection !== 'Default' && selection === tab.id;
          const labelColor = isSelected ? brand : textPrimary;
          const iconColor = isSelected ? brand : textPrimary;

          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isSelected ? 'page' : undefined}
              onClick={() => onSelect?.(tab.id)}
              style={{
                flex: '1 1 0',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap,
                padding: pad,
                border: 'none',
                background: 'transparent',
                cursor: onSelect ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: space('Spacing/12') * 2,
                  height: space('Spacing/12') * 2,
                  backgroundColor: surfaceWhite,
                }}
              >
                {tabIcon(tab.id, iconColor)}
              </span>
              <span
                style={{
                  ...labelStyle,
                  color: labelColor,
                  textAlign: 'center',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
