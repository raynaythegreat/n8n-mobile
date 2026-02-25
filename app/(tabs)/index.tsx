import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useN8n } from '@/src/context/N8nContext';
import { useRouter } from 'expo-router';
import WorkflowsScreen from '@/src/screens/WorkflowsScreen';

export default function WorkflowsTab() {
  const theme = useTheme();
  const { isConnected } = useN8n();
  const router = useRouter();

  if (!isConnected) {
    router.replace('/connection');
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <WorkflowsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
