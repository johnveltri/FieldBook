import type { CSSProperties } from 'react';
import {
  color,
  colorWithAlpha,
  shadowFromColor,
  space,
  typographyBodyBoldStyle,
  typographyMetricStyle,
} from '../../lib/tokens';

const surfaceWhite = color('Foundation/Surface/Default');

export const FIELD_BOOK_CTA_VARIANTS = [
  'notePrimary',
  'notePrimaryWithDelete',
  'brandPrimaryXl',
] as const;

export type FieldBookCtaVariant = (typeof FIELD_BOOK_CTA_VARIANTS)[number];

function TrashGlyph({ strokeColor }: { strokeColor: string }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3.5 4.5h9M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M12.5 4.5V13a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V4.5M6.5 7.5v4M9.5 7.5v4"
        stroke={strokeColor}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const labelNotePrimary: CSSProperties = {
  ...typographyBodyBoldStyle(),
  color: surfaceWhite,
  textTransform: 'uppercase',
  textAlign: 'center',
};

const labelBrandXl: CSSProperties = {
  ...typographyMetricStyle(),
  color: surfaceWhite,
  textTransform: 'uppercase',
  textAlign: 'center',
};

export type FieldBookCtaButtonProps = {
  variant: FieldBookCtaVariant;
  /** Default: `SAVE TO JOB` / `SAVE CHANGES` / `END SESSION` per variant. */
  primaryLabel?: string;
  onPrimaryClick?: () => void;
  /** `notePrimaryWithDelete` only. */
  onDeleteClick?: () => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * High-emphasis CTAs from Field Book (Figma **Button** `1287:1563`):
 * note-colored save, save + delete row, brand XL end action.
 */
export function FieldBookCtaButton({
  variant,
  primaryLabel,
  onPrimaryClick,
  onDeleteClick,
  className,
  style,
}: FieldBookCtaButtonProps) {
  const note = color('Semantic/Activity/Note');
  const brand = color('Brand/Primary');
  const deleteIcon = color('Semantic/Status/Error/Text');
  const noteShadow: CSSProperties = {
    boxShadow: shadowFromColor(note),
  };
  const xlShadow: CSSProperties = {
    boxShadow: shadowFromColor(note),
  };

  const resolvedPrimaryLabel =
    primaryLabel ??
    (variant === 'notePrimary'
      ? 'SAVE TO JOB'
      : variant === 'notePrimaryWithDelete'
        ? 'SAVE CHANGES'
        : 'END SESSION');

  const primaryButtonBase: CSSProperties = {
    margin: 0,
    border: 'none',
    borderRadius: 12,
    cursor: onPrimaryClick ? 'pointer' : 'default',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 100,
    paddingRight: 100,
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: 343,
  };

  if (variant === 'brandPrimaryXl') {
    return (
      <button
        data-name="field-book-cta-xl"
        type="button"
        className={className}
        onClick={onPrimaryClick}
        style={{
          ...primaryButtonBase,
          backgroundColor: brand,
          paddingTop: space('Spacing/24'),
          paddingBottom: space('Spacing/24'),
          ...xlShadow,
          ...style,
        }}
      >
        <span data-name="field-book-cta-label" style={labelBrandXl}>
          {resolvedPrimaryLabel}
        </span>
      </button>
    );
  }

  if (variant === 'notePrimary') {
    return (
      <button
        data-name="field-book-cta-primary"
        type="button"
        className={className}
        onClick={onPrimaryClick}
        style={{
          ...primaryButtonBase,
          backgroundColor: note,
          paddingTop: 17,
          paddingBottom: 17,
          ...noteShadow,
          ...style,
        }}
      >
        <span data-name="field-book-cta-label" style={labelNotePrimary}>
          {resolvedPrimaryLabel}
        </span>
      </button>
    );
  }

  return (
    <div
      data-name="field-book-cta-with-delete"
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 18,
        width: '100%',
        maxWidth: 343,
        minHeight: 71,
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...style,
      }}
    >
      <button
        data-name="field-book-cta-primary"
        type="button"
        onClick={onPrimaryClick}
        style={{
          flex: '1 1 0',
          minWidth: 0,
          margin: 0,
          border: 'none',
          borderRadius: 12,
          backgroundColor: note,
          cursor: onPrimaryClick ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: 100,
          paddingRight: 100,
          paddingTop: 17,
          paddingBottom: 17,
          ...noteShadow,
        }}
      >
        <span data-name="field-book-cta-label" style={labelNotePrimary}>
          {resolvedPrimaryLabel}
        </span>
      </button>
      <button
        data-name="field-book-cta-delete"
        type="button"
        onClick={onDeleteClick}
        aria-label="Delete"
        style={{
          flexShrink: 0,
          margin: 0,
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 18,
          paddingBottom: 18,
          borderRadius: 8,
          border: `1px solid ${colorWithAlpha('Brand/Primary', 0.2)}`,
          backgroundColor: surfaceWhite,
          cursor: onDeleteClick ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
        }}
      >
        <span data-name="field-book-cta-delete-icon">
          <TrashGlyph strokeColor={deleteIcon} />
        </span>
      </button>
    </div>
  );
}
