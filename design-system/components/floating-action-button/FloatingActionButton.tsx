import type { CSSProperties } from 'react';
import { PlusIcon } from '../../icons/PlusIcon';
import { color, shadow, space, typographyBodySmallStyle } from '../../lib/tokens';

/** Subtle single shadow (matches reduced Figma DROP_SHADOW on FAB variants). */
const fabShadow: CSSProperties = {
  boxShadow: shadow('Shadow/Accent/Brand'),
};

export const FLOATING_ACTION_VARIANTS = ['icon', 'extended'] as const;
export type FloatingActionVariant = (typeof FLOATING_ACTION_VARIANTS)[number];

export type FloatingActionButtonProps = {
  variant: FloatingActionVariant;
  /** Extended variant only. */
  label?: string;
  onClick?: () => void;
  /** Icon-only should set a clear action name (e.g. “Add”). */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
};

const labelStyle: CSSProperties = {
  ...typographyBodySmallStyle(),
  fontSize: 12,
  fontWeight: 600,
  color: color('Foundation/Surface/Default'),
  lineHeight: '20px',
};

/**
 * Floating action button (Figma component set `613:4`, variants `Style=Icon` | `Style=Extended`).
 * Uses shared {@link PlusIcon} (same asset as Section Header `371:2175`).
 * `data-name` matches kebab-case Figma layers (`floating-action-button-*`).
 */
export function FloatingActionButton({
  variant,
  label = 'New Job',
  onClick,
  'aria-label': ariaLabel,
  className,
  style,
}: FloatingActionButtonProps) {
  const bg = color('Brand/Primary');
  const fg = color('Foundation/Surface/Default');

  if (variant === 'icon') {
    return (
      <button
        type="button"
        data-name="floating-action-button"
        onClick={onClick}
        aria-label={ariaLabel ?? 'Add'}
        className={className}
        style={{
          width: 56,
          height: 56,
          padding: 0,
          border: 'none',
          borderRadius: 9999,
          backgroundColor: bg,
          color: fg,
          cursor: onClick ? 'pointer' : 'default',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...fabShadow,
          ...style,
        }}
      >
        <span data-name="floating-action-button-icon" style={{ display: 'inline-flex', lineHeight: 0 }}>
          <PlusIcon size={28} />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      data-name="floating-action-button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={className}
      style={{
        height: 48,
        minWidth: 140,
        paddingLeft: space('Spacing/24'),
        paddingRight: space('Spacing/24'),
        paddingTop: 0,
        paddingBottom: 0,
        border: 'none',
        borderRadius: 9999,
        backgroundColor: bg,
        color: fg,
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...fabShadow,
        ...style,
      }}
    >
      <span
        data-name="floating-action-button-extended-body"
        style={{
          display: 'inline-flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space('Spacing/8'),
        }}
      >
        <span data-name="floating-action-button-icon" style={{ display: 'inline-flex', lineHeight: 0 }}>
          <PlusIcon size={20} />
        </span>
        <span data-name="floating-action-button-label">
          <span data-name="floating-action-button-label-text" style={labelStyle}>
            {label}
          </span>
        </span>
      </span>
    </button>
  );
}
