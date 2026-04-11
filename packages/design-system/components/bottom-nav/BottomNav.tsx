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

/** Matches Figma `bottom-nav-tab-{home|jobs|earnings}` suffix. */
function tabSlug(tab: BottomNavTab): string {
  return tab.toLowerCase();
}

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

function selectedTab(selection: BottomNavSelection): BottomNavTab | null {
  if (selection === 'Home') return 'Home';
  if (selection === 'Jobs') return 'Jobs';
  if (selection === 'Earnings') return 'Earnings';
  return null;
}

/**
 * Three-tab bottom navigation (Figma: `Bottom Nav`, node 225:12089).
 * DOM mirrors `bottom-nav-*` layers: strip → tab cells → optional indicator + `bottom-nav-tab-content` (icon + label).
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

  const stripPad = space('Spacing/8');
  const tabPad = space('Spacing/12');
  const iconPad = space('Spacing/4');
  const contentGap = 2;
  const indicatorH = space('Spacing/4');
  const indicatorW = space('Spacing/32');
  const iconSize = space('Spacing/12') * 2;
  const iconFrame = iconSize + iconPad * 2;

  const labelStyle = typographyLabelStyle();
  const active = selectedTab(selection);

  return (
    <nav
      className={className}
      data-name="bottom-nav-background"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 391,
        minHeight: 73,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: bg,
        borderTop: `1px solid ${borderSubtle}`,
        ...style,
      }}
      aria-label="Primary"
    >
      <div
        data-name="bottom-nav-tab-strip"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          justifyContent: 'center',
          boxSizing: 'border-box',
          paddingLeft: stripPad,
          paddingRight: stripPad,
          minHeight: 0,
        }}
      >
        {TABS.map((tab) => {
          const isSelected = active !== null && active === tab.id;
          const labelColor = isSelected ? brand : textPrimary;
          const iconColor = isSelected ? brand : textPrimary;
          const slug = tabSlug(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              data-name={`bottom-nav-tab-${slug}`}
              aria-current={isSelected ? 'page' : undefined}
              onClick={() => onSelect?.(tab.id)}
              style={{
                flex: '1 1 0',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: isSelected ? 'space-between' : 'flex-end',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: onSelect ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {isSelected && (
                <div
                  data-name="bottom-nav-active-indicator"
                  style={{
                    alignSelf: 'center',
                    width: indicatorW,
                    height: indicatorH,
                    borderRadius: 9999,
                    backgroundColor: brand,
                    pointerEvents: 'none',
                    flexShrink: 0,
                  }}
                />
              )}
              <div
                data-name="bottom-nav-tab-content"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: contentGap,
                  padding: tabPad,
                  boxSizing: 'border-box',
                  width: '100%',
                }}
              >
                <span
                  data-name={`bottom-nav-tab-icon-${slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: iconFrame,
                    height: iconFrame,
                    padding: iconPad,
                    boxSizing: 'border-box',
                    backgroundColor: surfaceWhite,
                  }}
                >
                  {tabIcon(tab.id, iconColor)}
                </span>
                <span
                  data-name={`bottom-nav-tab-label-${slug}`}
                  style={{
                    ...labelStyle,
                    color: labelColor,
                    textAlign: 'center',
                  }}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
