/** Minimal typing so the design-system package typechecks before `expo-font` is installed in an Expo app. */
declare module 'expo-font' {
  export function loadAsync(
    fontMap: Record<string, number | string>,
  ): Promise<void>;
}
