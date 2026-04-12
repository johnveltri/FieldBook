import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { JobDetailScreen } from './src/screens/JobDetailScreen';
import { color } from '@fieldbook/design-system/lib/tokens';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <JobDetailScreen />
        <StatusBar style="dark" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color('Foundation/Background/Default'),
  },
});
