import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Chip,
  Button,
  Divider,
  useTheme,
  IconButton,
  List,
  Surface,
  Dialog,
  Portal,
  Avatar,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useWorkflow } from '../hooks/useWorkflow';
import { WorkflowNode, ExecutionStatus } from '../../n8n-api-types';

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

const NODE_TYPE_ICONS: Record<string, string> = {
  'n8n-nodes-base.start': 'play',
  'n8n-nodes-base.manualTrigger': 'gesture-tap',
  'n8n-nodes-base.scheduleTrigger': 'clock-outline',
  'n8n-nodes-base.webhook': 'webhook',
  'n8n-nodes-base.httpRequest': 'web',
  'n8n-nodes-base.code': 'code-tags',
  'n8n-nodes-base.set': 'cog',
  'n8n-nodes-base.if': 'source-branch',
  'n8n-nodes-base.merge': 'merge',
  'n8n-nodes-base.switch': 'toggle-switch',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function formatDuration(executionTime?: number): string {
  if (!executionTime) return '-';
  if (executionTime < 1000) return `${executionTime}ms`;
  if (executionTime < 60000) return `${(executionTime / 1000).toFixed(1)}s`;
  const mins = Math.floor(executionTime / 60000);
  const secs = Math.round((executionTime % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function getNodeIcon(type: string): string {
  if (NODE_TYPE_ICONS[type]) {
    return NODE_TYPE_ICONS[type];
  }
  if (type.includes('trigger')) return 'lightning-bolt';
  if (type.includes('webhook')) return 'webhook';
  if (type.includes('http')) return 'web';
  return 'cube-outline';
}

export default function WorkflowDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const workflowId = params.id;

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    workflow,
    loading,
    refreshing,
    error,
    executions,
    refreshingExecutions,
    executionsError,
    hasMoreExecutions,
    refresh,
    loadMoreExecutions,
    toggleActive,
    deleteWorkflow,
    execute,
  } = useWorkflow({ workflowId: workflowId || '' });

  const handleToggleActive = useCallback(async () => {
    try {
      setActionLoading('toggle');
      await toggleActive();
    } catch {
      Alert.alert('Error', `Failed to ${workflow?.active ? 'deactivate' : 'activate'} workflow`);
    } finally {
      setActionLoading(null);
    }
  }, [toggleActive, workflow?.active]);

  const handleExecute = useCallback(async () => {
    try {
      setActionLoading('execute');
      const executionId = await execute();
      if (executionId) {
        Alert.alert('Success', 'Workflow execution started', [
          { text: 'OK', onPress: () => refresh() },
        ]);
      } else {
        Alert.alert('Success', 'Workflow execution started');
        refresh();
      }
    } catch {
      Alert.alert('Error', 'Failed to execute workflow');
    } finally {
      setActionLoading(null);
    }
  }, [execute, refresh]);

  const handleEdit = useCallback(() => {
    router.push(`/workflows/${workflowId}/edit`);
  }, [router, workflowId]);

  const handleDelete = useCallback(async () => {
    try {
      setActionLoading('delete');
      await deleteWorkflow();
      setDeleteDialogVisible(false);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to delete workflow');
    } finally {
      setActionLoading(null);
    }
  }, [deleteWorkflow, router]);

  const handleExecutionPress = useCallback(
    (executionId: string) => {
      router.push(`/executions/${executionId}`);
    },
    [router]
  );

  const nodes = workflow?.nodes || [];
  const triggerNodes = nodes.filter(n => n.type.toLowerCase().includes('trigger') || n.type === 'n8n-nodes-base.start');
  const regularNodes = nodes.filter(n => !n.type.toLowerCase().includes('trigger') && n.type !== 'n8n-nodes-base.start');

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Workflow',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading workflow...</Text>
        </View>
      </View>
    );
  }

  if (error && !workflow) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Error',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.centerContainer}>
          <IconButton icon="alert-circle" size={48} iconColor={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          <Button mode="contained" onPress={refresh} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </View>
    );
  }

  if (!workflow) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Not Found',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.centerContainer}>
          <IconButton icon="file-question" size={48} iconColor={theme.colors.outline} />
          <Text style={styles.notFoundText}>Workflow not found</Text>
          <Button mode="outlined" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: workflow.name,
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Surface style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: workflow.active
                      ? theme.colors.primary
                      : theme.colors.outline,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: workflow.active ? theme.colors.primary : theme.colors.outline },
                ]}
              >
                {workflow.active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Chip
              mode="flat"
              compact
              style={[
                styles.nodeCountChip,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              {nodes.length} nodes
            </Chip>
          </View>

          {workflow.description && (
            <Text style={styles.description}>{workflow.description}</Text>
          )}

          {workflow.tags && workflow.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {workflow.tags.map(tag => (
                <Chip
                  key={tag.id}
                  compact
                  mode="outlined"
                  style={styles.tag}
                  textStyle={styles.tagText}
                >
                  {tag.name}
                </Chip>
              ))}
            </View>
          )}

          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Created: {formatDate(workflow.createdAt || '')}</Text>
            <Text style={styles.dateLabel}>Updated: {formatDate(workflow.updatedAt || '')}</Text>
          </View>
        </Surface>

        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleToggleActive}
            loading={actionLoading === 'toggle'}
            disabled={actionLoading !== null}
            style={[styles.actionButton, { backgroundColor: workflow.active ? theme.colors.error : theme.colors.primary }]}
            icon={workflow.active ? 'pause' : 'play'}
          >
            {workflow.active ? 'Deactivate' : 'Activate'}
          </Button>

          <Button
            mode="contained"
            onPress={handleExecute}
            loading={actionLoading === 'execute'}
            disabled={actionLoading !== null || !workflow.active}
            style={[styles.actionButton, { backgroundColor: theme.colors.tertiary }]}
            icon="lightning-bolt"
          >
            Execute
          </Button>

          <Button
            mode="outlined"
            onPress={handleEdit}
            disabled={actionLoading !== null}
            style={styles.actionButton}
            icon="pencil"
          >
            Edit
          </Button>

          <Button
            mode="outlined"
            onPress={() => setDeleteDialogVisible(true)}
            disabled={actionLoading !== null}
            style={[styles.actionButton, { borderColor: theme.colors.error }]}
            textColor={theme.colors.error}
            icon="delete"
          >
            Delete
          </Button>
        </View>

        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Nodes" subtitle={`${nodes.length} total`} />
          <Card.Content>
            {triggerNodes.length > 0 && (
              <>
                <Text style={styles.nodeSectionTitle}>Triggers</Text>
                {triggerNodes.map((node, index) => (
                  <List.Item
                    key={node.id || `trigger-${index}`}
                    title={node.name}
                    description={node.type.replace('n8n-nodes-base.', '').replace('@n8n/', '')}
                    left={props => <List.Icon {...props} icon={getNodeIcon(node.type)} />}
                    style={styles.nodeItem}
                  />
                ))}
                <Divider style={styles.nodeDivider} />
              </>
            )}

            {regularNodes.length > 0 && (
              <>
                <Text style={styles.nodeSectionTitle}>Workflow Nodes</Text>
                {regularNodes.map((node, index) => (
                  <List.Item
                    key={node.id || `node-${index}`}
                    title={node.name}
                    description={node.type.replace('n8n-nodes-base.', '').replace('@n8n/', '')}
                    left={props => <List.Icon {...props} icon={getNodeIcon(node.type)} />}
                    style={styles.nodeItem}
                    disabled={node.disabled}
                  />
                ))}
              </>
            )}

            {nodes.length === 0 && (
              <Text style={styles.emptyNodesText}>No nodes in this workflow</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Title
            title="Recent Executions"
            subtitle={executions.length > 0 ? `${executions.length} shown` : 'No executions'}
          />
          <Card.Content>
            {refreshingExecutions ? (
              <View style={styles.executionsLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.executionsLoadingText}>Loading executions...</Text>
              </View>
            ) : executionsError ? (
              <Text style={[styles.executionsError, { color: theme.colors.error }]}>
                {executionsError}
              </Text>
            ) : executions.length > 0 ? (
              <>
                {executions.map(execution => (
                  <List.Item
                    key={execution.id}
                    title={`Execution ${execution.id.slice(0, 8)}`}
                    description={`${formatRelativeTime(execution.startedAt)} • ${formatDuration(execution.executionTime)}`}
                    left={props => (
                      <List.Icon
                        {...props}
                        icon="circle"
                        color={STATUS_COLORS[execution.status as ExecutionStatus] || theme.colors.outline}
                      />
                    )}
                    right={props => (
                      <Chip
                        {...props}
                        compact
                        mode="flat"
                        style={[
                          styles.executionStatusChip,
                          {
                            backgroundColor:
                              (STATUS_COLORS[execution.status as ExecutionStatus] || '#757575') + '20',
                          },
                        ]}
                        textStyle={{
                          color: STATUS_COLORS[execution.status as ExecutionStatus] || '#757575',
                          fontSize: 11,
                        }}
                      >
                        {execution.status}
                      </Chip>
                    )}
                    onPress={() => handleExecutionPress(execution.id)}
                    style={styles.executionItem}
                  />
                ))}
                {hasMoreExecutions && (
                  <Button
                    mode="text"
                    onPress={loadMoreExecutions}
                    style={styles.loadMoreButton}
                  >
                    Load More
                  </Button>
                )}
              </>
            ) : (
              <Text style={styles.emptyExecutionsText}>
                No executions yet. Run the workflow to see execution history.
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Workflow</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{workflow.name}"? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleDelete}
              loading={actionLoading === 'delete'}
              textColor={theme.colors.error}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nodeCountChip: {
    height: 28,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    marginRight: 6,
    marginBottom: 4,
    height: 26,
  },
  tagText: {
    fontSize: 11,
  },
  dateContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  sectionCard: {
    borderRadius: 12,
    elevation: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  nodeSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: 8,
    marginTop: 8,
  },
  nodeItem: {
    paddingVertical: 4,
  },
  nodeDivider: {
    marginVertical: 8,
  },
  emptyNodesText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 16,
  },
  executionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  executionsLoadingText: {
    marginLeft: 8,
    color: '#666',
  },
  executionsError: {
    textAlign: 'center',
    paddingVertical: 16,
  },
  executionItem: {
    paddingVertical: 4,
  },
  executionStatusChip: {
    height: 24,
  },
  loadMoreButton: {
    marginTop: 8,
  },
  emptyExecutionsText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 16,
  },
});
