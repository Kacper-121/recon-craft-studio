import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import workflowsReducer from './slices/workflowsSlice';
import runsReducer from './slices/runsSlice';
import targetsReducer from './slices/targetsSlice';
import settingsReducer from './slices/settingsSlice';
import { reconCraftApi } from '@/api/reconCraftApi';

export const store = configureStore({
  reducer: {
    workflows: workflowsReducer,
    runs: runsReducer,
    targets: targetsReducer,
    settings: settingsReducer,
    // Add the RTK Query API reducer
    [reconCraftApi.reducerPath]: reconCraftApi.reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling, and other features of RTK Query
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(reconCraftApi.middleware),
});

// Optional: configure listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
