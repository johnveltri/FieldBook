import type { CSSProperties } from 'react';
import {
  color,
  space,
  typographyBodyBoldStyle,
  typographyBodyStyle,
  typographyLabelStyle,
  typographyTitleH3Style,
} from '../../lib/tokens';
import { StatusPill, type StatusPillKind } from '../status-pill';

const body = typographyBodyStyle();
const bodyBold = typographyBodyBoldStyle();
const labelCaps = typographyLabelStyle();

/** LABEL token without forced uppercase (Figma instances use mixed case for category chip). */
const labelMixed: CSSProperties = {
  ...labelCaps,
  textTransform: 'none',
};

const borderSubtle = color('Foundation/Border/Subtle');
const surfaceWhite = color('Foundation/Surface/White');
const textPrimary = color('Foundation/Text/Primary');
const textSecondary = color('Foundation/Text/Secondary');
const textMuted = color('Foundation/Text/Muted');
const textOnDark = color('Foundation/Background/Default');
const chipBg = color('Foundation/Text/Primary');
const brandPrimary = color('Brand/Primary');
/** MAT column value — matches Figma Job Card (`622:161`): **Brand/Accent** `#C44B2B`, not `Semantic/Activity/Material`. */
const metricMatValue = color('Brand/Accent');
const successText = color('Semantic/Status/Success/Text');

const cardShadow: CSSProperties = {
  boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
};

export type JobCardStatusVariant = 'success' | 'neutral';

/**
 * Matches Figma **Job Card** component set `622:161` — `Property 1`:
 * **Default** (`withCategory`), **No job category** (`noCategory`),
 * **Empty State** (`emptyState`), **No Metrics** (`noMetrics`).
 */
export type JobCardVariant =
  | 'withCategory'
  | 'noCategory'
  | 'emptyState'
  | 'noMetrics';

/** @deprecated Use `JobCardVariant`. */
export type JobCardCategoryVariant = Extract<
  JobCardVariant,
  'withCategory' | 'noCategory' | 'noMetrics'
>;

export type JobCardProps = {
  title?: string;
  customerName?: string;
  lastWorkedLabel?: string;
  categoryLabel?: string | null;
  /** Figma `Property 1`: `withCategory` / `noMetrics` show category chip when `categoryLabel` is set; `noCategory` / `emptyState` omit it. `noMetrics` hides the metrics row. */
  variant?: JobCardVariant;
  status?: string;
  /** Maps to `StatusPill` `kind` when `statusPillKind` is omitted: `success` → paid, `neutral` → not started. */
  statusVariant?: JobCardStatusVariant;
  /** Overrides auto mapping from `statusVariant`; use for any lifecycle pill from the design system. */
  statusPillKind?: StatusPillKind;
  timeHours?: string;
  revenue?: string;
  materials?: string;
  net?: string;
  netSentiment?: 'positive' | 'negative';
  onPress?: () => void;
  className?: string;
  style?: CSSProperties;
};

function pillKindFromStatusVariant(v: JobCardStatusVariant): StatusPillKind {
  return v === 'success' ? 'paid' : 'notStarted';
}

function netValueColor(sentiment: 'positive' | 'negative'): string {
  return sentiment === 'positive' ? successText : brandPrimary;
}

/**
 * Job list/detail card with accent rail, header, optional category chip, status pill, and metrics.
 * Figma: **Job Card** component set `622:161` (Default `661:2`, No job category `622:162`,
 * Empty State `622:199`, No Metrics `1286:816`).
 */
export function JobCard({
  title,
  customerName,
  lastWorkedLabel,
  categoryLabel,
  variant = 'withCategory',
  status,
  statusVariant = 'success',
  statusPillKind,
  timeHours,
  revenue,
  materials,
  net,
  netSentiment = 'positive',
  onPress,
  className,
  style,
}: JobCardProps) {
  const isEmpty = variant === 'emptyState';
  const showMetrics = variant !== 'noMetrics';

  if (!isEmpty) {
    if (title === undefined || title === '') {
      throw new Error(
        'JobCard: `title` is required when `variant` is not `emptyState`.',
      );
    }
    if (status === undefined || status === '') {
      throw new Error(
        'JobCard: `status` is required when `variant` is not `emptyState`.',
      );
    }
  }

  const resolvedTitle = isEmpty ? (title ?? 'Untitled Job') : title!;
  const resolvedCustomer = isEmpty ? (customerName ?? 'No customer') : customerName;
  const resolvedLastWorked = isEmpty
    ? (lastWorkedLabel ?? 'Last updated Mar 13')
    : lastWorkedLabel;
  const resolvedStatus = isEmpty ? (status ?? 'NOT STARTED') : status!;
  const resolvedStatusVariant = isEmpty
    ? (statusVariant ?? 'neutral')
    : statusVariant;
  const resolvedTimeHours = isEmpty ? (timeHours ?? '0.0h') : (timeHours ?? '');
  const resolvedRevenue = isEmpty ? (revenue ?? '$0') : (revenue ?? '');
  const resolvedMaterials = isEmpty ? (materials ?? '-$0') : (materials ?? '');
  const resolvedNet = isEmpty ? (net ?? '$0') : (net ?? '');
  const resolvedNetSentiment = isEmpty ? (netSentiment ?? 'positive') : netSentiment;

  const showMeta =
    (resolvedCustomer && resolvedCustomer.length > 0) ||
    (resolvedLastWorked && resolvedLastWorked.length > 0);
  const showCategory =
    (variant === 'withCategory' || variant === 'noMetrics') &&
    categoryLabel !== null &&
    categoryLabel !== undefined &&
    categoryLabel.length > 0;

  const pillKind =
    statusPillKind ?? pillKindFromStatusVariant(resolvedStatusVariant);

  const inner = (
    <>
      <div
        style={{
          width: 2,
          alignSelf: 'stretch',
          flexShrink: 0,
          backgroundColor: brandPrimary,
          opacity: 0.15,
        }}
        aria-hidden
      />
      <div
        style={{
          flex: '1 1 0',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: space('Spacing/16'),
          paddingTop: space('Spacing/24'),
          paddingBottom: space('Spacing/24'),
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: space('Spacing/8'),
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: space('Spacing/4'),
              flex: '1 1 0',
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 0,
                paddingTop: space('Spacing/4'),
                paddingBottom: space('Spacing/4'),
              }}
            >
              <h2
                style={{
                  margin: 0,
                  ...typographyTitleH3Style(),
                  color: textPrimary,
                }}
              >
                {resolvedTitle}
              </h2>
            </div>
            {showMeta ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: space('Spacing/4'),
                  ...body,
                  color: textSecondary,
                }}
              >
                {resolvedCustomer ? <span>{resolvedCustomer}</span> : null}
                {resolvedCustomer && resolvedLastWorked ? (
                  <span aria-hidden>•</span>
                ) : null}
                {resolvedLastWorked ? <span>{resolvedLastWorked}</span> : null}
              </div>
            ) : null}
          </div>
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <StatusPill kind={pillKind} label={resolvedStatus} />
          </div>
        </div>

        {showCategory ? (
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              paddingLeft: space('Spacing/8'),
              paddingRight: space('Spacing/8'),
              paddingTop: space('Spacing/4'),
              paddingBottom: space('Spacing/4'),
              borderRadius: 6,
              backgroundColor: chipBg,
              ...labelMixed,
              color: textOnDark,
            }}
          >
            {categoryLabel}
          </div>
        ) : null}

        {showMetrics ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
              gap: space('Spacing/32'),
              paddingTop: space('Spacing/16'),
              width: '100%',
            }}
          >
            <MetricColumn
              label="TIME"
              value={resolvedTimeHours}
              valueColor={textPrimary}
            />
            <MetricColumn
              label="REV"
              value={resolvedRevenue}
              valueColor={textPrimary}
            />
            <MetricColumn
              label="MAT"
              value={resolvedMaterials}
              valueColor={metricMatValue}
            />
            <MetricColumn
              label="NET"
              value={resolvedNet}
              valueColor={netValueColor(resolvedNetSentiment)}
              alignEnd
            />
          </div>
        ) : null}
      </div>
    </>
  );

  const shellStyle: CSSProperties = {
    width: '100%',
    maxWidth: 351,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingLeft: space('Spacing/24'),
    paddingRight: space('Spacing/24'),
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 16,
    border: `1px solid ${borderSubtle}`,
    backgroundColor: surfaceWhite,
    ...cardShadow,
    ...style,
  };

  if (onPress) {
    return (
      <button
        type="button"
        className={className}
        onClick={onPress}
        style={{
          ...shellStyle,
          margin: 0,
          font: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        {inner}
      </button>
    );
  }

  return (
    <section className={className} style={shellStyle}>
      {inner}
    </section>
  );
}

function MetricColumn({
  label,
  value,
  valueColor,
  alignEnd,
}: {
  label: string;
  value: string;
  valueColor: string;
  alignEnd?: boolean;
}) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignEnd ? 'flex-end' : 'flex-start',
        gap: space('Spacing/4'),
      }}
    >
      <span style={{ ...labelCaps, color: textMuted }}>{label}</span>
      <span
        style={{
          ...bodyBold,
          color: valueColor,
          textAlign: alignEnd ? 'right' : 'left',
          width: alignEnd ? '100%' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
