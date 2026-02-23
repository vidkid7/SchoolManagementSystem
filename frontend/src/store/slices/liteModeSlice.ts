/**
 * Lite Mode Redux Slice
 * 
 * Global state management for lite mode
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface LiteModeState {
  enabled: boolean;
  autoDetect: boolean;
  disableAnimations: boolean;
  reduceImageQuality: boolean;
  limitConcurrentRequests: boolean;
  isSlowConnection: boolean;
  effectiveConnectionType: string;
}

const LITE_MODE_STORAGE_KEY = 'lite_mode_config';

// Load initial state from localStorage
function loadInitialState(): LiteModeState {
  try {
    const stored = localStorage.getItem(LITE_MODE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        enabled: parsed.enabled ?? false,
        autoDetect: parsed.autoDetect ?? true,
        disableAnimations: parsed.disableAnimations ?? true,
        reduceImageQuality: parsed.reduceImageQuality ?? true,
        limitConcurrentRequests: parsed.limitConcurrentRequests ?? true,
        isSlowConnection: false,
        effectiveConnectionType: 'unknown',
      };
    }
  } catch (error) {
    console.error('Failed to load lite mode config:', error);
  }

  return {
    enabled: false,
    autoDetect: true,
    disableAnimations: true,
    reduceImageQuality: true,
    limitConcurrentRequests: true,
    isSlowConnection: false,
    effectiveConnectionType: 'unknown',
  };
}

// Save state to localStorage
function saveToStorage(state: LiteModeState): void {
  try {
    const toSave = {
      enabled: state.enabled,
      autoDetect: state.autoDetect,
      disableAnimations: state.disableAnimations,
      reduceImageQuality: state.reduceImageQuality,
      limitConcurrentRequests: state.limitConcurrentRequests,
    };
    localStorage.setItem(LITE_MODE_STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save lite mode config:', error);
  }
}

const initialState: LiteModeState = loadInitialState();

const liteModeSlice = createSlice({
  name: 'liteMode',
  initialState,
  reducers: {
    setLiteModeEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
      saveToStorage(state);
    },
    toggleLiteMode: (state) => {
      state.enabled = !state.enabled;
      saveToStorage(state);
    },
    setAutoDetect: (state, action: PayloadAction<boolean>) => {
      state.autoDetect = action.payload;
      saveToStorage(state);
    },
    toggleAutoDetect: (state) => {
      state.autoDetect = !state.autoDetect;
      saveToStorage(state);
    },
    setDisableAnimations: (state, action: PayloadAction<boolean>) => {
      state.disableAnimations = action.payload;
      saveToStorage(state);
    },
    setReduceImageQuality: (state, action: PayloadAction<boolean>) => {
      state.reduceImageQuality = action.payload;
      saveToStorage(state);
    },
    setLimitConcurrentRequests: (state, action: PayloadAction<boolean>) => {
      state.limitConcurrentRequests = action.payload;
      saveToStorage(state);
    },
    updateNetworkInfo: (
      state,
      action: PayloadAction<{ isSlowConnection: boolean; effectiveConnectionType: string }>
    ) => {
      state.isSlowConnection = action.payload.isSlowConnection;
      state.effectiveConnectionType = action.payload.effectiveConnectionType;
      
      // Auto-enable lite mode on slow connection if auto-detect is on
      if (state.autoDetect && action.payload.isSlowConnection && !state.enabled) {
        state.enabled = true;
        saveToStorage(state);
      }
      
      // Auto-disable lite mode on fast connection if auto-detect is on
      if (state.autoDetect && !action.payload.isSlowConnection && state.enabled) {
        state.enabled = false;
        saveToStorage(state);
      }
    },
  },
});

export const {
  setLiteModeEnabled,
  toggleLiteMode,
  setAutoDetect,
  toggleAutoDetect,
  setDisableAnimations,
  setReduceImageQuality,
  setLimitConcurrentRequests,
  updateNetworkInfo,
} = liteModeSlice.actions;

// Selectors
export const selectLiteModeEnabled = (state: RootState) => state.liteMode.enabled;
export const selectAutoDetect = (state: RootState) => state.liteMode.autoDetect;
export const selectIsLiteModeActive = (state: RootState) => {
  if (state.liteMode.autoDetect) {
    return state.liteMode.isSlowConnection || state.liteMode.enabled;
  }
  return state.liteMode.enabled;
};
export const selectShouldDisableAnimations = (state: RootState) =>
  selectIsLiteModeActive(state) && state.liteMode.disableAnimations;
export const selectShouldReduceImageQuality = (state: RootState) =>
  selectIsLiteModeActive(state) && state.liteMode.reduceImageQuality;
export const selectShouldLimitRequests = (state: RootState) =>
  selectIsLiteModeActive(state) && state.liteMode.limitConcurrentRequests;

// Memoized selector to prevent unnecessary rerenders
export const selectNetworkInfo = createSelector(
  [(state: RootState) => state.liteMode.isSlowConnection, (state: RootState) => state.liteMode.effectiveConnectionType],
  (isSlowConnection, effectiveConnectionType) => ({
    isSlowConnection,
    effectiveConnectionType,
  })
);

export default liteModeSlice.reducer;
