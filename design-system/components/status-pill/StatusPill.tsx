import type { CSSProperties } from 'react';
import { color, space, typographyLabelStyle } from '../../lib/tokens';

const labelStyle: CSSProperties = {
  ...typographyLabelStyle(),
  textTransform: 'none',
};

export const STATUS_PILL_KINDS = [
  'paid',
  'notStarted',
  'inProgress',
  'completed',
  'onHold',
  'cancelled',
] as const;

export type StatusPillKind = (typeof STATUS_PILL_KINDS)[number];

const DEFAULT_LABEL: Record<StatusPillKind, string> = {
  paid: 'Paid',
  notStarted: 'NOT STARTED',
  inProgress: 'IN PROGRESS',
  completed: 'COMPLETED',
  onHold: 'ON HOLD',
  cancelled: 'CANCELLED',
};

export type StatusPillProps = {
  kind: StatusPillKind;
  /** Overrides the default label for `kind` (e.g. custom casing). */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

function pillStyle(kind: StatusPillKind): CSSProperties {
  switch (kind) {
    case 'paid':
      return {
        backgroundColor: color('Semantic/Status/Success/BG'),
        border: `1px solid ${color('Semantic/Status/Success/Text')}`,
        color: color('Semantic/Status/Success/Text'),
      };
    case 'notStarted':
      return {
        backgroundColor: color('Semantic/Status/Neutral/BG'),
        border: `1px solid ${color('Semantic/Status/Neutral/Text')}`,
        color: color('Semantic/Status/Neutral/Text'),
      };
    case 'inProgress':
      return {
        backgroundColor: color('Semantic/Status/Info/BG'),
        border: `1px solid ${color('Semantic/Status/Info/Text')}`,
        color: color('Semantic/Status/Info/Text'),
      };
    case 'completed':
      return {
        backgroundColor: color('Semantic/Status/Warning/BG'),
        border: `1px solid ${color('Semantic/Status/Warning/Stroke')}80`,
        color: color('Semantic/Status/Warning/Label'),
      };
    case 'onHold':
      return {
        backgroundColor: color('Semantic/Status/Paused/BG'),
        border: `1px solid ${color('Semantic/Status/Paused/Text')}`,
        color: color('Semantic/Status/Paused/Text'),
      };
    case 'cancelled':
      return {
        backgroundColor: color('Semantic/Status/Error/BG'),
        border: `1px solid ${color('Semantic/Status/Error/Text')}`,
        color: color('Semantic/Status/Error/Text'),
      };
  }
}

/**
 * Status pill (Figma: `Status pill` component set, node `622:143`).
 * Fills and strokes match `design-system/tokens/colors.json` semantic status tokens.
 */
export function StatusPill({ kind, label, className, style }: StatusPillProps) {
  const text = label ?? DEFAULT_LABEL[kind];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        paddingLeft: space('Spacing/12'),
        paddingRight: space('Spacing/12'),
        paddingTop: space('Spacing/4'),
        paddingBottom: space('Spacing/4'),
        borderRadius: 9999,
        ...labelStyle,
        ...pillStyle(kind),
        ...style,
      }}
    >
      {text}
    </span>
  );
}
