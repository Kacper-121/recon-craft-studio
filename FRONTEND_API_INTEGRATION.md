# ReconCraft Studio - Frontend API Integration Guide

## Overview

This document describes the frontend API integration using RTK Query for efficient data fetching, caching, and state management.

## Architecture

### Technology Stack

- **RTK Query**: Official Redux Toolkit data fetching library
- **Redux Toolkit**: State management
- **TypeScript**: Type safety for API calls

### Benefits

- **Automatic Caching**: Responses are cached and reused
- **Real-time Updates**: Polling support for run status updates
- **Optimistic Updates**: UI updates before server confirmation
- **Type Safety**: Full TypeScript support
- **Loading States**: Built-in loading and error handling

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_DEBUG=false
```

### Store Setup

The RTK Query API is integrated into the Redux store (`src/store/index.ts`):

```typescript
import { reconCraftApi } from '@/api/reconCraftApi';

export const store = configureStore({
  reducer: {
    [reconCraftApi.reducerPath]: reconCraftApi.reducer,
    // ... other reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(reconCraftApi.middleware),
});
```

## API Service

### Base Configuration

Located in `src/api/reconCraftApi.ts`:

```typescript
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});
```

### Authentication Flow

1. **Create API Key**: Generate an API key from the backend
2. **Exchange for JWT**: Convert API key to JWT token
3. **Store Token**: Token stored in localStorage
4. **Auto-attach**: Token automatically added to all requests

```typescript
// Create API key
const { data: apiKey } = await createApiKey({ name: 'My API Key' });

// Exchange for JWT token
await exchangeApiKeyForToken({ apiKey: apiKey.key! });
// Token is automatically stored in localStorage
```

## Available API Endpoints

### Authentication

```typescript
// Create API key
useCreateApiKeyMutation()
POST /api/auth/api-keys

// Get all API keys
useGetApiKeysQuery()
GET /api/auth/api-keys

// Delete API key
useDeleteApiKeyMutation()
DELETE /api/auth/api-keys/:id

// Exchange API key for JWT token
useExchangeApiKeyForTokenMutation()
POST /api/auth/token
```

### Workflows

```typescript
// List all workflows
useGetWorkflowsQuery()
GET /api/workflows

// Get single workflow
useGetWorkflowQuery(id)
GET /api/workflows/:id

// Create workflow
useCreateWorkflowMutation()
POST /api/workflows

// Update workflow
useUpdateWorkflowMutation()
PUT /api/workflows/:id

// Delete workflow
useDeleteWorkflowMutation()
DELETE /api/workflows/:id

// Duplicate workflow
useDuplicateWorkflowMutation()
POST /api/workflows/:id/duplicate
```

### Runs

```typescript
// Start new run
useStartRunMutation()
POST /api/runs
Body: {
  workflowId: string
  targets: string[]
  runMode: 'live' | 'demo'
  authorizeTargets: boolean
}

// List runs with filters
useGetRunsQuery({ workflowId?, status?, limit?, offset? })
GET /api/runs

// Get single run (with polling)
useGetRunQuery(id, { pollingInterval: 2000 })
GET /api/runs/:id

// Get run logs
useGetRunLogsQuery({ runId, offset?, limit? })
GET /api/runs/:id/logs

// Send run to Slack
useSendRunToSlackMutation()
POST /api/runs/:id/actions/send-slack

// Send run to Discord
useSendRunToDiscordMutation()
POST /api/runs/:id/actions/send-discord
```

### Targets

```typescript
// List all targets
useGetTargetsQuery()
GET /api/targets

// Create target
useCreateTargetMutation()
POST /api/targets
Body: { value: string, tags: string[] }

// Bulk import targets
useBulkImportTargetsMutation()
POST /api/targets/bulk
Body: { targets: string[], tags?: string[] }

// Delete target
useDeleteTargetMutation()
DELETE /api/targets/:id
```

### Integrations

```typescript
// Get Slack integration
useGetSlackIntegrationQuery()
GET /api/integrations/slack

// Configure Slack
useConfigureSlackMutation()
POST /api/integrations/slack
Body: { webhookUrl: string, enabled: boolean }

// Get Discord integration
useGetDiscordIntegrationQuery()
GET /api/integrations/discord

// Configure Discord
useConfigureDiscordMutation()
POST /api/integrations/discord
Body: { webhookUrl: string, enabled: boolean }
```

### Health & Metrics

```typescript
// Health check
useGetHealthQuery()
GET /api/health

// Application metrics
useGetMetricsQuery()
GET /api/metrics
```

## Usage Examples

### Basic Query

```typescript
import { useGetWorkflowsQuery } from '@/api/reconCraftApi';

function WorkflowList() {
  const { data: workflows, isLoading, error } = useGetWorkflowsQuery();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {workflows.map(workflow => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </div>
  );
}
```

### Mutation with Error Handling

```typescript
import { useCreateWorkflowMutation } from '@/api/reconCraftApi';
import { toast } from 'sonner';

function CreateWorkflow() {
  const [createWorkflow, { isLoading }] = useCreateWorkflowMutation();

  const handleSubmit = async (data) => {
    try {
      const workflow = await createWorkflow(data).unwrap();
      toast.success('Workflow created');
      navigate(`/builder?id=${workflow.id}`);
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
      console.error('Create error:', error);
    }
  };

  return <WorkflowForm onSubmit={handleSubmit} loading={isLoading} />;
}
```

### Real-time Polling

```typescript
import { useGetRunQuery } from '@/api/reconCraftApi';

function RunMonitor({ runId }) {
  const { data: run } = useGetRunQuery(runId, {
    pollingInterval: 2000, // Poll every 2 seconds
    skip: !runId, // Skip if no runId
  });

  useEffect(() => {
    if (run?.status === 'succeeded') {
      toast.success('Run completed!');
    }
  }, [run?.status]);

  return <RunDetails run={run} />;
}
```

### Conditional Queries

```typescript
import { useGetWorkflowQuery } from '@/api/reconCraftApi';

function WorkflowEditor({ workflowId }) {
  const { data: workflow } = useGetWorkflowQuery(workflowId, {
    skip: !workflowId, // Only fetch if workflowId exists
  });

  // workflow will be undefined if skip is true
  return workflow ? <Editor workflow={workflow} /> : <NewWorkflow />;
}
```

### Optimistic Updates

```typescript
import { useUpdateWorkflowMutation } from '@/api/reconCraftApi';

function WorkflowEditor({ workflow }) {
  const [updateWorkflow] = useUpdateWorkflowMutation();

  const handleSave = async (changes) => {
    try {
      await updateWorkflow({
        id: workflow.id,
        workflow: changes,
      }).unwrap();

      toast.success('Saved');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  return <Editor onSave={handleSave} />;
}
```

## Caching Strategy

### Automatic Cache Management

RTK Query automatically manages cache based on tags:

```typescript
// After creating a workflow, the workflow list is automatically refetched
const [createWorkflow] = useCreateWorkflowMutation();
// Invalidates: ['Workflow']

// After deleting a workflow, the workflow list updates automatically
const [deleteWorkflow] = useDeleteWorkflowMutation();
// Invalidates: ['Workflow']
```

### Manual Cache Invalidation

```typescript
import { reconCraftApi } from '@/api/reconCraftApi';
import { useAppDispatch } from '@/store/hooks';

function RefreshButton() {
  const dispatch = useAppDispatch();

  const handleRefresh = () => {
    dispatch(reconCraftApi.util.invalidateTags(['Workflow', 'Run']));
  };

  return <Button onClick={handleRefresh}>Refresh</Button>;
}
```

### Cache Time Configuration

```typescript
// Default: 60 seconds
// Configure per-endpoint in reconCraftApi.ts:
getWorkflows: builder.query({
  query: () => '/workflows',
  keepUnusedDataFor: 300, // 5 minutes
}),
```

## Error Handling

### API Error Format

```typescript
interface ApiError {
  status: number;
  data: {
    message: string;
    detail?: any;
  };
}
```

### Handling Errors in Components

```typescript
const { data, error, isError } = useGetWorkflowsQuery();

if (isError) {
  const apiError = error as ApiError;
  return <Alert variant="destructive">{apiError.data.message}</Alert>;
}
```

### Global Error Handler

For consistency, wrap API calls in try-catch and use toast notifications:

```typescript
try {
  await mutation(data).unwrap();
  toast.success('Success!');
} catch (error: any) {
  toast.error(`Failed: ${error.data?.message || error.message || 'Unknown error'}`);
  console.error('API Error:', error);
}
```

## Real-time Updates

### Polling Configuration

```typescript
// Poll every 2 seconds while component is mounted
useGetRunQuery(runId, {
  pollingInterval: 2000,
  skip: !runId,
});

// Stop polling when run is complete
useEffect(() => {
  if (run?.status === 'succeeded' || run?.status === 'failed') {
    // Polling automatically stops when component unmounts
  }
}, [run?.status]);
```

### Selective Polling

```typescript
const [shouldPoll, setShouldPoll] = useState(false);

useGetRunsQuery(
  {},
  {
    pollingInterval: shouldPoll ? 5000 : 0, // 0 disables polling
  }
);
```

## Performance Optimization

### Lazy Queries

```typescript
import { useLazyGetWorkflowQuery } from '@/api/reconCraftApi';

function WorkflowSearch() {
  const [trigger, { data, isLoading }] = useLazyGetWorkflowQuery();

  const handleSearch = (id: string) => {
    trigger(id); // Fetch on demand
  };

  return <SearchInput onSearch={handleSearch} />;
}
```

### Prefetching

```typescript
import { useAppDispatch } from '@/store/hooks';
import { reconCraftApi } from '@/api/reconCraftApi';

function WorkflowCard({ workflowId }) {
  const dispatch = useAppDispatch();

  const handleMouseEnter = () => {
    // Prefetch workflow details on hover
    dispatch(
      reconCraftApi.util.prefetch('getWorkflow', workflowId, { force: false })
    );
  };

  return <Card onMouseEnter={handleMouseEnter}>...</Card>;
}
```

## Testing

### Mocking RTK Query

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/workflows', (req, res, ctx) => {
    return res(ctx.json([{ id: '1', name: 'Test Workflow' }]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Migration from Old API Client

The old mock API client (`src/api/client.ts`) has been replaced with RTK Query. Key changes:

### Before (Mock API)

```typescript
import { api } from '@/api/client';
import { useAppDispatch } from '@/store/hooks';
import { fetchWorkflows } from '@/store/slices/workflowsSlice';

useEffect(() => {
  dispatch(fetchWorkflows());
}, []);
```

### After (RTK Query)

```typescript
import { useGetWorkflowsQuery } from '@/api/reconCraftApi';

const { data: workflows, isLoading } = useGetWorkflowsQuery();
// Automatic fetching, caching, and state management
```

## Troubleshooting

### CORS Issues

Ensure backend CORS is configured:

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Authentication Errors

Check token in localStorage:

```javascript
localStorage.getItem('auth_token')
```

Generate new token if expired:

```typescript
const [exchangeToken] = useExchangeApiKeyForTokenMutation();
await exchangeToken({ apiKey: 'your-api-key' });
```

### Network Errors

Check backend is running:

```bash
curl http://localhost:8000/api/health
```

### Cache Issues

Clear RTK Query cache:

```typescript
dispatch(reconCraftApi.util.resetApiState());
```

## Best Practices

1. **Use TypeScript**: Leverage full type safety
2. **Error Handling**: Always wrap mutations in try-catch
3. **Loading States**: Show spinners during data fetching
4. **Polling Wisely**: Use polling sparingly to avoid excessive requests
5. **Cache Tags**: Properly tag queries for automatic invalidation
6. **Optimistic Updates**: Use for better UX
7. **Token Refresh**: Implement token refresh before expiration
8. **Environment Variables**: Use `.env` for configuration
9. **Error Logging**: Log errors for debugging
10. **Toast Notifications**: Provide user feedback for all actions

## Next Steps

1. **Authentication UI**: Create login page with API key management
2. **WebSocket Integration**: Add real-time log streaming
3. **Offline Support**: Add service worker for offline capabilities
4. **Error Boundaries**: Add React error boundaries for graceful failures
5. **Rate Limiting**: Handle API rate limits gracefully

## Resources

- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [Backend API Documentation](./backend/API_EXAMPLES.md)
- [Backend Summary](./BACKEND_SUMMARY.md)
- [Redux Toolkit](https://redux-toolkit.js.org/)

---

**Last Updated**: 2025-01-25
