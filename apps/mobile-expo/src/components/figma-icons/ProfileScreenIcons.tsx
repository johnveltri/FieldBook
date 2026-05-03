import Svg, { Path, Rect, Polyline } from 'react-native-svg';

const S = 2;

type StrokeProps = { color: string };
type SizedStrokeProps = StrokeProps & { size?: number };

/** PERSONAL INFO section heading — Lucide `user-pen` — 16×16 (matches Figma `1921:4625`). */
export function ProfilePersonalInfoIcon({ color, size = 16 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* User torso (truncated on the right) */}
      <Path
        d="M2.667 14v-1.333A2.667 2.667 0 0 1 5.333 10h2.334"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Head circle */}
      <Path
        d="M9.333 4.667a2.667 2.667 0 1 1-5.333 0 2.667 2.667 0 0 1 5.333 0Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pencil overlay (top-right) */}
      <Path
        d="M11.667 9.333 14 11.667l-2 2H9.667v-2.334l2-2Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** EDIT pencil pill icon — Lucide `pencil` — 14×14 (matches Figma `1921:4622`). */
export function ProfileEditPencilIcon({ color, size = 14 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M8.75 2.917 11.083 5.25M12.352 3.974a1.65 1.65 0 0 0-2.326-2.326L2.241 9.435c-.135.135-.236.301-.291.484l-.771 2.539a.292.292 0 0 0 .363.363l2.54-.77c.182-.056.348-.156.483-.291l7.787-7.786Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** PLAN section heading — Lucide `credit-card` — 16×16 (matches Figma `1924:1828`). */
export function ProfilePlanIcon({ color, size = 16 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect
        x={1.333}
        y={3.333}
        width={13.333}
        height={9.333}
        rx={1.333}
        stroke={color}
        strokeWidth={S}
        strokeLinejoin="round"
      />
      <Path d="M1.333 6.667h13.333" stroke={color} strokeWidth={S} strokeLinecap="round" />
    </Svg>
  );
}

/** ACCOUNT section heading — Lucide `settings` (gear) — 16×16 (matches Figma `1924:1871`). */
export function ProfileAccountIcon({ color, size = 16 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M9.667 1.333H6.333l-.4 1.6a4.667 4.667 0 0 0-1.116.645l-1.572-.46-1.667 2.887 1.172 1.139a4.667 4.667 0 0 0 0 1.288l-1.172 1.14 1.667 2.886 1.572-.46c.34.262.715.479 1.116.645l.4 1.6h3.334l.4-1.6c.4-.166.776-.383 1.116-.645l1.572.46 1.667-2.887-1.172-1.139a4.667 4.667 0 0 0 0-1.288l1.172-1.14-1.667-2.886-1.572.46a4.667 4.667 0 0 0-1.116-.645l-.4-1.6Z"
        stroke={color}
        strokeWidth={S}
        strokeLinejoin="round"
      />
      <Path
        d="M10 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
        stroke={color}
        strokeWidth={S}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Delete account leading icon — Lucide `trash-2` — 16×16 (matches Figma `1924:1953`). */
export function ProfileTrashIcon({ color, size = 16 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M5.333 3.667V2.333C5.333 1.667 6 1 6.667 1h2.666C10 1 10.667 1.667 10.667 2.333v1.334M2 3.667h12M12.667 3.667V13c0 .667-.667 1.333-1.334 1.333H4.667C4 14.333 3.333 13.667 3.333 13V3.667M6.667 7.028v3.833M9.333 7.028v3.833"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Row trailing chevron right — Figma `1924:1607` (5×10 vector). */
export function ProfileChevronRightIcon({ color, size = 12 }: SizedStrokeProps) {
  // Render as a 6×10 viewBox preserving aspect ratio.
  const w = (size * 6) / 10;
  return (
    <Svg width={w} height={size} viewBox="0 0 6 10" fill="none">
      <Polyline
        points="1,1 5,5 1,9"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Change Password sheet header lock icon — Lucide `lock` — 16×16 (matches Figma `1924:2100`). */
export function ProfileLockIcon({ color, size = 16 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect
        x={2.667}
        y={7.333}
        width={10.667}
        height={6.667}
        rx={1.333}
        stroke={color}
        strokeWidth={S}
        strokeLinejoin="round"
      />
      <Path
        d="M5 7.333V4.667a3 3 0 0 1 6 0v2.666"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Multi-select checkmark for trade picker rows — Lucide `check` — 16×16. */
export function ProfileCheckIcon({ color, size = 16 }: SizedStrokeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M3.333 8.333 6 11l6.667-6.667"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
