import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const CREDENTIALS_KEY = '@n8n_credentials';

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
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    isLoading: true,
    isTesting: false,
    error: null,
    credentials: null,
  });

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CREDENTIALS_KEY);
      if (stored) {
        const credentials: N8nCredentials = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          credentials,
          isLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load saved credentials',
      }));
    }
  }, []);

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
        await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
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
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CREDENTIALS_KEY);
      setState({
        isConnected: false,
        isLoading: false,
        isTesting: false,
        error: null,
        credentials: null,
      });
    } catch {
      setState(prev => ({
        ...prev,
        error: 'Failed to disconnect',
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    testConnection,
    disconnect,
    clearError,
    loadCredentials,
  };
}
