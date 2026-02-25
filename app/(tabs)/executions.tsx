import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useN8n } from '@/src/context/N8nContext';
import { useRouter } from 'expo-router';
import ExecutionsScreen from '@/src/screens/ExecutionsScreen';

export default function ExecutionsTab() {
  const theme = useTheme();
  const { isConnected, baseUrl, apiKey } = useN8n();
  const router = useRouter();

  if (!isConnected) {
    router.replace('/connection');
    return null;
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
});
