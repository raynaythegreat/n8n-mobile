import { useState, useCallback, useEffect } from 'react';
import { Workflow, UseWorkflowsOptions, UseWorkflowsReturn } from '../types/workflow';
import { n8nApi } from '../api/n8nApi';

export function useWorkflows(options: UseWorkflowsOptions = {}): UseWorkflowsReturn {
  const { pageSize = 20 } = options;

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWorkflows = useCallback(
    async (isRefresh = false, searchFilter?: string) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
          setCursor(undefined);
        } else {
          setLoading(true);
        }
        setError(null);

        const params: { limit: number; cursor?: string; filter?: string } = {
          limit: pageSize,
        };

        if (!isRefresh && cursor) {
          params.cursor = cursor;
        }

        if (searchFilter) {
          params.filter = searchFilter;
        }

        const response = await n8nApi.getWorkflows(params);

        if (isRefresh) {
          setWorkflows(response.data);
        } else {
          setWorkflows((prev) => [...prev, ...response.data]);
        }

        if (response.nextCursor) {
          setCursor(response.nextCursor);
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch workflows';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pageSize, cursor]
  );

  const refresh = useCallback(async () => {
    setCursor(undefined);
    await fetchWorkflows(true, searchQuery);
  }, [fetchWorkflows, searchQuery]);

  const loadMore = useCallback(async () => {
    if (!loading && !refreshing && hasMore) {
      await fetchWorkflows(false, searchQuery);
    }
  }, [loading, refreshing, hasMore, fetchWorkflows, searchQuery]);

  const toggleActive = useCallback(
    async (workflowId: string, active: boolean) => {
      try {
        const updatedWorkflow = await n8nApi.toggleWorkflowActive(workflowId, active);

        setWorkflows((prev) =>
          prev.map((w) =>
            w.id === workflowId ? { ...w, active: updatedWorkflow.active } : w
          )
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update workflow';
        setError(message);
        throw err;
      }
    },
    []
  );

  const searchWorkflows = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setCursor(undefined);
      setWorkflows([]);
      setHasMore(true);
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      await n8nApi.initialize();
      fetchWorkflows(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (searchQuery !== undefined || workflows.length === 0) {
      fetchWorkflows(true, searchQuery);
    }
  }, [searchQuery]);

  return {
    workflows,
    loading,
    refreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    toggleActive,
    searchWorkflows,
  };
}
