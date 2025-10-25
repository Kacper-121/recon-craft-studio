import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Run } from '@/types/workflow';
import { api } from '@/api/client';

interface RunsState {
  runs: Run[];
  currentRun: Run | null;
  loading: boolean;
  error: string | null;
}

const initialState: RunsState = {
  runs: [],
  currentRun: null,
  loading: false,
  error: null,
};

export const fetchRuns = createAsyncThunk('runs/fetchAll', async () => {
  return await api.listRuns();
});

export const fetchRun = createAsyncThunk('runs/fetchOne', async (id: string) => {
  return await api.getRun(id);
});

export const startRun = createAsyncThunk('runs/start', async (workflowId: string) => {
  return await api.runWorkflow(workflowId);
});

const runsSlice = createSlice({
  name: 'runs',
  initialState,
  reducers: {
    setCurrentRun: (state, action) => {
      state.currentRun = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRuns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRuns.fulfilled, (state, action) => {
        state.loading = false;
        state.runs = action.payload;
      })
      .addCase(fetchRuns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch runs';
      })
      .addCase(fetchRun.fulfilled, (state, action) => {
        state.currentRun = action.payload;
      })
      .addCase(startRun.fulfilled, (state, action) => {
        state.runs.unshift(action.payload);
        state.currentRun = action.payload;
      });
  },
});

export const { setCurrentRun } = runsSlice.actions;
export default runsSlice.reducer;
