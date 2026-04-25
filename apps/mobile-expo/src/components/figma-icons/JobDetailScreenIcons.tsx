import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Path,
  Rect,
} from 'react-native-svg';

/** Stroke width from Figma exports (`1836:1875` and linked components). */
const S = 2;

type StrokeProps = { color: string };

/** `231:534` top-header close — 20×20 */
export function JobDetailIconTopClose({ color }: StrokeProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M15 5L5 15M5 5L15 15"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** `444:2278` top-header edit pencil — 14×14 */
export function JobDetailIconTopEdit({ color }: StrokeProps) {
  const clipId = 'jobDetailEditClip';
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Defs>
        <ClipPath id={clipId}>
          <Rect width={14} height={14} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Path
          d="M8.75 2.91667L11.0833 5.25M12.3515 3.97367C12.6599 3.66533 12.8332 3.24711 12.8333 2.811C12.8333 2.37489 12.6601 1.95662 12.3518 1.64821C12.0435 1.33979 11.6252 1.1665 11.1891 1.16644C10.753 1.16639 10.3347 1.33958 10.0263 1.64792L2.24117 9.43483C2.10573 9.56987 2.00557 9.73614 1.9495 9.919L1.17892 12.4577C1.16384 12.5081 1.1627 12.5617 1.17562 12.6127C1.18854 12.6638 1.21504 12.7104 1.2523 12.7476C1.28956 12.7848 1.3362 12.8112 1.38726 12.824C1.43832 12.8369 1.49191 12.8357 1.54233 12.8205L4.08158 12.0505C4.26427 11.9949 4.43052 11.8954 4.56575 11.7606L12.3515 3.97367Z"
          stroke={color}
          strokeWidth={S}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** SESSIONS — `371:2171` — 16×16 */
export function JobDetailIconSectionSessions({ color }: StrokeProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 4V8L10.6667 9.33333M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** MATERIALS — `371:2171` wrench — 16×16 */
export function JobDetailIconSectionMaterials({ color }: StrokeProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M9.20726 4.01856C9.07874 4.14967 9.00676 4.32594 9.00676 4.50953C9.00676 4.69313 9.07874 4.8694 9.20726 5.00051L10.3295 6.12274C10.4606 6.25126 10.6369 6.32324 10.8205 6.32324C11.0041 6.32324 11.1803 6.25126 11.3114 6.12274L13.9557 3.47848C14.3084 4.25787 14.4152 5.12623 14.2618 5.96784C14.1085 6.80945 13.7023 7.58434 13.0974 8.18925C12.4925 8.79416 11.7176 9.20035 10.876 9.35369C10.0344 9.50704 9.16601 9.40025 8.38662 9.04757L3.53998 13.8942C3.26095 14.1732 2.8825 14.33 2.48789 14.33C2.09327 14.33 1.71482 14.1732 1.43579 13.8942C1.15676 13.6152 1 13.2367 1 12.8421C1 12.4475 1.15676 12.0691 1.43579 11.79L6.28244 6.94338C5.92975 6.16399 5.82296 5.29563 5.97631 4.45402C6.12965 3.61241 6.53584 2.83752 7.14075 2.23261C7.74566 1.6277 8.52055 1.22151 9.36216 1.06817C10.2038 0.914821 11.0721 1.02161 11.8515 1.37429L9.21427 4.01154L9.20726 4.01856Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** NOTES — `371:2171` — 16×16.25 viewBox */
export function JobDetailIconSectionNotes({ color }: StrokeProps) {
  return (
    <Svg width={16} height={17} viewBox="0 0 16 16.25" fill="none">
      <Path
        d="M9.66667 1V3.66667C9.66667 4.02029 9.80714 4.35943 10.0572 4.60948C10.3072 4.85952 10.6464 5 11 5H13.6667M7 5.66667H5.66667M11 8.33333H5.66667M11 11H5.66667M10.3333 1H4.33333C3.97971 1 3.64057 1.14048 3.39052 1.39052C3.14048 1.64057 3 1.97971 3 2.33333V13C3 13.3536 3.14048 13.6928 3.39052 13.9428C3.64057 14.1929 3.97971 14.3333 4.33333 14.3333H12.3333C12.687 14.3333 13.0261 14.1929 13.2761 13.9428C13.5262 13.6928 13.6667 13.3536 13.6667 13V4.33333L10.3333 1Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** `443:2206` section ADD — 12×12 */
export function JobDetailIconSectionAdd({ color }: StrokeProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <Path
        d="M6 1V11M1 6H11"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** View session chevron — 20×21 viewBox */
export function JobDetailIconViewSessionChevron({ color }: StrokeProps) {
  return (
    <Svg width={20} height={21} viewBox="0 0 20 21" fill="none">
      <Path
        d="M5 8L10 13L15 8"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Notes document — `1075:2363` / session note — 16×16 */
export function JobDetailIconViewNote({ color }: StrokeProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M9.33333 1.33333V4C9.33333 4.35362 9.47381 4.69276 9.72386 4.94281C9.97391 5.19286 10.313 5.33333 10.6667 5.33333H13.3333M6.66667 6H5.33333M10.6667 8.66667H5.33333M10.6667 11.3333H5.33333M10 1.33333H4C3.64638 1.33333 3.30724 1.47381 3.05719 1.72386C2.80714 1.97391 2.66667 2.31304 2.66667 2.66667V13.3333C2.66667 13.687 2.80714 14.0261 3.05719 14.2761C3.30724 14.5262 3.64638 14.6667 4 14.6667H12C12.3536 14.6667 12.6928 14.5262 12.9428 14.2761C13.1929 14.0261 13.3333 13.687 13.3333 13.3333V4.66667L10 1.33333Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** CTA overflow (⋯) — `1836:2014` / `Frame 5` — three dots, Figma viewBox 14×30 */
export function JobDetailIconCtaMore({ color }: { color: string }) {
  return (
    <Svg width={14} height={30} viewBox="0 0 14 30" fill="none">
      <Circle cx={7} cy={7} r={3} fill={color} />
      <Circle cx={7} cy={15} r={3} fill={color} />
      <Circle cx={7} cy={23} r={3} fill={color} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Session flow (New Session chooser / Edit Session sheet / Session card)
// ---------------------------------------------------------------------------

type SizedStrokeProps = StrokeProps & { size?: number };

/** Back chevron — Figma `1286:628` / `1284:731` — 20×20 */
export function SessionSheetBackIcon({ color, size = 20 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 15.8333L4.16667 10M4.16667 10L10 4.16667M4.16667 10H15.8333"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Edit Session title clock — Figma `1284:779` — 16×16 */
export function SessionEditClockIcon({ color, size = 16 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 4V8L10.6667 9.33333M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Trash icon for session-sheet delete — Figma `1808:1165` — 16×15.333 */
export function SessionSheetTrashIcon({ color, size = 16 }: SizedStrokeProps) {
  const h = (size * 15.3333) / 16;
  return (
    <Svg width={size} height={h} viewBox="0 0 16 15.3333" fill="none">
      <Path
        d="M5.33333 3.66667V2.33333C5.33333 1.66667 6 1 6.66667 1H9.33333C10 1 10.6667 1.66667 10.6667 2.33333V3.66667M2 3.66667H14M12.6667 3.66667V13C12.6667 13.6667 12 14.3333 11.3333 14.3333H4.66667C4 14.3333 3.33333 13.6667 3.33333 13V3.66667M6.66667 7.02778V10.8611M9.33333 7.02778V10.8611"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Row-card leading plus icon — Figma `I1286:622;787:51` (Log Past Session) — 20×20.
 * Cross path matches the Figma export exactly.
 */
export function SessionChooserRowPlusIcon({ color, size = 20 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2 10.6667H18.3333M10.1667 2.5V18.8333"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Row-card leading play triangle — Figma `I1286:671;787:51` (Live Session) — 20×20.
 * Stroked (hollow) triangle pointing right.
 */
export function SessionChooserRowPlayIcon({ color, size = 20 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M4 2.5L15.8644 10.1271L4 17.7542V2.5Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** EDIT pencil — Figma `1284:941` — 14×14 (view-session edit pill) */
export function SessionCardEditPencilIcon({ color, size = 14 }: SizedStrokeProps) {
  const clipId = 'sessionCardEditClip';
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Defs>
        <ClipPath id={clipId}>
          <Rect width={14} height={14} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Path
          d="M8.75 2.91667L11.0833 5.25M12.3515 3.97367C12.6599 3.66533 12.8332 3.24711 12.8333 2.811C12.8333 2.37489 12.6601 1.95662 12.3518 1.64821C12.0435 1.33979 11.6252 1.1665 11.1891 1.16644C10.753 1.16639 10.3347 1.33958 10.0263 1.64792L2.24117 9.43483C2.10573 9.56987 2.00557 9.73614 1.9495 9.919L1.17892 12.4577C1.16384 12.5081 1.1627 12.5617 1.17562 12.6127C1.18854 12.6638 1.21504 12.7104 1.2523 12.7476C1.28956 12.7848 1.3362 12.8112 1.38726 12.824C1.43832 12.8369 1.49191 12.8357 1.54233 12.8205L4.08158 12.0505C4.26427 11.9949 4.43052 11.8954 4.56575 11.7606L12.3515 3.97367Z"
          stroke={color}
          strokeWidth={S}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

/** Note capture tile — Figma `1284:892` — 16×16 */
export function SessionCaptureTileNoteIcon({ color, size = 16 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M9.33333 1.33333V4C9.33333 4.35362 9.47381 4.69276 9.72386 4.94281C9.97391 5.19286 10.313 5.33333 10.6667 5.33333H13.3333M6.66667 6H5.33333M10.6667 8.66667H5.33333M10.6667 11.3333H5.33333M10 1.33333H4C3.64638 1.33333 3.30724 1.47381 3.05719 1.72386C2.80714 1.97391 2.66667 2.31304 2.66667 2.66667V13.3333C2.66667 13.687 2.80714 14.0261 3.05719 14.2761C3.30724 14.5262 3.64638 14.6667 4 14.6667H12C12.3536 14.6667 12.6928 14.5262 12.9428 14.2761C13.1929 14.0261 13.3333 13.687 13.3333 13.3333V4.66667L10 1.33333Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Material capture tile (wrench) — Figma `1284:908` — 16×16 */
export function SessionCaptureTileMaterialIcon({ color, size = 16 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M9.8 4.2C9.67785 4.32462 9.60943 4.49217 9.60943 4.66667C9.60943 4.84117 9.67785 5.00871 9.8 5.13333L10.8667 6.2C10.9913 6.32215 11.1588 6.39057 11.3333 6.39057C11.5078 6.39057 11.6754 6.32215 11.8 6.2L14.3133 3.68667C14.6486 4.42746 14.7501 5.25282 14.6043 6.05276C14.4586 6.8527 14.0725 7.58923 13.4975 8.16419C12.9226 8.73914 12.186 9.12522 11.3861 9.27097C10.5862 9.41672 9.76079 9.31522 9.02 8.98L4.41333 13.5867C4.14812 13.8519 3.78841 14.0009 3.41333 14.0009C3.03826 14.0009 2.67855 13.8519 2.41333 13.5867C2.14812 13.3214 1.99912 12.9617 1.99912 12.5867C1.99912 12.2116 2.14812 11.8519 2.41333 11.5867L7.02 6.98C6.68478 6.23921 6.58328 5.41384 6.72903 4.6139C6.87478 3.81396 7.26086 3.07744 7.83581 2.50248C8.41077 1.92752 9.1473 1.54145 9.94724 1.39569C10.7472 1.24994 11.5725 1.35144 12.3133 1.68667L9.80667 4.19333L9.8 4.2Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Photo capture tile (camera) — Figma `1284:886` — 16×16 */
export function SessionCaptureTilePhotoIcon({ color, size = 16 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M9.66667 2.66667H6.33333L4.66667 4.66667H2.66667C2.31304 4.66667 1.97391 4.80714 1.72386 5.05719C1.47381 5.30724 1.33333 5.64638 1.33333 6V12C1.33333 12.3536 1.47381 12.6928 1.72386 12.9428C1.97391 13.1929 2.31304 13.3333 2.66667 13.3333H13.3333C13.687 13.3333 14.0261 13.1929 14.2761 12.9428C14.5262 12.6928 14.6667 12.3536 14.6667 12V6C14.6667 5.64638 14.5262 5.30724 14.2761 5.05719C14.0261 4.80714 13.687 4.66667 13.3333 4.66667H11.3333L9.66667 2.66667Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 10.6667C9.10457 10.6667 10 9.77124 10 8.66667C10 7.5621 9.10457 6.66667 8 6.66667C6.89543 6.66667 6 7.5621 6 8.66667C6 9.77124 6.89543 10.6667 8 10.6667Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Chevron up — Figma `1287:798` (Live Session minimized expand toggle) — 20×20 */
export function LiveSessionMinimizedExpandIcon({ color, size = 20 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M15 12L10 7L5 12"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Solid filled circle — Figma `1287:779` / `1897:3096` (Live Session active dot). */
export function LiveSessionActiveDotIcon({ color, size = 12 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Circle cx={6} cy={6} r={6} fill={color} />
    </Svg>
  );
}

/** Voice capture tile (microphone) — Figma `1284:901` — 16×16 */
export function SessionCaptureTileVoiceIcon({ color, size = 16 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 12.6667V14.6667M8 12.6667C9.23768 12.6667 10.4247 12.175 11.2998 11.2998C12.175 10.4247 12.6667 9.23768 12.6667 8V6.66667M8 12.6667C6.76232 12.6667 5.57534 12.175 4.70017 11.2998C3.825 10.4247 3.33333 9.23768 3.33333 8V6.66667M8 1.33333C9.10457 1.33333 10 2.22876 10 3.33333V8C10 9.10457 9.10457 10 8 10C6.89543 10 6 9.10457 6 8V3.33333C6 2.22876 6.89543 1.33333 8 1.33333Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
