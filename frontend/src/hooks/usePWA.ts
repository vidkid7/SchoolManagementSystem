/**
 * usePWA Hook
 * Manages PWA functionality, offline status, and sync operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isOnline,
  setupNetworkListeners,
  getCacheStorageUsage
} from '@utils/serviceWorker';
import {
  getSyncStatus,
  triggerManualSync as triggerOfflineSync,
  setupAutoSync,
  SyncResult,
  SyncProgress
} from '@utils/offlineSync';

export interface PWAState {
  isOnline: boolean;
  isInstalled: boolean;
  syncStatus: {
    isSyncing: boolean;
    pendingCount: number;
    lastSyncTime: Date | null;
    errors: string[];
    conflicts?: Array<{
      id: string;
      type: 'attendance' | 'grade';
      localData: any;
      serverData: any;
      resolution: 'local' | 'server' | 'pending';
    }>;
    syncResult?: SyncResult;
    progress?: SyncProgress;
  };
  cacheUsage: {
    usage: number;
    quota: number;
    percentage: number;
  };
}

export interface PWAActions {
  triggerManualSync: (onProgress?: (message: string) => void) => Promise<SyncResult>;
  refreshSyncStatus: () => Promise<void>;
  refreshCacheUsage: () => Promise<void>;
}

export function usePWA(): [PWAState, PWAActions] {
  const [state, setState] = useState<PWAState>({
    isOnline: isOnline(),
    isInstalled: false,
    syncStatus: {
      isSyncing: false,
      pendingCount: 0,
      lastSyncTime: null,
      errors: [],
      conflicts: [],
      syncResult: undefined,
      progress: undefined
    },
    cacheUsage: {
      usage: 0,
      quota: 0,
      percentage: 0
    }
  });

  // Check if PWA is installed
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      setState(prev => ({
        ...prev,
        isInstalled: isStandalone || (isIOS && isIOSStandalone)
      }));
    };

    checkInstalled();
  }, []);

  // Refresh sync status
  const refreshSyncStatus = useCallback(async () => {
    try {
      const syncStatus = await getSyncStatus();
      setState(prev => ({
        ...prev,
        syncStatus: {
          ...prev.syncStatus,
          isSyncing: false,
          pendingCount: syncStatus.pendingCount,
          lastSyncTime: syncStatus.lastSyncTime
        }
      }));
    } catch (error) {
      console.error('Error refreshing sync status:', error);
    }
  }, []);

  // Refresh cache usage
  const refreshCacheUsage = useCallback(async () => {
    const cacheUsage = await getCacheStorageUsage();
    setState(prev => ({ ...prev, cacheUsage }));
  }, []);

  // Setup network listeners and auto-sync
  useEffect(() => {
    const cleanupNetwork = setupNetworkListeners(
      () => {
        setState(prev => ({ ...prev, isOnline: true }));
      },
      () => {
        setState(prev => ({ ...prev, isOnline: false }));
      }
    );

    const cleanupAutoSync = setupAutoSync(
      () => {
        setState(prev => ({
          ...prev,
          syncStatus: { 
            ...prev.syncStatus, 
            isSyncing: true, 
            errors: [],
            conflicts: [],
            syncResult: undefined
          }
        }));
      },
      (result) => {
        setState(prev => ({
          ...prev,
          syncStatus: {
            ...prev.syncStatus,
            isSyncing: false,
            errors: result.errors.map(e => e.error),
            conflicts: result.conflicts,
            syncResult: result
          }
        }));
        refreshSyncStatus();
      },
      (progress) => {
        setState(prev => ({
          ...prev,
          syncStatus: {
            ...prev.syncStatus,
            progress
          }
        }));
      }
    );

    return () => {
      cleanupNetwork();
      cleanupAutoSync();
    };
  }, [refreshSyncStatus]);

  // Initial data fetch
  useEffect(() => {
    refreshSyncStatus();
    refreshCacheUsage();

    // Refresh sync status every 30 seconds
    const interval = setInterval(refreshSyncStatus, 30000);

    return () => clearInterval(interval);
  }, [refreshSyncStatus, refreshCacheUsage]);

  // Trigger manual sync
  const triggerManualSync = useCallback(async (onProgress?: (message: string) => void): Promise<SyncResult> => {
    setState(prev => ({
      ...prev,
      syncStatus: { 
        ...prev.syncStatus, 
        isSyncing: true, 
        errors: [],
        conflicts: [],
        syncResult: undefined
      }
    }));

    try {
      const result = await triggerOfflineSync(onProgress);
      
      setState(prev => ({
        ...prev,
        syncStatus: {
          ...prev.syncStatus,
          isSyncing: false,
          errors: result.errors.map(e => e.error),
          conflicts: result.conflicts,
          syncResult: result
        }
      }));
      
      await refreshSyncStatus();
      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        syncStatus: {
          ...prev.syncStatus,
          isSyncing: false,
          errors: [error.message || 'Sync failed']
        }
      }));
      throw error;
    }
  }, [refreshSyncStatus]);

  const actions: PWAActions = {
    triggerManualSync,
    refreshSyncStatus,
    refreshCacheUsage
  };

  return [state, actions];
}
