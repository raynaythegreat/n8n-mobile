import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Text,
  Chip,
  Searchbar,
  FAB,
  Switch,
  List,
  useTheme,
  Surface,
  IconButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Workflow } from '../types/workflow';
import { useWorkflows } from '../hooks/useWorkflows';

export default function WorkflowsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    workflows,
    loading,
    refreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    toggleActive,
    searchWorkflows,
  } = useWorkflows({ pageSize: 20 });

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      searchWorkflows(query);
    },
    [searchWorkflows]
  );

  const handleToggleActive = useCallback(
    async (workflowId: string, currentActive: boolean) => {
      try {
        await toggleActive(workflowId, !currentActive);
      } catch {
        // Error is handled in the hook
      }
    },
    [toggleActive]
  );

  const handleWorkflowPress = useCallback(
    (workflow: Workflow) => {
      router.push(`/workflows/${workflow.id}`);
    },
    [router]
  );

  const renderWorkflowItem = useCallback(
    ({ item }: { item: Workflow }) => (
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleWorkflowPress(item)}
      >
        <List.Item
          title={item.name}
          titleStyle={styles.workflowTitle}
          description={
            <View style={styles.descriptionContainer}>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: item.active
                        ? theme.colors.primary
                        : theme.colors.outline,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: item.active ? theme.colors.primary : theme.colors.outline },
                  ]}
                >
                  {item.active ? 'Active' : 'Inactive'}
                </Text>
              </View>
              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.slice(0, 3).map((tag) => (
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
                  {item.tags.length > 3 && (
                    <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
                  )}
                </View>
              )}
            </View>
          }
          right={() => (
            <View onStartShouldSetResponder={() => true}>
              <Switch
                value={item.active}
                onValueChange={() => handleToggleActive(item.id, item.active)}
              />
            </View>
          )}
        />
      </Card>
    ),
    [theme, handleWorkflowPress, handleToggleActive]
  );

  const renderFooter = useCallback(() => {
    if (!loading || refreshing) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }, [loading, refreshing, theme]);

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.emptyText}>Loading workflows...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <IconButton icon="alert-circle" size={48} iconColor={theme.colors.error} />
          <Text style={[styles.emptyText, { color: theme.colors.error }]}>
            {error}
          </Text>
          <Text style={styles.retryText} onPress={handleRefresh}>
            Tap to retry
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <IconButton icon="folder-outline" size={48} iconColor={theme.colors.outline} />
        <Text style={styles.emptyText}>
          {searchQuery ? 'No workflows found' : 'No workflows yet'}
        </Text>
        <Text style={styles.emptySubtext}>
          {searchQuery
            ? 'Try a different search term'
            : 'Create a workflow in n8n to get started'}
        </Text>
      </View>
    );
  }, [loading, error, theme, handleRefresh, searchQuery]);

  const keyExtractor = useCallback((item: Workflow) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.header}>
        <Searchbar
          placeholder="Search workflows..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />
      </Surface>

      <FlatList
        data={workflows}
        keyExtractor={keyExtractor}
        renderItem={renderWorkflowItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/workflows/new')}
        color={theme.colors.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    elevation: 2,
  },
  searchbar: {
    elevation: 0,
  },
  searchInput: {
    minHeight: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
    elevation: 1,
    borderRadius: 8,
  },
  workflowTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  descriptionContainer: {
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  tag: {
    marginRight: 4,
    marginBottom: 2,
    height: 24,
  },
  tagText: {
    fontSize: 10,
  },
  moreTagsText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 12,
    textDecorationLine: 'underline',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});
