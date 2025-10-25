import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Target } from '@/types/workflow';
import { api } from '@/api/client';

interface TargetsState {
  targets: Target[];
  loading: boolean;
  error: string | null;
}

const initialState: TargetsState = {
  targets: [],
  loading: false,
  error: null,
};

export const fetchTargets = createAsyncThunk('targets/fetchAll', async () => {
  return await api.listTargets();
});

export const saveTarget = createAsyncThunk(
  'targets/save',
  async (target: Omit<Target, 'id' | 'createdAt'>) => {
    return await api.saveTarget(target);
  }
);

export const deleteTarget = createAsyncThunk('targets/delete', async (id: string) => {
  await api.deleteTarget(id);
  return id;
});

export const bulkImportTargets = createAsyncThunk(
  'targets/bulkImport',
  async (targets: string[]) => {
    return await api.bulkImportTargets(targets);
  }
);

const targetsSlice = createSlice({
  name: 'targets',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTargets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTargets.fulfilled, (state, action) => {
        state.loading = false;
        state.targets = action.payload;
      })
      .addCase(fetchTargets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch targets';
      })
      .addCase(saveTarget.fulfilled, (state, action) => {
        state.targets.push(action.payload);
      })
      .addCase(deleteTarget.fulfilled, (state, action) => {
        state.targets = state.targets.filter((t) => t.id !== action.payload);
      })
      .addCase(bulkImportTargets.fulfilled, (state, action) => {
        state.targets.push(...action.payload);
      });
  },
});

export default targetsSlice.reducer;
