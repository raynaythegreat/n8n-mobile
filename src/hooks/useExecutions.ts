import { useState, useEffect, useCallback } from 'react';
import {
  Execution,
  ExecutionStatus,
  ExecutionListResponse,
  GetExecutionsQuery,
  API_ENDPOINTS,
} from '../../n8n-api-types';
import axios, { AxiosInstance } from 'axios';

interface UseExecutionsOptions {
  apiClient?: AxiosInstance;
  baseUrl?: string;
  apiKey?: string;
  initialLimit?: number;
}

interface UseExecutionsReturn {
  executions: Execution[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  totalRecords: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  setStatusFilter: (status: ExecutionStatus | undefined) => void;
  setWorkflowFilter: (workflowId: string | undefined) => void;
  statusFilter: ExecutionStatus | undefined;
  workflowFilter: string | undefined;
}

export function useExecutions(options: UseExecutionsOptions = {}): UseExecutionsReturn {
  const {
    apiClient,
    baseUrl,
    apiKey,
    initialLimit = 20,
  } = options;

  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | undefined>(undefined);
  const [workflowFilter, setWorkflowFilter] = useState<string | undefined>(undefined);

  const getClient = useCallback((): AxiosInstance => {
    if (apiClient) return apiClient;
    
    if (!baseUrl || !apiKey) {
      throw new Error('Either apiClient or baseUrl and apiKey must be provided');
    }

    return axios.create({
      baseURL: baseUrl,
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }, [apiClient, baseUrl, apiKey]);

  const fetchExecutions = useCallback(async (
    params: GetExecutionsQuery,
    replace: boolean = false
  ): Promise<void> => {
    try {
      if (replace) {
        setLoading(true);
      }
      setError(null);

      const client = getClient();
      const response = await client.get<ExecutionListResponse>(
        API_ENDPOINTS.EXECUTIONS.LIST,
        { params }
      );

      const { data, nextCursor, numberOfTotalRecords } = response.data;

      if (replace) {
        setExecutions(data);
      } else {
        setExecutions(prev => [...prev, ...data]);
      }

      setCursor(nextCursor);
      setHasMore(!!nextCursor && data.length > 0);
      setTotalRecords(numberOfTotalRecords ?? data.length);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Failed to fetch executions';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getClient]);

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    setCursor(undefined);
    
    const params: GetExecutionsQuery = {
      limit: initialLimit,
      status: statusFilter,
      workflowId: workflowFilter,
    };

    await fetchExecutions(params, true);
  }, [fetchExecutions, initialLimit, statusFilter, workflowFilter]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (loading || !hasMore) return;

    const params: GetExecutionsQuery = {
      limit: initialLimit,
      cursor,
      status: statusFilter,
      workflowId: workflowFilter,
    };

    await fetchExecutions(params, false);
  }, [fetchExecutions, initialLimit, cursor, loading, hasMore, statusFilter, workflowFilter]);

  const handleSetStatusFilter = useCallback((status: ExecutionStatus | undefined): void => {
    setStatusFilter(status);
    setCursor(undefined);
    setExecutions([]);
    setHasMore(true);
  }, []);

  const handleSetWorkflowFilter = useCallback((workflowId: string | undefined): void => {
    setWorkflowFilter(workflowId);
    setCursor(undefined);
    setExecutions([]);
    setHasMore(true);
  }, []);

  useEffect(() => {
    const params: GetExecutionsQuery = {
      limit: initialLimit,
      status: statusFilter,
      workflowId: workflowFilter,
    };

    fetchExecutions(params, true);
  }, [statusFilter, workflowFilter, fetchExecutions, initialLimit]);

  return {
    executions,
    loading,
    refreshing,
    error,
    hasMore,
    totalRecords,
    refresh,
    loadMore,
    setStatusFilter: handleSetStatusFilter,
    setWorkflowFilter: handleSetWorkflowFilter,
    statusFilter,
    workflowFilter,
  };
}
