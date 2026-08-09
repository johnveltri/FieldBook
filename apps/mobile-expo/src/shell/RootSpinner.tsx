import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { color } from '@fieldsolo/design-system/lib/tokens';

export function RootSpinner() {
  return (
    <View style={styles.root}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color('Foundation/Background/Default'),
  },
});
