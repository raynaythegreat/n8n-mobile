import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useN8n } from '@/src/context/N8nContext';
import { useRouter } from 'expo-router';
import WorkflowsScreen from '@/src/screens/WorkflowsScreen';

export default function WorkflowsTab() {
  const theme = useTheme();
  const { isConnected, isLoading, client } = useN8n();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !client) {
      router.replace('/connection');
    }
  }, [isLoading, client, router]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#ff6d5a" />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#ff6d5a" />
      </View>
    );
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
