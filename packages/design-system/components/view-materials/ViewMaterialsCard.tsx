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
  'materialsSameSession',
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

const labelCaps = typographyLabelStyle();

function SessionGroupHeader({ sessionDateLabel }: { sessionDateLabel: string }) {
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
      <p
        data-name="view-materials-session-header-text"
        style={{
          margin: 0,
          ...labelCaps,
          color: secondary,
          textTransform: 'none',
          fontSize: 10,
          letterSpacing: '1px',
        }}
      >
        <span>{`${sessionDateLabel.trim()} `}</span>
        <span style={{ textTransform: 'uppercase' }}>Session</span>
      </p>
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

function bucketHeader(bucketLabel: string) {
  const secondary = color('Foundation/Text/Secondary');
  return (
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
      <span data-name="view-materials-bucket-label" style={{ ...labelCaps, color: secondary }}>
        {bucketLabel}
      </span>
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
 * Materials list card — unassigned bucket + optional **Session** block
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

  const isMulti = variant === 'materialsMultiSession';

  const showSession =
    isMulti &&
    sessionBlock !== undefined &&
    sessionBlock.items.length > 0;

  const outerPad: CSSProperties = {
    width: '100%',
    maxWidth: 353,
    boxSizing: 'border-box',
    paddingTop: 9,
    paddingBottom: 9,
  };

  const borderedSurface: CSSProperties = {
    width: '100%',
    borderRadius: 16,
    border: `1px solid ${borderSubtle}`,
    backgroundColor: surfaceWhite,
    boxSizing: 'border-box',
    overflow: 'hidden',
    ...cardShadow,
  };

  const innerStack: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  };

  const unassignedBody = (
    <>
      {bucketHeader(bucketLabel)}
      <MaterialItemList items={unassignedItems} />
    </>
  );

  const sessionSection =
    showSession && sessionBlock ? (
      <div
        data-name="view-materials-session-section"
        style={{
          borderTop: `1px solid ${rowDivider}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <SessionGroupHeader sessionDateLabel={sessionBlock.sessionDateLabel} />
        <MaterialItemList items={sessionBlock.items} />
      </div>
    ) : null;

  if (isMulti) {
    return (
      <section
        className={className}
        data-name="view-materials-root"
        style={{ ...outerPad, ...style }}
      >
        <div data-name="view-materials-card-surface" style={borderedSurface}>
          <div data-name="view-materials-unassigned-block" style={innerStack}>
            {unassignedBody}
          </div>
          {sessionSection}
        </div>
      </section>
    );
  }

  return (
    <section
      className={className}
      data-name="view-materials-root"
      style={{ ...outerPad, ...style }}
    >
      <div data-name="view-materials-card" style={borderedSurface}>
        <div data-name="view-materials-card-surface" style={innerStack}>
          {unassignedBody}
        </div>
      </div>
    </section>
  );
}
