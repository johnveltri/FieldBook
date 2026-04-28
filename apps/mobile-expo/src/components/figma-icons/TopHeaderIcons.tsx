import Svg, { Path } from 'react-native-svg';

type StrokeProps = { color: string };

/**
 * Profile — exact SVG export from Figma `228:80` (`top-header-icon`, 20×20).
 */
export function TopHeaderProfileIcon({ color, size = 20 }: StrokeProps & { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M15.8333 17.5V15.8333C15.8333 14.9493 15.4821 14.1014 14.857 13.4763C14.2319 12.8512 13.384 12.5 12.5 12.5H7.49999C6.61593 12.5 5.76809 12.8512 5.14297 13.4763C4.51785 14.1014 4.16666 14.9493 4.16666 15.8333V17.5M13.3333 5.83333C13.3333 7.67428 11.8409 9.16667 9.99999 9.16667C8.15904 9.16667 6.66666 7.67428 6.66666 5.83333C6.66666 3.99238 8.15904 2.5 9.99999 2.5C11.8409 2.5 13.3333 3.99238 13.3333 5.83333Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Back arrow — exact SVG export from Figma `231:837` (`top-header-icon`, 24×24).
 * Scale via `size` for page chrome (e.g. 28) vs native 24 artboard.
 */
export function TopHeaderBackIcon({ color, size = 24 }: StrokeProps & { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19L5 12M5 12L12 5M5 12H19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
