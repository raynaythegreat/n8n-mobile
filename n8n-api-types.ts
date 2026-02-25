export type ExecutionStatus = 'canceled' | 'error' | 'running' | 'success' | 'waiting' | 'crashed' | 'new' | 'unknown';

export interface PaginationParams {
  limit?: number;
  cursor?: string;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

export interface ApiErrorResponse {
  message: string;
  code?: string;
  stack?: string;
}

export interface AuthHeaders {
  'X-N8N-API-KEY': string;
}

export interface WorkflowSettings {
  errorWorkflow?: string;
  timezone?: string;
  saveManualExecutions?: boolean;
  saveExecutionProgress?: boolean;
  saveDataErrorExecution?: string;
  saveDataSuccessExecution?: string;
  executionTimeout?: number;
  executionOrder?: 'v0' | 'v1';
}

export interface WorkflowNode {
  parameters: Record<string, unknown>;
  id?: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  notes?: string;
  notesInFlow?: boolean;
  credentials?: Record<string, string>;
  disabled?: boolean;
  continueOnFail?: boolean;
  onError?: Array<{
    type: string;
    errorOutput?: string;
    continue?: boolean;
  }>;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
  main?: Array<Array<{ node: string; type: string; index: number }>>;
}

export interface WorkflowConnection {
  main: Array<Array<{ node: string; type: string; index: number }>>;
}

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  nodes: WorkflowNode[];
  connections: Record<string, WorkflowConnection>;
  settings?: WorkflowSettings;
  staticData?: Record<string, unknown>;
  tags?: Tag[];
  triggerCount?: number;
  updatedAt?: string;
  createdAt?: string;
  versionId?: string;
  description?: string;
  meta?: Record<string, unknown>;
  pinData?: Record<string, unknown[]>;
}

export interface WorkflowListResponse extends PaginatedResponse<Workflow> {}

export interface CreateWorkflowRequest {
  name: string;
  nodes: WorkflowNode[];
  connections: Record<string, WorkflowConnection>;
  settings?: WorkflowSettings;
  staticData?: Record<string, unknown>;
  tags?: Array<{ id: string } | { name: string }>;
  active?: boolean;
  description?: string;
  pinData?: Record<string, unknown[]>;
}

export interface UpdateWorkflowRequest extends Partial<CreateWorkflowRequest> {}

export interface GetWorkflowsQuery extends PaginationParams {
  active?: boolean;
  tags?: string;
  name?: string;
  projectId?: string;
  excludePinnedData?: boolean;
}

export interface GetWorkflowQuery {
  excludePinnedData?: boolean;
}

export interface ActivateWorkflowBody {
  versionId?: string;
  name?: string;
  description?: string;
}

export interface TransferWorkflowBody {
  destinationProjectId: string;
}

export interface WorkflowVersion {
  id: string;
  versionId: string;
  workflowId: string;
  nodes: WorkflowNode[];
  connections: Record<string, WorkflowConnection>;
  settings?: WorkflowSettings;
  staticData?: Record<string, unknown>;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  triggerCount?: number;
  description?: string;
}

export interface ExecutionData {
  startNodes?: string[];
  resultData?: {
    runData?: Record<string, unknown>;
    lastNodeExecuted?: string;
    error?: {
      message?: string;
      stack?: string;
      name?: string;
    };
  };
  executionData?: {
    contextData?: Record<string, unknown>;
    nodeExecutionStack?: unknown[];
    metadata?: Record<string, unknown>;
    waitingForWebhook?: boolean;
  };
}

export interface Execution {
  id: string;
  finished: boolean;
  mode: 'manual' | 'trigger' | 'webhook' | 'retry' | 'cron' | 'init';
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  workflowName?: string;
  status: ExecutionStatus;
  data?: ExecutionData;
  customData?: Record<string, string>;
  waitTill?: string;
  executionTime?: number;
  project?: {
    id: string;
    name: string;
    icon?: string;
  };
}

export interface ExecutionListResponse extends PaginatedResponse<Execution> {
  numberOfTotalRecords?: number;
}

export interface GetExecutionsQuery extends PaginationParams {
  status?: ExecutionStatus;
  workflowId?: string;
  projectId?: string;
  includeData?: boolean;
}

export interface GetExecutionQuery {
  includeData?: boolean;
}

export interface RetryExecutionBody {
  loadWorkflow?: boolean;
}

export interface StopExecutionsBody {
  status: Array<Extract<ExecutionStatus, 'waiting' | 'running'> | 'queued'>;
  workflowId?: string;
  startedAfter?: string;
  startedBefore?: string;
}

export interface Tag {
  id?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TagListResponse extends PaginatedResponse<Tag> {}

export interface CreateTagRequest {
  name: string;
}

export interface UpdateTagRequest {
  name: string;
}

export interface Credential {
  id: string;
  name: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
  data?: Record<string, unknown>;
  isGlobal?: boolean;
  isResolvable?: boolean;
  project?: {
    id: string;
    name: string;
    icon?: string;
  };
}

export interface CredentialListResponse extends PaginatedResponse<Credential> {}

export interface CreateCredentialRequest {
  name: string;
  type: string;
  data: Record<string, unknown>;
}

export interface UpdateCredentialRequest {
  name?: string;
  type?: string;
  data?: Record<string, unknown>;
  isGlobal?: boolean;
  isResolvable?: boolean;
  isPartialData?: boolean;
}

export interface TransferCredentialBody {
  destinationProjectId: string;
}

export interface CredentialSchemaProperty {
  type: string;
  title?: string;
  description?: string;
  default?: unknown;
  required?: boolean;
  options?: Array<{ name: string; value: unknown }>;
  properties?: Record<string, CredentialSchemaProperty>;
  additionalProperties?: boolean;
}

export interface CredentialSchema {
  name: string;
  displayName: string;
  properties: Record<string, CredentialSchemaProperty>;
  required?: string[];
}

export interface Project {
  id: string;
  name: string;
  icon?: string;
  type?: 'personal' | 'team';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectListResponse extends PaginatedResponse<Project> {}

export interface CreateProjectRequest {
  name: string;
  icon?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  icon?: string;
}

export interface ProjectUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: {
    id: number;
    name: string;
  };
  projectRole: {
    id: number;
    name: string;
  };
}

export interface AddProjectUserBody {
  userId: string;
  roleId: number;
}

export interface UpdateProjectUserRoleBody {
  roleId: number;
}

export interface Variable {
  id: string;
  key: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VariableListResponse extends PaginatedResponse<Variable> {}

export interface CreateVariableRequest {
  key: string;
  value: string;
}

export interface UpdateVariableRequest {
  key?: string;
  value?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isPending: boolean;
  isOwner: boolean;
  globalRole: {
    id: number;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
  signInType?: 'email' | 'ldap' | 'saml' | 'oidc';
}

export interface UserListResponse extends PaginatedResponse<User> {}

export interface InviteUserRequest {
  emails: Array<{ email: string }>;
}

export interface UpdateUserRoleBody {
  roleId: number;
}

export interface DeleteUserQuery {
  transferId?: string;
  includeRole?: boolean;
}

export interface AuditGenerateBody {
  additionalOptions?: {
    categories?: Array<'credentials' | 'database' | 'nodes' | 'instance' | 'security'>;
    daysAbandonedWorkflow?: number;
  };
}

export interface AuditReport {
  report: {
    metadata: {
      generatedAt: string;
      n8nVersion: string;
    };
    risk: {
      categories: Array<{
        category: string;
        risks: Array<{
          risk: string;
          severity: 'high' | 'medium' | 'low';
          description: string;
        }>;
      }>;
    };
  };
}

export interface SourceControlPullResponse {
  status: string;
  message?: string;
}

export interface DataTable {
  id: string;
  name: string;
  description?: string;
  columns: Array<{
    name: string;
    type: string;
  }>;
  rowCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DataTableListResponse extends PaginatedResponse<DataTable> {}

export interface CreateDataTableRequest {
  name: string;
  description?: string;
  columns: Array<{
    name: string;
    type: string;
  }>;
}

export interface UpdateDataTableRequest {
  name?: string;
  description?: string;
}

export interface DataTableRow {
  id: string;
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DataTableRowListResponse extends PaginatedResponse<DataTableRow> {}

export interface AddDataTableRowsRequest {
  rows: Array<Record<string, unknown>>;
}

export interface UpdateDataTableRowsRequest {
  filter?: string;
  update: Record<string, unknown>;
}

export interface UpsertDataTableRowRequest {
  keyColumns: string[];
  data: Record<string, unknown>;
}

export interface DeleteDataTableRowsQuery {
  filter?: string;
  returnData?: boolean;
  dryRun?: boolean;
}

export const API_ENDPOINTS = {
  WORKFLOWS: {
    LIST: '/workflows',
    CREATE: '/workflows',
    GET: (id: string) => `/workflows/${id}`,
    UPDATE: (id: string) => `/workflows/${id}`,
    DELETE: (id: string) => `/workflows/${id}`,
    ACTIVATE: (id: string) => `/workflows/${id}/activate`,
    DEACTIVATE: (id: string) => `/workflows/${id}/deactivate`,
    GET_TAGS: (id: string) => `/workflows/${id}/tags`,
    UPDATE_TAGS: (id: string) => `/workflows/${id}/tags`,
    TRANSFER: (id: string) => `/workflows/${id}/transfer`,
    GET_VERSION: (id: string, versionId: string) => `/workflows/${id}/${versionId}`,
  },
  EXECUTIONS: {
    LIST: '/executions',
    GET: (id: string) => `/executions/${id}`,
    DELETE: (id: string) => `/executions/${id}`,
    RETRY: (id: string) => `/executions/${id}/retry`,
    STOP: (id: string) => `/executions/${id}/stop`,
    STOP_MANY: '/executions/stop',
    GET_TAGS: (id: string) => `/executions/${id}/tags`,
    UPDATE_TAGS: (id: string) => `/executions/${id}/tags`,
  },
  CREDENTIALS: {
    LIST: '/credentials',
    CREATE: '/credentials',
    GET: (id: string) => `/credentials/${id}`,
    UPDATE: (id: string) => `/credentials/${id}`,
    DELETE: (id: string) => `/credentials/${id}`,
    GET_SCHEMA: (credentialTypeName: string) => `/credentials/schema/${credentialTypeName}`,
    TRANSFER: (id: string) => `/credentials/${id}/transfer`,
  },
  TAGS: {
    LIST: '/tags',
    CREATE: '/tags',
    GET: (id: string) => `/tags/${id}`,
    UPDATE: (id: string) => `/tags/${id}`,
    DELETE: (id: string) => `/tags/${id}`,
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: (id: string) => `/projects/${id}`,
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
    GET_USERS: (id: string) => `/projects/${id}/users`,
    ADD_USER: (id: string) => `/projects/${id}/users`,
    UPDATE_USER: (projectId: string, userId: string) => `/projects/${projectId}/users/${userId}`,
    REMOVE_USER: (projectId: string, userId: string) => `/projects/${projectId}/users/${userId}`,
  },
  USERS: {
    LIST: '/users',
    INVITE: '/users',
    GET: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    UPDATE_ROLE: (id: string) => `/users/${id}/role`,
    REINVITE: (id: string) => `/users/${id}/reinvite`,
  },
  VARIABLES: {
    LIST: '/variables',
    CREATE: '/variables',
    GET: (id: string) => `/variables/${id}`,
    UPDATE: (id: string) => `/variables/${id}`,
    DELETE: (id: string) => `/variables/${id}`,
  },
  AUDIT: {
    GENERATE: '/audit',
  },
  SOURCE_CONTROL: {
    PULL: '/source-control/pull',
  },
  DATA_TABLES: {
    LIST: '/data-tables',
    CREATE: '/data-tables',
    GET: (id: string) => `/data-tables/${id}`,
    UPDATE: (id: string) => `/data-tables/${id}`,
    DELETE: (id: string) => `/data-tables/${id}`,
    GET_ROWS: (id: string) => `/data-tables/${id}/rows`,
    INSERT_ROWS: (id: string) => `/data-tables/${id}/rows`,
    UPDATE_ROWS: (id: string) => `/data-tables/${id}/rows/update`,
    UPSERT_ROW: (id: string) => `/data-tables/${id}/rows/upsert`,
    DELETE_ROWS: (id: string) => `/data-tables/${id}/rows/delete`,
  },
} as const;

export type N8nApiClientConfig = {
  baseUrl: string;
  apiKey: string;
};

export interface N8nApi {
  workflows: {
    list(params?: GetWorkflowsQuery): Promise<WorkflowListResponse>;
    create(data: CreateWorkflowRequest): Promise<Workflow>;
    get(id: string, params?: GetWorkflowQuery): Promise<Workflow>;
    update(id: string, data: UpdateWorkflowRequest): Promise<Workflow>;
    delete(id: string): Promise<void>;
    activate(id: string, data?: ActivateWorkflowBody): Promise<Workflow>;
    deactivate(id: string): Promise<Workflow>;
    getTags(id: string): Promise<Tag[]>;
    updateTags(id: string, tags: Array<{ id: string }>): Promise<Tag[]>;
    transfer(id: string, data: TransferWorkflowBody): Promise<Workflow>;
    getVersion(id: string, versionId: string): Promise<WorkflowVersion>;
  };
  executions: {
    list(params?: GetExecutionsQuery): Promise<ExecutionListResponse>;
    get(id: string, params?: GetExecutionQuery): Promise<Execution>;
    delete(id: string): Promise<void>;
    retry(id: string, data?: RetryExecutionBody): Promise<Execution>;
    stop(id: string): Promise<Execution>;
    stopMany(data: StopExecutionsBody): Promise<{ success: boolean }>;
    getTags(id: string): Promise<Tag[]>;
    updateTags(id: string, tags: Array<{ id: string }>): Promise<Tag[]>;
  };
  credentials: {
    list(params?: PaginationParams): Promise<CredentialListResponse>;
    create(data: CreateCredentialRequest): Promise<Credential>;
    get(id: string): Promise<Credential>;
    update(id: string, data: UpdateCredentialRequest): Promise<Credential>;
    delete(id: string): Promise<void>;
    getSchema(credentialTypeName: string): Promise<CredentialSchema>;
    transfer(id: string, data: TransferCredentialBody): Promise<Credential>;
  };
  tags: {
    list(params?: PaginationParams): Promise<TagListResponse>;
    create(data: CreateTagRequest): Promise<Tag>;
    get(id: string): Promise<Tag>;
    update(id: string, data: UpdateTagRequest): Promise<Tag>;
    delete(id: string): Promise<void>;
  };
  projects: {
    list(params?: PaginationParams): Promise<ProjectListResponse>;
    create(data: CreateProjectRequest): Promise<Project>;
    get(id: string): Promise<Project>;
    update(id: string, data: UpdateProjectRequest): Promise<Project>;
    delete(id: string): Promise<void>;
    getUsers(id: string): Promise<ProjectUser[]>;
    addUser(id: string, data: AddProjectUserBody): Promise<ProjectUser>;
    updateUserRole(projectId: string, userId: string, data: UpdateProjectUserRoleBody): Promise<ProjectUser>;
    removeUser(projectId: string, userId: string): Promise<void>;
  };
  users: {
    list(params?: PaginationParams): Promise<UserListResponse>;
    invite(data: InviteUserRequest): Promise<{ success: boolean }>;
    get(id: string): Promise<User>;
    delete(id: string, params?: DeleteUserQuery): Promise<void>;
    updateRole(id: string, data: UpdateUserRoleBody): Promise<User>;
    reinvite(id: string): Promise<{ success: boolean }>;
  };
  variables: {
    list(params?: PaginationParams): Promise<VariableListResponse>;
    create(data: CreateVariableRequest): Promise<Variable>;
    get(id: string): Promise<Variable>;
    update(id: string, data: UpdateVariableRequest): Promise<Variable>;
    delete(id: string): Promise<void>;
  };
  audit: {
    generate(data?: AuditGenerateBody): Promise<AuditReport>;
  };
  sourceControl: {
    pull(): Promise<SourceControlPullResponse>;
  };
  dataTables: {
    list(params?: PaginationParams): Promise<DataTableListResponse>;
    create(data: CreateDataTableRequest): Promise<DataTable>;
    get(id: string): Promise<DataTable>;
    update(id: string, data: UpdateDataTableRequest): Promise<DataTable>;
    delete(id: string): Promise<void>;
    getRows(id: string, params?: PaginationParams): Promise<DataTableRowListResponse>;
    insertRows(id: string, data: AddDataTableRowsRequest): Promise<DataTableRowListResponse>;
    updateRows(id: string, data: UpdateDataTableRowsRequest): Promise<DataTableRowListResponse>;
    upsertRow(id: string, data: UpsertDataTableRowRequest): Promise<DataTableRow>;
    deleteRows(id: string, params?: DeleteDataTableRowsQuery): Promise<{ deleted: number }>;
  };
}
