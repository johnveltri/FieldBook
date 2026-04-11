import type { CSSProperties, ReactNode } from 'react';
import {
  color,
  shadow,
  space,
  typographyBodySmallStyle,
} from '../../lib/tokens';

const labelStyle: CSSProperties = {
  ...typographyBodySmallStyle(),
  color: color('Foundation/Text/Primary'),
  textAlign: 'center',
  textTransform: 'uppercase',
};

const tileShadow: CSSProperties = {
  boxShadow: shadow('Shadow/Card/Default'),
};

const iconWellShadow: CSSProperties = {
  boxShadow: shadow('Shadow/Card/Default'),
};

export const ACTION_TILE_KINDS = [
  'startSession',
  'newNote',
  'addPhoto',
  'voiceMemo',
  'uploadFile',
  'newMaterial',
] as const;

export type ActionTileKind = (typeof ACTION_TILE_KINDS)[number];

const KIND_META: Record<
  ActionTileKind,
  { line1: string; line2: string; accentToken: string }
> = {
  startSession: {
    line1: 'START',
    line2: 'SESSION',
    accentToken: 'Semantic/Status/Error/Text',
  },
  newNote: {
    line1: 'NEW',
    line2: 'NOTE',
    accentToken: 'Semantic/Activity/Note',
  },
  addPhoto: {
    line1: 'ADD',
    line2: 'PHOTO',
    accentToken: 'Semantic/Activity/Photo',
  },
  voiceMemo: {
    line1: 'VOICE',
    line2: 'MEMO',
    accentToken: 'Semantic/Activity/Voice',
  },
  uploadFile: {
    line1: 'UPLOAD',
    line2: 'FILE',
    accentToken: 'Semantic/Activity/Attachment',
  },
  newMaterial: {
    line1: 'NEW',
    line2: 'MATERIAL',
    accentToken: 'Semantic/Activity/Material',
  },
};

export type ActionTileProps = {
  kind: ActionTileKind;
  /** Typically 20×20 glyph, centered in the 40px accent circle. */
  icon: ReactNode;
  line1?: string;
  line2?: string;
  onClick?: () => void;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Quick action cell: accent icon well + two-line label (Figma: `Action Tile`, `452:2740`).
 * `data-name` values match `structure.figmaLayerNames` in `spec.json` (icon above label in code; Figma uses absolute layout for the same visual).
 */
export function ActionTile({
  kind,
  icon,
  line1: line1Prop,
  line2: line2Prop,
  onClick,
  'aria-label': ariaLabel,
  className,
  style,
}: ActionTileProps) {
  const meta = KIND_META[kind];
  const line1 = line1Prop ?? meta.line1;
  const line2 = line2Prop ?? meta.line2;
  const accent = color(meta.accentToken);
  const defaultLabel = `${line1} ${line2}`;

  const inner = (
    <>
      <div
        data-name="action-tile-icon-circle"
        style={{
          width: 40,
          height: 40,
          borderRadius: 9999,
          backgroundColor: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: color('Foundation/Surface/Default'),
          ...iconWellShadow,
        }}
        >
        <div data-name="action-tile-icon">{icon}</div>
      </div>
      <div
        data-name="action-tile-label"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          width: '100%',
        }}
      >
        <span data-name="action-tile-label-line-1" style={{ ...labelStyle, lineHeight: 1.25 }}>
          {line1}
        </span>
        <span data-name="action-tile-label-line-2" style={{ ...labelStyle, lineHeight: 1.25 }}>
          {line2}
        </span>
      </div>
    </>
  );

  const shellStyle: CSSProperties = {
    width: 106.33,
    minHeight: 112,
    boxSizing: 'border-box',
    border: `1px solid ${color('Foundation/Border/Default')}`,
    borderRadius: 16,
    backgroundColor: color('Foundation/Surface/Default'),
    ...tileShadow,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: space('Spacing/16'),
    paddingBottom: space('Spacing/12'),
    paddingLeft: space('Spacing/8'),
    paddingRight: space('Spacing/8'),
    gap: space('Spacing/8'),
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        data-name="action-tile"
        onClick={onClick}
        aria-label={ariaLabel ?? defaultLabel}
        style={{
          ...shellStyle,
          margin: 0,
          font: 'inherit',
          textAlign: 'inherit',
        }}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className={className}
      data-name="action-tile"
      style={shellStyle}
      role="group"
      aria-label={ariaLabel ?? defaultLabel}
    >
      {inner}
    </div>
  );
}
