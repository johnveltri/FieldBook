import type { CSSProperties } from 'react';
import {
  color,
  space,
  typographyBodyBoldStyle,
  typographyBodySmallStyle,
  typographyLabelStyle,
  typographyTitleH3Style,
} from '../../lib/tokens';
import { QuickCaptureTileIcon } from '../bottom-sheet-quick-capture/QuickCaptureTileIcons';
import { RowCard } from '../row-card';

const sheetShadow: CSSProperties = {
  boxShadow: '0px 25px 50px rgba(0, 0, 0, 0.25)',
};

const cardShadow: CSSProperties = {
  boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
};

const bodyBold = typographyBodyBoldStyle();
const bodySmall = typographyBodySmallStyle();
const labelDivider = typographyLabelStyle();

export const CHOOSE_SESSION_VARIANTS = [
  'newNote',
  'addToSession',
  'removeEditSession',
] as const;

export type ChooseSessionVariant = (typeof CHOOSE_SESSION_VARIANTS)[number];

function sheetTitle(variant: ChooseSessionVariant): string {
  switch (variant) {
    case 'newNote':
      return 'New Note';
    case 'addToSession':
      return 'Add to Session';
    case 'removeEditSession':
      return 'Edit Session';
    default: {
      const _e: never = variant;
      return _e;
    }
  }
}

function ChevronBackIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12.5 15L7.5 10l5-5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type ChooseSessionJobRow = {
  id: string;
  title: string;
  subtitle: string;
};

export type ChooseSessionBottomSheetProps = {
  variant: ChooseSessionVariant;
  jobs: ChooseSessionJobRow[];
  onBack?: () => void;
  /** New Note: “Add Job Note” row. Remove/Edit Session: “Remove From Session” row. */
  onFeaturedAction?: () => void;
  onSelectJob?: (jobId: string) => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * Pick or detach a session for a job note (Figma: **Bottom Sheet: Choose Session** `1279:381`).
 */
export function ChooseSessionBottomSheet({
  variant,
  jobs,
  onBack,
  onFeaturedAction,
  onSelectJob,
  className,
  style,
}: ChooseSessionBottomSheetProps) {
  const bg = color('Foundation/Background/Default');
  const borderSubtle = color('Foundation/Border/Subtle');
  const fg = color('Foundation/Text/Primary');
  const backFg = color('Foundation/Text/Secondary');
  const titleMuted = color('Foundation/Text/Muted');
  const note = color('Semantic/Activity/Note');
  const errorBg = color('Semantic/Status/Error/BG');
  const errorText = color('Semantic/Status/Error/Text');
  const sheetTitleId = 'fieldbook-choose-session-title';
  const wellBg = 'rgba(250, 246, 240, 0.2)';

  const showFeatured = variant === 'newNote' || variant === 'removeEditSession';
  const showDivider =
    variant === 'newNote' || variant === 'removeEditSession';

  const dividerLabel =
    variant === 'newNote'
      ? 'or attach to SESSION'
      : 'ATTACH TO DIFFERENT SESSION';

  return (
    <section
      className={className}
      aria-labelledby={sheetTitleId}
      style={{
        width: '100%',
        maxWidth: 391,
        minHeight: 491.5,
        boxSizing: 'border-box',
        backgroundColor: bg,
        borderTop: `1px solid ${borderSubtle}`,
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingLeft: 18,
        paddingRight: 18,
        paddingBottom: space('Spacing/24'),
        ...sheetShadow,
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: space('Spacing/24'),
        }}
      >
        <div
          style={{
            width: 40,
            height: 6,
            borderRadius: 9999,
            backgroundColor: borderSubtle,
            flexShrink: 0,
          }}
          aria-hidden
        />
      </div>

      <div style={{ paddingTop: space('Spacing/32') }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            minHeight: 28,
            marginBottom: space('Spacing/16'),
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: space('Spacing/4'),
              padding: 0,
              margin: 0,
              border: 'none',
              background: 'none',
              cursor: onBack ? 'pointer' : 'default',
              color: backFg,
              ...bodyBold,
              width: 72,
              flexShrink: 0,
            }}
          >
            <ChevronBackIcon />
            Back
          </button>
          <h2
            id={sheetTitleId}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              margin: 0,
              textAlign: 'center',
              pointerEvents: 'none',
              ...typographyTitleH3Style(),
              color: fg,
            }}
          >
            {sheetTitle(variant)}
          </h2>
          <div style={{ width: 72, flexShrink: 0 }} aria-hidden />
        </div>

        {variant === 'newNote' ? (
          <button
            type="button"
            onClick={onFeaturedAction}
            style={{
              width: '100%',
              maxWidth: 353,
              margin: '0 auto',
              display: 'flex',
              boxSizing: 'border-box',
              alignItems: 'center',
              minHeight: 85,
              paddingLeft: space('Spacing/20'),
              paddingRight: space('Spacing/20'),
              paddingTop: space('Spacing/16'),
              paddingBottom: space('Spacing/16'),
              borderRadius: 16,
              border: `1px solid ${borderSubtle}`,
              backgroundColor: note,
              cursor: onFeaturedAction ? 'pointer' : 'default',
              textAlign: 'left',
              ...cardShadow,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: space('Spacing/12'),
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  minHeight: 40,
                  borderRadius: 9999,
                  backgroundColor: wellBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: titleMuted,
                }}
              >
                <QuickCaptureTileIcon kind="newNote" />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: space('Spacing/4'),
                  minWidth: 0,
                }}
              >
                <div style={{ ...bodyBold, color: titleMuted }}>
                  Add Job Note
                </div>
                <div
                  style={{
                    ...bodySmall,
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Save as unassigned — assign to a session later
                </div>
              </div>
            </div>
          </button>
        ) : null}

        {variant === 'removeEditSession' ? (
          <button
            type="button"
            onClick={onFeaturedAction}
            style={{
              width: '100%',
              maxWidth: 353,
              margin: '0 auto',
              display: 'flex',
              boxSizing: 'border-box',
              alignItems: 'center',
              minHeight: 85,
              paddingLeft: space('Spacing/20'),
              paddingRight: space('Spacing/20'),
              paddingTop: space('Spacing/16'),
              paddingBottom: space('Spacing/16'),
              borderRadius: 16,
              border: `1px solid ${borderSubtle}`,
              backgroundColor: errorBg,
              cursor: onFeaturedAction ? 'pointer' : 'default',
              textAlign: 'left',
              ...cardShadow,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: space('Spacing/4'),
                minWidth: 0,
              }}
            >
              <div style={{ ...bodyBold, color: errorText }}>
                Remove From Session
              </div>
              <div style={{ ...bodySmall, color: backFg }}>
                Save as unassigned — assign to a session later
              </div>
            </div>
          </button>
        ) : null}

        {showDivider ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: space('Spacing/12'),
              justifyContent: 'center',
              paddingTop: space('Spacing/8'),
              paddingBottom: space('Spacing/8'),
              marginTop: showFeatured ? 9 : 0,
            }}
          >
            <div
              style={{
                height: 1,
                flex: 1,
                maxWidth: 75.25,
                backgroundColor: borderSubtle,
              }}
              aria-hidden
            />
            <span
              style={{
                ...labelDivider,
                color: color('Foundation/Text/Secondary'),
                flexShrink: 0,
                textAlign: 'center',
              }}
            >
              {dividerLabel}
            </span>
            <div
              style={{
                height: 1,
                flex: 1,
                maxWidth: 75.25,
                backgroundColor: borderSubtle,
              }}
              aria-hidden
            />
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'center',
            marginTop: variant === 'addToSession' ? space('Spacing/24') : 0,
          }}
        >
          {jobs.map((job) => (
            <RowCard
              key={job.id}
              variant="simpleJob"
              title={job.title}
              subtitle={job.subtitle}
              onPress={
                onSelectJob ? () => onSelectJob(job.id) : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
