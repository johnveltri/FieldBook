import type { CSSProperties } from 'react';
import {
  color,
  space,
  typographyBodyBoldStyle,
  typographyBodySmallStyle,
  typographyBodyStyle,
  typographyTitleH3Style,
} from '../../lib/tokens';
import { PlusIcon } from '../../icons/PlusIcon';
import { QuickCaptureTileIcon } from '../bottom-sheet-quick-capture/QuickCaptureTileIcons';

const sheetShadow: CSSProperties = {
  boxShadow: '0px 25px 50px rgba(0, 0, 0, 0.25)',
};

const handleBg = 'rgba(43, 52, 65, 0.2)';

const bodyBold = typographyBodyBoldStyle();
const bodySmall = typographyBodySmallStyle();
/** Figma `1283:350` fields use Ubuntu Sans Mono 14 (`Typography/Body`), not `Typography/Input`. */
const fieldText = typographyBodyStyle();

export const MATERIAL_SHEET_VARIANTS = [
  'newQuickMaterial',
  'newJobMaterial',
  'newSessionMaterial',
  'editJobMaterial',
  'editSessionMaterial',
] as const;

export type MaterialSheetVariant = (typeof MATERIAL_SHEET_VARIANTS)[number];

const DEFAULT_SESSION_LABEL = 'Mar 25, 2026 9:00 AM – 10:00 AM';

const NAME_PLACEHOLDER = `e.g. Copper Pipe 1/2"`;

function sheetTitle(variant: MaterialSheetVariant): string {
  switch (variant) {
    case 'newQuickMaterial':
      return 'New Quick Material';
    case 'newJobMaterial':
      return 'New Job Material';
    case 'newSessionMaterial':
      return 'New Session Material';
    case 'editJobMaterial':
      return 'Edit Job Material';
    case 'editSessionMaterial':
      return 'Edit Session Material';
    default: {
      const _e: never = variant;
      return _e;
    }
  }
}

function defaultSubtitle(
  variant: MaterialSheetVariant,
  sessionLabel: string,
): string {
  switch (variant) {
    case 'newQuickMaterial':
      return 'Save to Inbox — assign to a job later';
    case 'newJobMaterial':
      return 'Unassigned — assign to a session later';
    case 'newSessionMaterial':
      return `Session: ${sessionLabel}`;
    case 'editJobMaterial':
      return 'Unassigned job material';
    case 'editSessionMaterial':
      return `Session: ${sessionLabel}`;
    default: {
      const _e: never = variant;
      return _e;
    }
  }
}

function primaryLabel(variant: MaterialSheetVariant): string {
  switch (variant) {
    case 'newQuickMaterial':
      return 'SAVE TO INBOX';
    case 'newJobMaterial':
      return 'SAVE TO JOB';
    case 'newSessionMaterial':
      return 'SAVE TO SESSION';
    case 'editJobMaterial':
    case 'editSessionMaterial':
      return 'SAVE CHANGES';
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

function PencilGlyph() {
  const c = color('Semantic/Status/Error/Text');
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8.5 2.5 11 5 4.5 11.5H2v-2.5L8.5 2.5z"
        stroke={c}
        strokeWidth={1.2}
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

function MaterialLeadIcon() {
  const fg = color('Semantic/Activity/Material');
  return (
    <div
      style={{
        width: 14,
        height: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: fg,
      }}
    >
      <div
        style={{
          transform: 'scale(0.7)',
          transformOrigin: 'center',
          display: 'flex',
        }}
      >
        <QuickCaptureTileIcon kind="newMaterial" />
      </div>
    </div>
  );
}

export type MaterialBottomSheetProps = {
  variant: MaterialSheetVariant;
  materialName?: string;
  onMaterialNameChange?: (value: string) => void;
  price?: string;
  onPriceChange?: (value: string) => void;
  quantity?: string;
  onQuantityChange?: (value: string) => void;
  unit?: string;
  onUnitChange?: (value: string) => void;
  /** Options for the unit select; current `unit` is always included. */
  unitOptions?: string[];
  subtitle?: string;
  sessionLabel?: string;
  namePlaceholder?: string;
  onBack?: () => void;
  onPrimaryAction?: () => void;
  onDelete?: () => void;
  onSessionPillPress?: () => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * Material entry / edit bottom sheet (Figma component set **Material** `1283:351`).
 */
export function MaterialBottomSheet({
  variant,
  materialName = '',
  onMaterialNameChange,
  price = '',
  onPriceChange,
  quantity = '1',
  onQuantityChange,
  unit = 'ea',
  onUnitChange,
  unitOptions = ['ea'],
  subtitle: subtitleProp,
  sessionLabel = DEFAULT_SESSION_LABEL,
  namePlaceholder = NAME_PLACEHOLDER,
  onBack,
  onPrimaryAction,
  onDelete,
  onSessionPillPress,
  className,
  style,
}: MaterialBottomSheetProps) {
  const isEdit =
    variant === 'editJobMaterial' || variant === 'editSessionMaterial';
  const subtitle = subtitleProp ?? defaultSubtitle(variant, sessionLabel);
  const title = sheetTitle(variant);
  const titleId = 'fieldbook-material-sheet-title';
  const bg = color('Foundation/Background/Default');
  const borderSubtle = color('Foundation/Border/Subtle');
  const backFg = color('Foundation/Text/Secondary');
  const fg = color('Foundation/Text/Primary');
  const material = color('Semantic/Activity/Material');
  const materialShadow = color('Semantic/Status/Success/Text');
  const errorBg = color('Semantic/Status/Error/BG');
  const errorText = color('Semantic/Status/Error/Text');
  const secondary = color('Foundation/Text/Secondary');
  const placeholderMuted = '#CCCCCC';

  const unitChoices = unitOptions.includes(unit)
    ? unitOptions
    : [...unitOptions, unit];

  const inputShell: CSSProperties = {
    ...fieldText,
    boxSizing: 'border-box',
    height: 38,
    borderRadius: 8,
    border: `1px solid ${borderSubtle}`,
    backgroundColor: color('Foundation/Surface/Default'),
    outline: 'none',
    width: '100%',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
  };

  return (
    <section
      className={className}
      aria-labelledby={titleId}
      style={{
        width: '100%',
        maxWidth: 391,
        minHeight: isEdit ? 346 : 347,
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

      <div style={{ width: '100%', maxWidth: 343 }}>
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
            justifyContent: 'space-between',
            gap: space('Spacing/12'),
            marginTop: space('Spacing/16'),
            minHeight: 28,
          }}
        >
          {!isEdit ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: space('Spacing/12'),
                minWidth: 0,
              }}
            >
              <MaterialLeadIcon />
              <h2
                id={titleId}
                style={{
                  margin: 0,
                  ...typographyTitleH3Style(),
                  color: fg,
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </h2>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space('Spacing/12'),
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <MaterialLeadIcon />
                <h2
                  id={titleId}
                  style={{
                    margin: 0,
                    ...typographyTitleH3Style(),
                    color: fg,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </h2>
              </div>
              {variant === 'editJobMaterial' ? (
                <button
                  type="button"
                  onClick={onSessionPillPress}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: space('Spacing/8'),
                    flexShrink: 0,
                    height: 24,
                    paddingLeft: space('Spacing/12'),
                    paddingRight: space('Spacing/12'),
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 9999,
                    border: 'none',
                    backgroundColor: errorBg,
                    cursor: onSessionPillPress ? 'pointer' : 'default',
                  }}
                >
                  <PlusIcon size={12} style={{ color: errorText }} />
                  <span
                    style={{
                      ...bodySmall,
                      color: errorText,
                      textTransform: 'uppercase',
                    }}
                  >
                    SESSION
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSessionPillPress}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: space('Spacing/8'),
                    flexShrink: 0,
                    height: 24,
                    paddingLeft: space('Spacing/12'),
                    paddingRight: space('Spacing/12'),
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 9999,
                    border: 'none',
                    backgroundColor: errorBg,
                    cursor: onSessionPillPress ? 'pointer' : 'default',
                  }}
                >
                  <PencilGlyph />
                  <span
                    style={{
                      ...bodySmall,
                      color: errorText,
                      textTransform: 'uppercase',
                    }}
                  >
                    SESSION
                  </span>
                </button>
              )}
            </>
          )}
        </div>

        <p
          style={{
            ...bodySmall,
            color: secondary,
            margin: 0,
            marginTop: space('Spacing/8'),
          }}
        >
          {subtitle}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: space('Spacing/8'),
            marginTop: 18,
            width: '100%',
          }}
        >
          <input
            type="text"
            value={materialName}
            onChange={(e) => onMaterialNameChange?.(e.target.value)}
            placeholder={namePlaceholder}
            aria-label="Material name"
            style={{
              ...inputShell,
              paddingLeft: 13,
              paddingRight: 13,
              paddingTop: 9,
              paddingBottom: 9,
              color: materialName ? fg : placeholderMuted,
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: space('Spacing/8'),
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  ...bodyBold,
                  fontSize: 11.9,
                  color: secondary,
                  flexShrink: 0,
                  lineHeight: '20px',
                }}
                aria-hidden
              >
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => onPriceChange?.(e.target.value)}
                placeholder="0.00"
                aria-label="Price"
                style={{
                  ...inputShell,
                  flex: 1,
                  minWidth: 0,
                  paddingLeft: space('Spacing/12'),
                  paddingRight: space('Spacing/12'),
                  paddingTop: space('Spacing/8'),
                  paddingBottom: space('Spacing/8'),
                  color: price ? fg : placeholderMuted,
                }}
              />
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => onQuantityChange?.(e.target.value)}
              aria-label="Quantity"
              style={{
                ...inputShell,
                width: 56,
                flexShrink: 0,
                padding: 9,
                textAlign: 'center',
                color: fg,
              }}
            />
            <div style={{ position: 'relative', width: 60, flexShrink: 0 }}>
              <select
                value={unit}
                onChange={(e) => onUnitChange?.(e.target.value)}
                aria-label="Unit"
                style={{
                  ...inputShell,
                  width: '100%',
                  height: 38,
                  paddingLeft: 9,
                  paddingRight: 22,
                  paddingTop: 9,
                  paddingBottom: 9,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  color: fg,
                  cursor: 'pointer',
                }}
              >
                {unitChoices.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <span
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 8.5,
                  color: secondary,
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}
                aria-hidden
              >
                ▼
              </span>
            </div>
          </div>
        </div>
      </div>

      {!isEdit ? (
        <button
          type="button"
          onClick={onPrimaryAction}
          style={{
            width: '100%',
            maxWidth: 343,
            paddingTop: 17,
            paddingBottom: 17,
            paddingLeft: 100,
            paddingRight: 100,
            borderRadius: 12,
            border: 'none',
            backgroundColor: material,
            cursor: onPrimaryAction ? 'pointer' : 'default',
            boxShadow: `0px 1px 2px ${materialShadow}`,
            ...bodyBold,
            color: color('Foundation/Surface/Default'),
            textTransform: 'uppercase',
          }}
        >
          {primaryLabel(variant)}
        </button>
      ) : (
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
            onClick={onPrimaryAction}
            style={{
              flex: 1,
              minWidth: 0,
              paddingTop: 17,
              paddingBottom: 17,
              paddingLeft: 100,
              paddingRight: 100,
              borderRadius: 12,
              border: 'none',
              backgroundColor: material,
              cursor: onPrimaryAction ? 'pointer' : 'default',
              boxShadow: `0px 1px 2px ${material}`,
              ...bodyBold,
              color: color('Foundation/Surface/Default'),
              textTransform: 'uppercase',
            }}
          >
            {primaryLabel(variant)}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete material"
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
              backgroundColor: color('Foundation/Surface/Default'),
              cursor: onDelete ? 'pointer' : 'default',
            }}
          >
            <TrashGlyph />
          </button>
        </div>
      )}
    </section>
  );
}
