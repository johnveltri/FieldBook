import { View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { color } from '@fieldsolo/design-system/lib/tokens';

type IconProps = { color: string; size?: number };

/** Needs Attention — leading circle + exclamation (16×16). */
export function HomeNeedsAttentionIcon({ color: stroke, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="7.5" stroke={stroke} strokeWidth={1.2} />
      <Path
        d="M8 4.5V9"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M8 11.25H8.01"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Jump back in — clock (16×16). */
export function HomeJumpBackInIcon({ color: stroke, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="6.75" stroke={stroke} strokeWidth={1.2} />
      <Path
        d="M8 4.75V8L10.5 9.25"
        stroke={stroke}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Trailing row affordance — arrow in circle (40×40), mirrored from session back chevron. */
export function HomeSummaryCardArrowIcon({
  arrowColor,
  backgroundColor = color('Foundation/Surface/White'),
  size = 40,
  style,
}: {
  arrowColor: string;
  backgroundColor?: string;
  size?: number;
  style?: ViewStyle;
}) {
  const iconSize = Math.round(size * 0.5);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      accessibilityElementsHidden
    >
      <Svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
        <Path
          d="M10 15.8333L15.8333 10M15.8333 10L10 4.16667M4.16667 10H15.8333"
          stroke={arrowColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
