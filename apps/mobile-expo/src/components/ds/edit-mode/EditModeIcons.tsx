import Svg, { Circle, Path } from 'react-native-svg';

const S = 2;

type IconProps = { color: string; size?: number };

/** Person — matches Calendar guest row. */
export function EditIconPerson({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={7} r={3} stroke={color} strokeWidth={S} />
      <Path
        d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Map pin — matches Calendar location row. */
export function EditIconLocation({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 17.5s5.5-4.03 5.5-8.75a5.5 5.5 0 1 0-11 0C4.5 13.47 10 17.5 10 17.5Z"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={10} cy={8.75} r={1.75} stroke={color} strokeWidth={S} />
    </Svg>
  );
}

/** Link / attach — session picker affordance. */
export function EditIconLink({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1M11.5 8.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1"
        stroke={color}
        strokeWidth={S}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
