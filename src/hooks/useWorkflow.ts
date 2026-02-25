import { useState, useCallback, useEffect } from 'react';
import { n8nApi } from '../api/n8nApi';
import { Workflow } from '../../n8n-api-types';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseWorkflowOptions {
  workflowId: string;
}

interface UseWorkflowReturn {
  workflow: Workflow | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refreshingExecutions: boolean;
  executions: ExecutionSummary[];
  executionsError: string | null;
  hasMoreExecutions: boolean;
  refresh: () => Promise<void>;
  refreshExecutions: () => Promise<void>;
  loadMoreExecutions: () => Promise<void>;
  activate: () => Promise<void>;
  deactivate: () => Promise<void>;
  toggleActive: () => Promise<void>;
  deleteWorkflow: () => Promise<void>;
  execute: () => Promise<string | null>;
}

interface ExecutionSummary {
  id: string;
  status: string;
  startedAt: string;
  stoppedAt?: string;
  mode: string;
  executionTime?: number;
}

async function getApiClient() {
  const baseUrl = await AsyncStorage.getItem('n8n_api_url');
  const apiKey = await AsyncStorage.getItem('n8n_api_key');

  if (!baseUrl || !apiKey) {
    throw new Error('API not configured');
  }

  return axios.create({
    baseURL: baseUrl,
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
  });
}

export function useWorkflow(options: UseWorkflowOptions): UseWorkflowReturn {
  const { workflowId } = options;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [executions, setExecutions] = useState<ExecutionSummary[]>([]);
  const [refreshingExecutions, setRefreshingExecutions] = useState(false);
  const [executionsError, setExecutionsError] = useState<string | null>(null);
  const [hasMoreExecutions, setHasMoreExecutions] = useState(true);
  const [executionsCursor, setExecutionsCursor] = useState<string | undefined>();

  const fetchWorkflow = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      await n8nApi.initialize();
      const response = await n8nApi.getWorkflow(workflowId);
      setWorkflow(response as unknown as Workflow);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch workflow';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workflowId]);

  const fetchExecutions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshingExecutions(true);
        setExecutionsCursor(undefined);
      }
      setExecutionsError(null);

      const client = await getApiClient();
      const params: { limit: number; workflowId: string; cursor?: string } = {
        limit: 10,
        workflowId,
      };

      if (!isRefresh && executionsCursor) {
        params.cursor = executionsCursor;
      }

      const response = await client.get('/executions', { params });
      const { data, nextCursor } = response.data;

      if (isRefresh) {
        setExecutions(data);
      } else {
        setExecutions(prev => [...prev, ...data]);
      }

      if (nextCursor) {
        setExecutionsCursor(nextCursor);
        setHasMoreExecutions(true);
      } else {
        setHasMoreExecutions(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch executions';
      setExecutionsError(message);
    } finally {
      setRefreshingExecutions(false);
    }
  }, [workflowId, executionsCursor]);

  const refresh = useCallback(async () => {
    await fetchWorkflow(true);
  }, [fetchWorkflow]);

  const refreshExecutions = useCallback(async () => {
    await fetchExecutions(true);
  }, [fetchExecutions]);

  const loadMoreExecutions = useCallback(async () => {
    if (!refreshingExecutions && hasMoreExecutions) {
      await fetchExecutions(false);
    }
  }, [fetchExecutions, refreshingExecutions, hasMoreExecutions]);

  const activate = useCallback(async () => {
    try {
      setError(null);
      await n8nApi.initialize();
      const response = await n8nApi.activateWorkflow(workflowId);
      setWorkflow(prev => prev ? { ...prev, active: true } : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate workflow';
      setError(message);
      throw err;
    }
  }, [workflowId]);

  const deactivate = useCallback(async () => {
    try {
      setError(null);
      await n8nApi.initialize();
      await n8nApi.deactivateWorkflow(workflowId);
      setWorkflow(prev => prev ? { ...prev, active: false } : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate workflow';
      setError(message);
      throw err;
    }
  }, [workflowId]);

  const toggleActive = useCallback(async () => {
    if (workflow?.active) {
      await deactivate();
    } else {
      await activate();
    }
  }, [workflow?.active, activate, deactivate]);

  const deleteWorkflow = useCallback(async () => {
    try {
      setError(null);
      await n8nApi.initialize();
      await n8nApi.deleteWorkflow(workflowId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete workflow';
      setError(message);
      throw err;
    }
  }, [workflowId]);

  const execute = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      await n8nApi.initialize();
      const result = await n8nApi.executeWorkflow(workflowId);
      return result.executionId || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute workflow';
      setError(message);
      throw err;
    }
  }, [workflowId]);

  useEffect(() => {
    fetchWorkflow();
    fetchExecutions(true);
  }, [fetchWorkflow, fetchExecutions]);

  return {
    workflow,
    loading,
    refreshing,
    error,
    refreshingExecutions,
    executions,
    executionsError,
    hasMoreExecutions,
    refresh,
    refreshExecutions,
    loadMoreExecutions,
    activate,
    deactivate,
    toggleActive,
    deleteWorkflow,
    execute,
  };
}
