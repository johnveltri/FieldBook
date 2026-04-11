import type { CSSProperties, ReactNode } from 'react';
import {
  color,
  colorWithAlpha,
  shadow,
  space,
  typographyBodyBoldStyle,
  typographyBodySmallStyle,
  typographyBodyStyle,
  typographyMetricStyle,
} from '../../lib/tokens';
import { QuickCaptureTileIcon } from '../bottom-sheet-quick-capture/QuickCaptureTileIcons';
import type { ActionTileKind } from '../action-tile';

const cardShadow: CSSProperties = {
  boxShadow: shadow('Shadow/Card/Default'),
};

const panelTopBorder = color('Foundation/Border/Subtle');
const rowBorder = color('Foundation/Border/Subtle');
const panelBg = colorWithAlpha('Foundation/Surface/Subtle', 0.3);

export const VIEW_SESSION_VARIANTS = [
  'collapsed',
  'expandedEmpty',
  'expandedAttachments',
] as const;

export type ViewSessionVariant = (typeof VIEW_SESSION_VARIANTS)[number];

export type ViewSessionAttachmentKind = 'note' | 'material' | 'photo' | 'voice';

export type ViewSessionAttachment = {
  kind: ViewSessionAttachmentKind;
  /** Row title (e.g. note title, “Example Material (2)”). */
  title: string;
  /** Trailing value for materials (e.g. `$4.00`). */
  price?: string;
};

const TILE_KIND: Record<ViewSessionAttachmentKind, ActionTileKind> = {
  note: 'newNote',
  material: 'newMaterial',
  photo: 'addPhoto',
  voice: 'voiceMemo',
};

const TILE_ACCENT: Record<ViewSessionAttachmentKind, string> = {
  note: color('Semantic/Activity/Note'),
  material: color('Semantic/Activity/Material'),
  photo: color('Semantic/Activity/Photo'),
  voice: color('Semantic/Activity/Voice'),
};

const TILE_LABEL: Record<ViewSessionAttachmentKind, string> = {
  note: 'Note',
  material: 'Material',
  photo: 'Photo',
  voice: 'Voice',
};

function ChevronIcon({ expanded }: { expanded: boolean }) {
  const c = color('Foundation/Text/Primary');
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{
        transform: expanded ? 'rotate(180deg)' : undefined,
        flexShrink: 0,
      }}
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

function PencilIcon() {
  const c = color('Semantic/Status/Error/Text');
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8.5 2.5 11 5 4 12H2.5v-1.5L8.5 2.5z"
        stroke={c}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 3.5 10.5 6.5"
        stroke={c}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

export type ViewSessionCardProps = {
  variant: ViewSessionVariant;
  dateLabel: string;
  timeRangeLabel: string;
  durationLabel: string;
  /** Rows when `variant` is `expandedAttachments`. */
  attachments?: ViewSessionAttachment[];
  emptyMessage?: string;
  onToggle?: () => void;
  onEdit?: () => void;
  onAddNote?: () => void;
  onAddMaterial?: () => void;
  onAddPhoto?: () => void;
  onAddVoice?: () => void;
  className?: string;
  style?: CSSProperties;
  /** Optional slot below the capture tiles (e.g. extra controls). */
  children?: ReactNode;
};

/**
 * Collapsible session summary with quick-capture tiles and optional attachment list
 * (Figma **View Session** `1284:577`).
 */
export function ViewSessionCard({
  variant,
  dateLabel,
  timeRangeLabel,
  durationLabel,
  attachments = [],
  emptyMessage = 'No notes, materials or photos yet',
  onToggle,
  onEdit,
  onAddNote,
  onAddMaterial,
  onAddPhoto,
  onAddVoice,
  className,
  style,
  children,
}: ViewSessionCardProps) {
  const isExpanded = variant !== 'collapsed';
  const borderSubtle = color('Foundation/Border/Subtle');
  const surfaceWhite = color('Foundation/Surface/White');
  const fg = color('Foundation/Text/Primary');
  const secondary = color('Foundation/Text/Secondary');
  const errorBg = color('Semantic/Status/Error/BG');
  const errorText = color('Semantic/Status/Error/Text');

  const bodyBold = typographyBodyBoldStyle();
  const timeRangeStyle: CSSProperties = {
    ...typographyBodyStyle(),
    fontSize: 11.9,
    lineHeight: '20px',
    color: secondary,
  };
  const metric = typographyMetricStyle();
  const small = typographyBodySmallStyle();

  const headerInner = (
    <div
      data-name="view-session-header"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 351,
        paddingLeft: space('Spacing/16'),
        paddingRight: space('Spacing/16'),
        paddingTop: 15,
        paddingBottom: 15,
        boxSizing: 'border-box',
      }}
    >
      <div
        data-name="view-session-header-leading"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 0,
          minWidth: 0,
        }}
      >
        <div
          data-name="view-session-date-row"
          style={{
            paddingTop: space('Spacing/4'),
            paddingBottom: space('Spacing/4'),
            width: '100%',
          }}
        >
          <p
            style={{
              margin: 0,
              ...bodyBold,
              color: fg,
              whiteSpace: 'nowrap',
            }}
          >
            {dateLabel}
          </p>
        </div>
        <div data-name="view-session-time-range-row" style={{ paddingTop: 1, paddingBottom: 1 }}>
          <p style={{ margin: 0, ...timeRangeStyle, whiteSpace: 'nowrap' }}>
            {timeRangeLabel}
          </p>
        </div>
      </div>
      <div
        data-name="view-session-header-trailing"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: space('Spacing/12'),
          flexShrink: 0,
        }}
      >
        <div data-name="view-session-duration">
          <p
            style={{
              margin: 0,
              ...metric,
              color: fg,
              textTransform: 'none',
              minWidth: 40,
              textAlign: 'right',
            }}
          >
            {durationLabel}
          </p>
        </div>
        <div data-name="view-session-chevron">
          <ChevronIcon expanded={isExpanded} />
        </div>
      </div>
    </div>
  );

  const tileBtn = (
    kind: ViewSessionAttachmentKind,
    onClick?: () => void,
  ): ReactNode => {
    const accent = TILE_ACCENT[kind];
    return (
      <button
        data-name="view-session-capture-tile"
        key={kind}
        type="button"
        onClick={onClick}
        aria-label={TILE_LABEL[kind]}
        style={{
          width: 73.75,
          height: 56,
          boxSizing: 'border-box',
          borderRadius: 12,
          border: `1px solid ${borderSubtle}`,
          backgroundColor: surfaceWhite,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 10,
          gap: 6,
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <span style={{ color: accent, display: 'flex' }}>
          <Icon16>
            <QuickCaptureTileIcon kind={TILE_KIND[kind]} />
          </Icon16>
        </span>
        <span
          style={{
            fontFamily: bodyBold.fontFamily,
            fontSize: 8.5,
            fontWeight: 700,
            lineHeight: '12px',
            color: fg,
            textTransform: 'none',
          }}
        >
          {TILE_LABEL[kind]}
        </span>
      </button>
    );
  };

  const expandedPanel = isExpanded ? (
    <div
      data-name="view-session-expanded"
      style={{
        width: '100%',
        borderTop: `1px solid ${panelTopBorder}`,
        backgroundColor: panelBg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <div
        data-name="view-session-panel-inner"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          paddingTop: space('Spacing/16'),
          paddingBottom: 0,
        }}
      >
        <div
          data-name="view-session-edit-row"
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingLeft: space('Spacing/16'),
            paddingRight: space('Spacing/16'),
          }}
        >
          <div data-name="view-session-edit-button-wrap">
            <button
              data-name="view-session-edit-button"
              type="button"
              onClick={onEdit}
              style={{
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space('Spacing/8'),
                height: 24,
                paddingLeft: space('Spacing/12'),
                paddingRight: space('Spacing/12'),
                paddingTop: space('Spacing/4'),
                paddingBottom: space('Spacing/4'),
                borderRadius: 9999,
                border: 'none',
                backgroundColor: errorBg,
                cursor: onEdit ? 'pointer' : 'default',
              }}
            >
              <PencilIcon />
              <span
                style={{
                  ...small,
                  color: errorText,
                }}
              >
                EDIT
              </span>
            </button>
          </div>
        </div>

        <div
          data-name="view-session-capture-section"
          style={{
            marginTop: space('Spacing/16'),
            paddingLeft: space('Spacing/16'),
            paddingRight: space('Spacing/16'),
            width: '100%',
            maxWidth: 319,
            alignSelf: 'center',
            boxSizing: 'border-box',
          }}
        >
          <p
            data-name="view-session-capture-heading"
            style={{
              margin: 0,
              marginBottom: space('Spacing/8'),
              ...small,
              color: fg,
            }}
          >
            Add to Session
          </p>
          <div
            data-name="view-session-tile-row"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: space('Spacing/8'),
              flexWrap: 'wrap',
            }}
          >
            {tileBtn('note', onAddNote)}
            {tileBtn('material', onAddMaterial)}
            {tileBtn('photo', onAddPhoto)}
            {tileBtn('voice', onAddVoice)}
          </div>
        </div>

        <div
          data-name="view-session-list-section"
          style={{
            padding: space('Spacing/16'),
            width: '100%',
            maxWidth: 351,
            alignSelf: 'center',
            boxSizing: 'border-box',
          }}
        >
          {variant === 'expandedAttachments' && attachments.length > 0 ? (
            <div
              data-name="view-session-attachment-list"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: space('Spacing/8'),
                width: '100%',
                maxWidth: 319,
                margin: '0 auto',
              }}
            >
              {attachments.map((row, i) => (
                <div
                  data-name="view-session-attachment-row"
                  key={`${row.kind}-${i}-${row.title}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: 45,
                    paddingLeft: space('Spacing/12'),
                    paddingRight: space('Spacing/12'),
                    paddingTop: 12,
                    paddingBottom: 12,
                    borderRadius: 8,
                    border: `1px solid ${rowBorder}`,
                    backgroundColor: surfaceWhite,
                    boxSizing: 'border-box',
                    gap: space('Spacing/8'),
                  }}
                >
                  <span
                    data-name="view-session-attachment-icon"
                    style={{
                      color: TILE_ACCENT[row.kind],
                      display: 'flex',
                      flexShrink: 0,
                    }}
                  >
                    <Icon16>
                      <QuickCaptureTileIcon kind={TILE_KIND[row.kind]} />
                    </Icon16>
                  </span>
                  <span
                    data-name="view-session-attachment-title"
                    style={{
                      ...small,
                      color: fg,
                      flex: '1 1 0',
                      minWidth: 0,
                      textAlign: 'left',
                    }}
                  >
                    {row.title}
                  </span>
                  {row.price !== undefined && row.price.length > 0 ? (
                    <span
                      data-name="view-session-attachment-price"
                      style={{
                        ...small,
                        color: fg,
                        flexShrink: 0,
                        textAlign: 'right',
                      }}
                    >
                      {row.price}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div
              data-name="view-session-empty"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: space('Spacing/8'),
                paddingBottom: space('Spacing/8'),
                maxWidth: 185,
                margin: '0 auto',
              }}
            >
              <p
                data-name="view-session-empty-message"
                style={{
                  margin: 0,
                  ...small,
                  color: secondary,
                  textAlign: 'center',
                }}
              >
                {emptyMessage}
              </p>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section
      data-name="view-session-card"
      className={className}
      style={{
        width: '100%',
        maxWidth: 353,
        minHeight: variant === 'collapsed' ? 80 : undefined,
        boxSizing: 'border-box',
        backgroundColor: surfaceWhite,
        border: `1px solid ${borderSubtle}`,
        borderRadius: 16,
        ...cardShadow,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: isExpanded ? 2 : 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          style={{
            margin: 0,
            padding: 0,
            border: 'none',
            background: 'none',
            font: 'inherit',
            color: 'inherit',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            width: '100%',
          }}
        >
          {isExpanded ? (
            <div data-name="view-session-header-wrap" style={{ width: '100%' }}>
              {headerInner}
            </div>
          ) : (
            headerInner
          )}
        </button>
      ) : (
        <div style={{ width: '100%' }}>
          {isExpanded ? (
            <div data-name="view-session-header-wrap" style={{ width: '100%' }}>
              {headerInner}
            </div>
          ) : (
            headerInner
          )}
        </div>
      )}

      {expandedPanel}
    </section>
  );
}
