import type { CSSProperties } from 'react';
import {
  color,
  space,
  typographyBodyStyle,
  typographyLabelStyle,
  typographyMetricStyle,
} from '../../lib/tokens';

const labelHeading = typographyLabelStyle();
const bodySemi = typographyBodyStyle();
const metricBold = typographyMetricStyle();

const borderSubtle = color('Foundation/Border/Subtle');
const textSecondary = color('Foundation/Text/Secondary');
const textPrimary = color('Foundation/Text/Primary');
const textBrand = color('Brand/Primary');
const textSuccess = color('Semantic/Status/Success/Text');

const cardShadow: CSSProperties = {
  boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
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
  title?: string;
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
  title = 'Earnings Summary',
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

  return (
    <section
      className={className}
      style={{
        width: '100%',
        maxWidth: 353,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: space('Spacing/8'),
        padding: space('Spacing/24'),
        borderRadius: 16,
        border: `1px solid ${borderSubtle}`,
        backgroundColor: color('Foundation/Surface/Default'),
        ...cardShadow,
        ...style,
      }}
    >
      <header
        style={{
          ...labelHeading,
          color: textSecondary,
          paddingTop: space('Spacing/4'),
          paddingBottom: space('Spacing/4'),
        }}
      >
        {title}
      </header>

      <div
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
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: space('Spacing/8'),
            borderTop: `1px solid ${borderSubtle}`,
          }}
        >
          <span
            style={{
              ...metricBold,
              color: textPrimary,
            }}
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
          >
            <span>{totalPrefix}</span>
            <span style={{ textAlign: 'right', marginLeft: 2 }}>
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
            ...bodySemi,
            color: textSecondary,
            flex: '1 1 0',
            minWidth: 0,
          }}
        >
          {line.label}
        </span>
        <span
          style={{
            display: 'inline-flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 0,
            ...bodySemi,
            color: lineValueColor(tone),
            paddingTop: 2,
            paddingBottom: 2,
          }}
        >
          {prefix ? <span style={{ whiteSpace: 'nowrap' }}>{prefix}</span> : null}
          <span style={{ textAlign: 'right', minWidth: 48 }}>{line.value}</span>
        </span>
      </div>
    </div>
  );
}
