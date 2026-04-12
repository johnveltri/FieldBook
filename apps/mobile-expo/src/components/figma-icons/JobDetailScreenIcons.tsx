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

/** TIMELINE — `810:614` — 16×16 */
export function JobDetailIconSectionTimeline({ color }: StrokeProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M14.3333 8.16667H12.68C12.3886 8.16604 12.1051 8.26087 11.8727 8.43664C11.6404 8.61242 11.472 8.85947 11.3933 9.14L9.82667 14.7133C9.81657 14.748 9.79552 14.7784 9.76667 14.8C9.73782 14.8216 9.70273 14.8333 9.66667 14.8333C9.6306 14.8333 9.59552 14.8216 9.56667 14.8C9.53782 14.7784 9.51676 14.748 9.50667 14.7133L5.82667 1.62C5.81657 1.58538 5.79552 1.55497 5.76667 1.53333C5.73782 1.5117 5.70273 1.5 5.66667 1.5C5.6306 1.5 5.59552 1.5117 5.56667 1.53333C5.53782 1.55497 5.51676 1.58538 5.50667 1.62L3.94 7.19333C3.86164 7.47277 3.69425 7.71901 3.46324 7.89468C3.23223 8.07034 2.95021 8.16584 2.66 8.16667H1"
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

/** `787:69` row-card timeline / activity — 14×14 */
export function JobDetailIconRowCardLeading({ color }: StrokeProps) {
  const clipId = 'jobDetailRowClip';
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Defs>
        <ClipPath id={clipId}>
          <Rect width={14} height={14} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Path
          d="M7 12.8333C10.2217 12.8333 12.8333 10.2217 12.8333 7C12.8333 3.77834 10.2217 1.16667 7 1.16667C3.77834 1.16667 1.16667 3.77834 1.16667 7C1.16667 10.2217 3.77834 12.8333 7 12.8333Z"
          stroke={color}
          strokeWidth={S}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M7 3.5V7L9.33333 8.16667"
          stroke={color}
          strokeWidth={S}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
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
