import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { fg } from '../theme/nativeTokens';

/** Minimal top-left control so signed-in users can return to the sign-in screen. */
export function AuthSignOutButton() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  return (
    <Pressable
      onPress={() => void signOut()}
      style={({ pressed }) => [
        styles.wrap,
        {
          top: insets.top + 8,
          left: insets.left + 16,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      hitSlop={12}
    >
      <Text style={styles.label}>Sign out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 14,
    color: fg.secondary,
    textDecorationLine: 'underline',
  },
});
