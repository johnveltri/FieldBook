import { AccessibilityInfo, type TextProps } from 'react-native';

type ScreenHeaderA11y = Pick<TextProps, 'accessibilityRole' | 'accessibilityLabel'>;

/** Marks visible screen or sheet titles for VoiceOver / TalkBack heading navigation. */
export function screenHeaderA11y(label?: string): ScreenHeaderA11y {
  if (label != null && label.trim() !== '') {
    return { accessibilityRole: 'header', accessibilityLabel: label.trim() };
  }
  return { accessibilityRole: 'header' };
}

export function announceAccessibilityMessage(message: string | null | undefined): void {
  const trimmed = message?.trim();
  if (!trimmed) return;
  AccessibilityInfo.announceForAccessibility(trimmed);
}
