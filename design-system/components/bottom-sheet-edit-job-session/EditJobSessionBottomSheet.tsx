import type { CSSProperties, ReactNode } from 'react';
import {
  color,
  space,
  typographyBodyBoldStyle,
  typographyBodySmallStyle,
  typographyBodyStyle,
  typographyTitleH3Style,
} from '../../lib/tokens';

const sheetShadow: CSSProperties = {
  boxShadow: '0px 25px 50px rgba(0, 0, 0, 0.25)',
};

const handleBg = 'rgba(43, 52, 65, 0.2)';

const bodyBold = typographyBodyBoldStyle();
const bodySmall = typographyBodySmallStyle();
const fieldText = typographyBodyStyle();

export const EDIT_JOB_SESSION_VARIANTS = [
  'editSession',
  'editJobPlaceholder',
  'editJobFilled',
] as const;

export type EditJobSessionVariant = (typeof EDIT_JOB_SESSION_VARIANTS)[number];

/** Figma “Edit Job Empty” populated sample (`1286:701`). */
const JOB_FILLED_DEFAULT = {
  jobTitle: 'Bathroom Remodel Phase 1',
  customerName: 'Andrew G',
  addressLine1: '123 Main Street ',
  addressLine2: 'Perrysburg, OH 43551',
  revenue: '5,678.87',
  jobType: 'Plumbing',
} as const;

const JOB_PLACEHOLDER_COPY = {
  jobTitle: 'Job Description',
  customerName: 'Customer Name',
  addressLine1: 'Service Address',
  addressLine2: '',
  revenue: 'Revenue',
  jobType: 'Select Job Type...',
} as const;

const SESSION_DEFAULT = {
  startDate: '2026-03-25',
  startTime: '02 : 00 PM',
  endDate: '2026-03-25',
  endTime: '04 : 00 PM',
} as const;

export type EditJobFormValues = {
  jobTitle: string;
  customerName: string;
  addressLine1: string;
  addressLine2: string;
  revenue: string;
  jobType: string;
};

export type EditSessionTimes = {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
};

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

function TrashGlyph() {
  const c = color('Semantic/Status/Error/Text');
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
        stroke={c}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SessionClockIcon() {
  const c = color('Brand/Accent');
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx={8} cy={8} r={6.25} stroke={c} strokeWidth={1.25} />
      <path
        d="M8 4.75V8l2.25 1.35"
        stroke={c}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type EditJobSessionBottomSheetProps = {
  variant: EditJobSessionVariant;
  /** Job field values merged with defaults per variant. */
  job?: Partial<EditJobFormValues>;
  onJobChange?: (next: EditJobFormValues) => void;
  /** Session date/time values merged with defaults. */
  session?: Partial<EditSessionTimes>;
  onSessionChange?: (next: EditSessionTimes) => void;
  /** Replace default job field stack (`editJob*` only). */
  children?: ReactNode;
  onBack?: () => void;
  onSaveChanges?: () => void;
  onDelete?: () => void;
  className?: string;
  style?: CSSProperties;
};

function mergeJob(
  variant: EditJobSessionVariant,
  job: Partial<EditJobFormValues> | undefined,
): EditJobFormValues {
  const base =
    variant === 'editJobFilled'
      ? ({ ...JOB_FILLED_DEFAULT } as EditJobFormValues)
      : ({
          jobTitle: '',
          customerName: '',
          addressLine1: '',
          addressLine2: '',
          revenue: '',
          jobType: '',
        } as EditJobFormValues);
  return { ...base, ...job };
}

function mergeSession(session: Partial<EditSessionTimes> | undefined): EditSessionTimes {
  return { ...SESSION_DEFAULT, ...session };
}

/**
 * Edit job details or session times with save + delete actions
 * (Figma component set **Edit Job, Session** `1284:789`).
 */
export function EditJobSessionBottomSheet({
  variant,
  job: jobProp,
  onJobChange,
  session: sessionProp,
  onSessionChange,
  children,
  onBack,
  onSaveChanges,
  onDelete,
  className,
  style,
}: EditJobSessionBottomSheetProps) {
  const bg = color('Foundation/Background/Default');
  const borderSubtle = color('Foundation/Border/Subtle');
  const fg = color('Foundation/Text/Primary');
  const backFg = color('Foundation/Text/Secondary');
  const secondary = color('Foundation/Text/Secondary');
  const borderDefault = color('Foundation/Border/Default');
  const accent = color('Brand/Accent');
  const primary = color('Brand/Primary');
  const surface = color('Foundation/Surface/Default');

  const titleId = 'fieldbook-edit-job-session-title';
  const isSession = variant === 'editSession';
  const isJob = variant === 'editJobPlaceholder' || variant === 'editJobFilled';
  const isPlaceholderJob = variant === 'editJobPlaceholder';

  const minHeight =
    variant === 'editSession' ? 451 : variant === 'editJobFilled' ? 457 : 453;

  const j = mergeJob(variant, jobProp);
  const s = mergeSession(sessionProp);

  const inputShell = (
    minH: number,
    extra?: CSSProperties,
  ): CSSProperties => ({
    ...fieldText,
    boxSizing: 'border-box',
    minHeight: minH,
    borderRadius: 8,
    border: `1px solid ${borderSubtle}`,
    backgroundColor: surface,
    outline: 'none',
    width: '100%',
    paddingLeft: 13,
    paddingRight: 13,
    paddingTop: 9,
    paddingBottom: 9,
    color: fg,
    ...extra,
  });

  const revenuePrefixStyle: CSSProperties = {
    ...bodyBold,
    color: borderDefault,
    width: 14,
    flexShrink: 0,
    textAlign: 'left' as const,
    paddingRight: 6,
  };

  const jc = isPlaceholderJob
    ? {
        title: { ...typographyTitleH3Style(), color: secondary },
        body: { ...fieldText, color: secondary },
      }
    : {
        title: { ...typographyTitleH3Style(), color: fg },
        body: { ...fieldText, color: fg },
      };

  const defaultJobBody =
    variant === 'editJobPlaceholder' ? (
      <>
        <input
          type="text"
          value={j.jobTitle}
          placeholder={JOB_PLACEHOLDER_COPY.jobTitle}
          onChange={(e) =>
            onJobChange?.({ ...j, jobTitle: e.target.value })
          }
          aria-label="Job description"
          style={inputShell(46, jc.title)}
        />
        <input
          type="text"
          value={j.customerName}
          placeholder={JOB_PLACEHOLDER_COPY.customerName}
          onChange={(e) =>
            onJobChange?.({ ...j, customerName: e.target.value })
          }
          aria-label="Customer name"
          style={inputShell(38, jc.body)}
        />
        <input
          type="text"
          value={j.addressLine1}
          placeholder={JOB_PLACEHOLDER_COPY.addressLine1}
          onChange={(e) =>
            onJobChange?.({ ...j, addressLine1: e.target.value })
          }
          aria-label="Service address"
          style={inputShell(38, jc.body)}
        />
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', ...inputShell(38, jc.body), paddingLeft: 12 }}>
          <span style={revenuePrefixStyle} aria-hidden>$</span>
          <input
            type="text"
            value={j.revenue}
            placeholder={JOB_PLACEHOLDER_COPY.revenue}
            onChange={(e) =>
              onJobChange?.({ ...j, revenue: e.target.value })
            }
            aria-label="Revenue"
            style={{
              ...fieldText,
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: secondary,
              padding: 0,
            }}
          />
        </div>
        <input
          type="text"
          value={j.jobType}
          placeholder={JOB_PLACEHOLDER_COPY.jobType}
          onChange={(e) =>
            onJobChange?.({ ...j, jobType: e.target.value })
          }
          aria-label="Job type"
          style={{ ...inputShell(38, { ...jc.body, color: fg }) }}
        />
      </>
    ) : (
      <>
        <input
          type="text"
          value={j.jobTitle}
          onChange={(e) =>
            onJobChange?.({ ...j, jobTitle: e.target.value })
          }
          aria-label="Job title"
          style={inputShell(38, jc.title)}
        />
        <input
          type="text"
          value={j.customerName}
          onChange={(e) =>
            onJobChange?.({ ...j, customerName: e.target.value })
          }
          aria-label="Customer name"
          style={inputShell(38, jc.body)}
        />
        <div
          style={{
            ...inputShell(38, jc.body),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          <p style={{ margin: 0, lineHeight: 'normal' }}>{j.addressLine1}</p>
          <p style={{ margin: 0, lineHeight: 'normal' }}>{j.addressLine2}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', ...inputShell(38, jc.body), paddingLeft: 12 }}>
          <span style={revenuePrefixStyle} aria-hidden>$</span>
          <input
            type="text"
            value={j.revenue}
            onChange={(e) =>
              onJobChange?.({ ...j, revenue: e.target.value })
            }
            aria-label="Revenue"
            style={{
              ...fieldText,
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: fg,
              padding: 0,
            }}
          />
        </div>
        <input
          type="text"
          value={j.jobType}
          onChange={(e) =>
            onJobChange?.({ ...j, jobType: e.target.value })
          }
          aria-label="Job type"
          style={inputShell(38, jc.body)}
        />
      </>
    );

  const sessionBody = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: space('Spacing/8'),
        width: '100%',
      }}
    >
      <span style={{ ...bodySmall, color: secondary }}>Start Time</span>
      <input
        type="text"
        value={s.startDate}
        onChange={(e) =>
          onSessionChange?.({ ...s, startDate: e.target.value })
        }
        aria-label="Start date"
        style={inputShell(38)}
      />
      <input
        type="text"
        value={s.startTime}
        onChange={(e) =>
          onSessionChange?.({ ...s, startTime: e.target.value })
        }
        aria-label="Start time"
        style={inputShell(38)}
      />
      <span style={{ ...bodySmall, color: secondary }}>End Time</span>
      <input
        type="text"
        value={s.endDate}
        onChange={(e) =>
          onSessionChange?.({ ...s, endDate: e.target.value })
        }
        aria-label="End date"
        style={inputShell(38)}
      />
      <input
        type="text"
        value={s.endTime}
        onChange={(e) =>
          onSessionChange?.({ ...s, endTime: e.target.value })
        }
        aria-label="End time"
        style={inputShell(38)}
      />
    </div>
  );

  return (
    <section
      className={className}
      aria-labelledby={titleId}
      style={{
        width: '100%',
        maxWidth: 391,
        minHeight,
        boxSizing: 'border-box',
        backgroundColor: bg,
        borderTop: `1px solid ${borderSubtle}`,
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingLeft: space('Spacing/24'),
        paddingRight: space('Spacing/24'),
        paddingTop: 18,
        paddingBottom: 18,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: space('Spacing/16'),
        ...sheetShadow,
        ...style,
      }}
    >
      <div
        style={{
          width: 40,
          height: 6,
          borderRadius: 9999,
          backgroundColor: handleBg,
          flexShrink: 0,
        }}
        aria-hidden
      />

      <div
        style={{
          width: '100%',
          maxWidth: 343,
          display: 'flex',
          flexDirection: 'column',
          gap: space('Spacing/12'),
          flex: 1,
          minHeight: 0,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
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
            alignSelf: 'flex-start',
          }}
        >
          <ChevronBackIcon />
          Back
        </button>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: space('Spacing/12'),
          }}
        >
          {isSession ? <SessionClockIcon /> : null}
          <h2
            id={titleId}
            style={{
              margin: 0,
              ...typographyTitleH3Style(),
              color: fg,
              whiteSpace: 'nowrap',
            }}
          >
            {isSession ? 'Edit Session' : 'Edit Job'}
          </h2>
        </div>

        {isSession ? (
          <div style={{ marginTop: space('Spacing/8') }}>{sessionBody}</div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: space('Spacing/8'),
              width: '100%',
            }}
          >
            {children ?? defaultJobBody}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: 18,
          width: '100%',
          maxWidth: 343,
          minHeight: 71,
        }}
      >
        <button
          type="button"
          onClick={onSaveChanges}
          style={{
            flex: 1,
            minWidth: 0,
            paddingTop: 17,
            paddingBottom: 17,
            paddingLeft: 100,
            paddingRight: 100,
            borderRadius: 12,
            border: 'none',
            backgroundColor: accent,
            cursor: onSaveChanges ? 'pointer' : 'default',
            boxShadow: `0px 1px 2px ${primary}`,
            ...bodyBold,
            color: surface,
            textTransform: 'uppercase',
          }}
        >
          SAVE CHANGES
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          style={{
            flexShrink: 0,
            width: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 18,
            paddingBottom: 18,
            borderRadius: 8,
            border: `1px solid rgba(212, 87, 42, 0.2)`,
            backgroundColor: surface,
            cursor: onDelete ? 'pointer' : 'default',
          }}
        >
          <TrashGlyph />
        </button>
      </div>
    </section>
  );
}
