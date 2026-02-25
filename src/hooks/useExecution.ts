import { useState, useEffect, useCallback } from 'react';
import {
  Execution,
  API_ENDPOINTS,
  RetryExecutionBody,
} from '../../n8n-api-types';
import axios, { AxiosInstance } from 'axios';

interface UseExecutionOptions {
  apiClient?: AxiosInstance;
  baseUrl?: string;
  apiKey?: string;
  executionId: string;
  includeData?: boolean;
}

interface UseExecutionReturn {
  execution: Execution | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  retrying: boolean;
  retryError: string | null;
  refresh: () => Promise<void>;
  retry: () => Promise<Execution | null>;
}

export function useExecution(options: UseExecutionOptions): UseExecutionReturn {
  const {
    apiClient,
    baseUrl,
    apiKey,
    executionId,
    includeData = true,
  } = options;

  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

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

  const fetchExecution = useCallback(async (
    isRefresh: boolean = false
  ): Promise<void> => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const client = getClient();
      const response = await client.get<Execution>(
        API_ENDPOINTS.EXECUTIONS.GET(executionId),
        {
          params: {
            includeData,
          },
        }
      );

      setExecution(response.data);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Failed to fetch execution';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getClient, executionId, includeData]);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchExecution(true);
  }, [fetchExecution]);

  const retry = useCallback(async (): Promise<Execution | null> => {
    if (!execution) return null;
    
    try {
      setRetrying(true);
      setRetryError(null);

      const client = getClient();
      const body: RetryExecutionBody = {
        loadWorkflow: true,
      };

      const response = await client.post<Execution>(
        API_ENDPOINTS.EXECUTIONS.RETRY(executionId),
        body
      );

      setExecution(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Failed to retry execution';
      setRetryError(errorMessage);
      return null;
    } finally {
      setRetrying(false);
    }
  }, [getClient, executionId, execution]);

  useEffect(() => {
    if (executionId) {
      fetchExecution();
    }
  }, [executionId, fetchExecution]);

  return {
    execution,
    loading,
    refreshing,
    error,
    retrying,
    retryError,
    refresh,
    retry,
  };
}
