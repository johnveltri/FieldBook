import type { CSSProperties, ReactNode } from 'react';
import { color, space, typographyBodyStyle } from '../../lib/tokens';

export const PRIMARY_SECONDARY_LAYOUTS = ['block', 'inline'] as const;
export type PrimarySecondaryLayout = (typeof PRIMARY_SECONDARY_LAYOUTS)[number];

export const PRIMARY_TONES = [
  'success',
  'info',
  'warning',
  'neutral',
  'outline',
] as const;
export type PrimaryTone = (typeof PRIMARY_TONES)[number];

const shadow: CSSProperties = {
  boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
};

const body = typographyBodyStyle();

function primarySurface(tone: PrimaryTone): {
  background: string;
  color: string;
  border: string;
} {
  const white = color('Foundation/Surface/Default');
  const border = color('Foundation/Border/Default');
  const textPrimary = color('Foundation/Text/Primary');
  switch (tone) {
    case 'success':
      return {
        background: color('Semantic/Status/Success/Text'),
        color: white,
        border: 'transparent',
      };
    case 'info':
      return {
        background: color('Semantic/Status/Info/Text'),
        color: white,
        border: 'transparent',
      };
    case 'warning':
      return {
        background: color('Semantic/Status/Warning/Text'),
        color: white,
        border: 'transparent',
      };
    case 'neutral':
      return {
        background: textPrimary,
        color: white,
        border: 'transparent',
      };
    case 'outline':
    default:
      return {
        background: white,
        color: textPrimary,
        border,
      };
  }
}

function secondarySurface(): { background: string; color: string; border: string } {
  return {
    background: color('Foundation/Surface/Default'),
    color: color('Foundation/Text/Primary'),
    border: color('Foundation/Border/Default'),
  };
}

export type PrimarySecondaryButtonsProps = {
  layout: PrimarySecondaryLayout;
  primaryTone: PrimaryTone;
  primaryLabel: string;
  secondaryLabel: string;
  leadingPrimary?: ReactNode;
  leadingSecondary?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
};

/**
 * Primary + secondary action pair (Figma: `Primary-Secondary Buttons`, node `604:35`).
 */
export function PrimarySecondaryButtons({
  layout,
  primaryTone,
  primaryLabel,
  secondaryLabel,
  leadingPrimary,
  leadingSecondary,
  className,
  style,
  onPrimaryClick,
  onSecondaryClick,
}: PrimarySecondaryButtonsProps) {
  const p = primarySurface(primaryTone);
  const s = secondarySurface();
  const isBlock = layout === 'block';

  const primaryStyle: CSSProperties = isBlock
    ? {
        ...body,
        flex: '1 1 auto',
        minWidth: 200,
        minHeight: 48,
        paddingLeft: space('Spacing/40'),
        paddingRight: space('Spacing/40'),
        paddingTop: space('Spacing/16'),
        paddingBottom: space('Spacing/16'),
        borderRadius: 12,
        border: `1px solid ${p.border}`,
        backgroundColor: p.background,
        color: p.color,
        cursor: onPrimaryClick ? 'pointer' : 'default',
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: leadingPrimary != null ? space('Spacing/4') : 0,
        textTransform: 'uppercase',
        ...shadow,
      }
    : {
        ...body,
        flex: '1 1 auto',
        minWidth: 0,
        minHeight: 32,
        paddingTop: 14,
        paddingBottom: 14,
        paddingLeft: 0,
        paddingRight: 0,
        borderRadius: 8,
        border: `1px solid ${p.border}`,
        backgroundColor: p.background,
        color: p.color,
        cursor: onPrimaryClick ? 'pointer' : 'default',
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: leadingPrimary != null ? space('Spacing/4') : 0,
        textTransform: 'uppercase',
        ...shadow,
      };

  const secondaryStyle: CSSProperties = isBlock
    ? {
        ...body,
        flex: '0 1 auto',
        minWidth: 144,
        minHeight: 48,
        paddingLeft: space('Spacing/40'),
        paddingRight: space('Spacing/40'),
        paddingTop: space('Spacing/16'),
        paddingBottom: space('Spacing/16'),
        borderRadius: 12,
        border: `1px solid ${s.border}`,
        backgroundColor: s.background,
        color: s.color,
        cursor: onSecondaryClick ? 'pointer' : 'default',
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: leadingSecondary != null ? space('Spacing/10') : 0,
        textTransform: 'uppercase',
        ...shadow,
      }
    : {
        ...body,
        flex: '0 1 auto',
        minWidth: 0,
        minHeight: 32,
        paddingTop: 14,
        paddingBottom: 14,
        paddingLeft: 0,
        paddingRight: 0,
        borderRadius: 8,
        border: `1px solid ${s.border}`,
        backgroundColor: s.background,
        color: s.color,
        cursor: onSecondaryClick ? 'pointer' : 'default',
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: leadingSecondary != null ? space('Spacing/10') : 0,
        textTransform: 'uppercase',
        ...shadow,
      };

  const rowStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space('Spacing/8'),
    width: '100%',
    maxWidth: 392,
    boxSizing: 'border-box',
    ...style,
  };

  return (
    <div className={className} style={rowStyle} role="group" aria-label="Primary and secondary actions">
      <button type="button" onClick={onPrimaryClick} style={primaryStyle}>
        {leadingPrimary != null ? (
          <span style={{ display: 'inline-flex', flexShrink: 0 }}>{leadingPrimary}</span>
        ) : null}
        <span>{primaryLabel}</span>
      </button>
      <button type="button" onClick={onSecondaryClick} style={secondaryStyle}>
        {leadingSecondary != null ? (
          <span style={{ display: 'inline-flex', flexShrink: 0 }}>{leadingSecondary}</span>
        ) : null}
        <span>{secondaryLabel}</span>
      </button>
    </div>
  );
}
