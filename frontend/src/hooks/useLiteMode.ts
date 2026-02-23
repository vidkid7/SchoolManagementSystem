/**
 * Lite Mode Hook
 * 
 * Manages lite mode state based on network conditions
 * Automatically enables lite mode on slow connections
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isSlowConnection,
  isDataSaverEnabled,
  addNetworkChangeListener,
  getNetworkInfo,
} from '../utils/networkDetection';

export interface LiteModeConfig {
  enabled: boolean;
  autoDetect: boolean;
  disableAnimations: boolean;
  reduceImageQuality: boolean;
  limitConcurrentRequests: boolean;
}

const LITE_MODE_STORAGE_KEY = 'lite_mode_config';
const DEFAULT_CONFIG: LiteModeConfig = {
  enabled: false,
  autoDetect: true,
  disableAnimations: true,
  reduceImageQuality: true,
  limitConcurrentRequests: true,
};

/**
 * Load lite mode config from localStorage
 */
function loadConfig(): LiteModeConfig {
  try {
    const stored = localStorage.getItem(LITE_MODE_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load lite mode config:', error);
  }
  return DEFAULT_CONFIG;
}

/**
 * Save lite mode config to localStorage
 */
function saveConfig(config: LiteModeConfig): void {
  try {
    localStorage.setItem(LITE_MODE_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save lite mode config:', error);
  }
}

/**
 * Hook to manage lite mode
 */
export function useLiteMode() {
  const [config, setConfig] = useState<LiteModeConfig>(loadConfig);
  const [networkInfo, setNetworkInfo] = useState(getNetworkInfo());

  // Update network info
  const updateNetworkInfo = useCallback(() => {
    setNetworkInfo(getNetworkInfo());
  }, []);

  // Check if lite mode should be enabled based on network
  const shouldEnableLiteMode = useCallback(() => {
    if (!config.autoDetect) {
      return config.enabled;
    }

    // Auto-enable on slow connection or data saver
    return isSlowConnection() || isDataSaverEnabled();
  }, [config.autoDetect, config.enabled]);

  // Update config
  const updateConfig = useCallback((updates: Partial<LiteModeConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      saveConfig(newConfig);
      return newConfig;
    });
  }, []);

  // Enable lite mode
  const enableLiteMode = useCallback(() => {
    updateConfig({ enabled: true });
  }, [updateConfig]);

  // Disable lite mode
  const disableLiteMode = useCallback(() => {
    updateConfig({ enabled: false });
  }, [updateConfig]);

  // Toggle lite mode
  const toggleLiteMode = useCallback(() => {
    updateConfig({ enabled: !config.enabled });
  }, [config.enabled, updateConfig]);

  // Toggle auto-detect
  const toggleAutoDetect = useCallback(() => {
    updateConfig({ autoDetect: !config.autoDetect });
  }, [config.autoDetect, updateConfig]);

  // Listen for network changes
  useEffect(() => {
    const cleanup = addNetworkChangeListener(updateNetworkInfo);
    return cleanup;
  }, [updateNetworkInfo]);

  // Auto-enable lite mode on slow connection
  useEffect(() => {
    if (config.autoDetect) {
      const shouldEnable = shouldEnableLiteMode();
      if (shouldEnable !== config.enabled) {
        updateConfig({ enabled: shouldEnable });
      }
    }
  }, [config.autoDetect, config.enabled, shouldEnableLiteMode, updateConfig]);

  // Determine if lite mode is active
  const isLiteModeActive = config.autoDetect ? shouldEnableLiteMode() : config.enabled;

  return {
    config,
    isLiteModeActive,
    networkInfo,
    enableLiteMode,
    disableLiteMode,
    toggleLiteMode,
    toggleAutoDetect,
    updateConfig,
    shouldDisableAnimations: isLiteModeActive && config.disableAnimations,
    shouldReduceImageQuality: isLiteModeActive && config.reduceImageQuality,
    shouldLimitRequests: isLiteModeActive && config.limitConcurrentRequests,
  };
}
