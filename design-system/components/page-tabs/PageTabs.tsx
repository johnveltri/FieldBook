import type { CSSProperties } from 'react';
import { color, space, typographyLabelStyle } from '../../lib/tokens';

const segmentShadow: CSSProperties = {
  boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
};

/** Job list filter labels (Figma preset). */
export const JOB_PAGE_TAB_LABELS = ['All', 'Open', 'Paid'] as const;

/** Earnings period labels (Figma preset). */
export const EARNINGS_PAGE_TAB_LABELS = [
  'This week',
  'This month',
  'This year',
] as const;

export type PageTabIndex = 0 | 1 | 2;

export type PageTabsProps = {
  /** Exactly three tab labels. */
  labels: readonly [string, string, string];
  value: PageTabIndex;
  onChange: (index: PageTabIndex) => void;
  /** Matches Figma frame width (345). */
  maxWidth?: number;
  className?: string;
  style?: CSSProperties;
};

const labelStyle = typographyLabelStyle();

/**
 * Page tabs / segmented control (Figma **Page Tabs** `806:20`).
 */
export function PageTabs({
  labels,
  value,
  onChange,
  maxWidth = 345,
  className,
  style,
}: PageTabsProps) {
  const track: CSSProperties = {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth,
    minHeight: 44.5,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: space('Spacing/4'),
    backgroundColor: color('Foundation/Surface/Subtle'),
    borderRadius: 9999,
    ...style,
  };

  return (
    <div className={className} role="tablist" style={track}>
      {labels.map((text, index) => {
        const selected = value === index;
        const isMiddleSlot = index === 1;
        const segment: CSSProperties = {
          flex: 1,
          minWidth: 0,
          border: 'none',
          margin: 0,
          cursor: 'pointer',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: space('Spacing/12'),
          paddingBottom: space('Spacing/12'),
          borderRadius: 9999,
          backgroundColor: selected
            ? color('Foundation/Surface/Default')
            : color('Foundation/Surface/Subtle'),
          color: selected
            ? color('Foundation/Text/Primary')
            : color('Foundation/Text/Secondary'),
          ...labelStyle,
          ...(isMiddleSlot ? segmentShadow : {}),
        };

        return (
          <button
            key={`${text}-${index}`}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(index as PageTabIndex)}
            style={segment}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
