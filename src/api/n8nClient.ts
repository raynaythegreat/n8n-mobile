import axios, { AxiosInstance, AxiosError } from 'axios';

export interface N8nClientConfig {
  baseUrl: string;
  apiKey: string;
}

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  nodes?: WorkflowNode[];
  connections?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters?: Record<string, unknown>;
}

export interface Execution {
  id: string;
  finished: boolean;
  mode: string;
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  waitTill?: string;
  status: ExecutionStatus;
  data?: ExecutionData;
}

export type ExecutionStatus = 'new' | 'running' | 'success' | 'failed' | 'canceled' | 'crashed' | 'waiting';

export interface ExecutionData {
  resultData?: {
    runData?: Record<string, unknown>;
    lastNodeExecuted?: string;
    error?: {
      message: string;
      stack?: string;
    };
  };
}

export interface Credential {
  id: string;
  name: string;
  type: string;
  data?: Record<string, unknown>;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

export interface ExecutionListParams extends PaginationParams {
  workflowId?: string;
  status?: ExecutionStatus;
  includeData?: boolean;
}

export interface WorkflowCreateParams {
  name: string;
  nodes?: WorkflowNode[];
  connections?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  tags?: string[];
}

export interface WorkflowUpdateParams {
  name?: string;
  nodes?: WorkflowNode[];
  connections?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  tags?: string[];
}

export class N8nApiError extends Error {
  public statusCode: number;
  public errorResponse: unknown;

  constructor(message: string, statusCode: number, errorResponse?: unknown) {
    super(message);
    this.name = 'N8nApiError';
    this.statusCode = statusCode;
    this.errorResponse = errorResponse;
  }
}

export class N8nClient {
  private client: AxiosInstance;
  private config: N8nClientConfig;

  constructor(config: N8nClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, ''),
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  updateConfig(config: Partial<N8nClientConfig>): void {
    if (config.baseUrl) {
      this.config.baseUrl = config.baseUrl;
      this.client.defaults.baseURL = config.baseUrl.replace(/\/$/, '');
    }
    if (config.apiKey) {
      this.config.apiKey = config.apiKey;
      this.client.defaults.headers['X-N8N-API-KEY'] = config.apiKey;
    }
  }

  getConfig(): N8nClientConfig {
    return { ...this.config };
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const message = axiosError.response?.data?.message 
        || axiosError.response?.data?.error 
        || axiosError.message;
      throw new N8nApiError(
        message,
        axiosError.response?.status || 0,
        axiosError.response?.data
      );
    }
    throw error;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/workflows', { params: { limit: 1 } });
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      this.handleError(error);
      return false;
    }
  }

  async listWorkflows(params?: PaginationParams): Promise<PaginatedResponse<Workflow>> {
    try {
      const response = await this.client.get('/workflows', { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await this.client.get(`/workflows/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createWorkflow(workflow: WorkflowCreateParams): Promise<Workflow> {
    try {
      const response = await this.client.post('/workflows', workflow);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateWorkflow(id: string, workflow: WorkflowUpdateParams): Promise<Workflow> {
    try {
      const response = await this.client.patch(`/workflows/${id}`, workflow);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    try {
      await this.client.delete(`/workflows/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  async activateWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await this.client.post(`/workflows/${id}/activate`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deactivateWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await this.client.post(`/workflows/${id}/deactivate`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listExecutions(params?: ExecutionListParams): Promise<PaginatedResponse<Execution>> {
    try {
      const response = await this.client.get('/executions', { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getExecution(id: string, includeData?: boolean): Promise<Execution> {
    try {
      const response = await this.client.get(`/executions/${id}`, {
        params: includeData ? { includeData: true } : undefined,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteExecution(id: string): Promise<void> {
    try {
      await this.client.delete(`/executions/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  async listCredentials(): Promise<PaginatedResponse<Credential>> {
    try {
      const response = await this.client.get('/credentials');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCredential(id: string): Promise<Credential> {
    try {
      const response = await this.client.get(`/credentials/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listTags(): Promise<PaginatedResponse<Tag>> {
    try {
      const response = await this.client.get('/tags');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTag(id: string): Promise<Tag> {
    try {
      const response = await this.client.get(`/tags/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export function createN8nClient(config: N8nClientConfig): N8nClient {
  return new N8nClient(config);
}
