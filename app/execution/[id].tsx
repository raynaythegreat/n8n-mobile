import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  Divider,
  useTheme,
  IconButton,
  List,
  Surface,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useN8n } from '@/src/context/N8nContext';
import { Execution, ExecutionStatus } from '@/src/api/n8nClient';

const STATUS_COLORS: Record<ExecutionStatus, string> = {
  success: '#4CAF50',
  failed: '#F44336',
  running: '#2196F3',
  waiting: '#FF9800',
  canceled: '#9E9E9E',
  crashed: '#E91E63',
  new: '#00BCD4',
};

const STATUS_LABELS: Record<ExecutionStatus, string> = {
  success: 'Success',
  failed: 'Failed',
  running: 'Running',
  waiting: 'Waiting',
  canceled: 'Canceled',
  crashed: 'Crashed',
  new: 'New',
};

function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const diffMs = end - start;

  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${Math.round(diffMs / 1000)}s`;
  if (diffMs < 3600000) {
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.round((diffMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export default function ExecutionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { getExecution, deleteExecution } = useN8n();
  
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExecution = useCallback(async () => {
    if (!id) return;
    
    try {
      setError(null);
      const data = await getExecution(id, true);
      setExecution(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load execution');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, getExecution]);

  useEffect(() => {
    fetchExecution();
  }, [fetchExecution]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExecution();
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading execution...</Text>
      </View>
    );
  }

  if (error || !execution) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <IconButton icon="alert-circle" size={48} iconColor={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error || 'Execution not found'}
        </Text>
        <Button mode="contained" onPress={fetchExecution} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[execution.status];
  const duration = formatDuration(execution.startedAt, execution.stoppedAt);
  const errorMessage = execution.data?.resultData?.error?.message;

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `Execution ${execution.id}`,
        }} 
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Surface style={styles.statusCard} elevation={1}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor },
                ]}
              />
              <Text variant="titleMedium">
                {STATUS_LABELS[execution.status]}
              </Text>
            </View>
            <Chip
              mode="flat"
              compact
              style={{ backgroundColor: statusColor + '20' }}
              textStyle={{ color: statusColor }}
            >
              {execution.mode}
            </Chip>
          </View>
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Details
          </Text>
          <List.Item
            title="Workflow"
            description={`ID: ${execution.workflowId}`}
            left={(props) => <List.Icon {...props} icon="source-branch" />}
            onPress={() => router.push(`/workflow/${execution.workflowId}`)}
          />
          <Divider />
          <List.Item
            title="Started"
            description={new Date(execution.startedAt).toLocaleString()}
            left={(props) => <List.Icon {...props} icon="clock-start" />}
          />
          <Divider />
          <List.Item
            title="Finished"
            description={execution.stoppedAt 
              ? new Date(execution.stoppedAt).toLocaleString() 
              : 'Still running'}
            left={(props) => <List.Icon {...props} icon="clock-end" />}
          />
          <Divider />
          <List.Item
            title="Duration"
            description={duration}
            left={(props) => <List.Icon {...props} icon="timer" />}
          />
        </Surface>

        {errorMessage && (
          <Surface style={[styles.section, styles.errorSection]} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Error
            </Text>
            <View style={styles.errorContent}>
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                {errorMessage}
              </Text>
            </View>
          </Surface>
        )}

        {execution.data?.resultData?.runData && (
          <Surface style={styles.section} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Execution Data
            </Text>
            <Text variant="bodySmall" style={styles.infoText}>
              {Object.keys(execution.data.resultData.runData).length} node(s) executed
            </Text>
          </Surface>
        )}

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Actions
          </Text>
          <List.Item
            title="View Workflow"
            description="Go to the workflow details"
            left={(props) => <List.Icon {...props} icon="source-branch" />}
            onPress={() => router.push(`/workflow/${execution.workflowId}`)}
          />
        </Surface>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  statusCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  section: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    padding: 16,
    paddingBottom: 8,
    opacity: 0.7,
  },
  errorSection: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorContent: {
    padding: 16,
    paddingTop: 0,
  },
  infoText: {
    padding: 16,
    paddingTop: 0,
    opacity: 0.7,
  },
});
