import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  N8nClient,
  N8nClientConfig,
  N8nApiError,
  Workflow,
  Execution,
  Credential,
  Tag,
  PaginationParams,
  ExecutionListParams,
  WorkflowCreateParams,
  WorkflowUpdateParams,
  PaginatedResponse,
} from '../api/n8nClient';

const STORAGE_KEYS = {
  API_KEY: 'n8n_api_key',
  BASE_URL: 'n8n_base_url',
};

interface N8nContextValue {
  client: N8nClient | null;
  apiKey: string;
  baseUrl: string;
  isLoading: boolean;
  isConnected: boolean | null;
  connectionError: string | null;
  setConfig: (apiKey: string, baseUrl: string) => Promise<void>;
  clearConfig: () => Promise<void>;
  testConnection: () => Promise<boolean>;
  listWorkflows: (params?: PaginationParams) => Promise<PaginatedResponse<Workflow>>;
  getWorkflow: (id: string) => Promise<Workflow>;
  createWorkflow: (workflow: WorkflowCreateParams) => Promise<Workflow>;
  updateWorkflow: (id: string, workflow: WorkflowUpdateParams) => Promise<Workflow>;
  deleteWorkflow: (id: string) => Promise<void>;
  activateWorkflow: (id: string) => Promise<Workflow>;
  deactivateWorkflow: (id: string) => Promise<Workflow>;
  listExecutions: (params?: ExecutionListParams) => Promise<PaginatedResponse<Execution>>;
  getExecution: (id: string, includeData?: boolean) => Promise<Execution>;
  deleteExecution: (id: string) => Promise<void>;
  listCredentials: () => Promise<PaginatedResponse<Credential>>;
  getCredential: (id: string) => Promise<Credential>;
  listTags: () => Promise<PaginatedResponse<Tag>>;
  getTag: (id: string) => Promise<Tag>;
}

const N8nContext = createContext<N8nContextValue | null>(null);

interface N8nProviderProps {
  children: ReactNode;
  defaultBaseUrl?: string;
}

export function N8nProvider({ children, defaultBaseUrl = 'http://localhost:5678' }: N8nProviderProps) {
  const [client, setClient] = useState<N8nClient | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>(defaultBaseUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    loadStoredConfig();
  }, []);

  const loadStoredConfig = async (): Promise<void> => {
    try {
      const [storedApiKey, storedBaseUrl] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
        AsyncStorage.getItem(STORAGE_KEYS.BASE_URL),
      ]);

      const loadedApiKey = storedApiKey || '';
      const loadedBaseUrl = storedBaseUrl || defaultBaseUrl;

      setApiKey(loadedApiKey);
      setBaseUrl(loadedBaseUrl);

      if (loadedApiKey) {
        const newClient = new N8nClient({
          apiKey: loadedApiKey,
          baseUrl: loadedBaseUrl,
        });
        setClient(newClient);
      }
    } catch (error) {
      console.error('Failed to load stored config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setConfig = useCallback(async (newApiKey: string, newBaseUrl: string): Promise<void> => {
    setIsLoading(true);
    setConnectionError(null);

    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.API_KEY, newApiKey),
        AsyncStorage.setItem(STORAGE_KEYS.BASE_URL, newBaseUrl),
      ]);

      setApiKey(newApiKey);
      setBaseUrl(newBaseUrl);

      const newClient = new N8nClient({
        apiKey: newApiKey,
        baseUrl: newBaseUrl,
      });
      setClient(newClient);
      setIsConnected(null);
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearConfig = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.API_KEY),
        AsyncStorage.removeItem(STORAGE_KEYS.BASE_URL),
      ]);

      setApiKey('');
      setBaseUrl(defaultBaseUrl);
      setClient(null);
      setIsConnected(null);
      setConnectionError(null);
    } catch (error) {
      console.error('Failed to clear config:', error);
      throw error;
    }
  }, [defaultBaseUrl]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!client) {
      setConnectionError('No client configured');
      setIsConnected(false);
      return false;
    }

    try {
      setConnectionError(null);
      const result = await client.testConnection();
      setIsConnected(result);
      if (!result) {
        setConnectionError('Authentication failed. Please check your API key.');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof N8nApiError
        ? error.message
        : 'Failed to connect to n8n instance';
      setConnectionError(errorMessage);
      setIsConnected(false);
      return false;
    }
  }, [client]);

  const requireClient = (): N8nClient => {
    if (!client) {
      throw new Error('N8n client not configured. Please set API key and base URL.');
    }
    return client;
  };

  const listWorkflows = useCallback(async (params?: PaginationParams): Promise<PaginatedResponse<Workflow>> => {
    return requireClient().listWorkflows(params);
  }, [client]);

  const getWorkflow = useCallback(async (id: string): Promise<Workflow> => {
    return requireClient().getWorkflow(id);
  }, [client]);

  const createWorkflow = useCallback(async (workflow: WorkflowCreateParams): Promise<Workflow> => {
    return requireClient().createWorkflow(workflow);
  }, [client]);

  const updateWorkflow = useCallback(async (id: string, workflow: WorkflowUpdateParams): Promise<Workflow> => {
    return requireClient().updateWorkflow(id, workflow);
  }, [client]);

  const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
    return requireClient().deleteWorkflow(id);
  }, [client]);

  const activateWorkflow = useCallback(async (id: string): Promise<Workflow> => {
    return requireClient().activateWorkflow(id);
  }, [client]);

  const deactivateWorkflow = useCallback(async (id: string): Promise<Workflow> => {
    return requireClient().deactivateWorkflow(id);
  }, [client]);

  const listExecutions = useCallback(async (params?: ExecutionListParams): Promise<PaginatedResponse<Execution>> => {
    return requireClient().listExecutions(params);
  }, [client]);

  const getExecution = useCallback(async (id: string, includeData?: boolean): Promise<Execution> => {
    return requireClient().getExecution(id, includeData);
  }, [client]);

  const deleteExecution = useCallback(async (id: string): Promise<void> => {
    return requireClient().deleteExecution(id);
  }, [client]);

  const listCredentials = useCallback(async (): Promise<PaginatedResponse<Credential>> => {
    return requireClient().listCredentials();
  }, [client]);

  const getCredential = useCallback(async (id: string): Promise<Credential> => {
    return requireClient().getCredential(id);
  }, [client]);

  const listTags = useCallback(async (): Promise<PaginatedResponse<Tag>> => {
    return requireClient().listTags();
  }, [client]);

  const getTag = useCallback(async (id: string): Promise<Tag> => {
    return requireClient().getTag(id);
  }, [client]);

  const value: N8nContextValue = {
    client,
    apiKey,
    baseUrl,
    isLoading,
    isConnected,
    connectionError,
    setConfig,
    clearConfig,
    testConnection,
    listWorkflows,
    getWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    listExecutions,
    getExecution,
    deleteExecution,
    listCredentials,
    getCredential,
    listTags,
    getTag,
  };

  return <N8nContext.Provider value={value}>{children}</N8nContext.Provider>;
}

export function useN8n(): N8nContextValue {
  const context = useContext(N8nContext);
  if (!context) {
    throw new Error('useN8n must be used within an N8nProvider');
  }
  return context;
}

export function useN8nClient(): N8nClient | null {
  const { client } = useN8n();
  return client;
}

export function useN8nConnection(): {
  isLoading: boolean;
  isConnected: boolean | null;
  connectionError: string | null;
  testConnection: () => Promise<boolean>;
} {
  const { isLoading, isConnected, connectionError, testConnection } = useN8n();
  return { isLoading, isConnected, connectionError, testConnection };
}

export function useN8nConfig(): {
  apiKey: string;
  baseUrl: string;
  setConfig: (apiKey: string, baseUrl: string) => Promise<void>;
  clearConfig: () => Promise<void>;
} {
  const { apiKey, baseUrl, setConfig, clearConfig } = useN8n();
  return { apiKey, baseUrl, setConfig, clearConfig };
}
