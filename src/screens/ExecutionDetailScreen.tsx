import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
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
  List,
  Surface,
} from 'react-native-paper';
import { useExecution } from '../hooks/useExecution';
import {
  Execution,
  ExecutionStatus,
  ExecutionData,
} from '../../n8n-api-types';

interface ExecutionDetailScreenProps {
  navigation: any;
  route: any;
  baseUrl?: string;
  apiKey?: string;
}

type NodeStatus = 'success' | 'error' | 'skipped';

const STATUS_COLORS: Record<ExecutionStatus | NodeStatus, string> = {
  success: '#4CAF50',
  error: '#F44336',
  running: '#2196F3',
  waiting: '#FF9800',
  canceled: '#9E9E9E',
  crashed: '#E91E63',
  new: '#00BCD4',
  unknown: '#757575',
  skipped: '#BDBDBD',
};

const STATUS_LABELS: Record<ExecutionStatus | NodeStatus, string> = {
  success: 'Success',
  error: 'Error',
  running: 'Running',
  waiting: 'Waiting',
  canceled: 'Canceled',
  crashed: 'Crashed',
  new: 'New',
  unknown: 'Unknown',
  skipped: 'Skipped',
};

const STATUS_ICONS: Record<ExecutionStatus | NodeStatus, string> = {
  success: 'check-circle',
  error: 'alert-circle',
  running: 'sync',
  waiting: 'clock-outline',
  canceled: 'cancel',
  crashed: 'skull',
  new: 'plus-circle',
  unknown: 'help-circle',
  skipped: 'skip-next',
};

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const diffMs = end - start;

  if (diffMs < 0) return '0ms';
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

interface NodeRunData {
  data?: Array<{
    json?: unknown;
    binary?: unknown;
    pairedItem?: unknown;
    error?: {
      message?: string;
      stack?: string;
      name?: string;
    };
  }>;
  source?: Array<Array<{ previousNode?: string; index?: number }>>;
  startTime?: number;
  executionTime?: number;
}

interface NodeExecutionInfo {
  name: string;
  status: NodeStatus;
  runData?: NodeRunData[];
  error?: {
    message?: string;
    stack?: string;
    name?: string;
  };
}

function parseNodeExecutions(execution: Execution): NodeExecutionInfo[] {
  const nodes: NodeExecutionInfo[] = [];
  const data = execution.data as ExecutionData | undefined;
  
  if (!data?.resultData?.runData) {
    return nodes;
  }

  const runData = data.resultData.runData as Record<string, NodeRunData[]>;
  const lastNodeExecuted = data.resultData.lastNodeExecuted;
  const executionError = data.resultData.error;

  for (const [nodeName, nodeRuns] of Object.entries(runData)) {
    const hasError = nodeRuns.some(run => run.data?.some(d => d.error));
    const isLastNode = nodeName === lastNodeExecuted;
    
    let status: NodeStatus = 'success';
    if (hasError || (isLastNode && executionError)) {
      status = 'error';
    }

    nodes.push({
      name: nodeName,
      status,
      runData: nodeRuns,
      error: isLastNode && executionError ? executionError : undefined,
    });
  }

  return nodes;
}

function formatJson(data: unknown, indent: number = 0): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function NodeAccordion({
  node,
  expanded,
  onToggle,
}: {
  node: NodeExecutionInfo;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusColor = STATUS_COLORS[node.status];
  const hasError = node.status === 'error';

  const renderNodeData = () => {
    if (!node.runData || node.runData.length === 0) {
      return (
        <View style={styles.nodeDataContainer}>
          <Text variant="bodySmall" style={styles.noDataText}>
            No execution data available
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.nodeDataContainer}>
        {node.error && (
          <Surface style={styles.errorContainer} elevation={1}>
            <Text variant="labelMedium" style={styles.errorLabel}>
              Error Details
            </Text>
            {node.error.name && (
              <Text variant="bodySmall" style={styles.errorName}>
                {node.error.name}
              </Text>
            )}
            {node.error.message && (
              <Text variant="bodySmall" style={styles.errorMessage}>
                {node.error.message}
              </Text>
            )}
            {node.error.stack && (
              <ScrollView horizontal style={styles.stackContainer}>
                <Text variant="bodySmall" style={styles.stackText}>
                  {node.error.stack}
                </Text>
              </ScrollView>
            )}
          </Surface>
        )}

        {node.runData.map((run, runIndex) => (
          <View key={runIndex} style={styles.runContainer}>
            <Text variant="labelMedium" style={styles.runLabel}>
              Run {runIndex + 1}
            </Text>
            {run.startTime && (
              <Text variant="bodySmall" style={styles.runTime}>
                Started: {formatDateTime(new Date(run.startTime).toISOString())}
              </Text>
            )}
            {run.executionTime !== undefined && (
              <Text variant="bodySmall" style={styles.runTime}>
                Duration: {run.executionTime}ms
              </Text>
            )}
            
            {run.data && run.data.length > 0 && (
              <Surface style={styles.outputContainer} elevation={1}>
                <Text variant="labelMedium" style={styles.outputLabel}>
                  Output Data ({run.data.length} item{run.data.length !== 1 ? 's' : ''})
                </Text>
                <ScrollView horizontal style={styles.jsonContainer}>
                  <Text variant="bodySmall" style={styles.jsonText}>
                    {formatJson(run.data.map(d => d.json))}
                  </Text>
                </ScrollView>
              </Surface>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Surface style={[styles.accordionContainer, hasError && styles.accordionError]} elevation={1}>
      <List.Item
        title={node.name}
        description={hasError ? node.error?.message || 'Execution failed' : undefined}
        left={(props) => (
          <List.Icon
            {...props}
            icon={STATUS_ICONS[node.status]}
            color={statusColor}
          />
        )}
        right={(props) => (
          <View style={styles.accordionRight}>
            <Chip
              mode="flat"
              compact
              style={[styles.nodeStatusChip, { backgroundColor: statusColor + '20' }]}
              textStyle={{ color: statusColor, fontSize: 11 }}
            >
              {STATUS_LABELS[node.status]}
            </Chip>
            <List.Icon
              {...props}
              icon={expanded ? 'chevron-up' : 'chevron-down'}
            />
          </View>
        )}
        onPress={onToggle}
        style={styles.accordionHeader}
      />
      {expanded && renderNodeData()}
    </Surface>
  );
}

export function ExecutionDetailScreen({
  navigation,
  route,
  baseUrl: propBaseUrl,
  apiKey: propApiKey,
}: ExecutionDetailScreenProps) {
  const theme = useTheme();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  const effectiveBaseUrl = propBaseUrl ?? route?.params?.baseUrl;
  const effectiveApiKey = propApiKey ?? route?.params?.apiKey;
  const executionId = route?.params?.executionId;
  const initialExecution = route?.params?.execution as Execution | undefined;

  const {
    execution,
    loading,
    refreshing,
    error,
    retrying,
    retryError,
    refresh,
    retry,
  } = useExecution({
    baseUrl: effectiveBaseUrl,
    apiKey: effectiveApiKey,
    executionId,
  });

  const displayExecution = execution || initialExecution;

  const nodeExecutions = useMemo(() => {
    if (!displayExecution) return [];
    return parseNodeExecutions(displayExecution);
  }, [displayExecution]);

  const handleRetry = useCallback(async () => {
    const newExecution = await retry();
    if (newExecution) {
      navigation?.setParams?.({
        executionId: newExecution.id,
        execution: newExecution,
      });
    }
  }, [retry, navigation]);

  const toggleNode = useCallback((nodeName: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeName)) {
        next.delete(nodeName);
      } else {
        next.add(nodeName);
      }
      return next;
    });
  }, []);

  if (loading && !displayExecution) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading execution details...
        </Text>
      </View>
    );
  }

  if (error && !displayExecution) {
    return (
      <View style={styles.centerContainer}>
        <List.Icon icon="alert-circle" color={STATUS_COLORS.error} />
        <Text variant="titleMedium" style={styles.errorTitle}>
          Error loading execution
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

  if (!displayExecution) {
    return (
      <View style={styles.centerContainer}>
        <List.Icon icon="file-question" color={STATUS_COLORS.unknown} />
        <Text variant="titleMedium">
          Execution not found
        </Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[displayExecution.status];
  const duration = formatDuration(
    displayExecution.startedAt,
    displayExecution.stoppedAt
  );
  const canRetry = displayExecution.status === 'error' || 
                   displayExecution.status === 'crashed' ||
                   displayExecution.status === 'canceled';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text variant="titleLarge" numberOfLines={2}>
                {displayExecution.workflowName || `Workflow ${displayExecution.workflowId}`}
              </Text>
            </View>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
              textStyle={{ color: statusColor, fontWeight: '600' }}
              icon={STATUS_ICONS[displayExecution.status]}
            >
              {STATUS_LABELS[displayExecution.status]}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text variant="labelSmall" style={styles.detailLabel}>
                Started
              </Text>
              <Text variant="bodySmall">
                {formatDateTime(displayExecution.startedAt)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text variant="labelSmall" style={styles.detailLabel}>
                {displayExecution.stoppedAt ? 'Finished' : 'Duration'}
              </Text>
              <Text variant="bodySmall">
                {displayExecution.stoppedAt
                  ? formatDateTime(displayExecution.stoppedAt)
                  : duration}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text variant="labelSmall" style={styles.detailLabel}>
                Duration
              </Text>
              <Text variant="bodySmall">{duration}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text variant="labelSmall" style={styles.detailLabel}>
                Mode
              </Text>
              <Text variant="bodySmall">{displayExecution.mode}</Text>
            </View>
          </View>

          {displayExecution.retryOf && (
            <View style={styles.retryInfo}>
              <List.Icon icon="refresh" />
              <Text variant="bodySmall" style={styles.retryText}>
                Retry of execution {displayExecution.retryOf}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {retryError && (
        <Surface style={styles.retryErrorContainer} elevation={1}>
          <Text variant="bodySmall" style={styles.retryErrorText}>
            {retryError}
          </Text>
        </Surface>
      )}

      {canRetry && (
        <Button
          mode="contained"
          onPress={handleRetry}
          loading={retrying}
          disabled={retrying}
          style={styles.retryButton}
          icon="refresh"
        >
          {retrying ? 'Retrying...' : 'Retry Execution'}
        </Button>
      )}

      <Card style={styles.nodesCard}>
        <Card.Title
          title="Node Executions"
          subtitle={`${nodeExecutions.length} node${nodeExecutions.length !== 1 ? 's' : ''}`}
          titleVariant="titleMedium"
          left={(props) => <List.Icon {...props} icon="sitemap" />}
        />
        <Card.Content>
          {nodeExecutions.length === 0 ? (
            <View style={styles.noNodesContainer}>
              <Text variant="bodySmall" style={styles.noDataText}>
                No node execution data available
              </Text>
            </View>
          ) : (
            <View style={styles.nodesList}>
              {nodeExecutions.map((node) => (
                <NodeAccordion
                  key={node.name}
                  node={node}
                  expanded={expandedNodes.has(node.name)}
                  onToggle={() => toggleNode(node.name)}
                />
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {displayExecution.customData && Object.keys(displayExecution.customData).length > 0 && (
        <Card style={styles.customDataCard}>
          <Card.Title
            title="Custom Data"
            titleVariant="titleMedium"
            left={(props) => <List.Icon {...props} icon="code-tags" />}
          />
          <Card.Content>
            <ScrollView horizontal>
              <Text variant="bodySmall" style={styles.jsonText}>
                {formatJson(displayExecution.customData)}
              </Text>
            </ScrollView>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorTitle: {
    color: '#F44336',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  headerCard: {
    marginBottom: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  statusChip: {
    height: 32,
  },
  divider: {
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#888',
    marginBottom: 2,
  },
  retryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  retryText: {
    color: '#666',
  },
  retryErrorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryErrorText: {
    color: '#F44336',
  },
  retryButton: {
    marginBottom: 12,
  },
  nodesCard: {
    marginBottom: 12,
    elevation: 2,
  },
  noNodesContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noDataText: {
    color: '#888',
  },
  nodesList: {
    gap: 8,
  },
  accordionContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  accordionError: {
    backgroundColor: '#FFEBEE',
  },
  accordionHeader: {
    paddingVertical: 4,
  },
  accordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeStatusChip: {
    height: 24,
  },
  nodeDataContainer: {
    padding: 12,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorLabel: {
    color: '#F44336',
    marginBottom: 4,
  },
  errorName: {
    color: '#F44336',
    fontWeight: '600',
    marginBottom: 4,
  },
  errorContainerMessage: {
    color: '#F44336',
  },
  stackContainer: {
    marginTop: 8,
  },
  stackText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#666',
  },
  runContainer: {
    marginBottom: 12,
  },
  runLabel: {
    color: '#666',
    marginBottom: 4,
  },
  runTime: {
    color: '#888',
    fontSize: 11,
  },
  outputContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  outputLabel: {
    color: '#4CAF50',
    marginBottom: 4,
  },
  jsonContainer: {
    marginTop: 4,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#333',
  },
  customDataCard: {
    marginBottom: 12,
    elevation: 2,
  },
});

export default ExecutionDetailScreen;
