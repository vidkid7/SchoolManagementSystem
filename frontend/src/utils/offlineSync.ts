/**
 * Offline Sync Service
 * Handles syncing queued operations when connectivity is restored
 */

import axios from 'axios';
import {
  getPendingAttendance,
  getPendingGrades,
  updateAttendanceSyncStatus,
  updateGradeSyncStatus,
  getPendingCount,
} from './offlineDatabase';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflictCount: number;
  errors: Array<{
    id: string;
    type: 'attendance' | 'grade';
    error: string;
  }>;
  conflicts: Array<{
    id: string;
    type: 'attendance' | 'grade';
    localData: any;
    serverData: any;
    resolution: 'local' | 'server' | 'pending';
  }>;
}

export type ConflictResolutionStrategy = 'last-write-wins' | 'prompt-user' | 'server-wins' | 'local-wins';

export interface SyncProgress {
  stage: 'starting' | 'syncing-attendance' | 'syncing-grades' | 'resolving-conflicts' | 'complete';
  current: number;
  total: number;
  message: string;
}

/**
 * Sync all pending offline operations
 */
export async function syncOfflineQueue(
  onProgress?: (progress: SyncProgress) => void,
  conflictStrategy: ConflictResolutionStrategy = 'last-write-wins'
): Promise<SyncResult> {
  if (!navigator.onLine) {
    return {
      success: false,
      syncedCount: 0,
      failedCount: 0,
      conflictCount: 0,
      errors: [{ id: 'network', type: 'attendance', error: 'No network connection' }],
      conflicts: []
    };
  }

  const result: SyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    conflictCount: 0,
    errors: [],
    conflicts: []
  };

  // Get total count for progress tracking
  const pendingAttendance = await getPendingAttendance();
  const pendingGrades = await getPendingGrades();
  const totalRecords = pendingAttendance.length + pendingGrades.length;

  if (onProgress) {
    onProgress({
      stage: 'starting',
      current: 0,
      total: totalRecords,
      message: 'Starting sync...'
    });
  }

  // Sync attendance records
  if (onProgress) {
    onProgress({
      stage: 'syncing-attendance',
      current: 0,
      total: totalRecords,
      message: `Syncing ${pendingAttendance.length} attendance records...`
    });
  }

  const attendanceResult = await syncAttendanceQueue(
    conflictStrategy,
    (current) => {
      if (onProgress) {
        onProgress({
          stage: 'syncing-attendance',
          current,
          total: totalRecords,
          message: `Syncing attendance ${current}/${pendingAttendance.length}...`
        });
      }
    }
  );
  result.syncedCount += attendanceResult.syncedCount;
  result.failedCount += attendanceResult.failedCount;
  result.conflictCount += attendanceResult.conflictCount;
  result.errors.push(...attendanceResult.errors);
  result.conflicts.push(...attendanceResult.conflicts);

  // Sync grade records
  if (onProgress) {
    onProgress({
      stage: 'syncing-grades',
      current: pendingAttendance.length,
      total: totalRecords,
      message: `Syncing ${pendingGrades.length} grade records...`
    });
  }

  const gradeResult = await syncGradeQueue(
    conflictStrategy,
    (current) => {
      if (onProgress) {
        onProgress({
          stage: 'syncing-grades',
          current: pendingAttendance.length + current,
          total: totalRecords,
          message: `Syncing grades ${current}/${pendingGrades.length}...`
        });
      }
    }
  );
  result.syncedCount += gradeResult.syncedCount;
  result.failedCount += gradeResult.failedCount;
  result.conflictCount += gradeResult.conflictCount;
  result.errors.push(...gradeResult.errors);
  result.conflicts.push(...gradeResult.conflicts);

  // Resolve conflicts if any
  if (result.conflicts.length > 0 && onProgress) {
    onProgress({
      stage: 'resolving-conflicts',
      current: totalRecords,
      total: totalRecords,
      message: `Resolving ${result.conflicts.length} conflicts...`
    });
  }

  result.success = result.failedCount === 0 && result.conflictCount === 0;

  if (onProgress) {
    onProgress({
      stage: 'complete',
      current: totalRecords,
      total: totalRecords,
      message: result.success 
        ? `Sync complete! ${result.syncedCount} records synced.`
        : `Sync completed with issues. ${result.syncedCount} synced, ${result.failedCount} failed, ${result.conflictCount} conflicts.`
    });
  }

  return result;
}

/**
 * Sync attendance queue
 */
async function syncAttendanceQueue(
  conflictStrategy: ConflictResolutionStrategy = 'last-write-wins',
  onProgress?: (current: number) => void
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    conflictCount: 0,
    errors: [],
    conflicts: []
  };

  const pendingRecords = await getPendingAttendance();
  let current = 0;

  for (const record of pendingRecords) {
    current++;
    if (onProgress) {
      onProgress(current);
    }

    // Skip if retry count exceeds limit
    if (record.retryCount >= 3) {
      result.failedCount++;
      result.errors.push({
        id: record.id,
        type: 'attendance',
        error: 'Max retry count exceeded'
      });
      continue;
    }

    try {
      // Transform offline record to API format
      const attendanceData = record.records.map(r => ({
        studentId: r.studentId,
        classId: record.classId,
        date: record.date,
        dateBS: record.dateBS,
        status: r.status,
        periodNumber: r.periodNumber,
        remarks: r.remarks,
        markedBy: record.markedBy
      }));

      // Send to API
      const response = await axios.post('/api/v1/attendance/student/sync', {
        records: attendanceData
      });

      // Check for conflicts in response
      if (response.data.conflicts && response.data.conflicts.length > 0) {
        // Handle conflicts based on strategy
        const conflict = response.data.conflicts[0];
        
        if (conflictStrategy === 'last-write-wins' || conflictStrategy === 'local-wins') {
          // Force update with local data
          await axios.post('/api/v1/attendance/student/sync', {
            records: attendanceData,
            forceUpdate: true
          });
          
          result.conflicts.push({
            id: record.id,
            type: 'attendance',
            localData: attendanceData,
            serverData: conflict.serverData,
            resolution: 'local'
          });
          result.conflictCount++;
        } else if (conflictStrategy === 'server-wins') {
          // Accept server data, mark as synced
          result.conflicts.push({
            id: record.id,
            type: 'attendance',
            localData: attendanceData,
            serverData: conflict.serverData,
            resolution: 'server'
          });
          result.conflictCount++;
        } else {
          // Prompt user - mark as pending
          result.conflicts.push({
            id: record.id,
            type: 'attendance',
            localData: attendanceData,
            serverData: conflict.serverData,
            resolution: 'pending'
          });
          result.conflictCount++;
          continue; // Don't mark as synced
        }
      }

      // Mark as synced
      await updateAttendanceSyncStatus(record.id, 'synced');
      result.syncedCount++;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
      
      // Check if it's a conflict error (409)
      if (error.response?.status === 409) {
        const serverData = error.response.data.data;
        
        if (conflictStrategy === 'last-write-wins' || conflictStrategy === 'local-wins') {
          // Retry with force update
          try {
            await axios.post('/api/v1/attendance/student/sync', {
              records: record.records.map(r => ({
                studentId: r.studentId,
                classId: record.classId,
                date: record.date,
                dateBS: record.dateBS,
                status: r.status,
                periodNumber: r.periodNumber,
                remarks: r.remarks,
                markedBy: record.markedBy
              })),
              forceUpdate: true
            });
            
            await updateAttendanceSyncStatus(record.id, 'synced');
            result.syncedCount++;
            result.conflicts.push({
              id: record.id,
              type: 'attendance',
              localData: record.records,
              serverData,
              resolution: 'local'
            });
            result.conflictCount++;
            continue;
          } catch (retryError) {
            // Fall through to error handling
          }
        } else if (conflictStrategy === 'server-wins') {
          // Accept server data
          await updateAttendanceSyncStatus(record.id, 'synced');
          result.syncedCount++;
          result.conflicts.push({
            id: record.id,
            type: 'attendance',
            localData: record.records,
            serverData,
            resolution: 'server'
          });
          result.conflictCount++;
          continue;
        } else {
          // Prompt user
          result.conflicts.push({
            id: record.id,
            type: 'attendance',
            localData: record.records,
            serverData,
            resolution: 'pending'
          });
          result.conflictCount++;
          continue;
        }
      }
      
      await updateAttendanceSyncStatus(record.id, 'error', errorMessage);
      result.failedCount++;
      result.errors.push({
        id: record.id,
        type: 'attendance',
        error: errorMessage
      });
    }
  }

  result.success = result.failedCount === 0;
  return result;
}

/**
 * Sync grade queue
 */
async function syncGradeQueue(
  conflictStrategy: ConflictResolutionStrategy = 'last-write-wins',
  onProgress?: (current: number) => void
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    conflictCount: 0,
    errors: [],
    conflicts: []
  };

  const pendingRecords = await getPendingGrades();
  let current = 0;

  for (const record of pendingRecords) {
    current++;
    if (onProgress) {
      onProgress(current);
    }

    // Skip if retry count exceeds limit
    if (record.retryCount >= 3) {
      result.failedCount++;
      result.errors.push({
        id: record.id,
        type: 'grade',
        error: 'Max retry count exceeded'
      });
      continue;
    }

    try {
      // Send to API
      const response = await axios.post(`/api/v1/exams/${record.examId}/grades`, {
        studentId: record.studentId,
        theoryMarks: record.theoryMarks,
        practicalMarks: record.practicalMarks,
        totalMarks: record.totalMarks,
        remarks: record.remarks,
        enteredBy: record.enteredBy
      });

      // Check for conflicts in response
      if (response.data.conflicts && response.data.conflicts.length > 0) {
        const conflict = response.data.conflicts[0];
        
        if (conflictStrategy === 'last-write-wins' || conflictStrategy === 'local-wins') {
          // Force update with local data
          await axios.post(`/api/v1/exams/${record.examId}/grades`, {
            studentId: record.studentId,
            theoryMarks: record.theoryMarks,
            practicalMarks: record.practicalMarks,
            totalMarks: record.totalMarks,
            remarks: record.remarks,
            enteredBy: record.enteredBy,
            forceUpdate: true
          });
          
          result.conflicts.push({
            id: record.id,
            type: 'grade',
            localData: record,
            serverData: conflict.serverData,
            resolution: 'local'
          });
          result.conflictCount++;
        } else if (conflictStrategy === 'server-wins') {
          result.conflicts.push({
            id: record.id,
            type: 'grade',
            localData: record,
            serverData: conflict.serverData,
            resolution: 'server'
          });
          result.conflictCount++;
        } else {
          result.conflicts.push({
            id: record.id,
            type: 'grade',
            localData: record,
            serverData: conflict.serverData,
            resolution: 'pending'
          });
          result.conflictCount++;
          continue;
        }
      }

      // Mark as synced
      await updateGradeSyncStatus(record.id, 'synced');
      result.syncedCount++;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
      
      // Check if it's a conflict error (409)
      if (error.response?.status === 409) {
        const serverData = error.response.data.data;
        
        if (conflictStrategy === 'last-write-wins' || conflictStrategy === 'local-wins') {
          try {
            await axios.post(`/api/v1/exams/${record.examId}/grades`, {
              studentId: record.studentId,
              theoryMarks: record.theoryMarks,
              practicalMarks: record.practicalMarks,
              totalMarks: record.totalMarks,
              remarks: record.remarks,
              enteredBy: record.enteredBy,
              forceUpdate: true
            });
            
            await updateGradeSyncStatus(record.id, 'synced');
            result.syncedCount++;
            result.conflicts.push({
              id: record.id,
              type: 'grade',
              localData: record,
              serverData,
              resolution: 'local'
            });
            result.conflictCount++;
            continue;
          } catch (retryError) {
            // Fall through to error handling
          }
        } else if (conflictStrategy === 'server-wins') {
          await updateGradeSyncStatus(record.id, 'synced');
          result.syncedCount++;
          result.conflicts.push({
            id: record.id,
            type: 'grade',
            localData: record,
            serverData,
            resolution: 'server'
          });
          result.conflictCount++;
          continue;
        } else {
          result.conflicts.push({
            id: record.id,
            type: 'grade',
            localData: record,
            serverData,
            resolution: 'pending'
          });
          result.conflictCount++;
          continue;
        }
      }
      
      await updateGradeSyncStatus(record.id, 'error', errorMessage);
      result.failedCount++;
      result.errors.push({
        id: record.id,
        type: 'grade',
        error: errorMessage
      });
    }
  }

  result.success = result.failedCount === 0;
  return result;
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{
  isPending: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
}> {
  const pendingCount = await getPendingCount();
  
  // Get last sync time from localStorage
  const lastSyncTimeStr = localStorage.getItem('lastSyncTime');
  const lastSyncTime = lastSyncTimeStr ? new Date(lastSyncTimeStr) : null;

  return {
    isPending: pendingCount > 0,
    pendingCount,
    lastSyncTime
  };
}

/**
 * Setup auto-sync on network reconnection
 */
export function setupAutoSync(
  onSyncStart?: () => void,
  onSyncComplete?: (result: SyncResult) => void,
  onSyncProgress?: (progress: SyncProgress) => void,
  conflictStrategy: ConflictResolutionStrategy = 'last-write-wins'
): () => void {
  const handleOnline = async () => {
    console.log('Network reconnected. Starting auto-sync...');
    
    if (onSyncStart) {
      onSyncStart();
    }

    try {
      const result = await syncOfflineQueue(onSyncProgress, conflictStrategy);
      
      // Update last sync time
      localStorage.setItem('lastSyncTime', new Date().toISOString());
      
      if (onSyncComplete) {
        onSyncComplete(result);
      }

      if (result.success) {
        console.log(`Auto-sync completed successfully. Synced ${result.syncedCount} records.`);
      } else {
        console.warn(`Auto-sync completed with issues. Synced: ${result.syncedCount}, Failed: ${result.failedCount}, Conflicts: ${result.conflictCount}`);
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
      
      if (onSyncComplete) {
        onSyncComplete({
          success: false,
          syncedCount: 0,
          failedCount: 0,
          conflictCount: 0,
          errors: [{ id: 'sync', type: 'attendance', error: 'Sync failed' }],
          conflicts: []
        });
      }
    }
  };

  window.addEventListener('online', handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

/**
 * Manually trigger sync
 */
export async function triggerManualSync(
  onProgress?: (message: string) => void,
  conflictStrategy: ConflictResolutionStrategy = 'last-write-wins'
): Promise<SyncResult> {
  if (!navigator.onLine) {
    throw new Error('Cannot sync while offline');
  }

  if (onProgress) {
    onProgress('Starting sync...');
  }

  const result = await syncOfflineQueue(
    (progress) => {
      if (onProgress) {
        onProgress(progress.message);
      }
    },
    conflictStrategy
  );

  if (result.success) {
    localStorage.setItem('lastSyncTime', new Date().toISOString());
    if (onProgress) {
      onProgress(`Sync completed. ${result.syncedCount} records synced.`);
    }
  } else {
    if (onProgress) {
      const issues = [];
      if (result.failedCount > 0) issues.push(`${result.failedCount} failed`);
      if (result.conflictCount > 0) issues.push(`${result.conflictCount} conflicts`);
      onProgress(`Sync completed with issues. ${result.syncedCount} synced, ${issues.join(', ')}.`);
    }
  }

  return result;
}

/**
 * Check if there are pending operations
 */
export async function hasPendingOperations(): Promise<boolean> {
  const count = await getPendingCount();
  return count > 0;
}
