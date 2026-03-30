import type { CSSProperties, ReactNode } from 'react';
import { PlusIcon } from '../../icons/PlusIcon';
import {
  color,
  space,
  typographyBodySmallStyle,
  typographyMetricSStyle,
} from '../../lib/tokens';

export const SECTION_HEADER_LAYOUTS = ['Row', 'Stack', 'Title only'] as const;
export type SectionHeaderLayout = (typeof SECTION_HEADER_LAYOUTS)[number];

export type SectionHeaderAction = 'none' | 'add' | 'edit';

export type SectionHeaderTitleTone =
  | 'accent'
  | 'secondary'
  | 'warning'
  | 'info'
  | 'primary';

export type SectionHeaderSubtitleTone =
  | 'warning'
  | 'info'
  | 'secondary'
  | 'primary';

const TITLE_TONE: Record<SectionHeaderTitleTone, string> = {
  accent: 'Brand/Accent',
  secondary: 'Foundation/Text/Secondary',
  warning: 'Semantic/Status/Warning/Text',
  info: 'Semantic/Status/Info/Text',
  primary: 'Foundation/Text/Primary',
};

const SUBTITLE_TONE: Record<SectionHeaderSubtitleTone, string> = {
  warning: 'Semantic/Status/Warning/Text',
  info: 'Semantic/Status/Info/Text',
  secondary: 'Foundation/Text/Secondary',
  primary: 'Foundation/Text/Primary',
};

export type SectionHeaderProps = {
  layout: SectionHeaderLayout;
  title: string;
  /** Second line; used when `layout` is `Stack`. */
  subtitle?: string;
  /** Trailing pill; only shown when `layout` is `Row`. */
  action?: SectionHeaderAction;
  /** Leading icon or marker; not used for `Title only`. */
  leading?: ReactNode;
  titleTone?: SectionHeaderTitleTone;
  subtitleTone?: SectionHeaderSubtitleTone;
  className?: string;
  style?: CSSProperties;
  onActionClick?: () => void;
};

const titleText = typographyMetricSStyle();
const smallText = typographyBodySmallStyle();

function IconPencil({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20l4.5-1 9-9-3.5-3.5-9 9L4 20z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActionPill({
  mode,
  onClick,
}: {
  mode: 'add' | 'edit';
  onClick?: () => void;
}) {
  const errBg = color('Semantic/Status/Error/BG');
  const errFg = color('Semantic/Status/Error/Text');

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space('Spacing/8'),
        minHeight: 24,
        paddingLeft: space('Spacing/12'),
        paddingRight: space('Spacing/12'),
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
        border: 'none',
        backgroundColor: errBg,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        ...smallText,
        color: errFg,
        textTransform: 'uppercase',
      }}
    >
      {mode === 'add' ? (
        <>
          <PlusIcon size={12} />
          <span>ADD</span>
        </>
      ) : (
        <>
          <IconPencil size={12} />
          <span>EDIT</span>
        </>
      )}
    </button>
  );
}

/**
 * Section header (Figma: `Section Header`, node `371:2179`).
 * Variants: `Row` | `Stack` | `Title only` — see `./spec.json`.
 */
export function SectionHeader({
  layout,
  title,
  subtitle,
  action = 'none',
  leading,
  titleTone = 'accent',
  subtitleTone = 'warning',
  className,
  style,
  onActionClick,
}: SectionHeaderProps) {
  const titleColor = color(TITLE_TONE[titleTone]);
  const subColor = color(SUBTITLE_TONE[subtitleTone]);

  const pad = {
    paddingTop: space('Spacing/36'),
    paddingBottom: space('Spacing/16'),
    paddingLeft: space('Spacing/20'),
    paddingRight: space('Spacing/20'),
  };

  const titleEl = (
    <span
      style={{
        ...titleText,
        color: titleColor,
        margin: 0,
      }}
    >
      {title}
    </span>
  );

  if (layout === 'Title only') {
    return (
      <header
        className={className}
        style={{ ...pad, boxSizing: 'border-box', width: '100%', maxWidth: 353, ...style }}
        aria-label={title}
      >
        {titleEl}
      </header>
    );
  }

  if (layout === 'Stack') {
    return (
      <header
        className={className}
        style={{
          ...pad,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: 353,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 4,
          ...style,
        }}
        aria-label={title}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: space('Spacing/8'),
            width: '100%',
          }}
        >
          {leading != null ? (
            <span style={{ display: 'flex', flexShrink: 0 }}>{leading}</span>
          ) : null}
          {titleEl}
        </div>
        {subtitle ? (
          <div style={{ paddingLeft: 22, paddingRight: 22 }}>
            <span
              style={{
                ...smallText,
                color: subColor,
                margin: 0,
              }}
            >
              {subtitle}
            </span>
          </div>
        ) : null}
      </header>
    );
  }

  // Row
  const showAction = action !== 'none';

  return (
    <header
      className={className}
      style={{
        ...pad,
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: 353,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space('Spacing/8'),
        ...style,
      }}
      aria-label={title}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: space('Spacing/8'),
          minWidth: 0,
          flex: '1 1 auto',
        }}
      >
        {leading != null ? (
          <span style={{ display: 'flex', flexShrink: 0 }}>{leading}</span>
        ) : null}
        {titleEl}
      </div>
      {showAction ? (
        <ActionPill mode={action === 'edit' ? 'edit' : 'add'} onClick={onActionClick} />
      ) : null}
    </header>
  );
}
