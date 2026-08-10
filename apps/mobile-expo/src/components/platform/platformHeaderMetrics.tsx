import {
  Platform,
  Text,
  View,
  type AccessibilityRole,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

/** Matches `PlatformHeaderAction` touch + chrome size. */
export const PLATFORM_HEADER_ACTION_SIZE = 44;

/**
 * Android PT Serif Display-H1 still reads a hair low after geometric centering
 * in the 44px chrome row. Positive = shift title down; negative = up.
 */
export const PLATFORM_HEADER_TITLE_OPTICAL_NUDGE_Y = -2;

/** Row that pairs a header action with a single-line display title. */
export function platformHeaderRowStyle(
  extra?: ViewStyle,
  options?: { fixedHeight?: boolean },
): ViewStyle {
  const fixedHeight =
    options?.fixedHeight !== false && Platform.OS === 'android';
  return {
    flexDirection: 'row',
    alignItems: 'center',
    ...(fixedHeight
      ? { height: PLATFORM_HEADER_ACTION_SIZE, minHeight: PLATFORM_HEADER_ACTION_SIZE }
      : null),
    ...extra,
  };
}

/**
 * Title column beside header chrome. On Android, lock to the 44px action height so
 * the title box and chrome share one vertical frame.
 */
export function platformHeaderTitleSlotStyle(extra?: ViewStyle): ViewStyle {
  if (Platform.OS !== 'android') {
    return { flex: 1, minWidth: 0, justifyContent: 'center', ...extra };
  }
  return {
    flex: 1,
    minWidth: 0,
    height: PLATFORM_HEADER_ACTION_SIZE,
    // Title uses marginTop for placement — don't flex-center (double-offsets).
    justifyContent: 'flex-start',
    overflow: 'visible',
    ...extra,
  };
}

/**
 * Android display-title metrics for header rows.
 * Do **not** set `height` on Text (Android pins glyphs to the bottom of a fixed
 * height). Parent slot is `flex-start`; `marginTop` places the fontSize box in
 * the 44px chrome row, with a small optical nudge for PT Serif caps.
 */
export function platformHeaderDisplayTitleStyle(
  base: TextStyle,
  options?: { allowWrap?: boolean },
): TextStyle {
  if (Platform.OS !== 'android') return base;
  const size = typeof base.fontSize === 'number' ? base.fontSize : 32;
  const geometricTop =
    (PLATFORM_HEADER_ACTION_SIZE - size) / 2 + PLATFORM_HEADER_TITLE_OPTICAL_NUDGE_Y;
  return {
    ...base,
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontSize: size,
    lineHeight: size,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: options?.allowWrap ? PLATFORM_HEADER_TITLE_OPTICAL_NUDGE_Y : geometricTop,
    marginBottom: 0,
  };
}

type PlatformHeaderTitleProps = {
  children: string;
  typography: TextStyle;
  style?: StyleProp<TextStyle>;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
};

/**
 * Display title paired with `PlatformHeaderAction` — Android locks glyph box to fontSize
 * inside a 44px slot so it shares a centerline with the chrome circle.
 */
export function PlatformHeaderTitle({
  children,
  typography,
  style,
  accessibilityRole = 'header',
  accessibilityLabel,
}: PlatformHeaderTitleProps) {
  return (
    <View style={platformHeaderTitleSlotStyle()}>
      <Text
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        numberOfLines={1}
        style={[platformHeaderDisplayTitleStyle(typography), style]}
      >
        {children}
      </Text>
    </View>
  );
}
