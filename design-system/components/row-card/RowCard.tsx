import type { CSSProperties, ReactNode } from 'react';
import {
  color,
  space,
  typographyBodyBoldStyle,
  typographyBodySmallStyle,
  typographyLabelStyle,
  typographyMetricSStyle,
  typographyMetricStyle,
} from '../../lib/tokens';
import { PlusIcon } from '../../icons/PlusIcon';

const cardShadow: CSSProperties = {
  boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
};

const body = typographyBodyBoldStyle();
const small = typographyBodySmallStyle();
const labelBtn = typographyLabelStyle();

function ActivityClockGlyph({ strokeColor }: { strokeColor: string }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx={12}
        cy={12}
        r={9}
        stroke={strokeColor}
        strokeWidth={2}
      />
      <path
        d="M12 7v5l3 2"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const ROW_CARD_VARIANTS = [
  'unsortedCaptures',
  'incompleteJob',
  'pendingPayment',
  'rankedJobWithMetric',
  'simpleJob',
  'quickActionDefault',
  'activityCard',
  'emptyCard',
  'emptyWithButton',
] as const;

export type RowCardVariant = (typeof ROW_CARD_VARIANTS)[number];

export type RowCardProps = {
  variant: RowCardVariant;
  /** Primary line (`Typography/Body-Bold`). */
  title?: string;
  /** Secondary line (`Typography/Body-Small`), when applicable. */
  subtitle?: string;
  /** Badge integer (unsorted captures, pending payment count). */
  count?: number;
  /** Rank index shown in neutral well (ranked variant). */
  rank?: number;
  /** Text after “Missing: ” on incomplete variant. */
  missingDetail?: string;
  /** Right column: schedules (`Review →`, `$100/hr`, currency string, etc.). */
  trailing?: string;
  /** Activity variant time line. */
  activityTime?: string;
  /** `emptyCard` / `emptyWithButton` main line. */
  emptyMessage?: string;
  /** `emptyWithButton` pill label (default matches Figma). */
  emptyActionLabel?: string;
  onPress?: () => void;
  onEmptyActionPress?: () => void;
  className?: string;
  style?: CSSProperties;
};

function surfaceForVariant(
  variant: RowCardVariant,
): Pick<
  CSSProperties,
  'backgroundColor' | 'borderColor' | 'minHeight' | 'justifyContent' | 'flexDirection' | 'gap'
> {
  const h74 = 74;
  const h85 = 85;
  const h90 = 90;
  const borderSubtle = color('Foundation/Border/Subtle');

  switch (variant) {
    case 'unsortedCaptures':
      return {
        backgroundColor: color('Brand/PrimaryBg'),
        borderColor: color('Brand/PrimaryStroke'),
        minHeight: h74,
        justifyContent: 'space-between',
      };
    case 'incompleteJob':
    case 'pendingPayment':
      return {
        backgroundColor: color('Semantic/Status/Warning/BG'),
        borderColor: color('Semantic/Status/Warning/Stroke'),
        minHeight: h74,
        justifyContent: 'space-between',
      };
    case 'quickActionDefault':
      return {
        backgroundColor: color('Brand/Primary'),
        borderColor: borderSubtle,
        minHeight: h85,
      };
    case 'emptyWithButton':
      return {
        backgroundColor: color('Foundation/Surface/Default'),
        borderColor: borderSubtle,
        minHeight: h90,
        flexDirection: 'column',
        gap: space('Spacing/12'),
      };
    default:
      return {
        backgroundColor: color('Foundation/Surface/Default'),
        borderColor: borderSubtle,
        minHeight: h74,
        justifyContent:
          variant === 'emptyCard' ? 'center' : undefined,
      };
  }
}

/**
 * Row Card (Figma component set **Row Card**, node `786:28`).
 */
export function RowCard({
  variant,
  title = '',
  subtitle = '',
  count = 0,
  rank = 1,
  missingDetail = '',
  trailing = '',
  activityTime = '',
  emptyMessage = '',
  emptyActionLabel = 'Confirm no materials used',
  onPress,
  onEmptyActionPress,
  className,
  style,
}: RowCardProps) {
  const interactive = Boolean(onPress);
  const surface = surfaceForVariant(variant);

  const baseStyle: CSSProperties = {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: 353,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 16,
    paddingLeft: space('Spacing/20'),
    paddingRight: space('Spacing/20'),
    paddingTop: space('Spacing/16'),
    paddingBottom: space('Spacing/16'),
    display: 'flex',
    alignItems:
      variant === 'emptyWithButton' ? 'stretch' : 'center',
    flexDirection: (surface.flexDirection as 'row' | 'column') ?? 'row',
    gap: surface.gap,
    justifyContent: surface.justifyContent,
    backgroundColor: surface.backgroundColor,
    borderColor: surface.borderColor,
    minHeight: surface.minHeight,
    cursor: interactive ? 'pointer' : undefined,
    ...cardShadow,
    ...style,
  };

  const leadWell = (children: ReactNode, wellStyle: CSSProperties) => (
    <div
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 9999,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...wellStyle,
      }}
    >
      {children}
    </div>
  );

  const renderLeading = (): ReactNode => {
    switch (variant) {
      case 'unsortedCaptures':
        return leadWell(
          <span
            style={{
              ...typographyMetricStyle(),
              color: color('Foundation/Text/Muted'),
              lineHeight: 1,
            }}
          >
            {count}
          </span>,
          { backgroundColor: color('Brand/Primary') },
        );
      case 'pendingPayment':
        return leadWell(
          <span
            style={{
              ...typographyMetricStyle(),
              color: color('Foundation/Text/Muted'),
              lineHeight: 1,
            }}
          >
            {count}
          </span>,
          { backgroundColor: color('Semantic/Status/Warning/Label') },
        );
      case 'rankedJobWithMetric':
        return leadWell(
          <span
            style={{
              ...typographyMetricStyle(),
              color: color('Foundation/Text/Secondary'),
              lineHeight: 1,
            }}
          >
            {rank}
          </span>,
          {
            backgroundColor: color('Semantic/Status/Neutral/BG'),
            border: `1px solid ${color('Foundation/Border/Subtle')}`,
          },
        );
      case 'quickActionDefault':
        return leadWell(
          <PlusIcon size={20} style={{ color: color('Foundation/Surface/White') }} />,
          {
            backgroundColor: color('Brand/PrimaryHover'),
            minWidth: 40,
            minHeight: 40,
          },
        );
      case 'activityCard':
        return (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 9999,
              flexShrink: 0,
              backgroundColor: 'rgba(212, 87, 42, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityClockGlyph strokeColor={color('Brand/Primary')} />
          </div>
        );
      default:
        return null;
    }
  };

  const titleStyle = (): CSSProperties => {
    switch (variant) {
      case 'quickActionDefault':
        return { ...body, color: color('Foundation/Text/Muted') };
      default:
        return { ...body, color: color('Foundation/Text/Primary') };
    }
  };

  const subtitleStyle = (): CSSProperties => {
    switch (variant) {
      case 'unsortedCaptures':
      case 'simpleJob':
      case 'rankedJobWithMetric':
      case 'activityCard':
        return { ...small, color: color('Foundation/Text/Secondary') };
      case 'pendingPayment':
        return { ...small, color: color('Semantic/Status/Warning/Label') };
      case 'quickActionDefault':
        return { ...small, color: color('Brand/PrimaryStroke') };
      case 'incompleteJob':
        return { ...small, color: color('Semantic/Status/Error/Text') };
      default:
        return { ...small, color: color('Foundation/Text/Secondary') };
    }
  };

  const renderCenter = (): ReactNode => {
    if (variant === 'emptyCard') {
      return (
        <div style={{ ...body, color: color('Foundation/Text/Secondary'), textAlign: 'center', width: '100%' }}>
          {emptyMessage}
        </div>
      );
    }
    if (variant === 'emptyWithButton') {
      return (
        <>
          <div
            style={{
              ...body,
              color: color('Foundation/Text/Secondary'),
              textAlign: 'center',
              width: '100%',
            }}
          >
            {emptyMessage}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEmptyActionPress?.();
            }}
            style={{
              alignSelf: 'center',
              backgroundColor: color('Foundation/Surface/Subtle'),
              border: `1px solid ${color('Foundation/Border/Subtle')}`,
              borderRadius: 9999,
              padding: `${9}px ${17}px`,
              cursor: 'pointer',
              ...labelBtn,
              color: color('Foundation/Text/Primary'),
            }}
          >
            {emptyActionLabel}
          </button>
        </>
      );
    }

    const lead = renderLeading();
    const gap = lead ? space('Spacing/12') : 0;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap,
          flex: 1,
          minWidth: 0,
          maxWidth: variant === 'quickActionDefault' ? undefined : 232,
        }}
      >
        {lead}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: space('Spacing/4'),
            flex: 1,
            minWidth: 0,
          }}
        >
          <div style={titleStyle()}>{title}</div>
          {variant === 'incompleteJob' ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: space('Spacing/4'),
                alignItems: 'center',
                ...small,
                color: color('Semantic/Status/Error/Text'),
                whiteSpace: 'nowrap',
              }}
            >
              <span>Missing:</span>
              <span>{missingDetail}</span>
            </div>
          ) : variant === 'activityCard' ? (
            <div style={subtitleStyle()}>{activityTime}</div>
          ) : (
            subtitle !== '' && <div style={subtitleStyle()}>{subtitle}</div>
          )}
        </div>
      </div>
    );
  };

  const renderTrailing = (): ReactNode => {
    if (
      variant !== 'unsortedCaptures' &&
      variant !== 'incompleteJob' &&
      variant !== 'pendingPayment' &&
      variant !== 'rankedJobWithMetric'
    ) {
      return null;
    }
    const wrap: CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      flexShrink: 0,
      alignItems:
        variant === 'incompleteJob' ? 'flex-end' : 'center',
    };

    let textStyle: CSSProperties;
    if (variant === 'unsortedCaptures') {
      textStyle = { ...typographyMetricSStyle(), color: color('Brand/Primary') };
    } else if (variant === 'incompleteJob') {
      textStyle = {
        ...typographyMetricSStyle(),
        color: color('Semantic/Status/Error/Text'),
      };
    } else if (variant === 'pendingPayment') {
      textStyle = {
        ...typographyMetricStyle(),
        color: color('Semantic/Status/Warning/Label'),
      };
    } else {
      textStyle = {
        ...typographyMetricSStyle(),
        color: color('Semantic/Status/Success/Text'),
      };
    }

    return (
      <div style={wrap}>
        <div style={{ ...textStyle, lineHeight: 1.2 }}>{trailing}</div>
      </div>
    );
  };

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={className}
      style={baseStyle}
      onClick={onPress}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPress?.();
              }
            }
          : undefined
      }
    >
      {renderCenter()}
      {renderTrailing()}
    </div>
  );
}
