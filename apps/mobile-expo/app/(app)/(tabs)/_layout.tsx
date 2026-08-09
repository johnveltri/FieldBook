import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { bg, fg } from '../../../src/theme/nativeTokens';

/** Foundation/Text/Primary — ink for icons + labels. */
const tabInk = fg.primary;
/**
 * Android bar fill: Foundation/Surface/Subtle — same tan track as Earnings
 * “PAST WEEK / MONTH / YEAR” so the nav separates from canvas-warm content.
 */
const androidTabBarBg = bg.subtle;
/** Material 3 selected indicator (secondary-container-like wash of primary ink). */
const m3Indicator = 'rgba(43, 52, 65, 0.14)';
const m3Ripple = 'rgba(43, 52, 65, 0.12)';

const iconHome = require('../../../assets/tab-icons/home.png');
const iconJobs = require('../../../assets/tab-icons/jobs.png');
const iconEarnings = require('../../../assets/tab-icons/earnings.png');

function NativeTabsLayout() {
  return (
    <NativeTabs
      // iOS: leave background unset/transparent so Liquid Glass owns the chrome;
      // forcing a fill creates the opaque slab under Reduce Transparency.
      backgroundColor={Platform.OS === 'android' ? androidTabBarBg : 'transparent'}
      tintColor={tabInk}
      iconColor={{ default: tabInk, selected: tabInk }}
      labelStyle={{
        default: { color: tabInk, fontSize: 10, fontWeight: '600' },
        selected: { color: tabInk, fontSize: 10, fontWeight: '700' },
      }}
      // Android: standard Material 3 active indicator + labeled tabs.
      disableIndicator={false}
      indicatorColor={m3Indicator}
      rippleColor={m3Ripple}
      labelVisibilityMode="labeled"
      // iOS: thinner material than systemChrome* — less vertical “glass bleed” above the pill.
      blurEffect={Platform.OS === 'ios' ? 'systemThinMaterialLight' : undefined}
      shadowColor="transparent"
      // iOS: without this, NativeTabs assumes scroll-edge and the glass/blur
      // extends far above the pill (especially when ScrollView isn’t the first child).
      disableTransparentOnScrollEdge
      minimizeBehavior="never"
    >
      <NativeTabs.Trigger name="index" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>HOME</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={iconHome} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="jobs" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>JOBS</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={iconJobs} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="earnings" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>EARNINGS</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={iconEarnings} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

/** Jest cannot host native tab navigators — use a stack with the same routes. */
function JestTabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="jobs" />
      <Stack.Screen name="earnings" />
    </Stack>
  );
}

export default function TabsLayout() {
  if (process.env.JEST_WORKER_ID !== undefined) {
    return <JestTabsLayout />;
  }
  return <NativeTabsLayout />;
}
