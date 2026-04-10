import type { CSSProperties } from 'react';
import {
  color,
  radius,
  shadow,
  space,
  typographyLabelStyle,
  typographyMetricStyle,
  typographyMetricXLStyle,
} from '../../lib/tokens';

const labelText = typographyLabelStyle();
const metricText = typographyMetricStyle();
const metricXL = typographyMetricXLStyle();

const borderSubtle = color('Foundation/Border/Subtle');
const textSecondary = color('Foundation/Text/Secondary');
const textPrimary = color('Foundation/Text/Primary');
const textSuccess = color('Semantic/Status/Success/Text');
const textBrand = color('Brand/Primary');

export type MetricValueTone = 'primary' | 'brand' | 'success';

function toneColor(tone: MetricValueTone): string {
  switch (tone) {
    case 'success':
      return textSuccess;
    case 'brand':
      return textBrand;
    case 'primary':
    default:
      return textPrimary;
  }
}

export type MetricPrimaryBlock = {
  label: string;
  /** Displayed after prefix, e.g. `242,608.00` */
  value: string;
  valuePrefix?: string;
};

export type MetricPairColumn = {
  label: string;
  value: string;
  valuePrefix?: string;
  tone?: MetricValueTone;
  align?: 'start' | 'end';
};

export type MetricTripleColumn = {
  label: string;
  value: string;
  valuePrefix?: string;
  tone?: MetricValueTone;
  align?: 'start' | 'center' | 'end';
};

export type MetricCardProps = {
  /** Matches Figma “Default (Clean)”: no vertical dividers between columns. */
  cleanLayout?: boolean;
  primary?: MetricPrimaryBlock | null;
  secondary?: {
    left: MetricPairColumn;
    right: MetricPairColumn;
  } | null;
  tertiary?: {
    left: MetricTripleColumn;
    center: MetricTripleColumn;
    right: MetricTripleColumn;
  } | null;
  className?: string;
  style?: CSSProperties;
};

/**
 * Metric summary card (Figma: `Metric Card`, node `258:1161`).
 * Compose `primary` / `secondary` / `tertiary` blocks to match variant coverage in the spec.
 */
export function MetricCard({
  cleanLayout = false,
  primary,
  secondary,
  tertiary,
  className,
  style,
}: MetricCardProps) {
  const hasPrimary = primary != null;
  const sectionCount = [primary, secondary, tertiary].filter(Boolean).length;

  const pad: CSSProperties = hasPrimary
    ? { padding: space('Spacing/32') }
    : {
        paddingLeft: space('Spacing/32'),
        paddingRight: space('Spacing/32'),
        paddingTop: space('Spacing/12'),
        paddingBottom: space('Spacing/12'),
      };

  const vDivider = cleanLayout ? 'none' : `1px solid ${borderSubtle}`;

  return (
    <section
      data-name="metric-card"
      className={className}
      style={{
        width: '100%',
        maxWidth: 353,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: sectionCount > 1 ? 3 : 0,
        borderRadius: radius('Radius/24'),
        border: `1px solid ${borderSubtle}`,
        backgroundColor: color('Foundation/Surface/Default'),
        boxShadow: shadow('Shadow/Card/Default'),
        ...pad,
        ...style,
      }}
    >
      {primary ? (
        <div
          data-name="metric-card-primary"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: space('Spacing/4'),
            width: '100%',
          }}
        >
          <div
            data-name="metric-card-metric"
            style={{
              ...labelText,
              color: textSecondary,
              textAlign: 'center',
              width: '100%',
            }}
          >
            {primary.label}
          </div>
          <div
            data-name="metric-card-metric-value"
            style={{
              ...metricXL,
              color: textSuccess,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: space('Spacing/4'),
              width: '100%',
            }}
          >
            <span>{primary.valuePrefix ?? '$'}</span>
            <span>{primary.value}</span>
          </div>
        </div>
      ) : null}

      {secondary ? (
        <div
          data-name="metric-card-secondary"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: space('Spacing/8'),
            paddingBottom: space('Spacing/8'),
            borderTop: hasPrimary ? `1px solid ${borderSubtle}` : undefined,
          }}
        >
          <MetricPairCell
            column={secondary.left}
            vDividerRight={vDivider}
            position="left"
          />
          <MetricPairCell
            column={secondary.right}
            vDividerRight="none"
            position="right"
          />
        </div>
      ) : null}

      {tertiary ? (
        <div
          data-name="metric-card-tertiary"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: space('Spacing/8'),
            paddingBottom: space('Spacing/8'),
            borderTop:
              hasPrimary || secondary
                ? `1px solid ${borderSubtle}`
                : undefined,
          }}
        >
          <MetricTripleCell
            column={tertiary.left}
            vDividerRight={vDivider}
            widthStyle={{ flex: '1 1 0', minWidth: 0 }}
            slot="left"
          />
          <MetricTripleCell
            column={tertiary.center}
            vDividerRight={vDivider}
            widthStyle={{
              width: 120,
              flexShrink: 0,
              paddingLeft: space('Spacing/12'),
              paddingRight: space('Spacing/12'),
            }}
            center
            slot="center"
          />
          <MetricTripleCell
            column={tertiary.right}
            vDividerRight="none"
            widthStyle={{ flex: '1 1 0', minWidth: 0 }}
            slot="right"
          />
        </div>
      ) : null}
    </section>
  );
}

function MetricPairCell({
  column,
  vDividerRight,
  position,
}: {
  column: MetricPairColumn;
  vDividerRight: string;
  position: 'left' | 'right';
}) {
  const align = column.align ?? (position === 'left' ? 'start' : 'end');
  const tone = column.tone ?? 'primary';
  return (
    <div
      data-name={`metric-card-${position}`}
      style={{
        flex: '1 1 0',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'end' ? 'flex-end' : 'flex-start',
        borderRight: vDividerRight,
      }}
    >
      <div
        data-name="metric-card-metric"
        style={{
          ...labelText,
          color: textSecondary,
          textAlign: align === 'end' ? 'right' : 'left',
          paddingTop: space('Spacing/4'),
          paddingBottom: space('Spacing/4'),
          width: '100%',
        }}
      >
        {column.label}
      </div>
      <div
        data-name="metric-card-metric-value"
        style={{
          ...metricText,
          color: toneColor(tone),
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: space('Spacing/4'),
          justifyContent: align === 'end' ? 'flex-end' : 'flex-start',
          width: '100%',
        }}
      >
        {column.valuePrefix ? <span>{column.valuePrefix}</span> : null}
        <span>{column.value}</span>
      </div>
    </div>
  );
}

function MetricTripleCell({
  column,
  vDividerRight,
  widthStyle,
  center,
  slot,
}: {
  column: MetricTripleColumn;
  vDividerRight: string;
  widthStyle: CSSProperties;
  center?: boolean;
  slot: 'left' | 'center' | 'right';
}) {
  const tone = column.tone ?? 'primary';
  const align = column.align ?? (center ? 'center' : 'start');
  const alignItems =
    align === 'end'
      ? 'flex-end'
      : align === 'center'
        ? 'center'
        : 'flex-start';
  const textAlign =
    align === 'end' ? 'right' : align === 'center' ? 'center' : 'left';

  return (
    <div
      data-name={`metric-card-${slot}`}
      style={{
        ...widthStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignItems,
        borderRight: vDividerRight,
        boxSizing: 'border-box',
      }}
    >
      <div
        data-name="metric-card-metric"
        style={{
          ...labelText,
          color: textSecondary,
          textAlign,
          paddingTop: space('Spacing/4'),
          paddingBottom: space('Spacing/4'),
          width: '100%',
        }}
      >
        {column.label}
      </div>
      <div
        data-name="metric-card-metric-value"
        style={{
          ...metricText,
          color: toneColor(tone),
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent:
            align === 'end'
              ? 'flex-end'
              : align === 'center'
                ? 'center'
                : 'flex-start',
          gap: space('Spacing/4'),
          width: '100%',
        }}
      >
        {column.valuePrefix ? <span>{column.valuePrefix}</span> : null}
        <span style={{ textAlign }}>{column.value}</span>
      </div>
    </div>
  );
}
