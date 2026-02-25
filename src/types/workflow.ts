export interface WorkflowTag {
  id: string;
  name: string;
}

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  tags: WorkflowTag[];
  createdAt: string;
  updatedAt: string;
  nodes?: number;
  connections?: number;
}

export interface WorkflowsResponse {
  data: Workflow[];
  nextCursor?: string;
}

export interface UseWorkflowsOptions {
  pageSize?: number;
}

export interface UseWorkflowsReturn {
  workflows: Workflow[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  toggleActive: (workflowId: string, active: boolean) => Promise<void>;
  searchWorkflows: (query: string) => void;
}
