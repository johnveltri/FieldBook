import type { CSSProperties } from 'react';
import {
  color,
  space,
  typographyBodyBoldStyle,
  typographyBodyStyle,
  typographyLabelStyle,
} from '../../lib/tokens';

const cardShadow: CSSProperties = {
  boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
};

const rowDivider = 'rgba(43, 52, 65, 0.05)';

export const VIEW_MATERIALS_VARIANTS = [
  'materialsMultiSession',
  'materialsSingleSession',
] as const;

export type ViewMaterialsVariant = (typeof VIEW_MATERIALS_VARIANTS)[number];

export type ViewMaterialsLineItem = {
  name: string;
  quantityLabel: string;
  priceLabel: string;
};

export type ViewMaterialsSessionBlock = {
  sessionDateLabel: string;
  items: ViewMaterialsLineItem[];
};

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

function MaterialRow({ item }: { item: ViewMaterialsLineItem }) {
  const bodyBold = typographyBodyBoldStyle();
  const body = typographyBodyStyle();
  const fg = color('Foundation/Text/Primary');
  const secondary = color('Foundation/Text/Secondary');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space('Spacing/16'),
        width: '100%',
        boxSizing: 'border-box',
        padding: space('Spacing/16'),
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
          minWidth: 0,
          flex: '1 1 auto',
        }}
      >
        <p
          style={{
            margin: 0,
            ...bodyBold,
            color: fg,
          }}
        >
          {item.name}
        </p>
        <p
          style={{
            margin: 0,
            ...body,
            color: secondary,
          }}
        >
          {item.quantityLabel}
        </p>
      </div>
      <p
        style={{
          margin: 0,
          ...bodyBold,
          color: fg,
          flexShrink: 0,
          textAlign: 'right',
        }}
      >
        {item.priceLabel}
      </p>
    </div>
  );
}

function MaterialItemList({ items }: { items: ViewMaterialsLineItem[] }) {
  return (
    <>
      {items.map((item, i) => (
        <div
          key={`${i}-${item.name}-${item.priceLabel}`}
          style={{
            borderTop:
              i > 0 ? `1px solid ${rowDivider}` : undefined,
            width: '100%',
          }}
        >
          <MaterialRow item={item} />
        </div>
      ))}
    </>
  );
}

export type ViewMaterialsCardProps = {
  variant: ViewMaterialsVariant;
  bucketLabel?: string;
  unassignedItems: ViewMaterialsLineItem[];
  sessionBlock?: ViewMaterialsSessionBlock;
  className?: string;
  style?: CSSProperties;
};

/**
 * Materials list card — unassigned bucket + optional **SESSION** block
 * (Figma **View Materials** `1287:618`).
 */
export function ViewMaterialsCard({
  variant,
  bucketLabel = 'Unassigned',
  unassignedItems,
  sessionBlock,
  className,
  style,
}: ViewMaterialsCardProps) {
  const borderSubtle = color('Foundation/Border/Subtle');
  const surfaceWhite = color('Foundation/Surface/White');
  const label = typographyLabelStyle();
  const secondary = color('Foundation/Text/Secondary');

  const showSession =
    variant === 'materialsMultiSession' &&
    sessionBlock !== undefined &&
    sessionBlock.items.length > 0;

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

          <MaterialItemList items={unassignedItems} />

          {showSession ? (
            <div
              style={{
                borderTop: `1px solid ${rowDivider}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
            >
              <SessionGroupHeader
                sessionDateLabel={sessionBlock!.sessionDateLabel}
              />
              <MaterialItemList items={sessionBlock!.items} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
