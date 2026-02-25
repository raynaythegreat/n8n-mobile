import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ConnectionScreen } from '@/src/screens/ConnectionScreen';
import { useN8n } from '@/src/context/N8nContext';

export default function ConnectionRoute() {
  const router = useRouter();
  const { isConnected, isLoading } = useN8n();

  useEffect(() => {
    if (isConnected && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [isConnected, isLoading, router]);

  const handleConnectionSuccess = () => {
    router.replace('/(tabs)');
  };

  return <ConnectionScreen onConnectionSuccess={handleConnectionSuccess} />;
}
