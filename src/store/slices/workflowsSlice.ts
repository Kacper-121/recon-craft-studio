import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Workflow } from '@/types/workflow';
import { api } from '@/api/client';

interface WorkflowsState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  loading: boolean;
  error: string | null;
}

const initialState: WorkflowsState = {
  workflows: [],
  currentWorkflow: null,
  loading: false,
  error: null,
};

export const fetchWorkflows = createAsyncThunk('workflows/fetchAll', async () => {
  return await api.listWorkflows();
});

export const fetchWorkflow = createAsyncThunk('workflows/fetchOne', async (id: string) => {
  return await api.getWorkflow(id);
});

export const saveWorkflow = createAsyncThunk('workflows/save', async (workflow: Workflow) => {
  return await api.saveWorkflow(workflow);
});

export const deleteWorkflow = createAsyncThunk('workflows/delete', async (id: string) => {
  await api.deleteWorkflow(id);
  return id;
});

export const duplicateWorkflow = createAsyncThunk('workflows/duplicate', async (id: string) => {
  return await api.duplicateWorkflow(id);
});

const workflowsSlice = createSlice({
  name: 'workflows',
  initialState,
  reducers: {
    setCurrentWorkflow: (state, action: PayloadAction<Workflow | null>) => {
      state.currentWorkflow = action.payload;
    },
    updateCurrentWorkflow: (state, action: PayloadAction<Partial<Workflow>>) => {
      if (state.currentWorkflow) {
        state.currentWorkflow = { ...state.currentWorkflow, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkflows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.loading = false;
        state.workflows = action.payload;
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch workflows';
      })
      .addCase(fetchWorkflow.fulfilled, (state, action) => {
        state.currentWorkflow = action.payload;
      })
      .addCase(saveWorkflow.fulfilled, (state, action) => {
        const index = state.workflows.findIndex((w) => w.id === action.payload.id);
        if (index >= 0) {
          state.workflows[index] = action.payload;
        } else {
          state.workflows.push(action.payload);
        }
        state.currentWorkflow = action.payload;
      })
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.workflows = state.workflows.filter((w) => w.id !== action.payload);
      })
      .addCase(duplicateWorkflow.fulfilled, (state, action) => {
        state.workflows.push(action.payload);
      });
  },
});

export const { setCurrentWorkflow, updateCurrentWorkflow } = workflowsSlice.actions;
export default workflowsSlice.reducer;
