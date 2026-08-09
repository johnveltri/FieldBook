import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  BottomNavIconEarnings,
  BottomNavIconHome,
  BottomNavIconJobs,
} from '../bottom-nav/BottomNavTabIcons';
import { dynamicTypeTextStyle } from '../../theme/dynamicTypeText';
import { createTextStyles, fg, radius, space } from '../../theme/nativeTokens';
import { PlatformFloatingSurface } from './PlatformFloatingSurface';
import type { ShellMainTab } from '../shell/ShellBottomNav';

type Typography = ReturnType<typeof createTextStyles>;

/** Minimum tab hit target width (iOS HIG / Material guidance ≥ 44). */
const TAB_MIN_WIDTH = 72;

function NavTabCell({
  selected,
  label,
  accessibilityName,
  icon,
  typography,
  onPress,
  minHeight,
  fontScale,
}: {
  selected: boolean;
  label: string;
  accessibilityName?: string;
  icon: ReactNode;
  typography: Typography;
  onPress: () => void;
  minHeight: number;
  fontScale: number;
}) {
  const labelStyle = dynamicTypeTextStyle(typography.labelCaps, fontScale, {
    padRatio: 0.06,
  });
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${accessibilityName ?? label} tab`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabCell,
        { minHeight },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.tabInner, selected && styles.tabInnerSelected]}>
        <View style={styles.tabContent}>
          <View style={styles.iconSlot}>{icon}</View>
          <Text
            numberOfLines={1}
            style={[
              labelStyle,
              {
                // Slack: selected stays ink, not a brand fill — glass wash carries selection.
                color: fg.primary,
                textAlign: 'center',
                flexShrink: 1,
                minWidth: 0,
                width: '100%',
              },
            ]}
          >
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export type PlatformNavigationGroupProps = {
  selected: ShellMainTab;
  onSelect: (tab: ShellMainTab) => void;
  rowHeight: number;
};

export function PlatformNavigationGroup({
  selected,
  onSelect,
  rowHeight,
}: PlatformNavigationGroupProps) {
  const { fontScale } = useWindowDimensions();
  const tabHeight = rowHeight;
  const [fontsLoaded] = useFonts({
    PTSerif_700Bold,
    UbuntuSansMono_400Regular,
    UbuntuSansMono_600SemiBold,
    UbuntuSansMono_700Bold,
  });

  const typography = useMemo(
    () =>
      createTextStyles({
        serifBold: 'PTSerif_700Bold',
        mono: 'UbuntuSansMono_400Regular',
        monoSemi: 'UbuntuSansMono_600SemiBold',
        monoBold: 'UbuntuSansMono_700Bold',
      }),
    [],
  );

  void fontsLoaded;

  const earningsLabel = fontScale > 1.9 ? 'EARN' : 'EARNINGS';
  // Slack: inactive + selected icons share the same ink weight; wash marks selection.
  const ink = fg.primary;

  return (
    <PlatformFloatingSurface
      style={[styles.groupSurface, { height: tabHeight }]}
      testID="platform-nav-group"
    >
      <View style={[styles.inner, { height: tabHeight }]}>
        <NavTabCell
          selected={selected === 'home'}
          label="HOME"
          typography={typography}
          onPress={() => onSelect('home')}
          icon={<BottomNavIconHome color={ink} />}
          minHeight={tabHeight}
          fontScale={fontScale}
        />
        <NavTabCell
          selected={selected === 'jobs'}
          label="JOBS"
          typography={typography}
          onPress={() => onSelect('jobs')}
          icon={<BottomNavIconJobs color={ink} />}
          minHeight={tabHeight}
          fontScale={fontScale}
        />
        <NavTabCell
          selected={selected === 'earnings'}
          label={earningsLabel}
          accessibilityName="Earnings"
          typography={typography}
          onPress={() => onSelect('earnings')}
          icon={<BottomNavIconEarnings color={ink} />}
          minHeight={tabHeight}
          fontScale={fontScale}
        />
      </View>
    </PlatformFloatingSurface>
  );
}

const styles = StyleSheet.create({
  groupSurface: {
    width: '100%',
    minWidth: TAB_MIN_WIDTH * 3,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    paddingHorizontal: space('Spacing/4'),
  },
  tabCell: {
    flex: 1,
    minWidth: TAB_MIN_WIDTH,
  },
  tabInner: {
    flex: 1,
    marginVertical: space('Spacing/6'),
    marginHorizontal: space('Spacing/4'),
    borderRadius: 999,
    // Android clips background to radius only when overflow is hidden on this node.
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space('Spacing/2'),
  },
  tabInnerSelected: {
    backgroundColor: 'rgba(43, 52, 65, 0.12)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space('Spacing/2'),
    width: '100%',
    minWidth: 0,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: space('Spacing/28'),
  },
  pressed: { opacity: 0.75 },
});
