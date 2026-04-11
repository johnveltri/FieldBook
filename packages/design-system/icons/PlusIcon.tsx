import type { CSSProperties } from 'react';

export type PlusIconProps = {
  /** Pixel size; Figma uses 12 (Section Header ADD), 20 (extended FAB), 28 (circular FAB). */
  size?: number;
  className?: string;
  style?: CSSProperties;
};

/**
 * Plus mark aligned with the vector used in Section Header “+ ADD” (`371:2175`):
 * round caps, 12×12 viewBox — scale via `size` for FABs.
 */
export function PlusIcon({ size = 12, className, style }: PlusIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color: 'inherit', display: 'block', ...style }}
      aria-hidden
    >
      <path
        d="M6 2.5V9.5M2.5 6H9.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
