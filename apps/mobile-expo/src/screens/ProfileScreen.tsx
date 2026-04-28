import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
import { useMemo } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CanvasTiledBackground } from '../components/CanvasTiledBackground';
import { TopHeaderBackIcon } from '../components/figma-icons/TopHeaderIcons';
import { useAuth } from '../context/AuthContext';
import {
  CONTENT_MAX_WIDTH,
  TOP_HEADER_MAX_WIDTH,
  bg,
  border,
  cardShadowRn,
  createTextStyles,
  fg,
  radius,
  space,
} from '../theme/nativeTokens';

/** Page back control — scale up Figma `231:837` (24×24 artboard). */
const PROFILE_BACK_ICON_SIZE = 28;

export type ProfileScreenProps = {
  onBack: () => void;
};

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useMemo(() => new Animated.Value(0), []);
  const { signOut } = useAuth();

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

  const headerTopPad = Math.max(insets.top - space('Spacing/12'), 0);
  const bottomNavReservedHeight =
    space('Spacing/8') + 1 + 64 + space('Spacing/8') + insets.bottom;

  if (!fontsLoaded) {
    return (
      <View style={styles.root}>
        <CanvasTiledBackground scrollY={scrollY} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CanvasTiledBackground scrollY={scrollY} />
      <Animated.ScrollView
        style={[styles.scroll, { paddingTop: headerTopPad }]}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomNavReservedHeight + space('Spacing/20'),
            flexGrow: 1,
          },
        ]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        <View style={styles.headerBand}>
          <View style={[styles.topHeaderRow, { maxWidth: TOP_HEADER_MAX_WIDTH }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={onBack}
              hitSlop={12}
              style={({ pressed }) => [styles.backHit, pressed && styles.pressed]}
            >
              <TopHeaderBackIcon color={fg.secondary} size={PROFILE_BACK_ICON_SIZE} />
            </Pressable>
            <Text style={[typography.displayH1, styles.profileTitle]}>PROFILE</Text>
          </View>
        </View>

        <View style={[styles.bodyWrap, { maxWidth: CONTENT_MAX_WIDTH }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={() => void signOut()}
            style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
          >
            <Text style={[typography.bodyBold, styles.signOutLabel]}>Sign out</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', backgroundColor: bg.canvasWarm },
  scroll: { flex: 1, width: '100%', backgroundColor: 'transparent' },
  scrollContent: {
    alignItems: 'stretch',
  },
  headerBand: {
    width: '100%',
    alignItems: 'center',
  },
  /** Title + Back — no accent strip (`231:817` variant `Title + Back`). */
  topHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space('Spacing/20'),
    paddingTop: space('Spacing/32'),
    paddingBottom: space('Spacing/16'),
    gap: space('Spacing/8'),
  },
  backHit: {
    width: PROFILE_BACK_ICON_SIZE,
    height: PROFILE_BACK_ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  profileTitle: {
    flex: 1,
    color: fg.primary,
  },
  bodyWrap: {
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: space('Spacing/20'),
    paddingTop: space('Spacing/8'),
  },
  signOutButton: {
    minHeight: 48,
    borderRadius: radius('Radius/Full'),
    borderWidth: 2,
    borderColor: border.default,
    backgroundColor: bg.surfaceWhite,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space('Spacing/24'),
    ...cardShadowRn,
  },
  signOutLabel: {
    color: fg.primary,
    textTransform: 'uppercase',
  },
  pressed: { opacity: 0.75 },
});
