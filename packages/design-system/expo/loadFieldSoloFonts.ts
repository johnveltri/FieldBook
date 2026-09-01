/// <reference path="./expo-font.d.ts" />
/**
 * Expo / React Native — load fonts used by design-system/tokens/typography.json.
 *
 * In your Expo app:
 *   npx expo install expo-font @expo-google-fonts/ubuntu @expo-google-fonts/pt-serif
 *
 * Call `loadFieldSoloFonts()` once before rendering (e.g. root layout); await splash screen until resolved.
 * React Native `fontFamily` must use the Expo-registered names below, not the raw Google names.
 */
import * as Font from 'expo-font';
import { Ubuntu_400Regular, Ubuntu_500Medium, Ubuntu_700Bold } from '@expo-google-fonts/ubuntu';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';

/** Registered keys for `fontFamily` after `loadFieldSoloFonts()` resolves. */
export const fieldsoloExpoFontFamily = {
  /** Typography/Body, Typography/Body-Small (Regular 400) */
  ubuntuRegular: 'Ubuntu_400Regular',
  /** SemiBold tokens (Medium 500 — Ubuntu has no 600 weight) */
  ubuntuMedium: 'Ubuntu_500Medium',
  /** LABEL, Metric, Metric-XL (Bold 700) */
  ubuntuBold: 'Ubuntu_700Bold',
  /** Display-H1, Heading-H2, Title-H3 (Bold 700) */
  ptSerifBold: 'PTSerif_700Bold',
} as const;

/** Pass to `useFonts()` from `expo-font`. */
export const fieldsoloExpoFontAssets = {
  [fieldsoloExpoFontFamily.ubuntuRegular]: Ubuntu_400Regular,
  [fieldsoloExpoFontFamily.ubuntuMedium]: Ubuntu_500Medium,
  [fieldsoloExpoFontFamily.ubuntuBold]: Ubuntu_700Bold,
  [fieldsoloExpoFontFamily.ptSerifBold]: PTSerif_700Bold,
} as const;

/** Pass to `createTextStyles()` in the mobile app (`nativeTokens.ts`). */
export const fieldsoloLoadedFonts = {
  serifBold: fieldsoloExpoFontFamily.ptSerifBold,
  sans: fieldsoloExpoFontFamily.ubuntuRegular,
  sansSemi: fieldsoloExpoFontFamily.ubuntuMedium,
  sansBold: fieldsoloExpoFontFamily.ubuntuBold,
} as const;

export async function loadFieldSoloFonts(): Promise<void> {
  await Font.loadAsync(fieldsoloExpoFontAssets);
}
