import { configureStore } from '@reduxjs/toolkit';
import workflowsReducer from './slices/workflowsSlice';
import runsReducer from './slices/runsSlice';
import targetsReducer from './slices/targetsSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    workflows: workflowsReducer,
    runs: runsReducer,
    targets: targetsReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
