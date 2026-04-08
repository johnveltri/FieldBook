import type { CSSProperties, ReactNode } from 'react';
import {
  color,
  space,
  typographyBodySmallStyle,
  typographyBodyStyle,
  typographyLabelStyle,
} from '../../lib/tokens';
import { QuickCaptureTileIcon } from '../bottom-sheet-quick-capture/QuickCaptureTileIcons';
import type { ActionTileKind } from '../action-tile';

const cardShadow: CSSProperties = {
  boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
};

const sectionDivider = 'rgba(43, 52, 65, 0.05)';

export const VIEW_NOTES_VARIANTS = [
  'notesMultiSession',
  'notesSameSession',
  'notesSingleSession',
] as const;

export type ViewNotesVariant = (typeof VIEW_NOTES_VARIANTS)[number];

export type ViewNotesRowIcon = 'newNote' | 'newMaterial';

export type ViewNotesNoteItem = {
  excerpt: string;
  dateLabel: string;
  /** Default `newNote` (Figma note glyph); session rows may use `newMaterial`. */
  iconKind?: ViewNotesRowIcon;
};

export type ViewNotesSessionBlock = {
  /** Date line before the word **SESSION** (e.g. `Mar 25, 2026`). Uppercased via label style. */
  sessionDateLabel: string;
  notes: ViewNotesNoteItem[];
};

function Icon16({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        width: 16,
        height: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: 'flex',
          transform: 'scale(0.8)',
          transformOrigin: 'center',
        }}
      >
        {children}
      </span>
    </span>
  );
}

const TILE_KIND: Record<ViewNotesRowIcon, ActionTileKind> = {
  newNote: 'newNote',
  newMaterial: 'newMaterial',
};

function rowAccent(kind: ViewNotesRowIcon): string {
  return kind === 'newMaterial'
    ? color('Semantic/Activity/Material')
    : color('Semantic/Activity/Note');
}

function NoteRow({ item }: { item: ViewNotesNoteItem }) {
  const iconKind = item.iconKind ?? 'newNote';
  const body = typographyBodyStyle();
  const small = typographyBodySmallStyle();

  return (
    <div
      style={{
        paddingLeft: space('Spacing/16'),
        paddingRight: space('Spacing/16'),
        paddingTop: space('Spacing/16'),
        paddingBottom: space('Spacing/16'),
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          color: rowAccent(iconKind),
          display: 'flex',
          marginTop: 2,
          flexShrink: 0,
        }}
      >
        <Icon16>
          <QuickCaptureTileIcon kind={TILE_KIND[iconKind]} />
        </Icon16>
      </span>
      <div
        style={{
          flex: '1 1 0',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: space('Spacing/4'),
        }}
      >
        <p
          style={{
            margin: 0,
            ...body,
            color: color('Foundation/Text/Primary'),
          }}
        >
          {item.excerpt}
        </p>
        <p
          style={{
            margin: 0,
            ...small,
            color: color('Foundation/Text/Secondary'),
          }}
        >
          {item.dateLabel}
        </p>
      </div>
    </div>
  );
}

function SessionGroupHeader({ sessionDateLabel }: { sessionDateLabel: string }) {
  const label = typographyLabelStyle();
  const secondary = color('Foundation/Text/Secondary');

  return (
    <div
      style={{
        height: 32,
        boxSizing: 'border-box',
        backgroundColor: color('Foundation/Background/Default'),
        paddingLeft: space('Spacing/16'),
        paddingRight: space('Spacing/16'),
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <span style={{ ...label, color: secondary }}>
        {`${sessionDateLabel.trim()} SESSION`}
      </span>
    </div>
  );
}

export type ViewNotesCardProps = {
  variant: ViewNotesVariant;
  /** Top band label (Figma default **Unassigned**). */
  bucketLabel?: string;
  /** Rows under the first band. */
  unassignedNotes: ViewNotesNoteItem[];
  /**
   * Second band for **`notesMultiSession`** — session sub-header + rows.
   * Ignored for other variants.
   */
  sessionBlock?: ViewNotesSessionBlock;
  className?: string;
  style?: CSSProperties;
};

/**
 * Notes list card: bucket header + note rows; multi-session adds a **SESSION** band + rows
 * (Figma **View Notes** `1287:432`).
 */
export function ViewNotesCard({
  variant,
  bucketLabel = 'Unassigned',
  unassignedNotes,
  sessionBlock,
  className,
  style,
}: ViewNotesCardProps) {
  const borderSubtle = color('Foundation/Border/Subtle');
  const surfaceWhite = color('Foundation/Surface/White');
  const label = typographyLabelStyle();
  const secondary = color('Foundation/Text/Secondary');
  const showSessionBlock =
    variant === 'notesMultiSession' &&
    sessionBlock !== undefined &&
    sessionBlock.notes.length > 0;

  return (
    <section
      className={className}
      style={{
        width: '100%',
        maxWidth: 353,
        boxSizing: 'border-box',
        paddingTop: 9,
        paddingBottom: 9,
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          borderRadius: 16,
          border: `1px solid ${borderSubtle}`,
          backgroundColor: surfaceWhite,
          boxSizing: 'border-box',
          overflow: 'hidden',
          ...cardShadow,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              backgroundColor: color('Foundation/Background/Default'),
              paddingLeft: space('Spacing/16'),
              paddingRight: space('Spacing/16'),
              paddingTop: space('Spacing/8'),
              paddingBottom: space('Spacing/8'),
            }}
          >
            <span style={{ ...label, color: secondary }}>{bucketLabel}</span>
          </div>

          {unassignedNotes.map((item, i) => (
            <NoteRow key={`u-${i}-${item.excerpt.slice(0, 12)}`} item={item} />
          ))}

          {showSessionBlock ? (
            <div
              style={{
                borderTop: `1px solid ${sectionDivider}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
            >
              <SessionGroupHeader
                sessionDateLabel={sessionBlock!.sessionDateLabel}
              />
              {sessionBlock!.notes.map((item, i) => (
                <NoteRow
                  key={`s-${i}-${item.excerpt.slice(0, 12)}`}
                  item={item}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
