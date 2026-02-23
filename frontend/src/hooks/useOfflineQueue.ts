/**
 * React Hook for Offline Queue Management
 * Provides easy access to offline queue functionality
 */

import { useState, useEffect, useCallback } from 'react';
import {
  queueAttendance,
  queueGrade,
  getPendingCount,
  getDatabaseStats,
  OfflineAttendance,
  OfflineGrade
} from '../utils/offlineDatabase';
import {
  syncOfflineQueue,
  getSyncStatus,
  setupAutoSync,
  triggerManualSync,
  SyncResult
} from '../utils/offlineSync';

export interface OfflineQueueState {
  isOnline: boolean;
  isPending: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
}

export interface UseOfflineQueueReturn {
  state: OfflineQueueState;
  queueAttendanceOffline: (
    attendance: Omit<OfflineAttendance, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>
  ) => Promise<string>;
  queueGradeOffline: (
    grade: Omit<OfflineGrade, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>
  ) => Promise<string>;
  triggerSync: () => Promise<SyncResult>;
  refreshStatus: () => Promise<void>;
}

/**
 * Hook for managing offline queue operations
 */
export function useOfflineQueue(): UseOfflineQueueReturn {
  const [state, setState] = useState<OfflineQueueState>({
    isOnline: navigator.onLine,
    isPending: false,
    pendingCount: 0,
    isSyncing: false,
    lastSyncTime: null,
    syncError: null
  });

  // Refresh sync status
  const refreshStatus = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      const count = await getPendingCount();
      
      setState(prev => ({
        ...prev,
        isPending: status.isPending,
        pendingCount: count,
        lastSyncTime: status.lastSyncTime
      }));
    } catch (error) {
      console.error('Error refreshing sync status:', error);
    }
  }, []);

  // Queue attendance for offline sync
  const queueAttendanceOffline = useCallback(
    async (
      attendance: Omit<OfflineAttendance, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>
    ): Promise<string> => {
      const id = await queueAttendance(attendance);
      await refreshStatus();
      return id;
    },
    [refreshStatus]
  );

  // Queue grade for offline sync
  const queueGradeOffline = useCallback(
    async (
      grade: Omit<OfflineGrade, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>
    ): Promise<string> => {
      const id = await queueGrade(grade);
      await refreshStatus();
      return id;
    },
    [refreshStatus]
  );

  // Trigger manual sync
  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    setState(prev => ({ ...prev, isSyncing: true, syncError: null }));
    
    try {
      const result = await triggerManualSync();
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: result.success ? null : 'Some records failed to sync'
      }));
      
      await refreshStatus();
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Sync failed';
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage
      }));
      
      throw error;
    }
  }, [refreshStatus]);

  // Setup online/offline listeners and auto-sync
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup auto-sync
    const cleanupAutoSync = setupAutoSync(
      () => {
        setState(prev => ({ ...prev, isSyncing: true, syncError: null }));
      },
      (result) => {
        setState(prev => ({
          ...prev,
          isSyncing: false,
          syncError: result.success ? null : 'Some records failed to sync'
        }));
        refreshStatus();
      }
    );

    // Initial status refresh
    refreshStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanupAutoSync();
    };
  }, [refreshStatus]);

  return {
    state,
    queueAttendanceOffline,
    queueGradeOffline,
    triggerSync,
    refreshStatus
  };
}

/**
 * Hook for database statistics
 */
export function useOfflineStats() {
  const [stats, setStats] = useState({
    pendingAttendance: 0,
    pendingGrades: 0,
    cachedStudents: 0,
    cachedClasses: 0,
    totalPending: 0
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const dbStats = await getDatabaseStats();
      setStats(dbStats);
    } catch (error) {
      console.error('Error fetching database stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    
    // Refresh every 30 seconds
    const interval = setInterval(refresh, 30000);
    
    return () => clearInterval(interval);
  }, [refresh]);

  return { stats, loading, refresh };
}
