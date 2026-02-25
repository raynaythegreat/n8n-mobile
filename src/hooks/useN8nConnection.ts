import { useState, useCallback } from 'react';
import axios from 'axios';
import { useN8n } from '@/src/context/N8nContext';

export interface N8nCredentials {
  instanceUrl: string;
  apiKey: string;
}

export interface ConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  isTesting: boolean;
  error: string | null;
  credentials: N8nCredentials | null;
}

export function useN8nConnection() {
  const { setConfig, client, isLoading: contextLoading, isConnected } = useN8n();
  
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    isLoading: true,
    isTesting: false,
    error: null,
    credentials: null,
  });

  const testConnection = useCallback(async (credentials: N8nCredentials): Promise<boolean> => {
    setState(prev => ({ ...prev, isTesting: true, error: null }));

    try {
      const normalizedUrl = credentials.instanceUrl.replace(/\/$/, '');
      
      const response = await axios.get(`${normalizedUrl}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': credentials.apiKey,
        },
        timeout: 10000,
      });

      const isSuccess = response.status === 200;
      
      if (isSuccess) {
        await setConfig(credentials.apiKey, normalizedUrl);
        setState(prev => ({
          ...prev,
          isTesting: false,
          isConnected: true,
          credentials,
          error: null,
        }));
      }
      
      return isSuccess;
    } catch (err) {
      let errorMessage = 'Connection failed';
      
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Connection timed out';
        } else if (err.response?.status === 401) {
          errorMessage = 'Invalid API key';
        } else if (err.response?.status === 404) {
          errorMessage = 'Invalid n8n instance URL';
        } else if (err.message === 'Network Error') {
          errorMessage = 'Network error - check the URL';
        } else {
          errorMessage = err.message || 'Connection failed';
        }
      }
      
      setState(prev => ({
        ...prev,
        isTesting: false,
        isConnected: false,
        error: errorMessage,
      }));
      
      return false;
    }
  }, [setConfig]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    isTesting: state.isTesting,
    isLoading: contextLoading,
    isConnected: isConnected === true,
    testConnection,
    clearError,
  };
}
