import type { ActionTileKind } from '../action-tile';

const common = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none' as const,
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true as const,
};

/**
 * 20×20 glyphs for {@link ActionTile} wells in Quick Capture (Figma asset semantics per kind).
 */
export function QuickCaptureTileIcon({ kind }: { kind: ActionTileKind }) {
  switch (kind) {
    case 'startSession':
      return (
        <svg {...common}>
          <circle
            cx={10}
            cy={10}
            r={6.5}
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <path
            d="M10 6.5V10l2.5 1.5"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'newNote':
      return (
        <svg {...common}>
          <path
            d="M6 4.5h6l2 2v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <path
            d="M12 4.5V7h2.5M6.5 9.5h7M6.5 12h5"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      );
    case 'newMaterial':
      return (
        <svg {...common}>
          <path
            d="M7 5.5 4 8v1.5l3 3L14 6.5l-3-3H7z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <path
            d="m11 8.5 2.5 2.5a1 1 0 0 1 0 1.4l-1.1 1.1a1 1 0 0 1-1.4 0L8.5 12"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'addPhoto':
      return (
        <svg {...common}>
          <path
            d="M4.5 7.5h2l1.2-1.5h4.6l1.2 1.5h2A1 1 0 0 1 16 8.5v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <circle
            cx={10}
            cy={11.5}
            r={2.25}
            stroke="currentColor"
            strokeWidth={1.5}
          />
        </svg>
      );
    case 'uploadFile':
      return (
        <svg {...common}>
          <path
            d="M6.5 4.5h5l2 2v9a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <path
            d="M11.5 4.5V7H14M7 10.5h6M7 12.5h6"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      );
    case 'voiceMemo':
      return (
        <svg {...common}>
          <path
            d="M10 4.5a2.5 2.5 0 0 0-2.5 2.5v3A2.5 2.5 0 0 0 10 12.5a2.5 2.5 0 0 0 2.5-2.5v-3A2.5 2.5 0 0 0 10 4.5z"
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <path
            d="M13 9v.5a3 3 0 0 1-6 0V9M10 12.5V15M7.5 15h5"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
