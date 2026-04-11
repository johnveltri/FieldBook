import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

import { JobDetailScreen } from './src/screens/JobDetailScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <JobDetailScreen />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#faf6f0',
  },
});
