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
  Switch,
  Divider,
  useTheme,
  IconButton,
  List,
  Surface,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useN8n } from '@/src/context/N8nContext';
import { Workflow, Tag } from '@/src/api/n8nClient';

export default function WorkflowDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { getWorkflow, activateWorkflow, deactivateWorkflow, deleteWorkflow } = useN8n();
  
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchWorkflow = useCallback(async () => {
    if (!id) return;
    
    try {
      setError(null);
      const data = await getWorkflow(id);
      setWorkflow(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, getWorkflow]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkflow();
  };

  const handleToggleActive = async () => {
    if (!workflow) return;
    
    setToggling(true);
    try {
      if (workflow.active) {
        const updated = await deactivateWorkflow(workflow.id);
        setWorkflow(updated);
      } else {
        const updated = await activateWorkflow(workflow.id);
        setWorkflow(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle workflow');
    } finally {
      setToggling(false);
    }
  };

  const handleViewExecutions = () => {
    router.push(`/execution?workflowId=${id}`);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading workflow...</Text>
      </View>
    );
  }

  if (error || !workflow) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <IconButton icon="alert-circle" size={48} iconColor={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error || 'Workflow not found'}
        </Text>
        <Button mode="contained" onPress={fetchWorkflow} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: workflow.name,
          headerRight: () => (
            <View style={styles.headerRight}>
              <Switch
                value={workflow.active}
                onValueChange={handleToggleActive}
                disabled={toggling}
              />
            </View>
          ),
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
                  {
                    backgroundColor: workflow.active
                      ? '#4CAF50'
                      : theme.colors.outline,
                  },
                ]}
              />
              <Text variant="titleMedium">
                {workflow.active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Chip
              mode="flat"
              compact
              style={{ backgroundColor: theme.colors.primaryContainer }}
            >
              ID: {workflow.id}
            </Chip>
          </View>
        </Surface>

        {workflow.tags && workflow.tags.length > 0 && (
          <Surface style={styles.section} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Tags
            </Text>
            <View style={styles.tagsContainer}>
              {workflow.tags.map((tag: Tag) => (
                <Chip
                  key={tag.id}
                  mode="outlined"
                  style={styles.tag}
                >
                  {tag.name}
                </Chip>
              ))}
            </View>
          </Surface>
        )}

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Details
          </Text>
          <List.Item
            title="Created"
            description={new Date(workflow.createdAt).toLocaleString()}
            left={(props) => <List.Icon {...props} icon="calendar-plus" />}
          />
          <Divider />
          <List.Item
            title="Last Updated"
            description={new Date(workflow.updatedAt).toLocaleString()}
            left={(props) => <List.Icon {...props} icon="calendar-edit" />}
          />
          {workflow.nodes !== undefined && (
            <>
              <Divider />
              <List.Item
                title="Nodes"
                description={`${workflow.nodes} nodes`}
                left={(props) => <List.Icon {...props} icon="graph" />}
              />
            </>
          )}
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Actions
          </Text>
          <List.Item
            title="View Executions"
            description="See all executions of this workflow"
            left={(props) => <List.Icon {...props} icon="history" />}
            onPress={handleViewExecutions}
          />
          <Divider />
          <List.Item
            title="Open in n8n"
            description="Edit this workflow in n8n"
            left={(props) => <List.Icon {...props} icon="open-in-new" />}
            onPress={() => {}}
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
  headerRight: {
    marginRight: 8,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tag: {
    marginRight: 8,
    marginBottom: 4,
  },
});
