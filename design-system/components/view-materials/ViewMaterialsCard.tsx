import type { CSSProperties } from 'react';
import {
  color,
  shadow,
  space,
  typographyBodyBoldStyle,
  typographyBodyStyle,
  typographyLabelStyle,
} from '../../lib/tokens';

const cardShadow: CSSProperties = {
  boxShadow: shadow('Shadow/Card/Default'),
};

const rowDivider = color('Foundation/Border/Subtle');

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
      data-name="view-materials-session-header"
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
      <span data-name="view-materials-session-header-text" style={{ ...label, color: secondary }}>
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
      data-name="view-materials-row"
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
        data-name="view-materials-row-content"
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
          data-name="view-materials-row-name"
          style={{
            margin: 0,
            ...bodyBold,
            color: fg,
          }}
        >
          {item.name}
        </p>
        <p
          data-name="view-materials-row-quantity"
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
        data-name="view-materials-row-price"
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
    <div data-name="view-materials-item-list" style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((item, i) => (
        <div
          data-name={`view-materials-row-group-${i}`}
          key={`${i}-${item.name}-${item.priceLabel}`}
          style={{
            borderTop: i > 0 ? `1px solid ${rowDivider}` : undefined,
            width: '100%',
          }}
        >
          <MaterialRow item={item} />
        </div>
      ))}
    </div>
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
      data-name="view-materials-card"
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
        data-name="view-materials-card-surface"
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
          data-name="view-materials-body"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          <div
            data-name="view-materials-bucket-header"
            style={{
              backgroundColor: color('Foundation/Background/Default'),
              paddingLeft: space('Spacing/16'),
              paddingRight: space('Spacing/16'),
              paddingTop: space('Spacing/8'),
              paddingBottom: space('Spacing/8'),
            }}
          >
            <span data-name="view-materials-bucket-label" style={{ ...label, color: secondary }}>
              {bucketLabel}
            </span>
          </div>

          <MaterialItemList items={unassignedItems} />

          {showSession ? (
            <div
              data-name="view-materials-session-section"
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
