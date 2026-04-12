import type { CSSProperties } from 'react';
import {
  color,
  shadow,
  space,
  typographyBodyBoldStyle,
  typographyLabelStyle,
  typographyMetricStyle,
} from '../../lib/tokens';

const labelHeading = typographyLabelStyle();
const bodyBold = typographyBodyBoldStyle();
const metricBold = typographyMetricStyle();

const borderSubtle = color('Foundation/Border/Subtle');
const borderDefault = color('Foundation/Border/Default');
const textSecondary = color('Foundation/Text/Secondary');
const textPrimary = color('Foundation/Text/Primary');
const textBrand = color('Brand/Primary');
const textSuccess = color('Semantic/Status/Success/Text');

const cardShadow: CSSProperties = {
  boxShadow: shadow('Shadow/Card/Default'),
};

export type JobSummaryLineValueTone = 'primary' | 'brand';

export type JobSummaryLine = {
  label: string;
  value: string;
  /** e.g. `$`, `-$` */
  valuePrefix?: string;
  valueTone?: JobSummaryLineValueTone;
};

export type JobSummaryCardProps = {
  /** Omit or empty — Figma default (`258:1549`) has no heading above the breakdown. */
  title?: string | null;
  revenue: JobSummaryLine;
  materials: JobSummaryLine;
  fees?: JobSummaryLine | null;
  total: {
    label?: string;
    value: string;
    valuePrefix?: string;
    /** Matches Figma: success green vs brand for net loss. */
    sentiment: 'positive' | 'negative';
  };
  className?: string;
  style?: CSSProperties;
};

function lineValueColor(tone: JobSummaryLineValueTone | undefined): string {
  return tone === 'brand' ? textBrand : textPrimary;
}

function totalValueColor(sentiment: 'positive' | 'negative'): string {
  return sentiment === 'positive' ? textSuccess : textBrand;
}

/**
 * Job earnings breakdown card (Figma: `Job Summary Card`, node `258:1549`).
 */
export function JobSummaryCard({
  title,
  revenue,
  materials,
  fees = null,
  total,
  className,
  style,
}: JobSummaryCardProps) {
  const totalLabel = total.label ?? 'Net Earnings';
  const totalPrefix =
    total.valuePrefix ??
    (total.sentiment === 'negative' ? '-$' : '$');
  const showTitle = title != null && title !== '';

  return (
    <section
      className={className}
      data-name="job-summary-card"
      style={{
        width: '100%',
        maxWidth: 353,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: showTitle ? space('Spacing/8') : 0,
        padding: space('Spacing/24'),
        borderRadius: 16,
        border: `1px solid ${borderSubtle}`,
        backgroundColor: color('Foundation/Surface/Default'),
        ...cardShadow,
        ...style,
      }}
    >
      {showTitle ? (
        <header
          data-name="job-summary-card-heading"
          style={{
            ...labelHeading,
            color: textSecondary,
            paddingTop: space('Spacing/4'),
            paddingBottom: space('Spacing/4'),
          }}
        >
          {title}
        </header>
      ) : null}

      <div
        data-name="job-summary-card-breakdown"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: space('Spacing/4'),
          width: '100%',
        }}
      >
        <SummaryRow line={revenue} />
        <SummaryRow line={materials} />
        {fees ? <SummaryRow line={fees} /> : null}

        <div
          data-name="job-summary-card-total"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: space('Spacing/8'),
            borderTop: `1px solid ${
              total.sentiment === 'positive' ? borderDefault : borderSubtle
            }`,
          }}
        >
          <span
            style={{
              ...metricBold,
              color: textPrimary,
            }}
            data-name="job-summary-card-total-label"
          >
            {totalLabel}
          </span>
          <span
            style={{
              ...metricBold,
              color: totalValueColor(total.sentiment),
              display: 'inline-flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 0,
            }}
            data-name="job-summary-card-total-value"
          >
            <span data-name="job-summary-card-total-value-prefix">{totalPrefix}</span>
            <span
              data-name="job-summary-card-total-value-amount"
              style={{ textAlign: 'right', marginLeft: 2 }}
            >
              {total.value}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ line }: { line: JobSummaryLine }) {
  const prefix = line.valuePrefix ?? '';
  const tone = line.valueTone ?? 'primary';

  return (
    <div
      data-name="job-summary-card-row"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 32,
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          maxWidth: 305,
        }}
      >
        <span
          style={{
            ...bodyBold,
            color: textSecondary,
            flex: '1 1 0',
            minWidth: 0,
          }}
          data-name="job-summary-card-row-label"
        >
          {line.label}
        </span>
        <span
          style={{
            display: 'inline-flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 0,
            ...bodyBold,
            color: lineValueColor(tone),
            paddingTop: 2,
            paddingBottom: 2,
          }}
          data-name="job-summary-card-row-value"
        >
          {prefix ? (
            <span
              style={{ whiteSpace: 'nowrap' }}
              data-name="job-summary-card-row-value-prefix"
            >
              {prefix}
            </span>
          ) : null}
          <span
            style={{ textAlign: 'right', minWidth: 48 }}
            data-name="job-summary-card-row-value-amount"
          >
            {line.value}
          </span>
        </span>
      </div>
    </div>
  );
}
