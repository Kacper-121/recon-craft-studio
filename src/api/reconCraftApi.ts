import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Workflow, Run, Target, Integration, ApiKey, RunMode } from '@/types/workflow';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  prepareHeaders: (headers) => {
    // Get JWT token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// API Response types
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface RunLogsResponse {
  logs: string[];
  hasMore: boolean;
}

interface MetricsResponse {
  totalWorkflows: number;
  totalRuns: number;
  runsByStatus: {
    queued: number;
    running: number;
    succeeded: number;
    failed: number;
  };
  successRate: number;
  activeApiKeys: number;
  authorizedTargetsCount: number;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  timestamp: string;
}

// Create RTK Query API
export const reconCraftApi = createApi({
  reducerPath: 'reconCraftApi',
  baseQuery,
  tagTypes: ['Workflow', 'Run', 'Target', 'Integration', 'ApiKey', 'Health', 'Metrics'],
  endpoints: (builder) => ({
    // ======================
    // Authentication
    // ======================
    createApiKey: builder.mutation<ApiKey, { name: string; expiresInDays?: number }>({
      query: (data) => ({
        url: '/auth/api-keys',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ApiKey'],
    }),

    getApiKeys: builder.query<ApiKey[], void>({
      query: () => '/auth/api-keys',
      providesTags: ['ApiKey'],
    }),

    deleteApiKey: builder.mutation<void, string>({
      query: (id) => ({
        url: `/auth/api-keys/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ApiKey'],
    }),

    exchangeApiKeyForToken: builder.mutation<{ token: string; expiresAt: string }, { apiKey: string }>({
      query: (data) => ({
        url: '/auth/token',
        method: 'POST',
        body: data,
      }),
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          // Store token in localStorage
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('token_expires_at', data.expiresAt);
        } catch (err) {
          console.error('Failed to exchange API key for token:', err);
        }
      },
    }),

    // ======================
    // Workflows
    // ======================
    getWorkflows: builder.query<Workflow[], void>({
      query: () => '/workflows',
      providesTags: ['Workflow'],
    }),

    getWorkflow: builder.query<Workflow, string>({
      query: (id) => `/workflows/${id}`,
      providesTags: (result, error, id) => [{ type: 'Workflow', id }],
    }),

    createWorkflow: builder.mutation<Workflow, Partial<Workflow>>({
      query: (workflow) => ({
        url: '/workflows',
        method: 'POST',
        body: workflow,
      }),
      invalidatesTags: ['Workflow'],
    }),

    updateWorkflow: builder.mutation<Workflow, { id: string; workflow: Partial<Workflow> }>({
      query: ({ id, workflow }) => ({
        url: `/workflows/${id}`,
        method: 'PUT',
        body: workflow,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Workflow', id }, 'Workflow'],
    }),

    deleteWorkflow: builder.mutation<void, string>({
      query: (id) => ({
        url: `/workflows/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workflow'],
    }),

    duplicateWorkflow: builder.mutation<Workflow, string>({
      query: (id) => ({
        url: `/workflows/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: ['Workflow'],
    }),

    // ======================
    // Runs
    // ======================
    startRun: builder.mutation<
      Run,
      { workflowId: string; targets: string[]; runMode: RunMode; authorizeTargets: boolean }
    >({
      query: (data) => ({
        url: '/runs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Run'],
    }),

    getRuns: builder.query<
      Run[],
      { workflowId?: string; status?: Run['status']; limit?: number; offset?: number }
    >({
      query: (params) => ({
        url: '/runs',
        params,
      }),
      providesTags: ['Run'],
    }),

    getRun: builder.query<Run, string>({
      query: (id) => `/runs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Run', id }],
    }),

    getRunLogs: builder.query<RunLogsResponse, { runId: string; offset?: number; limit?: number }>({
      query: ({ runId, offset = 0, limit = 100 }) => ({
        url: `/runs/${runId}/logs`,
        params: { offset, limit },
      }),
    }),

    sendRunToSlack: builder.mutation<void, string>({
      query: (runId) => ({
        url: `/runs/${runId}/actions/send-slack`,
        method: 'POST',
      }),
    }),

    sendRunToDiscord: builder.mutation<void, string>({
      query: (runId) => ({
        url: `/runs/${runId}/actions/send-discord`,
        method: 'POST',
      }),
    }),

    // ======================
    // Targets
    // ======================
    getTargets: builder.query<Target[], void>({
      query: () => '/targets',
      providesTags: ['Target'],
    }),

    createTarget: builder.mutation<Target, Omit<Target, 'id' | 'createdAt'>>({
      query: (target) => ({
        url: '/targets',
        method: 'POST',
        body: target,
      }),
      invalidatesTags: ['Target'],
    }),

    bulkImportTargets: builder.mutation<Target[], { targets: string[]; tags?: string[] }>({
      query: (data) => ({
        url: '/targets/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Target'],
    }),

    deleteTarget: builder.mutation<void, string>({
      query: (id) => ({
        url: `/targets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Target'],
    }),

    // ======================
    // Integrations
    // ======================
    getSlackIntegration: builder.query<Integration, void>({
      query: () => '/integrations/slack',
      providesTags: ['Integration'],
    }),

    configureSlack: builder.mutation<Integration, { webhookUrl: string; enabled: boolean }>({
      query: (data) => ({
        url: '/integrations/slack',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Integration'],
    }),

    getDiscordIntegration: builder.query<Integration, void>({
      query: () => '/integrations/discord',
      providesTags: ['Integration'],
    }),

    configureDiscord: builder.mutation<Integration, { webhookUrl: string; enabled: boolean }>({
      query: (data) => ({
        url: '/integrations/discord',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Integration'],
    }),

    // ======================
    // Health & Metrics
    // ======================
    getHealth: builder.query<HealthResponse, void>({
      query: () => '/health',
      providesTags: ['Health'],
    }),

    getMetrics: builder.query<MetricsResponse, void>({
      query: () => '/metrics',
      providesTags: ['Metrics'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  // Auth
  useCreateApiKeyMutation,
  useGetApiKeysQuery,
  useDeleteApiKeyMutation,
  useExchangeApiKeyForTokenMutation,

  // Workflows
  useGetWorkflowsQuery,
  useGetWorkflowQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  useDuplicateWorkflowMutation,

  // Runs
  useStartRunMutation,
  useGetRunsQuery,
  useGetRunQuery,
  useGetRunLogsQuery,
  useSendRunToSlackMutation,
  useSendRunToDiscordMutation,

  // Targets
  useGetTargetsQuery,
  useCreateTargetMutation,
  useBulkImportTargetsMutation,
  useDeleteTargetMutation,

  // Integrations
  useGetSlackIntegrationQuery,
  useConfigureSlackMutation,
  useGetDiscordIntegrationQuery,
  useConfigureDiscordMutation,

  // Health & Metrics
  useGetHealthQuery,
  useGetMetricsQuery,
} = reconCraftApi;
