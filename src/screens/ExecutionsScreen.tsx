import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Menu,
  Button,
  Divider,
  useTheme,
  IconButton,
  List,
} from 'react-native-paper';
import { useExecutions } from '../hooks/useExecutions';
import {
  Execution,
  ExecutionStatus,
  Workflow,
  API_ENDPOINTS,
} from '../../n8n-api-types';
import axios from 'axios';

interface ExecutionsScreenProps {
  navigation: any;
  route: any;
  baseUrl?: string;
  apiKey?: string;
  workflowId?: string;
}

const STATUS_COLORS: Record<ExecutionStatus, string> = {
  success: '#4CAF50',
  error: '#F44336',
  running: '#2196F3',
  waiting: '#FF9800',
  canceled: '#9E9E9E',
  crashed: '#E91E63',
  new: '#00BCD4',
  unknown: '#757575',
};

const STATUS_LABELS: Record<ExecutionStatus, string> = {
  success: 'Success',
  error: 'Error',
  running: 'Running',
  waiting: 'Waiting',
  canceled: 'Canceled',
  crashed: 'Crashed',
  new: 'New',
  unknown: 'Unknown',
};

const FILTERABLE_STATUSES: ExecutionStatus[] = [
  'success',
  'error',
  'running',
  'waiting',
  'canceled',
  'crashed',
];

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

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ExecutionsScreen({
  navigation,
  route,
  baseUrl,
  apiKey,
  workflowId: propWorkflowId,
}: ExecutionsScreenProps) {
  const theme = useTheme();
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [workflowMenuVisible, setWorkflowMenuVisible] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);

  const effectiveBaseUrl = baseUrl ?? route?.params?.baseUrl;
  const effectiveApiKey = apiKey ?? route?.params?.apiKey;
  const initialWorkflowId = propWorkflowId ?? route?.params?.workflowId;

  const {
    executions,
    loading,
    refreshing,
    error,
    hasMore,
    totalRecords,
    refresh,
    loadMore,
    setStatusFilter,
    setWorkflowFilter,
    statusFilter,
    workflowFilter,
  } = useExecutions({
    baseUrl: effectiveBaseUrl,
    apiKey: effectiveApiKey,
  });

  const fetchWorkflows = useCallback(async () => {
    if (!effectiveBaseUrl || !effectiveApiKey) return;
    
    setWorkflowsLoading(true);
    try {
      const client = axios.create({
        baseURL: effectiveBaseUrl,
        headers: {
          'X-N8N-API-KEY': effectiveApiKey,
        },
      });
      const response = await client.get(API_ENDPOINTS.WORKFLOWS.LIST);
      setWorkflows(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setWorkflowsLoading(false);
    }
  }, [effectiveBaseUrl, effectiveApiKey]);

  React.useEffect(() => {
    fetchWorkflows();
    if (initialWorkflowId) {
      setWorkflowFilter(initialWorkflowId);
    }
  }, [fetchWorkflows, initialWorkflowId, setWorkflowFilter]);

  const handleExecutionPress = useCallback(
    (execution: Execution) => {
      navigation?.navigate('ExecutionDetail', {
        executionId: execution.id,
        execution,
      });
    },
    [navigation]
  );

  const handleStatusSelect = useCallback(
    (status: ExecutionStatus | undefined) => {
      setStatusFilter(status);
      setStatusMenuVisible(false);
    },
    [setStatusFilter]
  );

  const handleWorkflowSelect = useCallback(
    (workflowId: string | undefined) => {
      setWorkflowFilter(workflowId);
      setWorkflowMenuVisible(false);
    },
    [setWorkflowFilter]
  );

  const renderExecutionItem = useCallback(
    ({ item }: { item: Execution }) => {
      const statusColor = STATUS_COLORS[item.status];
      const workflowName = item.workflowName || `Workflow ${item.workflowId}`;
      const duration = formatDuration(item.startedAt, item.stoppedAt);
      const relativeTime = formatRelativeTime(item.startedAt);

      return (
        <Card
          style={styles.card}
          onPress={() => handleExecutionPress(item)}
          testID={`execution-item-${item.id}`}
        >
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Text variant="titleMedium" numberOfLines={1} style={styles.workflowName}>
                  {workflowName}
                </Text>
                <Chip
                  mode="flat"
                  compact
                  style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
                  textStyle={{ color: statusColor, fontSize: 12 }}
                >
                  {STATUS_LABELS[item.status]}
                </Chip>
              </View>
            </View>
            <View style={styles.cardDetails}>
              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={styles.detailText}>
                  {relativeTime}
                </Text>
                <Text variant="bodySmall" style={styles.detailText}>
                  {duration}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.modeText}>
                Mode: {item.mode}
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    },
    [handleExecutionPress]
  );

  const renderFooter = useCallback(() => {
    if (!loading || refreshing) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }, [loading, refreshing, theme.colors.primary]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text variant="titleMedium">No executions found</Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          {statusFilter || workflowFilter
            ? 'Try adjusting your filters'
            : 'Run a workflow to see executions here'}
        </Text>
      </View>
    );
  }, [loading, statusFilter, workflowFilter]);

  const selectedWorkflowName = useMemo(() => {
    if (!workflowFilter) return 'All Workflows';
    const workflow = workflows.find(w => w.id === workflowFilter);
    return workflow?.name || 'Unknown Workflow';
  }, [workflowFilter, workflows]);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="titleMedium" style={styles.errorText}>
          Error loading executions
        </Text>
        <Text variant="bodyMedium" style={styles.errorMessage}>
          {error}
        </Text>
        <Button mode="contained" onPress={refresh} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Menu
          visible={statusMenuVisible}
          onDismiss={() => setStatusMenuVisible(false)}
          anchor={
            <Chip
              mode="outlined"
              onPress={() => setStatusMenuVisible(true)}
              style={styles.filterChip}
              icon="filter-variant"
            >
              {statusFilter ? STATUS_LABELS[statusFilter] : 'All Status'}
            </Chip>
          }
        >
          <Menu.Item
            onPress={() => handleStatusSelect(undefined)}
            title="All Status"
            leadingIcon={statusFilter === undefined ? 'check' : undefined}
          />
          <Divider />
          {FILTERABLE_STATUSES.map(status => (
            <Menu.Item
              key={status}
              onPress={() => handleStatusSelect(status)}
              title={STATUS_LABELS[status]}
              leadingIcon={statusFilter === status ? 'check' : undefined}
            />
          ))}
        </Menu>

        <Menu
          visible={workflowMenuVisible}
          onDismiss={() => setWorkflowMenuVisible(false)}
          anchor={
            <Chip
              mode="outlined"
              onPress={() => setWorkflowMenuVisible(true)}
              style={styles.filterChip}
              icon="workflow"
            >
              {selectedWorkflowName}
            </Chip>
          }
        >
          <Menu.Item
            onPress={() => handleWorkflowSelect(undefined)}
            title="All Workflows"
            leadingIcon={workflowFilter === undefined ? 'check' : undefined}
          />
          <Divider />
          {workflowsLoading ? (
            <View style={styles.menuLoading}>
              <ActivityIndicator size="small" />
            </View>
          ) : (
            workflows.map(workflow => (
              <Menu.Item
                key={workflow.id}
                onPress={() => handleWorkflowSelect(workflow.id)}
                title={workflow.name}
                leadingIcon={workflowFilter === workflow.id ? 'check' : undefined}
              />
            ))
          )}
        </Menu>

        {(statusFilter || workflowFilter) && (
          <IconButton
            icon="close-circle"
            size={20}
            onPress={() => {
              setStatusFilter(undefined);
              setWorkflowFilter(undefined);
            }}
          />
        )}
      </View>

      {totalRecords > 0 && (
        <Text variant="bodySmall" style={styles.recordCount}>
          {totalRecords} execution{totalRecords !== 1 ? 's' : ''}
        </Text>
      )}

      <FlatList
        data={executions}
        renderItem={renderExecutionItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    marginRight: 8,
  },
  recordCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#666',
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workflowName: {
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  cardDetails: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    color: '#666',
  },
  modeText: {
    color: '#888',
    marginTop: 4,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    marginTop: 8,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  menuLoading: {
    padding: 16,
    alignItems: 'center',
  },
});

export default ExecutionsScreen;
