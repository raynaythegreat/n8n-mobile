import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workflow, WorkflowsResponse } from '../types/workflow';

const API_URL_KEY = 'n8n_api_url';
const API_KEY_KEY = 'n8n_api_key';

class N8nApi {
  private client: AxiosInstance | null = null;
  private baseUrl: string | null = null;
  private apiKey: string | null = null;

  async initialize(): Promise<void> {
    this.baseUrl = await AsyncStorage.getItem(API_URL_KEY);
    this.apiKey = await AsyncStorage.getItem(API_KEY_KEY);

    if (this.baseUrl && this.apiKey) {
      this.client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  async setCredentials(baseUrl: string, apiKey: string): Promise<void> {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;

    await AsyncStorage.setItem(API_URL_KEY, baseUrl);
    await AsyncStorage.setItem(API_KEY_KEY, apiKey);

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async clearCredentials(): Promise<void> {
    this.baseUrl = null;
    this.apiKey = null;
    this.client = null;

    await AsyncStorage.multiRemove([API_URL_KEY, API_KEY_KEY]);
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async getWorkflows(params?: {
    cursor?: string;
    limit?: number;
    filter?: string;
  }): Promise<WorkflowsResponse> {
    if (!this.client) {
      throw new Error('API not configured');
    }

    const response = await this.client.get('/workflows', { params });
    return response.data;
  }

  async getWorkflow(id: string): Promise<Workflow> {
    if (!this.client) {
      throw new Error('API not configured');
    }

    const response = await this.client.get(`/workflows/${id}`);
    return response.data;
  }

  async activateWorkflow(id: string): Promise<Workflow> {
    if (!this.client) {
      throw new Error('API not configured');
    }

    const response = await this.client.patch(`/workflows/${id}`, { active: true });
    return response.data;
  }

  async deactivateWorkflow(id: string): Promise<Workflow> {
    if (!this.client) {
      throw new Error('API not configured');
    }

    const response = await this.client.patch(`/workflows/${id}`, { active: false });
    return response.data;
  }

  async toggleWorkflowActive(id: string, active: boolean): Promise<Workflow> {
    if (active) {
      return this.activateWorkflow(id);
    }
    return this.deactivateWorkflow(id);
  }

  async deleteWorkflow(id: string): Promise<void> {
    if (!this.client) {
      throw new Error('API not configured');
    }

    await this.client.delete(`/workflows/${id}`);
  }

  async executeWorkflow(id: string): Promise<{ executionId: string }> {
    if (!this.client) {
      throw new Error('API not configured');
    }

    const response = await this.client.post(`/workflows/${id}/execute`);
    return response.data;
  }
}

export const n8nApi = new N8nApi();
