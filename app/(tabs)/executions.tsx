import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useN8n } from '@/src/context/N8nContext';
import { useRouter } from 'expo-router';
import ExecutionsScreen from '@/src/screens/ExecutionsScreen';

export default function ExecutionsTab() {
  const theme = useTheme();
  const { baseUrl, apiKey, isLoading, client } = useN8n();
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
      <ExecutionsScreen 
        navigation={{
          navigate: (route: string, params: any) => {
            if (route === 'ExecutionDetail') {
              router.push(`/execution/${params.executionId}`);
            }
          },
        }}
        route={{}}
        baseUrl={baseUrl}
        apiKey={apiKey || ''}
      />
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
