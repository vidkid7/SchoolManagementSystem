import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import liteModeReducer from './slices/liteModeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    liteMode: liteModeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled', 'auth/logout/fulfilled'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
