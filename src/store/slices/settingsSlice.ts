import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Settings } from '@/types/workflow';
import { api } from '@/api/client';

interface SettingsState extends Settings {
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  theme: 'dark',
  integrations: {},
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
  return await api.getSettings();
});

export const saveSettings = createAsyncThunk('settings/save', async (settings: Settings) => {
  return await api.saveSettings(settings);
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.theme = action.payload.theme;
        state.integrations = action.payload.integrations;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.theme = action.payload.theme;
        state.integrations = action.payload.integrations;
      });
  },
});

export const { setTheme } = settingsSlice.actions;
export default settingsSlice.reducer;
